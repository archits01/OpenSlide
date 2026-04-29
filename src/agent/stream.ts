// SSE client for claude-router
// claude-router exposes a streaming Anthropic Messages API compatible endpoint

export interface RawSSEEvent {
  type: string;
  data: Record<string, unknown>;
}

export type SystemBlock = {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
};

export interface StreamPayload {
  model?: string;
  max_tokens: number;
  system?: string | SystemBlock[];
  messages: Array<{ role: string; content: unknown }>;
  tools?: unknown[];
  thinking?: { type: "enabled"; budget_tokens: number };
  stream: true;
}

const ROUTER_URL = () => process.env.CLAUDE_ROUTER_URL!;
const PROXY_KEY = () => process.env.CLAUDE_ROUTER_PROXY_KEY!;

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 2000; // 2s, doubles each retry: 2s → 4s → 8s → 16s

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Diagnostic: fingerprints every thinking/redacted_thinking block in the outgoing
// payload so we can correlate "cannot be modified" 400s with the exact block state.
// Content is NOT logged — only lengths + short hashes, so nothing sensitive leaks.
function fingerprintThinkingBlocks(payload: StreamPayload): void {
  try {
    for (let i = 0; i < payload.messages.length; i++) {
      const m = payload.messages[i];
      if (m.role !== "assistant" || !Array.isArray(m.content)) continue;
      const blocks = m.content as Array<{ type?: string; thinking?: string; signature?: string; data?: string }>;
      for (let j = 0; j < blocks.length; j++) {
        const b = blocks[j];
        if (b.type === "thinking") {
          const tlen = (b.thinking ?? "").length;
          const slen = (b.signature ?? "").length;
          const sigHead = (b.signature ?? "").slice(0, 8);
          const sigTail = (b.signature ?? "").slice(-8);
          console.log(`[stream][fp] messages[${i}].content[${j}] thinking text_len=${tlen} sig_len=${slen} sig=${sigHead}…${sigTail} has_signature=${!!b.signature}`);
        } else if (b.type === "redacted_thinking") {
          const dlen = (b.data ?? "").length;
          console.log(`[stream][fp] messages[${i}].content[${j}] redacted_thinking data_len=${dlen}`);
        }
      }
    }
  } catch (err) {
    console.warn("[stream][fp] fingerprint failed:", err);
  }
}

export async function* streamFromRouter(
  payload: StreamPayload,
  signal?: AbortSignal,
  sessionId?: string
): AsyncGenerator<RawSSEEvent> {
  let attempt = 0;
  let attemptedThinkingStrip = false;

  while (true) {
    if (signal?.aborted) throw new Error("Aborted");

    fingerprintThinkingBlocks(payload);

    const res = await fetch(`${ROUTER_URL()}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PROXY_KEY()}`,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
        "x-source": "openslide",
        ...(sessionId ? { "x-session-id": sessionId } : {}),
      },
      body: JSON.stringify(payload),
      signal,
    });

    // Retry on 429 (rate limit) and 529 (overloaded) with exponential backoff
    if ((res.status === 429 || res.status === 529) && attempt < MAX_RETRIES) {
      const retryAfter = res.headers.get("retry-after");
      const waitMs = retryAfter
        ? parseInt(retryAfter) * 1000
        : BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(`[stream] ${res.status} rate limit, retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
      attempt++;
      await sleep(waitMs);
      continue;
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown error");
      // One-shot recovery: existing sessions can carry corrupted thinking/
      // redacted_thinking blocks (e.g. from an older model turn) that the
      // current model refuses to accept. Strip them from history and retry
      // once — Anthropic allows assistant messages without thinking blocks.
      if (res.status === 400 && !attemptedThinkingStrip && /cannot be modified/i.test(errText)) {
        console.warn("[stream] 400 cannot-be-modified — retrying once with thinking/redacted_thinking stripped from history");
        for (const m of payload.messages) {
          if (m.role !== "assistant" || !Array.isArray(m.content)) continue;
          m.content = (m.content as Array<{ type?: string }>).filter(
            (b) => b.type !== "thinking" && b.type !== "redacted_thinking",
          );
        }
        // Drop any assistant messages that became empty after stripping.
        payload.messages = payload.messages.filter((m) =>
          !(m.role === "assistant" && Array.isArray(m.content) && m.content.length === 0),
        );
        attemptedThinkingStrip = true;
        continue;
      }
      // Dump the payload messages for debugging invalid_request_error
      if (res.status === 400) {
        console.error(`[stream] 400 error — dumping message structure:`);
        for (let i = 0; i < payload.messages.length; i++) {
          const m = payload.messages[i];
          const c = m.content;
          const info = typeof c === "string"
            ? `string(${c.length})`
            : Array.isArray(c)
            ? `array(${c.length}): [${(c as Array<{type?: string}>).map(b => b.type ?? "?").join(",")}]`
            : `${typeof c}`;
          console.error(`  messages[${i}] role=${m.role} content=${info}`);
        }
      }
      throw new Error(`claude-router error ${res.status}: ${errText}`);
    }

    if (!res.body) {
      throw new Error("claude-router returned no response body");
    }

    yield* parseSSEStream(res.body);
    return;
  }
}

async function* parseSSEStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<RawSSEEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      let eventType = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (dataStr === "[DONE]") return;

          try {
            const data = JSON.parse(dataStr);
            yield { type: eventType || data.type || "unknown", data };
          } catch {
            // Malformed JSON in SSE — skip
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Non-streaming API call — for short responses (classifiers, summaries).
 * Single fetch → JSON parse → extract text. No SSE overhead.
 * Retries once on 429/529.
 */
export async function callRouterNonStreaming(
  payload: Omit<StreamPayload, "stream">,
  signal?: AbortSignal,
): Promise<string> {
  const doFetch = async () => {
    const res = await fetch(`${ROUTER_URL()}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PROXY_KEY()}`,
        "anthropic-version": "2023-06-01",
        "x-source": "openslide",
      },
      body: JSON.stringify({ ...payload, stream: false }),
      signal,
    });

    if (res.status === 429 || res.status === 529) {
      throw new Error(`rate-limited: ${res.status}`);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown error");
      throw new Error(`claude-router error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const text = (data.content as Array<{ type: string; text?: string }>)
      ?.find((b) => b.type === "text")?.text ?? "";
    return text;
  };

  try {
    return await doFetch();
  } catch (err) {
    // One retry on rate limit
    if (String(err).includes("rate-limited")) {
      await sleep(BASE_DELAY_MS);
      return await doFetch();
    }
    throw err;
  }
}

export function getThinkingConfig(websiteMode?: boolean): { type: "enabled"; budget_tokens: number } | undefined {
  const budget = websiteMode
    ? Number(process.env.THINKING_BUDGET_WEBSITE ?? 8192)
    : Number(process.env.THINKING_BUDGET ?? 8192);
  if (budget <= 0) return undefined;
  return { type: "enabled", budget_tokens: budget };
}
