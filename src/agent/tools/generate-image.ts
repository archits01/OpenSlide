import type { AgentTool } from "./types";
import { generateImage, type StyleHint } from "@/lib/image-providers/fal";

interface GenerateImageInput {
  prompt: string;
  width: number;
  height: number;
  style?: StyleHint;
}

export const generateImageTool: AgentTool = {
  name: "generate_image",
  description:
    "Generate a cinematic custom image from a text prompt using Flux (fal.ai). This is your tool for hero art, abstract backgrounds, decorative scenes, concept illustrations, brand-new products search indexes don't have yet, and anything where you want intentional aesthetic control. " +
    "Prefer this over `search_images` for ALL hero images — searches return stock, generation lets you art-direct. " +
    "Returns a stable CDN URL — drop straight into `<img>` with explicit width/height. " +
    "Latency ~5-8s per image. If FAL_KEY is not configured, this tool throws a clear error — fall back to `search_images` or skip. " +
    "Prompt quality = output quality. Generic prompts produce generic AI-slop. Detailed prompts with lighting + composition + mood produce editorial output.",
  input_schema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description:
          "Detailed cinematic prompt. MUST include: (1) subject + materials/texture, (2) lighting direction/quality, (3) composition rule, (4) mood adjective. " +
          "GOOD: 'matte-black e-bike on polished concrete, studio three-point lighting with subtle rim light from left, rule-of-thirds with negative space above, cinematic and premium' / 'aerial view of alpine lake at golden hour, long shadows stretching east, centered symmetrical composition, serene and expansive' / 'close-up hands holding ceramic coffee cup on linen, warm window light from the right, shallow depth of field, intimate and tactile'. " +
          "BAD: 'A workspace', 'modern office', 'happy team' — these generate AI-slop. Lift the prompt with specifics.",
      },
      width: { type: "number", description: "Target width in pixels (256-1536, snapped to multiples of 16). Pass the actual slot width." },
      height: { type: "number", description: "Target height in pixels (256-1536, snapped to multiples of 16). Pass the actual slot height." },
      style: {
        type: "string",
        enum: ["photo", "illustration", "3d"],
        description:
          "Optional style nudge. `photo` = realistic photography (default for heroes, products). `illustration` = flat vector/editorial art. `3d` = rendered 3d scene. Omit for fully prompt-driven style — prompt adjectives will drive aesthetic.",
      },
    },
    required: ["prompt", "width", "height"],
  },
  async execute(raw, signal) {
    const { prompt, width, height, style } = raw as GenerateImageInput;
    if (!prompt?.trim()) throw new Error("prompt is required");
    if (!width || width <= 0) throw new Error("width must be a positive number");
    if (!height || height <= 0) throw new Error("height must be a positive number");

    const result = await generateImage(prompt, width, height, style, signal);
    return result;
  },
};
