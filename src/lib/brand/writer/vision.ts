/**
 * Vision-call wrapper around claude-router.
 *
 * Sends a list of image blocks plus a text prompt to Claude, returns the text
 * response. Uses callRouterNonStreaming under the hood — image content blocks
 * pass through the router unchanged (it's Anthropic-Messages-API compatible).
 */

import fs from "fs";
import { streamFromRouter } from "@/agent/stream";

export type ImageInput = string; // either a file path OR a base64 string

export interface VisionCallOptions {
  /** Model id. Default claude-sonnet-4-6. */
  model?: string;
  /** System prompt (string form). */
  system?: string;
  /** Image inputs — file paths OR raw base64 strings. */
  images: ImageInput[];
  /** Text prompt that follows the images. */
  prompt: string;
  /** Max output tokens. Default 8192. */
  maxTokens?: number;
  /** Optional extended-thinking budget. */
  thinking?: { type: "enabled"; budget_tokens: number };
}

function isBase64Like(s: string): boolean {
  // Heuristic: file paths usually contain "/" or end in ".png/.jpg" — base64 strings don't.
  return !s.includes("/") && s.length > 100;
}

function imageToBlock(input: ImageInput): {
  type: "image";
  source: { type: "base64"; media_type: string; data: string };
} {
  let data: string;
  let mediaType = "image/png";
  if (isBase64Like(input)) {
    data = input;
  } else {
    const buf = fs.readFileSync(input);
    data = buf.toString("base64");
    if (input.toLowerCase().endsWith(".jpg") || input.toLowerCase().endsWith(".jpeg")) {
      mediaType = "image/jpeg";
    }
  }
  return {
    type: "image",
    source: { type: "base64", media_type: mediaType, data },
  };
}

export async function callVision(opts: VisionCallOptions): Promise<string> {
  const {
    model = "claude-sonnet-4-6",
    system,
    images,
    prompt,
    maxTokens = 8192,
    thinking,
  } = opts;

  const content: Array<unknown> = [
    ...images.map((img) => imageToBlock(img)),
    { type: "text", text: prompt },
  ];

  // Use streaming under the hood so long vision calls don't hit the
  // claude-router non-streaming 90s timeout. We accumulate the full text and
  // return it as a single string — the caller doesn't care about streaming.
  const stream = streamFromRouter({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content }],
    ...(thinking ? { thinking } : {}),
    stream: true,
  });

  let text = "";
  for await (const ev of stream) {
    // Anthropic SSE event shape: content_block_delta { delta: { type: "text_delta", text: "..." } }
    const data = ev.data as {
      delta?: { type?: string; text?: string };
    };
    if (data?.delta?.type === "text_delta" && data.delta.text) {
      text += data.delta.text;
    }
  }
  return text;
}

/**
 * Force JSON output by appending a strict instruction and running through
 * a parser. Retries once on parse failure with a fix-up prompt.
 */
export async function callVisionJson<T = unknown>(
  opts: VisionCallOptions,
): Promise<T> {
  const jsonPrompt = `${opts.prompt}\n\nReturn ONLY valid JSON. No prose, no markdown fences. Begin with { or [ and end with } or ].`;
  const raw = await callVision({ ...opts, prompt: jsonPrompt });

  const tryParse = (s: string): T | null => {
    // Strip code fences if present.
    let cleaned = s.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
    // Find first { or [ and last } or ] to robustly extract JSON.
    const startObj = cleaned.indexOf("{");
    const startArr = cleaned.indexOf("[");
    const start =
      startObj === -1 ? startArr : startArr === -1 ? startObj : Math.min(startObj, startArr);
    if (start < 0) return null;
    const endObj = cleaned.lastIndexOf("}");
    const endArr = cleaned.lastIndexOf("]");
    const end = Math.max(endObj, endArr);
    if (end <= start) return null;
    const slice = cleaned.slice(start, end + 1);
    try {
      return JSON.parse(slice) as T;
    } catch {
      return null;
    }
  };

  const parsed = tryParse(raw);
  if (parsed) return parsed;

  // One repair retry.
  const repair = await callVision({
    model: opts.model,
    system: opts.system,
    images: [],
    prompt: `Repair the following text into valid JSON. Return ONLY the JSON, no prose:\n\n${raw}`,
    maxTokens: opts.maxTokens,
  });
  const repaired = tryParse(repair);
  if (repaired) return repaired;

  throw new Error(`Vision call did not return valid JSON. Raw output:\n${raw.slice(0, 500)}`);
}
