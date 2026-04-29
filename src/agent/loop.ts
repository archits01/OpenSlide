// Core agentic loop — tool use + streaming + event emission
// Handles multi-turn tool use until the model stops or max iterations reached

async function withStreamRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try { return await fn(); }
    catch (err) {
      const msg = String(err);
      const isNetworkErr = msg.includes("fetch") || msg.includes("ECONNRESET") || msg.includes("network") || err instanceof TypeError;
      if (!isNetworkErr || attempt === maxRetries) throw err;
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

import type { Message, Slide, Outline, ToolCallEntry, Session } from "@/lib/redis";
import { AgentEventBus } from "./events";
import { streamFromRouter, getThinkingConfig, type StreamPayload } from "./stream";
import { toAnthropicTools, type AgentTool } from "./tools/index";
import { getAllToolsWithAuth, getIntegrationTools } from './tools/tool-registry';
import { activateIntegrationTool, setActivationCallback } from './tools/activate-integration';
import { createDocOutlineTool } from "./tools/create-doc-outline";
import { docBuildTools, docEditTools } from "./tools/doc-page-tools";
import {
  buildSystemPrompt,
  buildSlidesContext,
  buildResearchContext,
  buildDiversityContext,
  buildResearchSourcesContext,
  buildConnectionStatusContext,
  type PromptContext,
} from "@/prompts";
import { getValidToken } from '@/lib/get-valid-token';
import { prisma } from '@/lib/db';
// Ensure auth tools are registered on import

import './tools/export-pdf';
import { generateExport } from './tools/export-pdf';
import './tools/gmail-send';
import './tools/google-drive';
import './tools/google-sheets';
import './tools/github';
// import './tools/notion-read'; // Disabled — no public OAuth integration yet
// import './tools/slack-send'; // Disabled — Slack requires HTTPS redirect URI
import './tools/spawn-subagent';
import { setSubagentBus, clearSubagentBus } from './tools/spawn-subagent';
import './tools/get-subagent-result';
import type { SystemBlock } from "./stream";
import { maybeCompact } from "./compaction";
import { waitForShellResult } from "@/lib/shell-sync";
import type { ResearchOutput } from "@/skills/deep-research/research-orchestrator";
import type { SlideCategory } from "@/skills/slide-categories/slide-classifier";
import type { SheetCategory } from "@/skills/SheetSkills/sheet-classifier";
// OSS build: no credit accounting. Token usage is still returned for caller
// observability, but never converted to credits or charged.
export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
};
class UsageAccumulator {
  private totals: TokenUsage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
  add(u: Partial<TokenUsage>) {
    this.totals.inputTokens += u.inputTokens ?? 0;
    this.totals.outputTokens += u.outputTokens ?? 0;
    this.totals.cacheReadTokens += u.cacheReadTokens ?? 0;
    this.totals.cacheWriteTokens += u.cacheWriteTokens ?? 0;
  }
  getTotals(): TokenUsage { return { ...this.totals }; }
}

// Ensure providers are registered
import "@/agent/tools/slide-provider";
import "@/agent/tools/sheet-provider";
import "@/agent/tools/website-provider";

const MAX_ITERATIONS = 35;
// Vercel hard-kills functions at maxDuration (300s). The check fires BEFORE
// starting a new iteration — at that point the previous iteration already
// finished. The 30s gap from 270s→300s is headroom for the final saveSession
// call and SSE flush, NOT for another iteration. A mid-iteration kill can
// still happen; per-iteration onIterationComplete is the durability guarantee.
const TIME_BUDGET_MS = 270_000;

function detectPatternHint(content: string): string {
  if (content.includes("grid-template-columns:repeat(3,1fr)") && content.includes("stat-number"))
    return "Three Stats";
  if (content.includes("stat-number") && !content.includes("grid-template-columns"))
    return "Hero Metric";
  if (content.includes("display:flex;flex-direction:row") && content.includes("width:55%"))
    return "Cover Slide";
  if (content.includes("slide-split") || (content.includes("width:50%") && content.includes("width:50%")))
    return "Split Content";
  if (content.includes("slide-bullets") && content.includes("grid"))
    return "Card Grid";
  if (content.includes("slide-bullets") && !content.includes("grid"))
    return "Bullet List";
  if (content.includes("blockquote") || content.includes("quote"))
    return "Quote";
  if (content.includes("timeline") || content.includes("step"))
    return "Timeline";
  return "Custom";
}

// Quick commands complete in <5s and return useful output — run them
// synchronously so the model sees the result in the same turn instead of
// waiting for the next user message.
//
// `npm install` and `npm run dev` are also marked sync (despite being slower)
// because the model MUST wait for `npm install` to fully exit before deciding
// whether to fire `npm run dev`. Without this, the agent gets `{queued: true}`
// instantly for install and immediately fires dev → Vite boots against
// half-installed node_modules → "dev server stopped". This mirrors bolt.diy's
// sequential action chain (action-runner.ts:138) where every shell action
// awaits the previous one's exit code via `executeCommand`.
//
// `npm run dev` resolves quickly on the client (returns immediately after spawn,
// since dev servers run forever), so its sync wait is short — just startup time.
function isQuickShellCommand(cmd: string, args: string[]): boolean {
  if (cmd === "grep" || cmd === "find") return true;
  if (cmd === "npx" && args[0] === "tsc") return true;
  if (cmd === "npm" && args[0] === "install") return true;
  if (cmd === "npm" && args[0] === "run" && args[1] === "dev") return true;
  return false;
}

// Per-command sync timeouts (ms). Most commands resolve in seconds; npm install
// can legitimately take minutes on a fresh template. Falls back to 30s.
function syncTimeoutMs(cmd: string, args: string[]): number {
  if (cmd === "npm" && args[0] === "install") return 5 * 60 * 1000; // 5min
  return 30_000;
}

// Tools that are safe to execute concurrently — pure reads with no side effects.
const PARALLEL_SAFE_NAMES = new Set([
  "read_file",
  "read_files",
  "list_files",
  "fetch_url",
  "search_images",
]);

export interface LoopOptions {
  sessionId: string;
  userId: string;
  messages: Message[];
  slides: Slide[];
  outline?: Outline | null;
  toolHistory?: ToolCallEntry[];
  researchResults?: ResearchOutput | null;
  slideCategory?: SlideCategory;
  presentationType?: string;
  deepResearch?: boolean;
  docsMode?: boolean;
  docCategory?: import("@/skills/DocSkills/doc-classifier").DocCategory;
  sheetsMode?: boolean;
  sheetCategory?: SheetCategory;
  websiteMode?: boolean;
  /** When true in website mode, strip all file/shell tools and use a lighter system prompt — user is chatting, not building. */
  discussMode?: boolean;
  /** Initial website files for the loop run. Mutated in-place; return value on LoopResult.websiteFiles. */
  websiteFiles?: Record<string, string>;
  /** Names of env vars set on the session (values injected into the WebContainer at spawn time, not here). */
  websiteEnvVarNames?: string[];
  /** One-line hint describing the pre-mounted template (entry point, stack, etc.) — injected into the system prompt. */
  websiteScaffoldHint?: string;
  onWebsiteFileCreated?: (path: string, content: string) => void;
  onWebsiteFileUpdated?: (path: string, content: string) => void;
  onWebsiteFileDeleted?: (path: string) => void;
  onWebsiteShellCommand?: (cmd: string, args: string[], toolUseId: string) => void;
  research?: Session["research"];
  brand?: { brandJson: Record<string, unknown>; brandConfig?: import("@/lib/brand-defaults").BrandConfig };
  /** v2 brand kit (BrandKit table). When present, replaces generic design-system + layout-library in the system prompt. */
  brandKit?: import("@/lib/brand/types").BrandKitRecord;
  resolvedAttachments?: import("@/lib/types").ContentBlock[];
  signal?: AbortSignal;
  onSlideCreated?: (slide: Slide) => void;
  onSlideUpdated?: (slideId: string, changes: Partial<Slide>) => void;
  onSlideDeleted?: (slideId: string) => void;
  onSlidesReordered?: (order: string[]) => void;
  onThemeChanged?: (theme: string) => void;
  onOutlineCreated?: (outline: Outline) => void;
  /** Called after each successful iteration so the caller can persist partial state.
   * This is what makes the loop resilient to Vercel hard-kills: whatever completed before
   * the kill is durably saved, and the user keeps their progress on refresh.
   * Includes every field that `runAgentLoop` ultimately returns in LoopResult, so the
   * final state saved post-kill is identical to what a normal loop completion would save. */
  onIterationComplete?: (state: {
    messages: Message[];
    slides: Slide[];
    outline: Outline | null;
    toolHistory: ToolCallEntry[];
    logoUrl: string | null;
    theme: string | null;
    themeColors: Record<string, string> | null;
    research: Array<{ query: string; url: string; title: string; snippet: string; retrievedAt: number }>;
    websiteFiles: Record<string, string>;
  }) => Promise<void>;
  /** Spawn depth — 0 for top-level agent, increments per subagent layer. Passed to tools so spawn_subagent can enforce limits. */
  spawnDepth?: number;
  /** Extra system prompt block injected after the static prompt — used by subagents to carry task context. */
  extraSystemPrompt?: string;
}

export interface LoopResult {
  messages: Message[];
  slides: Slide[];
  outline: Outline | null;
  logoUrl: string | null;
  theme: string | null;
  themeColors: Record<string, string> | null;
  toolHistory: ToolCallEntry[];
  research: Array<{ query: string; url: string; title: string; snippet: string; retrievedAt: number }>;
  tokenUsage: TokenUsage;
  websiteFiles: Record<string, string>;
  bus: AgentEventBus;
}

export async function runAgentLoop(
  options: LoopOptions,
  bus: AgentEventBus
): Promise<LoopResult> {
  const {
    signal,
    onSlideCreated,
    onSlideUpdated,
    onSlideDeleted,
    onSlidesReordered,
    onThemeChanged,
    onOutlineCreated,
    onWebsiteFileCreated,
    onWebsiteFileUpdated,
    onWebsiteFileDeleted,
    onWebsiteShellCommand,
  } = options;

  // Compact history if needed
  let messages = await maybeCompact(options.messages, { docsMode: options.docsMode, websiteMode: options.websiteMode });
  const websiteFiles: Record<string, string> = { ...(options.websiteFiles ?? {}) };
  let slides = [...options.slides];
  let currentOutline: Outline | null = options.outline ?? null;
  let logoUrl: string | null = null;
  let currentTheme: string | null = null;
  let currentThemeColors: Record<string, string> | null = null;
  const toolHistory: ToolCallEntry[] = [...(options.toolHistory ?? [])];
  // In-memory stash for export data — survives across iterations within the same loop run
  let lastExportResult: { base64: string; sizeBytes: number; mimeType: string; filename: string } | null = null;
  const usageAccumulator = new UsageAccumulator();
  const researchAccumulator: Array<{ query: string; url: string; title: string; snippet: string; retrievedAt: number }> = [...(options.research ?? [])];

  const rawTools = await getAllToolsWithAuth();
  console.log(`[loop] Core tools (${rawTools.length}): [${rawTools.map(t => t.name).join(', ')}]`);

  // Build the effective tools list.
  // Docs mode: replace slide tools with doc page tools (create_page, update_page, etc.)
  // Slides mode: use raw tools as-is
  // Integration tools (gmail, drive, sheets, github) are NOT included here —
  // they get injected on demand via activate_integration to save input tokens.
  const tools: AgentTool[] = (() => {
    // Website tools are ONLY active in website mode. Keep this list in sync
    // with WebsiteToolProvider.getTools() in website-provider.ts — whitelist
    // drift silently drops tools the model should see.
    const websiteToolNames = [
      "create_file",
      "update_file",
      "patch_file",
      "delete_file",
      "run_shell_command",
      "list_files",
      "read_file",
      "read_files",
      "search_images",
      "generate_image",
      "review_output",
      "check_types",
      "fetch_url",
    ];

    if (options.websiteMode) {
      // Discuss mode: no tools at all — just answer the question
      if (options.discussMode) return [];
      // Build mode: keep only the website tools. Drop slides/docs/sheets/integrations.
      return rawTools.filter(t => websiteToolNames.includes(t.name));
    }
    if (options.sheetsMode) {
      const slideToolNames = ["create_slide", "update_slide", "delete_slide", "reorder_slides", "create_outline", "fetch_logo", "set_theme"];
      const docToolNames = ["create_page", "update_page", "delete_page", "reorder_pages", "create_doc_outline"];
      return rawTools.filter(t => !slideToolNames.includes(t.name) && !docToolNames.includes(t.name) && !websiteToolNames.includes(t.name));
    }
    if (!options.docsMode) {
      // Slides mode — drop website tools (they shouldn't appear outside website mode)
      return rawTools.filter(t => !websiteToolNames.includes(t.name));
    }
    // Docs mode: remove slide + website tools, inject doc page tools
    const slideToolNames = ["create_slide", "update_slide", "delete_slide", "reorder_slides", "create_outline", "fetch_logo", "set_theme"];
    const nonSlideTools = rawTools.filter(t => !slideToolNames.includes(t.name) && !websiteToolNames.includes(t.name));
    const isEditingExistingDoc = options.slides.length > 0 && options.messages.filter(m => m.role === "user").length >= 3;
    const pageTools = isEditingExistingDoc ? docEditTools : docBuildTools;
    return [...nonSlideTools, createDocOutlineTool, ...pageTools];
  })();

  // Wire the live bus — keyed by sessionId so concurrent requests don't clobber each other
  setSubagentBus(options.sessionId, bus);

  // Add the activate_integration meta-tool so Claude can lazy-load integrations
  const activatedProviders = new Set<string>();
  tools.push(activateIntegrationTool);

  // Wire up the callback so activate_integration can inject tools into the live array
  setActivationCallback((provider, providerTools) => {
    if (activatedProviders.has(provider)) return; // already activated
    activatedProviders.add(provider);
    tools.push(...providerTools);
    console.log(`[loop] Activated ${provider}: +${providerTools.length} tools [${providerTools.map(t => t.name).join(', ')}]`);
  });

  // Static prompt built once — never changes mid-session, safe to prompt-cache.
  // Dynamic content context built fresh each iteration (pages/slides grow as we build).
  // Priority order matches the legacy if-ladder: website > sheets > docs > slides.
  const promptCtx: PromptContext = (options.websiteMode && options.discussMode)
    ? { mode: 'website-discuss' as const }
    : options.websiteMode
    ? { mode: 'website', envVarNames: options.websiteEnvVarNames ?? [], scaffoldHint: options.websiteScaffoldHint }
    : options.sheetsMode
      ? { mode: 'sheets', category: options.sheetCategory, brand: options.brand, brandKit: options.brandKit }
      : options.docsMode
        ? { mode: 'docs', category: options.docCategory, deepResearch: options.deepResearch, brand: options.brand, brandKit: options.brandKit }
        : { mode: 'slides', category: options.slideCategory, presentationType: options.presentationType, deepResearch: options.deepResearch, brand: options.brand, brandKit: options.brandKit };
  const staticSystemPrompt = buildSystemPrompt(promptCtx);

  // Brand kit identity passed into AgentToolContext so tools (e.g. fetch_logo)
  // can avoid acting on the kit's own brand. Domain stems come from two
  // sources, in priority order:
  //   1. The kit's stored `domain` field (e.g. "mckinsey.com" → "mckinsey").
  //      This is the precise match — set by extraction or manually in the UI.
  //   2. Significant words from the brand name. Fuzzy fallback for kits
  //      without a domain set; over-blocks for short generic names but
  //      catches the common case of the model fetching the kit's own brand.
  const activeBrandKitContext = options.brandKit
    ? (() => {
        const stems = new Set<string>();
        const storedDomain = (options.brandKit as unknown as { domain?: string }).domain;
        if (storedDomain) {
          const stem = storedDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(".")[0];
          if (stem) stems.add(stem);
        }
        for (const w of options.brandKit.brandVars.brandName
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((w) => w.length >= 3 && !["and", "the", "company", "inc", "ltd", "llc", "corp"].includes(w))) {
          stems.add(w);
        }
        return {
          id: options.brandKit.id,
          brandName: options.brandKit.brandVars.brandName,
          blockedDomainStems: Array.from(stems),
        };
      })()
    : undefined;

  const thinkingConfig = getThinkingConfig(options.websiteMode);

  let connectedProviders: Array<{ provider: string; metadata: Record<string, string> | null }> = [];
  try {
    const rows = await prisma.userConnection.findMany({
      where: { userId: options.userId, status: 'active' },
      select: { provider: true, metadata: true },
    });
    connectedProviders = rows.map((r) => ({
      provider: r.provider,
      metadata: r.metadata as Record<string, string> | null,
    }));
  } catch {
    // Prisma client may not have userConnection yet (migration pending) — degrade gracefully
  }

  let iterations = 0;
  const loopStartedAt = Date.now();

  while (iterations < MAX_ITERATIONS) {
    if (signal?.aborted) {
      bus.emit({ type: "error", message: "Aborted by user" });
      break;
    }

    // Graceful shutdown before Vercel hard-kills the function at maxDuration.
    // Each iteration takes 30-90s, so if we're already past the budget we can't
    // safely start another. Emit a user-facing pause message and exit cleanly
    // so route.ts's saveSession still runs and the user keeps partial progress.
    const elapsedMs = Date.now() - loopStartedAt;
    if (elapsedMs > TIME_BUDGET_MS) {
      console.warn(`[loop] time budget exceeded at iteration ${iterations}, elapsed ${elapsedMs}ms — graceful shutdown`);
      bus.emit({
        type: "error",
        message: "Generation paused — please send a follow-up to continue.",
      });
      bus.emit({ type: "done", stopReason: "time_budget" });
      break;
    }

    iterations++;

    // Sanitize messages — remove empty content + fix role alternation
    const filtered = messages.filter((m) => {
      if (typeof m.content === "string") return m.content.length > 0;
      if (Array.isArray(m.content)) return m.content.length > 0;
      return false;
    });
    // Ensure alternating roles — merge consecutive same-role messages
    const sanitizedMessages: typeof filtered = [];
    for (const m of filtered) {
      const prev = sanitizedMessages[sanitizedMessages.length - 1];
      if (prev && prev.role === m.role) {
        // Merge into previous message
        const prevContent = typeof prev.content === "string" ? [{ type: "text" as const, text: prev.content }] : (prev.content as unknown[]);
        const currContent = typeof m.content === "string" ? [{ type: "text" as const, text: m.content }] : (m.content as unknown[]);
        prev.content = [...prevContent, ...currContent] as Message["content"];
      } else {
        sanitizedMessages.push({ ...m });
      }
    }

    // Ensure conversation ends with a user message (API rejects assistant-last)
    if (sanitizedMessages.length > 0 && sanitizedMessages[sanitizedMessages.length - 1].role === "assistant") {
      while (sanitizedMessages.length > 0 && sanitizedMessages[sanitizedMessages.length - 1].role === "assistant") {
        sanitizedMessages.pop();
      }
    }

    // Strip server-managed web search blocks from ALL assistant messages.
    // `encrypted_content` in search_result blocks expires between API calls, so
    // stale server blocks must be removed before every request — including the
    // latest assistant message. Thinking blocks are NOT stripped; their signature
    // is scoped to the thinking block itself and survives removal of sibling blocks.
    // If Anthropic rejects with "blocks cannot be modified" (corrupted thinking from
    // an earlier bug), the streamFromRouter call below retries once with thinking
    // stripped — best of both worlds.
    for (let i = sanitizedMessages.length - 1; i >= 0; i--) {
      const msg = sanitizedMessages[i];
      if (msg.role !== "assistant" || typeof msg.content === "string") continue;

      const blocks = msg.content as Array<{ type: string; [k: string]: unknown }>;
      const hasServerBlocks = blocks.some(
        (b) => b.type === "server_tool_use" || b.type === "web_search_tool_result"
      );
      if (!hasServerBlocks) continue;

      const cleaned = blocks.filter(
        (b) => b.type !== "server_tool_use" && b.type !== "web_search_tool_result",
      );

      if (cleaned.length === 0) {
        sanitizedMessages.splice(i, 1);
      } else {
        msg.content = cleaned as Message["content"];
      }
    }

    // Re-merge after stripping — adjacent same-role messages may have formed
    {
      let i = 0;
      while (i < sanitizedMessages.length - 1) {
        if (sanitizedMessages[i].role === sanitizedMessages[i + 1].role) {
          const a = sanitizedMessages[i];
          const b = sanitizedMessages[i + 1];
          const ac = typeof a.content === "string" ? [{ type: "text" as const, text: a.content }] : (a.content as unknown[]);
          const bc = typeof b.content === "string" ? [{ type: "text" as const, text: b.content }] : (b.content as unknown[]);
          a.content = [...ac, ...bc] as Message["content"];
          sanitizedMessages.splice(i + 1, 1);
        } else {
          i++;
        }
      }
    }

    // Strip orphaned tool_result blocks — their matching tool_use may have been
    // removed by compaction or stale Redis data. The API rejects any tool_result
    // whose tool_use_id doesn't appear in the immediately preceding assistant message.
    for (let i = 0; i < sanitizedMessages.length; i++) {
      const msg = sanitizedMessages[i];
      if (msg.role !== "user" || typeof msg.content === "string") continue;
      const blocks = msg.content as Array<{ type: string; tool_use_id?: string; [k: string]: unknown }>;
      const hasToolResults = blocks.some(b => b.type === "tool_result");
      if (!hasToolResults) continue;

      // Collect valid tool_use_ids from the preceding assistant message
      const prev = i > 0 ? sanitizedMessages[i - 1] : null;
      const validIds = new Set<string>();
      if (prev?.role === "assistant" && Array.isArray(prev.content)) {
        for (const b of prev.content as Array<{ type: string; id?: string }>) {
          if (b.type === "tool_use" && b.id) validIds.add(b.id);
        }
      }

      const cleaned = blocks.filter(b => {
        if (b.type !== "tool_result") return true;
        return b.tool_use_id ? validIds.has(b.tool_use_id) : true;
      });

      if (cleaned.length === 0) {
        sanitizedMessages.splice(i, 1);
        i--;
      } else if (cleaned.length !== blocks.length) {
        msg.content = cleaned as Message["content"];
      }
    }

    // Diagnostic logging
    console.log(`[loop] Iteration ${iterations} — ${sanitizedMessages.length} messages, ${tools.length} tools: [${tools.map(t => t.name).join(", ")}]`);
    sanitizedMessages.forEach((m, i) => {
      const contentType = typeof m.content;
      const contentSummary = contentType === "string"
        ? `string(${(m.content as string).length} chars): "${(m.content as string).slice(0, 80)}..."`
        : `array(${(m.content as unknown[]).length} blocks): [${(m.content as Array<{type: string}>).map(b => b.type).join(", ")}]`;
      console.log(`  [${i}] ${m.role}: ${contentSummary}`);
    });

    // Build system as array so the static portion can be prompt-cached.
    // The router prepends its own identity block (constant text) before forwarding,
    // so the cache key is stable: identity_block + staticSystemPrompt.
    const systemBlocks: SystemBlock[] = [
      { type: "text", text: staticSystemPrompt, cache_control: { type: "ephemeral" } },
    ];

    // Inject CLAUDE.md project context when it exists in the website files.
    // The agent writes this file after scaffolding to document the project's
    // stack, entry points, and architecture decisions. Reading it each turn
    // gives the model stable context that survives compaction and multi-turn gaps.
    if (options.websiteMode && websiteFiles["CLAUDE.md"]) {
      systemBlocks.push({
        type: "text",
        text: `# Project context (from CLAUDE.md)\n\n${websiteFiles["CLAUDE.md"]}`,
        cache_control: { type: "ephemeral" },
      });
    }

    // Inject subagent context when running as a subagent (survives compaction)
    if (options.extraSystemPrompt) {
      systemBlocks.push({ type: "text", text: options.extraSystemPrompt, cache_control: { type: "ephemeral" } });
    }

    // Inject pre-computed research results every iteration (survives compaction)
    if (options.researchResults) {
      const researchCtx = buildResearchContext(options.researchResults);
      if (researchCtx) {
        systemBlocks.push({ type: "text", text: researchCtx, cache_control: { type: "ephemeral" } });
      }
    }

    // Inject accumulated web search research sources (survives compaction)
    if (researchAccumulator.length > 0) {
      const researchSourcesCtx = buildResearchSourcesContext(researchAccumulator);
      if (researchSourcesCtx) {
        systemBlocks.push({ type: "text", text: researchSourcesCtx, cache_control: { type: "ephemeral" } });
      }
    }

    // Inject file attachments into the first user message with cache_control.
    // Anthropic caches the document/image bytes for 5 minutes — re-fetching from
    // storage each turn is fast, but the actual tokens are only charged once.
    if (options.resolvedAttachments?.length) {
      const firstUserIdx = sanitizedMessages.findIndex((m) => m.role === "user");
      if (firstUserIdx !== -1) {
        const firstUser = sanitizedMessages[firstUserIdx];
        const existingContent: unknown[] =
          typeof firstUser.content === "string"
            ? [{ type: "text", text: firstUser.content }]
            : (firstUser.content as unknown[]);
        const attachmentBlocksWithCache = options.resolvedAttachments.map((b) => ({
          ...b,
          cache_control: { type: "ephemeral" },
        }));
        sanitizedMessages[firstUserIdx] = {
          ...firstUser,
          content: [...attachmentBlocksWithCache, ...existingContent] as Message["content"],
        };
      }
    }

    const slidesCtx = buildSlidesContext(
      slides.map((s) => ({ id: s.id, index: s.index, title: s.title })),
      options.docsMode,
      options.sheetsMode,
    );
    if (slidesCtx) {
      systemBlocks.push({ type: "text", text: slidesCtx });
    }

    // Build diversity context (pattern tracking + next slide preview) — slides only
    if (!options.docsMode && !options.sheetsMode && !options.websiteMode) {
      const diversityCtx = buildDiversityContext(
        slides.map((s) => ({
          title: s.title,
          type: s.type,
          patternHint: s.patternHint,
        })),
        currentOutline
      );
      if (diversityCtx) {
        systemBlocks.push({ type: "text", text: diversityCtx });
      }
    }

    const connectionCtx = buildConnectionStatusContext(connectedProviders.map(c => c.provider), connectedProviders);
    systemBlocks.push({ type: "text", text: connectionCtx });

    const modeLabel = options.websiteMode
      ? "website"
      : options.docsMode
        ? "docs"
        : options.sheetsMode
          ? "sheets"
          : "slides";
    const chosenModel = options.websiteMode ? "claude-opus-4-7" : "claude-sonnet-4-6";
    console.log(`[agent] mode=${modeLabel} model=${chosenModel} thinking=${thinkingConfig?.budget_tokens ?? 0}`);

    const payload: StreamPayload = {
      model: chosenModel,
      max_tokens: thinkingConfig ? thinkingConfig.budget_tokens + 32000 : 32000,
      system: systemBlocks,
      messages: sanitizedMessages as Array<{ role: string; content: unknown }>,
      tools: [
        ...(tools.length ? toAnthropicTools(
          tools
        ) : []),
        { type: "web_search_20250305", name: "web_search", max_uses: 20 },
      ],
      stream: true,
      ...(thinkingConfig ? { thinking: thinkingConfig } : {}),
    };

    // Accumulate the assistant turn
    let assistantContentBlocks: Array<{
      type: string;
      id?: string;
      name?: string;
      input?: unknown;
      text?: string;
      thinking?: string;
      signature?: string;
      data?: unknown;        // redacted_thinking opaque blob
      tool_use_id?: string;
      content?: unknown;
    }> = [];

    let currentBlockIndex = -1;
    let inputBuffer = "";
    let lastElementCount = 0; // For element-boundary slide streaming
    let lastEmittedLength = 0; // For character-threshold slide streaming

    const runStream = async () => {
      // Reset per-attempt state so retries start clean
      assistantContentBlocks = [];
      currentBlockIndex = -1;
      inputBuffer = "";
      lastElementCount = 0;
      lastEmittedLength = 0;

      for await (const event of streamFromRouter(payload, signal, options.sessionId)) {
        if (signal?.aborted) break;

        const { type, data } = event;

        // Capture token usage for caller observability (OSS: no credit charge)
        if (type === "message_start") {
          const msg = data.message as { usage?: { input_tokens?: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number } };
          if (msg?.usage) {
            usageAccumulator.add({
              inputTokens: msg.usage.input_tokens ?? 0,
              outputTokens: 0,
              cacheReadTokens: msg.usage.cache_read_input_tokens ?? 0,
              cacheWriteTokens: msg.usage.cache_creation_input_tokens ?? 0,
            });
          }
        }

        if (type === "content_block_start") {
          const block = data.content_block as {
            type: string;
            id?: string;
            name?: string;
            input?: string;
            tool_use_id?: string;
            content?: unknown;
          };
          currentBlockIndex++;
          inputBuffer = "";

          if (block.type === "thinking") {
            assistantContentBlocks.push({ type: "thinking", thinking: "" });
          } else if (block.type === "redacted_thinking") {
            // Redacted thinking blocks must be passed through verbatim — no deltas
            assistantContentBlocks.push({ type: "redacted_thinking", data: (block as Record<string, unknown>).data });
          } else if (block.type === "text") {
            assistantContentBlocks.push({ type: "text", text: "" });
          } else if (block.type === "tool_use") {
            assistantContentBlocks.push({
              type: "tool_use",
              id: block.id,
              name: block.name,
              input: {},
            });
            // Reset streaming counters for new slide
            if (block.name === "create_slide") { lastElementCount = 0; lastEmittedLength = 0; }
            bus.emit({
              type: "tool_call",
              toolName: block.name ?? "",
              toolUseId: block.id ?? "",
              input: {},
            });
            toolHistory.push({
              id: block.id ?? `tool_${Date.now()}`,
              toolName: block.name ?? "unknown",
              status: "running",
              timestamp: Date.now(),
            });
          } else if (block.type === "server_tool_use") {
            // Spread the entire raw block — API requires server-managed blocks byte-identical
            assistantContentBlocks.push({ ...(block as Record<string, unknown>), type: "server_tool_use" });
            bus.emit({
              type: "tool_call",
              toolName: block.name ?? "web_search",
              toolUseId: block.id ?? "",
              input: {},
            });
            toolHistory.push({
              id: block.id ?? `ws_${Date.now()}`,
              toolName: block.name ?? "web_search",
              status: "running",
              timestamp: Date.now(),
            });
          } else if (block.type === "web_search_tool_result") {
            // Spread the entire raw block so we capture all fields for the current turn.
            // Note: these blocks are stripped from history on subsequent iterations because
            // encrypted_content expires between API calls.
            assistantContentBlocks.push({ ...(block as Record<string, unknown>), type: "web_search_tool_result" });

            // Extract search result titles + URLs for the frontend tool card
            let searchSummary = "Search results received";
            try {
              const searchContent = block.content as Array<{ type: string; title?: string; url?: string; encrypted_content?: string }>;
              if (Array.isArray(searchContent)) {
                const results = searchContent
                  .filter((r) => r.type === "web_search_result" && r.title && r.url)
                  .map((r) => `${r.title} — ${r.url}`);
                if (results.length > 0) {
                  searchSummary = results.join("\n");
                }

                // Accumulate research entries (dedupe by URL)
                const existingUrls = new Set(researchAccumulator.map(r => r.url));
                for (const r of searchContent) {
                  if (r.type === "web_search_result" && r.title && r.url && !existingUrls.has(r.url)) {
                    researchAccumulator.push({
                      query: "", // web_search doesn't expose the query in results
                      url: r.url,
                      title: r.title,
                      snippet: (r as { encrypted_content?: string }).encrypted_content ? "" : (r.title ?? ""),
                      retrievedAt: Date.now(),
                    });
                    existingUrls.add(r.url);
                  }
                }
              }
            } catch {
              // Fallback to generic message
            }

            bus.emit({
              type: "tool_result",
              toolName: "web_search",
              toolUseId: block.tool_use_id ?? "",
              result: searchSummary,
              isError: false,
            });
            const wsIdx = toolHistory.findIndex(t => t.id === block.tool_use_id);
            if (wsIdx >= 0) toolHistory[wsIdx] = { ...toolHistory[wsIdx], status: "done" };
          }
        } else if (type === "content_block_delta") {
          const delta = data.delta as { type: string; text?: string; partial_json?: string; thinking?: string; signature?: string };
          const block = assistantContentBlocks[currentBlockIndex];

          if (!block) continue;

          if (delta.type === "text_delta" && delta.text) {
            block.text = (block.text ?? "") + delta.text;
            bus.emit({ type: "text_delta", text: delta.text });
          } else if (delta.type === "thinking_delta" && delta.thinking) {
            block.thinking = (block.thinking ?? "") + delta.thinking;
            bus.emit({ type: "thinking", text: delta.thinking });
          } else if (delta.type === "signature_delta" && delta.signature) {
            block.signature = (block.signature ?? "") + delta.signature;
          } else if (delta.type === "input_json_delta" && delta.partial_json) {
            inputBuffer += delta.partial_json;

            // Stream slide preview: dual-trigger (element boundaries + character threshold)
            // Emits at element boundaries for "component placement" feel AND every ~200 chars
            // for smooth continuous streaming between element completions.
            const currentBlock = assistantContentBlocks[currentBlockIndex];
            if (currentBlock?.name === "create_slide") {
              const partial = extractPartialSlideContent(inputBuffer);
              if (partial?.content) {
                const elementCount = countCompleteElements(partial.content);
                const charDelta = partial.content.length - lastEmittedLength;

                if (elementCount > lastElementCount || charDelta >= 200) {
                  bus.emit({
                    type: "slide_building",
                    toolUseId: currentBlock.id ?? "",
                    title: partial.title,
                    partialContent: partial.content,
                  });
                  lastElementCount = elementCount;
                  lastEmittedLength = partial.content.length;
                }
              }
            }
          }
        } else if (type === "content_block_stop") {
          const block = assistantContentBlocks[currentBlockIndex];
          if ((block?.type === "tool_use" || block?.type === "server_tool_use") && inputBuffer) {
            try {
              block.input = JSON.parse(inputBuffer);
            } catch {
              block.input = {};
            }
            inputBuffer = "";
          }
          if (block?.type === "text" && block.text) {
            bus.emit({ type: "text_done", text: block.text });
          }
          // Emit input ready for tool use blocks once input is parsed
          if ((block?.type === "tool_use" || block?.type === "server_tool_use") && block.id) {
            bus.emit({ type: "tool_input_ready", toolUseId: block.id, input: block.input ?? {} });
          }
        } else if (type === "message_delta") {
          const delta = data.delta as { stop_reason?: string };
          // Capture output token usage
          const deltaUsage = data.usage as { output_tokens?: number } | undefined;
          if (deltaUsage?.output_tokens) {
            usageAccumulator.add({
              inputTokens: 0,
              outputTokens: deltaUsage.output_tokens,
              cacheReadTokens: 0,
              cacheWriteTokens: 0,
            });
          }
          if (delta.stop_reason === "end_turn") {
            // Will be handled at message_stop
          }
        } else if (type === "message_stop") {
          break;
        }
      }
    }; // end runStream

    try {
      await withStreamRetry(runStream);
    } catch (err) {
      if (signal?.aborted) break;
      bus.emit({ type: "error", message: String(err) });
      break;
    }

    // Add assistant message to history — keep ALL blocks including server-managed ones.
    // Extended thinking requires the latest assistant message to be byte-identical
    // to what the API originally sent (thinking block signature validation).
    const historyBlocks = assistantContentBlocks;
    if (historyBlocks.length > 0) {
      messages = [
        ...messages,
        {
          role: "assistant",
          content: historyBlocks as Message["content"],
        },
      ];
    }

    // Find tool use blocks
    const toolUseBlocks = assistantContentBlocks.filter(
      (b) => b.type === "tool_use" || b.type === "server_tool_use"
    );

    if (!toolUseBlocks.length) {
      // No tool calls — model is done
      const stopReason = "end_turn";
      bus.emit({ type: "done", stopReason });
      break;
    }

    // Execute all tool calls
    // content is a union: plain string for normal tools, structured array for
    // vision-returning tools (review_output) so the model can see an image.
    type ToolResultContent =
      | string
      | Array<
          | { type: "text"; text: string }
          | { type: "image"; source: { type: "url"; url: string } | { type: "base64"; media_type: string; data: string } }
        >;
    const toolResults: Array<{
      type: "tool_result";
      tool_use_id: string;
      content: ToolResultContent;
      is_error?: boolean;
    }> = [];

    // Pre-fetch results for read-only tools concurrently before the sequential loop.
    // When the model emits e.g. [search_images, search_images, search_images] or
    // [read_file, read_file, list_files] in one turn, they run in parallel (~3× faster).
    // File mutations, shell commands, and integration tools stay sequential.
    const parallelResultCache = new Map<string, unknown>();
    const parallelErrorCache = new Map<string, unknown>();
    {
      const parallelCandidates = toolUseBlocks.filter(
        (b) => b.name && PARALLEL_SAFE_NAMES.has(b.name) && b.id && b.type !== "server_tool_use",
      );
      if (parallelCandidates.length > 1) {
        await Promise.all(
          parallelCandidates.map(async ({ id: pId, name: pName, input: pInput }) => {
            const pTool = tools.find((t) => t.name === pName);
            if (!pTool || !pId) return;
            try {
              const pResult = await pTool.execute(pInput, signal, {
                userId: options.userId,
                sessionId: options.sessionId,
                websiteFiles: options.websiteMode ? websiteFiles : undefined,
                spawnDepth: options.spawnDepth ?? 0,
                activeBrandKit: activeBrandKitContext,
              });
              parallelResultCache.set(pId, pResult);
            } catch (pErr) {
              parallelErrorCache.set(pId, pErr);
            }
          }),
        );
      }
    }

    for (const toolBlock of toolUseBlocks) {
      const { id: toolUseId, name: toolName, input } = toolBlock;
      if (!toolName || !toolUseId) continue;

      // Auth pre-check for tools with providerTag
      const toolWithTag = tools.find((t) => t.name === toolName);
      if (toolWithTag?.providerTag) {
        const token = await getValidToken(options.userId, toolWithTag.providerTag);
        if (!token) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
          bus.emit({
            type: 'connection_required',
            provider: toolWithTag.providerTag,
            connectUrl: `${appUrl}/api/auth/connect/${toolWithTag.providerTag}`,
            message: `Connect your ${toolWithTag.providerTag} account to use this feature.`,
          });
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUseId!,
            content: JSON.stringify({ error: 'NOT_CONNECTED', provider: toolWithTag.providerTag }),
            is_error: false,
          });
          continue;
        }
      }

      let tool = tools.find(t => t.name === toolName);

      // Server-managed tools (web_search) are handled by the API — skip local execution
      if (!tool && toolBlock.type === "server_tool_use") {
        continue;
      }

      // Fallback: check integration registry in case the tool was activated
      // earlier in this same tool-call batch (activate_integration + gmail_send in one turn)
      if (!tool) {
        const allProviders = Array.from(activatedProviders);
        for (const p of allProviders) {
          const pTools = getIntegrationTools(p);
          const found = pTools.find(t => t.name === toolName);
          if (found) { tool = found; break; }
        }
      }

      if (!tool) {
        const errMsg = `Tool "${toolName}" not found. If this is an integration tool, call activate_integration first.`;
        bus.emit({ type: "tool_result", toolName, toolUseId, result: errMsg, isError: true });
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUseId,
          content: errMsg,
          is_error: true,
        });
        continue;
      }

      try {
        // Auto-inject stashed export as attachment for gmail_send
        // ALWAYS override — the LLM never has real base64 data (it was stripped from conversation)
        if (toolName === "gmail_send") {
          const gmailInput = input as Record<string, unknown>;
          // Auto-export if no prior export exists
          if (!lastExportResult) {
            console.log(`[loop] gmail_send called without prior export — auto-generating PDF for session ${options.sessionId}`);
            const autoExport = await generateExport(options.sessionId, 'pdf');
            if ('base64' in autoExport) {
              lastExportResult = autoExport;
              console.log(`[loop] Auto-export success: ${autoExport.filename}, ${autoExport.sizeBytes} bytes`);
            } else {
              console.log(`[loop] Auto-export failed: ${autoExport.error}`);
            }
          }
          if (lastExportResult) {
            console.log(`[loop] Attaching export to gmail_send: ${lastExportResult.filename}, base64 length: ${lastExportResult.base64.length}`);
            gmailInput.attachment = {
              filename: lastExportResult.filename,
              mimeType: lastExportResult.mimeType,
              base64: lastExportResult.base64,
            };
          } else {
            // Auto-export failed too — strip any hallucinated attachment
            if (gmailInput.attachment) {
              console.log(`[loop] WARNING: stripping hallucinated attachment (auto-export also failed)`);
              delete gmailInput.attachment;
            }
          }
        }

        // Use pre-fetched result for parallel-safe tools; otherwise execute normally.
        if (parallelErrorCache.has(toolUseId)) throw parallelErrorCache.get(toolUseId) as Error;
        const result: unknown = parallelResultCache.has(toolUseId)
          ? parallelResultCache.get(toolUseId)!
          : await tool.execute(input, signal, {
              userId: options.userId,
              sessionId: options.sessionId,
              // update_sheet + update_slide both want access to current slide state
              // (slide content for diff capture; sheet workbook lookup).
              slides: (toolName === "update_sheet" || toolName === "update_slide") ? slides : undefined,
              websiteFiles: options.websiteMode ? websiteFiles : undefined,
              spawnDepth: options.spawnDepth ?? 0,
              activeBrandKit: activeBrandKitContext,
            });

        // Safety net: if a tool with a providerTag slipped past the pre-check and
        // returned NOT_CONNECTED (e.g. token was revoked between pre-check and call),
        // surface the connection card so the user can reconnect inline.
        if (tool.providerTag && result && typeof result === 'object') {
          const r = result as { error?: string; code?: string };
          if (r.error === 'NOT_CONNECTED' || r.code === 'NOT_CONNECTED') {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
            bus.emit({
              type: 'connection_required',
              provider: tool.providerTag,
              connectUrl: `${appUrl}/api/auth/connect/${tool.providerTag}`,
              message: `Connect your ${tool.providerTag} account to use this feature.`,
            });
          }
        }

        // Slim SSE result for slide tools — don't send HTML to frontend
        const sseResult = (toolName === "create_slide" || toolName === "update_slide")
          ? { id: (result as Slide).id, title: (result as Slide).title, index: (result as Slide).index }
          : result;
        bus.emit({ type: "tool_result", toolName, toolUseId, result: sseResult, isError: false });
        // Update toolHistory entry
        const thIdx = toolHistory.findIndex(t => t.id === toolUseId);
        if (thIdx >= 0) {
          toolHistory[thIdx] = {
            ...toolHistory[thIdx],
            status: "done",
            input: input as Record<string, unknown>,
          };
        }

        // Handle slide mutations
        if (toolName === "create_outline") {
          const outline = result as Outline;
          currentOutline = outline;
          onOutlineCreated?.(outline);
          bus.emit({ type: "outline_created", outline });
        } else if (toolName === "create_sheet") {
          const slide = result as Slide;
          if (slide.index === -1) {
            slide.index = slides.length;
          }
          slides = insertSlide(slides, slide);
          onSlideCreated?.(slide);
          bus.emit({ type: "slide_created", slide });
        } else if (toolName === "update_sheet") {
          const changes = result as { slideId: string } & Partial<Slide>;
          const { slideId, ...rest } = changes;
          slides = slides.map((s) => (s.id === slideId ? { ...s, ...rest } : s));
          onSlideUpdated?.(slideId, rest);
          bus.emit({ type: "slide_updated", slideId, changes: rest });
        } else if (toolName === "create_slide" || toolName === "create_page") {
          const slide = result as Slide;
          if (slide.index === -1) {
            slide.index = slides.length;
          }
          if (toolName === "create_slide") {
            const patternHint = detectPatternHint(slide.content ?? "");
            slide.patternHint = patternHint;
          }
          slides = insertSlide(slides, slide);
          onSlideCreated?.(slide);
          bus.emit({ type: "slide_created", slide });
        } else if (toolName === "update_slide" || toolName === "update_page") {
          const changes = result as { slideId: string } & Partial<Slide>;
          const { slideId, ...rest } = changes;
          slides = slides.map((s) => (s.id === slideId ? { ...s, ...rest } : s));
          onSlideUpdated?.(slideId, rest);
          bus.emit({ type: "slide_updated", slideId, changes: rest });
        } else if (toolName === "delete_slide" || toolName === "delete_page") {
          const { deleted } = result as { deleted: string };
          slides = slides.filter((s) => s.id !== deleted);
          onSlideDeleted?.(deleted);
          bus.emit({ type: "slide_deleted", slideId: deleted });
        } else if (toolName === "reorder_slides" || toolName === "reorder_pages") {
          const { order } = result as { order: string[] };
          slides = reorderSlides(slides, order);
          onSlidesReordered?.(order);
          bus.emit({ type: "slides_reordered", order });
        } else if (toolName === "set_theme") {
          const { theme, colors } = result as { theme: string; colors: { bg: string; text: string; accent: string; secondary: string; dark: string; accentLight: string; border: string } };
          currentTheme = theme;
          currentThemeColors = colors;
          onThemeChanged?.(theme);
          bus.emit({ type: "theme_changed", theme, colors });
        } else if (toolName === "fetch_logo") {
          const logoResult = result as { url: string; source: string; colors: string[]; name?: string } | null;
          if (logoResult?.url) {
            logoUrl = logoResult.url;
            bus.emit({ type: "logo_fetched", logoUrl: logoResult.url, colors: logoResult.colors ?? [], name: logoResult.name });
          }
        }
        // ─── Website mode tool handlers ──────────────────────────────────
        else if (toolName === "create_file") {
          const { path: p, content } = result as { path: string; content: string };
          websiteFiles[p] = content;
          onWebsiteFileCreated?.(p, content);
          bus.emit({ type: "website_file_created", path: p, content });
        } else if (toolName === "update_file" || toolName === "patch_file") {
          const { path: p, content } = result as { path: string; content: string };
          websiteFiles[p] = content;
          onWebsiteFileUpdated?.(p, content);
          bus.emit({ type: "website_file_updated", path: p, content });
        } else if (toolName === "delete_file") {
          const { path: p } = result as { path: string };
          delete websiteFiles[p];
          onWebsiteFileDeleted?.(p);
          bus.emit({ type: "website_file_deleted", path: p });
        } else if (toolName === "run_shell_command" || toolName === "check_types") {
          const { cmd, args, cwd } = result as { cmd: string; args: string[]; cwd?: string };
          const isSync = isQuickShellCommand(cmd, args);
          onWebsiteShellCommand?.(cmd, args, toolUseId);
          bus.emit({ type: "website_shell_command", cmd, args, cwd, toolUseId, sync: isSync });

          if (isSync) {
            try {
              const syncResult = await waitForShellResult(toolUseId, syncTimeoutMs(cmd, args));
              const cap = syncResult.output.slice(0, 50_000);
              const label = syncResult.exitCode === 0
                ? `Exit code: 0 (success)`
                : `Exit code: ${syncResult.exitCode} (non-zero)`;
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUseId,
                content: `${label}\n\nOutput:\n${cap}`,
              });
              continue; // skip the default JSON.stringify path
            } catch (syncErr) {
              // Timeout or Redis error — fall through so model gets { queued: true }
              // and the result will arrive as a user message next turn instead.
              console.warn(`[loop] sync shell fallback toolUseId=${toolUseId}:`, syncErr);
            }
          }
        }

        // ─── Vision-returning tools (review_output): build a structured
        // tool_result content array with an image block so the model can
        // actually see the screenshot. Skip the JSON-stringify branch for these.
        if (
          toolName === "review_output" &&
          result &&
          typeof result === "object" &&
          (result as { __visionBlocks?: boolean }).__visionBlocks === true
        ) {
          const r = result as { screenshotUrl: string | null; instruction: string; notReady?: boolean };
          if (r.notReady || !r.screenshotUrl) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUseId,
              content: r.instruction,
            });
          } else {
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUseId,
              content: [
                { type: "text", text: r.instruction },
                { type: "image", source: { type: "url", url: r.screenshotUrl } },
              ],
            });
          }
          continue;
        }

        // Slim tool results for slide tools — don't send full HTML back into conversation
        // (model already sees slide state via buildSlidesContext in system prompt)
        let resultContent: string;
        if (toolName === "create_slide" || toolName === "create_page") {
          const s = result as { id: string; index: number; title: string };
          resultContent = JSON.stringify({ id: s.id, index: s.index, title: s.title });
        } else if (toolName === "update_slide" || toolName === "update_page") {
          const u = result as { slideId: string; title?: string };
          resultContent = JSON.stringify({ slideId: u.slideId, title: u.title ?? "updated" });
        } else if (toolName === "create_sheet") {
          const s = result as { id: string; index: number; title: string };
          resultContent = JSON.stringify({ id: s.id, index: s.index, title: s.title });
        } else if (toolName === "update_sheet") {
          const u = result as { slideId: string; changeSummary?: string };
          resultContent = JSON.stringify({ slideId: u.slideId, changeSummary: u.changeSummary ?? "updated" });
        } else if (toolName === "patch_file") {
          const p = result as { path: string; patchesApplied: number; sizeBytes: number; sizeDelta: number };
          resultContent = JSON.stringify({
            path: p.path,
            patchesApplied: p.patchesApplied,
            sizeBytes: p.sizeBytes,
            sizeDelta: p.sizeDelta,
            note: "Patches applied. The model's local mental model of this file's content is now stale — re-read with read_file before the next patch if unsure.",
          });
        } else if (toolName === "export_pdf") {
          // Never store base64 PDF data in conversation — just confirm success/failure
          const exp = result as { base64?: string; sizeBytes?: number; mimeType?: string; filename?: string; error?: string };
          if (exp.error) {
            resultContent = JSON.stringify({ error: exp.error });
          } else {
            lastExportResult = { base64: exp.base64!, sizeBytes: exp.sizeBytes!, mimeType: exp.mimeType!, filename: exp.filename! };
            console.log(`[loop] export_pdf success: ${exp.filename}, ${exp.sizeBytes} bytes, base64 length: ${exp.base64!.length}`);
            resultContent = JSON.stringify({ success: true, sizeBytes: exp.sizeBytes, filename: exp.filename, note: "PDF ready to attach via gmail_send." });
          }
        } else {
          resultContent = JSON.stringify(result);
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUseId,
          content: resultContent,
        });
      } catch (err) {
        const errMsg = `Tool "${toolName}" failed: ${String(err)}`;
        console.warn(`[loop] ${errMsg}`);
        bus.emit({ type: "tool_result", toolName, toolUseId, result: errMsg, isError: true });
        const errIdx = toolHistory.findIndex(t => t.id === toolUseId);
        if (errIdx >= 0) toolHistory[errIdx] = { ...toolHistory[errIdx], status: "error" };
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUseId,
          content: errMsg,
          is_error: true,
        });
      }
    }

    // Add tool results as user turn — only if there are results to add
    if (toolResults.length > 0) {
      messages = [
        ...messages,
        {
          role: "user",
          content: toolResults as Message["content"],
        },
      ];
    }

    // OSS build: no credit deduction. Users plug in their own keys → unlimited.

    // Persist partial state so Vercel hard-kills don't destroy completed work.
    // Wrapped in try/catch — a save failure must not kill the loop; the final
    // saveSession in the route handler is still a second chance.
    // Passes every field present in LoopResult so a kill-point save is
    // indistinguishable from a normal-completion save.
    if (options.onIterationComplete) {
      try {
        await options.onIterationComplete({
          messages,
          slides,
          outline: currentOutline,
          toolHistory,
          logoUrl,
          theme: currentTheme,
          themeColors: currentThemeColors,
          research: researchAccumulator,
          websiteFiles,
        });
      } catch (err) {
        console.warn("[loop] onIterationComplete failed (continuing):", err);
      }
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    bus.emit({ type: "error", message: `Max iterations (${MAX_ITERATIONS}) reached` });
    bus.emit({ type: "done", stopReason: "max_iterations" });
  }

  clearSubagentBus(options.sessionId);
  return { messages, slides, outline: currentOutline, logoUrl, theme: currentTheme, themeColors: currentThemeColors, toolHistory, research: researchAccumulator, tokenUsage: usageAccumulator.getTotals(), websiteFiles, bus };
}

// ─── Slide streaming utilities ─────────────────────────────────────────────────

/** Unescape JSON string characters (the HTML is JSON-encoded inside tool input) */
function unescapeJsonString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/** Extract title and partial HTML content from the incomplete JSON input buffer */
function extractPartialSlideContent(buffer: string): { title?: string; content?: string } | null {
  let title: string | undefined;
  const titleMatch = buffer.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (titleMatch) title = unescapeJsonString(titleMatch[1]);

  const contentKey = '"content"';
  const contentStart = buffer.indexOf(contentKey);
  if (contentStart === -1) return title ? { title } : null;

  const colonAfter = buffer.indexOf(":", contentStart + contentKey.length);
  if (colonAfter === -1) return title ? { title } : null;

  const quoteStart = buffer.indexOf('"', colonAfter);
  if (quoteStart === -1) return title ? { title } : null;

  const raw = buffer.slice(quoteStart + 1);
  const content = unescapeJsonString(raw);

  return { title, content };
}

/** Count closing tags for block-level elements — each one = a complete visual component */
const ELEMENT_BOUNDARY_RE = /<\/(div|section|ul|ol|h[1-6]|p|table|figure|blockquote|header|footer|nav|main|article)>/gi;
function countCompleteElements(html: string): number {
  const matches = html.match(ELEMENT_BOUNDARY_RE);
  return matches ? matches.length : 0;
}

// ─── Slide helpers ─────────────────────────────────────────────────────────────

function insertSlide(slides: Slide[], newSlide: Slide): Slide[] {
  const result = [...slides];
  if (newSlide.index >= 0 && newSlide.index <= result.length) {
    result.splice(newSlide.index, 0, newSlide);
    // Re-index
    return result.map((s, i) => ({ ...s, index: i }));
  }
  return [...result, { ...newSlide, index: result.length }];
}

function reorderSlides(slides: Slide[], order: string[]): Slide[] {
  const byId = new Map(slides.map((s) => [s.id, s]));
  return order
    .map((id, index) => {
      const s = byId.get(id);
      return s ? { ...s, index } : null;
    })
    .filter((s): s is Slide => s !== null);
}
