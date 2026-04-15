// Context compaction — triggered when estimated token count exceeds threshold
// Summarize older turns, keep recent turns verbatim

import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@/lib/redis";

const MAX_TOKENS_SLIDES = 35_000;
const MAX_TOKENS_DOCS = 20_000; // Docs pages are 3-5x larger — compact earlier
const KEEP_RECENT_TURNS = 10;

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

async function summarizeHistory(messages: Message[]): Promise<string> {
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

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Summarize this presentation conversation concisely. Focus on: what presentation was requested, what slides were created (titles and key content), design decisions made, and any user feedback or changes. Be specific about slide content.\n\n---\n\n${transcript}`,
        },
      ],
    });
    return (response.content[0] as { type: string; text?: string })?.text ?? "[Summary unavailable]";
  } catch {
    return `[Summarization unavailable — ${messages.length} earlier messages omitted]`;
  }
}

export async function maybeCompact(
  messages: Message[],
  options?: { docsMode?: boolean }
): Promise<Message[]> {
  const threshold = options?.docsMode ? MAX_TOKENS_DOCS : MAX_TOKENS_SLIDES;
  const estimated = estimateTokens(messages);

  if (estimated < threshold) {
    return messages;
  }

  console.log(
    `[compaction] Context ~${estimated} tokens > ${threshold}, compacting...`
  );

  // Find a clean cut point that doesn't split a tool_use / tool_result pair.
  // Start from the target offset and walk backward until we hit a user message
  // that is a natural turn (plain text), not a tool_result response.
  let cutIndex = messages.length - KEEP_RECENT_TURNS;
  while (cutIndex > 0) {
    const msg = messages[cutIndex];
    // A user message with only text content (no tool_results) is a clean boundary
    if (msg.role === "user") {
      if (typeof msg.content === "string") break;
      const blocks = msg.content as Array<{ type: string }>;
      const hasToolResult = blocks.some(b => b.type === "tool_result");
      if (!hasToolResult) break;
    }
    cutIndex--;
  }

  const toSummarize = messages.slice(0, cutIndex);
  const recent = messages.slice(cutIndex);

  if (!toSummarize.length) return messages;

  const summary = await summarizeHistory(toSummarize);

  const summaryMessage: Message = {
    role: "user",
    content: `[Previous conversation summary — ${toSummarize.length} messages]: ${summary}`,
  };

  console.log(`[compaction] Compacted ${toSummarize.length} messages into summary`);

  return [summaryMessage, ...recent];
}
