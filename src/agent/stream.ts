// Anthropic SDK streaming client
// Self-hosters set ANTHROPIC_API_KEY in their .env

import Anthropic from "@anthropic-ai/sdk";

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

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export async function* streamFromRouter(
  payload: StreamPayload,
  signal?: AbortSignal,
  _sessionId?: string
): AsyncGenerator<RawSSEEvent> {
  const client = getClient();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) throw new Error("Aborted");

    try {
      const stream = await client.messages.stream({
        model: payload.model ?? "claude-sonnet-4-6",
        max_tokens: payload.max_tokens,
        system: payload.system as Anthropic.TextBlockParam[] | string | undefined,
        messages: payload.messages as Anthropic.MessageParam[],
        tools: payload.tools as Anthropic.Tool[] | undefined,
        thinking: payload.thinking as Anthropic.ThinkingConfigParam | undefined,
      });

      for await (const event of stream) {
        if (signal?.aborted) throw new Error("Aborted");
        yield { type: event.type, data: event as unknown as Record<string, unknown> };
      }
      return;
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if ((status === 429 || status === 529) && attempt < MAX_RETRIES) {
        const waitMs = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[stream] ${status} rate limit, retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(waitMs);
        continue;
      }
      if (status === 429 || status === 529) {
        throw new Error(`rate-limited: ${status}`);
      }
      throw err;
    }
  }
}

/**
 * Non-streaming API call — for short responses (classifiers, summaries).
 */
export async function callRouterNonStreaming(
  payload: Omit<StreamPayload, "stream">,
  signal?: AbortSignal,
): Promise<string> {
  const client = getClient();

  const doFetch = async () => {
    const response = await client.messages.create({
      model: payload.model ?? "claude-sonnet-4-6",
      max_tokens: payload.max_tokens,
      system: payload.system as Anthropic.TextBlockParam[] | string | undefined,
      messages: payload.messages as Anthropic.MessageParam[],
      tools: payload.tools as Anthropic.Tool[] | undefined,
    }, { signal });

    return (response.content as Array<{ type: string; text?: string }>)
      ?.find((b) => b.type === "text")?.text ?? "";
  };

  try {
    return await doFetch();
  } catch (err) {
    if (String(err).includes("rate-limited") || (err as { status?: number })?.status === 429) {
      await sleep(BASE_DELAY_MS);
      return await doFetch();
    }
    throw err;
  }
}

export function getThinkingConfig(): { type: "enabled"; budget_tokens: number } | undefined {
  const budget = Number(process.env.THINKING_BUDGET ?? 0);
  if (budget <= 0) return undefined;
  return { type: "enabled", budget_tokens: budget };
}
