export interface GeneratedImage {
  url: string;
  promptUsed: string;
}

const ENDPOINT = "https://fal.run/fal-ai/flux/schnell";

function key(): string {
  const k = process.env.FAL_KEY;
  if (!k) throw new Error(
    "generate_image disabled — FAL_KEY not set. Add it from fal.ai dashboard to .env.local and restart. For now, fall back to search_images or omit the image.",
  );
  return k;
}

// Flux requires dimensions divisible by 16; clamp to a safe range so we don't
// hit model upper bounds. 1536 is the practical max that still fits in a
// single sync call under the default timeout.
function normalize(n: number, min = 256, max = 1536): number {
  const clamped = Math.min(Math.max(Math.round(n), min), max);
  return Math.round(clamped / 16) * 16;
}

export type StyleHint = "photo" | "illustration" | "3d";

function stylize(prompt: string, style?: StyleHint): string {
  if (!style) return prompt;
  const suffix: Record<StyleHint, string> = {
    photo: "high-quality product photography, sharp focus, studio lighting",
    illustration: "clean vector illustration, modern flat design",
    "3d": "3d render, octane, soft lighting, subtle depth of field",
  };
  return `${prompt}. ${suffix[style]}`;
}

export async function generateImage(
  prompt: string,
  width: number,
  height: number,
  style?: StyleHint,
  signal?: AbortSignal,
): Promise<GeneratedImage> {
  const finalPrompt = stylize(prompt, style);
  const body = {
    prompt: finalPrompt,
    image_size: { width: normalize(width), height: normalize(height) },
    num_inference_steps: 4,
    num_images: 1,
    enable_safety_checker: true,
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Key ${key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: signal ?? AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "no body");
    throw new Error(`fal.ai ${res.status}: ${errText}`);
  }
  const parsed = (await res.json()) as {
    images?: Array<{ url?: string }>;
  };
  const url = parsed.images?.[0]?.url;
  if (!url) throw new Error("fal.ai returned no image URL");
  return { url, promptUsed: finalPrompt };
}
