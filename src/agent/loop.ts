// Core agentic loop — tool use + streaming + event emission
// Handles multi-turn tool use until the model stops or max iterations reached

import type { Message, Slide, Outline, ToolCallEntry, Session } from "@/lib/redis";
import { AgentEventBus } from "./events";
import { streamFromRouter, getThinkingConfig, type StreamPayload } from "./stream";
import { toAnthropicTools, type AgentTool } from "./tools/index";
import { getAllToolsWithAuth, getIntegrationTools } from './tools/tool-registry';
import { activateIntegrationTool, setActivationCallback } from './tools/activate-integration';
import { createDocOutlineTool } from "./tools/create-doc-outline";
import { docBuildTools, docEditTools } from "./tools/doc-page-tools";
import { buildStaticSystemPrompt, buildSlidesContext, buildResearchContext, buildDiversityContext, buildResearchSourcesContext, buildConnectionStatusContext } from "./system-prompt";
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
import type { SystemBlock } from "./stream";
import { maybeCompact } from "./compaction";
import type { ResearchOutput } from "@/skills/deep-research/research-orchestrator";
import type { SlideCategory } from "@/skills/slide-categories/slide-classifier";

// Ensure providers are registered
import "@/agent/tools/slide-provider";

// ─── Token usage tracking (lightweight, no external dep) ──────────────────────
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

class UsageAccumulator {
  private totals: TokenUsage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
  add(u: TokenUsage) {
    this.totals.inputTokens += u.inputTokens;
    this.totals.outputTokens += u.outputTokens;
    this.totals.cacheReadTokens += u.cacheReadTokens;
    this.totals.cacheWriteTokens += u.cacheWriteTokens;
  }
  getTotal(): TokenUsage { return { ...this.totals }; }
  getTotalCredits(): number { return 0; } // no credits system in OSS
}

const MAX_ITERATIONS = 25;

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
  research?: Session["research"];
  brand?: { brandJson: Record<string, unknown>; brandConfig?: import("@/lib/brand-defaults").BrandConfig };
  resolvedAttachments?: import("@/lib/types").ContentBlock[];
  signal?: AbortSignal;
  onSlideCreated?: (slide: Slide) => void;
  onSlideUpdated?: (slideId: string, changes: Partial<Slide>) => void;
  onSlideDeleted?: (slideId: string) => void;
  onSlidesReordered?: (order: string[]) => void;
  onThemeChanged?: (theme: string) => void;
  onOutlineCreated?: (outline: Outline) => void;
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
  } = options;

  // Compact history if needed
  let messages = await maybeCompact(options.messages, { docsMode: options.docsMode });
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
    if (!options.docsMode) {
      return [...rawTools];
    }
    // Remove ALL slide-specific tools
    const slideToolNames = ["create_slide", "update_slide", "delete_slide", "reorder_slides", "create_outline", "fetch_logo", "set_theme"];
    const nonSlideTools = rawTools.filter(t => !slideToolNames.includes(t.name));
    // Use build tools (no update/delete) for fresh docs, edit tools for existing docs
    const isEditingExistingDoc = options.slides.length > 0 && options.messages.filter(m => m.role === "user").length >= 3;
    const pageTools = isEditingExistingDoc ? docEditTools : docBuildTools;
    return [...nonSlideTools, createDocOutlineTool, ...pageTools];
  })();

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
  const staticSystemPrompt = buildStaticSystemPrompt(options.slideCategory, options.deepResearch, options.brand, options.docsMode, options.docCategory, options.presentationType);

  const thinkingConfig = getThinkingConfig();

  let connectedProviders: Array<{ provider: string; metadata: Record<string, string> | null }> = [];
  try {
    const rows = await prisma.userConnection.findMany({
      where: { userId: options.userId, status: 'active' },
      select: { provider: true, metadata: true },
    });
    connectedProviders = rows.map((r: { provider: string; metadata: unknown }) => ({
      provider: r.provider,
      metadata: r.metadata as Record<string, string> | null,
    }));
  } catch {
    // Prisma client may not have userConnection yet (migration pending) — degrade gracefully
  }

  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    if (signal?.aborted) {
      bus.emit({ type: "error", message: "Aborted by user" });
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
      options.docsMode
    );
    if (slidesCtx) {
      systemBlocks.push({ type: "text", text: slidesCtx });
    }

    // Build diversity context (pattern tracking) — slides only, docs don't need pattern variety
    if (!options.docsMode) {
      const diversityCtx = buildDiversityContext(
        slides.map((s) => ({
          title: s.title,
          type: s.type,
          patternHint: s.patternHint,
        }))
      );
      if (diversityCtx) {
        systemBlocks.push({ type: "text", text: diversityCtx });
      }
    }

    const connectionCtx = buildConnectionStatusContext(connectedProviders.map(c => c.provider), connectedProviders);
    systemBlocks.push({ type: "text", text: connectionCtx });

    const payload: StreamPayload = {
      model: "claude-sonnet-4-6",
      max_tokens: thinkingConfig ? thinkingConfig.budget_tokens + 16000 : 16000,
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
    const assistantContentBlocks: Array<{
      type: string;
      id?: string;
      name?: string;
      input?: unknown;
      text?: string;
      thinking?: string;
      tool_use_id?: string;
      content?: unknown;
    }> = [];

    let currentBlockIndex = -1;
    let inputBuffer = "";
    let lastElementCount = 0; // For element-boundary slide streaming
    let lastEmittedLength = 0; // For character-threshold slide streaming

    try {
      for await (const event of streamFromRouter(payload, signal, options.sessionId)) {
        if (signal?.aborted) break;

        const { type, data } = event;

        // Capture token usage for credit tracking
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
            assistantContentBlocks.push({
              type: "server_tool_use",
              id: block.id,
              name: block.name,
              input: {},
            });
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
            assistantContentBlocks.push({
              type: "web_search_tool_result",
              tool_use_id: block.tool_use_id,
              content: block.content,
            });

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
          const delta = data.delta as { type: string; text?: string; partial_json?: string; thinking?: string };
          const block = assistantContentBlocks[currentBlockIndex];

          if (!block) continue;

          if (delta.type === "text_delta" && delta.text) {
            block.text = (block.text ?? "") + delta.text;
            bus.emit({ type: "text_delta", text: delta.text });
          } else if (delta.type === "thinking_delta" && delta.thinking) {
            block.thinking = (block.thinking ?? "") + delta.thinking;
            bus.emit({ type: "thinking", text: delta.thinking });
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
    } catch (err) {
      if (signal?.aborted) break;
      bus.emit({ type: "error", message: String(err) });
      break;
    }

    // Add assistant message to history — strip server-managed tool blocks
    // (web_search_tool_result contains encrypted_content that can't be replayed)
    const historyBlocks = assistantContentBlocks
      .filter((b) => b.type !== "server_tool_use" && b.type !== "web_search_tool_result");
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
    const toolResults: Array<{
      type: "tool_result";
      tool_use_id: string;
      content: string;
      is_error?: boolean;
    }> = [];

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

        const result = await tool.execute(input, signal, { userId: options.userId, sessionId: options.sessionId });

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

        // Slim tool results for slide tools — don't send full HTML back into conversation
        // (model already sees slide state via buildSlidesContext in system prompt)
        let resultContent: string;
        if (toolName === "create_slide" || toolName === "create_page") {
          const s = result as { id: string; index: number; title: string };
          resultContent = JSON.stringify({ id: s.id, index: s.index, title: s.title });
        } else if (toolName === "update_slide" || toolName === "update_page") {
          const u = result as { slideId: string; title?: string };
          resultContent = JSON.stringify({ slideId: u.slideId, title: u.title ?? "updated" });
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

  }

  if (iterations >= MAX_ITERATIONS) {
    bus.emit({ type: "error", message: `Max iterations (${MAX_ITERATIONS}) reached` });
    bus.emit({ type: "done", stopReason: "max_iterations" });
  }

  return { messages, slides, outline: currentOutline, logoUrl, theme: currentTheme, themeColors: currentThemeColors, toolHistory, research: researchAccumulator, tokenUsage: usageAccumulator.getTotal(), bus };
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
