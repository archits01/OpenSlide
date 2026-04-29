// Context compaction — triggered when estimated token count exceeds threshold
// OpenClaw pattern: summarize older turns, keep recent turns verbatim

import type { Message } from "@/lib/redis";

const MAX_TOKENS_SLIDES = 35_000;
const MAX_TOKENS_DOCS = 20_000; // Docs pages are 3-5x larger — compact earlier
const MAX_TOKENS_WEBSITE = 25_000; // Website files grow fast across turns — compact eagerly
const KEEP_RECENT_TURNS = 10;
// Website mode: tool_result bodies older than this turn offset are replaced with a stub.
// Model calls read_file to re-fetch the current version from websiteFilesJson.
const WEBSITE_FILE_TOOL_STUB_AFTER_TURNS = 3;
const WEBSITE_FILE_TOOLS = new Set(["create_file", "update_file", "read_file"]);

// Rough token estimate: ~4 chars per token (conservative)
function estimateTokens(messages: Message[]): number {
  let chars = 0;
  for (const msg of messages) {
    if (typeof msg.content === "string") {
      chars += msg.content.length;
    } else if (Array.isArray(msg.content)) {
      for (const block of msg.content as Array<{ type: string; text?: string; content?: unknown; source?: { data?: string } }>) {
        if (block.text) chars += block.text.length;
        if (typeof block.content === "string") chars += block.content.length;
        // Base64-encoded files: count the raw data length (base64 is ~4/3 of binary size)
        if (block.source?.data) chars += block.source.data.length;
      }
    }
  }
  return Math.ceil(chars / 4);
}

async function summarizeHistory(
  messages: Message[],
  routerUrl: string,
  proxyKey: string
): Promise<string> {
  // Build a plain text transcript for summarization
  const transcript = messages
    .map((m) => {
      const role = m.role === "user" ? "User" : "Assistant";
      if (typeof m.content === "string") {
        return `${role}: ${m.content}`;
      }
      const parts: string[] = [];
      for (const block of m.content as Array<{ type: string; text?: string; title?: string; source?: { media_type?: string } }>) {
        if (block.type === "text" && block.text) {
          parts.push(block.text);
        } else if (block.type === "document") {
          parts.push(`[Attached document: ${block.title ?? "untitled"} (${block.source?.media_type ?? "text"})]`);
        } else if (block.type === "image") {
          parts.push(`[Attached image: ${block.title ?? "untitled"}]`);
        }
      }
      return `${role}: ${parts.join(" ")}`;
    })
    .join("\n\n");

  const payload = {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Summarize this presentation conversation concisely. Focus on: what presentation was requested, what slides were created (titles and key content), design decisions made, and any user feedback or changes. Be specific about slide content.\n\n---\n\n${transcript}`,
      },
    ],
  };

  const res = await fetch(`${routerUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${proxyKey}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // If summarization fails, just return a minimal summary
    return `[Summarization unavailable — ${messages.length} earlier messages omitted]`;
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "[Summary unavailable]";
  return text;
}

/**
 * Website-mode pre-compaction: walk messages, replace file-tool tool_result
 * bodies older than N turns with a small stub. Keeps the model's context
 * lean while preserving accuracy (it can always read_file to re-fetch).
 */
function stubOldFileToolResults(messages: Message[]): Message[] {
  const cutoffIdx = Math.max(0, messages.length - WEBSITE_FILE_TOOL_STUB_AFTER_TURNS * 2); // *2 → turn = user+assistant
  // Map tool_use_id → toolName so we know which tool_results to stub
  const toolUseToName = new Map<string, string>();
  for (let i = 0; i < cutoffIdx; i++) {
    const msg = messages[i];
    if (msg.role !== "assistant" || typeof msg.content === "string") continue;
    for (const b of msg.content as Array<{ type: string; id?: string; name?: string }>) {
      if (b.type === "tool_use" && b.id && b.name) toolUseToName.set(b.id, b.name);
    }
  }
  return messages.map((msg, i) => {
    if (i >= cutoffIdx) return msg;
    if (msg.role !== "user" || typeof msg.content === "string") return msg;
    const blocks = msg.content as Array<{ type: string; tool_use_id?: string; content?: unknown; is_error?: boolean }>;
    let changed = false;
    const newBlocks = blocks.map((b) => {
      if (b.type !== "tool_result" || !b.tool_use_id) return b;
      const toolName = toolUseToName.get(b.tool_use_id);
      if (!toolName || !WEBSITE_FILE_TOOLS.has(toolName)) return b;
      if (b.is_error) return b; // keep error results so model can learn
      // Stub: keep only the path if parseable
      const contentStr = typeof b.content === "string" ? b.content : JSON.stringify(b.content ?? {});
      let pathHint = "";
      try {
        const parsed = JSON.parse(contentStr) as { path?: string };
        if (parsed.path) pathHint = ` (path=${parsed.path})`;
      } catch { /* ignore */ }
      changed = true;
      return {
        ...b,
        content: `[compacted older-turn ${toolName} result${pathHint} — call read_file to re-fetch current content]`,
      };
    });
    if (!changed) return msg;
    return { ...msg, content: newBlocks as Message["content"] };
  });
}

export async function maybeCompact(
  messages: Message[],
  options?: { routerUrl?: string; proxyKey?: string; docsMode?: boolean; websiteMode?: boolean }
): Promise<Message[]> {
  // Website mode: first stub old file tool_results (cheap) before considering summarization
  const preprocessed = options?.websiteMode ? stubOldFileToolResults(messages) : messages;
  const threshold = options?.websiteMode
    ? MAX_TOKENS_WEBSITE
    : options?.docsMode
    ? MAX_TOKENS_DOCS
    : MAX_TOKENS_SLIDES;
  const estimated = estimateTokens(preprocessed);

  if (estimated < threshold) {
    return preprocessed;
  }

  console.log(
    `[compaction] Context ~${estimated} tokens > ${threshold}, compacting...`
  );

  // Find a clean cut point that doesn't split a tool_use / tool_result pair.
  // Start from the target offset and walk backward until we hit a user message
  // that is a natural turn (plain text), not a tool_result response.
  let cutIndex = preprocessed.length - KEEP_RECENT_TURNS;
  while (cutIndex > 0) {
    const msg = preprocessed[cutIndex];
    // A user message with only text content (no tool_results) is a clean boundary
    if (msg.role === "user") {
      if (typeof msg.content === "string") break;
      const blocks = msg.content as Array<{ type: string }>;
      const hasToolResult = blocks.some(b => b.type === "tool_result");
      if (!hasToolResult) break;
    }
    cutIndex--;
  }

  const toSummarize = preprocessed.slice(0, cutIndex);
  const recent = preprocessed.slice(cutIndex);

  if (!toSummarize.length) return preprocessed;

  const routerUrl = options?.routerUrl ?? process.env.CLAUDE_ROUTER_URL ?? "";
  const proxyKey = options?.proxyKey ?? process.env.CLAUDE_ROUTER_PROXY_KEY ?? "";

  const summary = await summarizeHistory(toSummarize, routerUrl, proxyKey);

  const summaryMessage: Message = {
    role: "user",
    content: `[Previous conversation summary — ${toSummarize.length} messages]: ${summary}`,
  };

  console.log(`[compaction] Compacted ${toSummarize.length} messages into summary`);

  return [summaryMessage, ...recent];
}
