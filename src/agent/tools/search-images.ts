import type { AgentTool } from "./types";
import { searchImages } from "@/lib/image-providers/searchapi";

interface SearchImagesInput {
  query: string;
  width: number;
  height: number;
  count?: number;
}

export const searchImagesTool: AgentTool = {
  name: "search_images",
  description:
    "Find editorial-quality photographs from Google Images (via SerpAPI) for a website. You are curating, not just fetching — prefer candidates that look like they were shot for a magazine or product launch, not a generic stock library. " +
    "Use for real-world scenes: products (including ones released in the last few weeks), people, places, food, nature, workspaces. For hero art, abstract backgrounds, or anything that needs a specific aesthetic, use `generate_image` instead — search cannot invent. " +
    "Returned URLs are re-hosted on our Supabase CDN — stable, immune to hotlink 404s, safe to embed directly. " +
    "Style your `<img>` with `object-fit: cover` + width/height so the URL (full-resolution, unresized) crops cleanly into the slot. " +
    "Always pass the ACTUAL CSS pixel dimensions of the target slot so you pick a well-sized candidate. " +
    "Always set meaningful `alt` text from the query. " +
    "If a specific phrase returns nothing, the tool auto-broadens. If results still feel generic, prefer `generate_image` with a detailed prompt over shipping a cliché.",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "2-6 word description targeted for editorial quality — not generic stock. GOOD: 'matte-black iPhone 17 studio shot', 'cedar kitchen marble countertops morning light', 'engineer debugging on laptop overhead angle'. BAD: 'business meeting', 'team celebrating', 'handshake' (stock clichés — will degrade the page). Include a descriptor that narrows the visual style (material, lighting, angle, setting) when possible.",
      },
      width: { type: "number", description: "Target width in pixels (e.g. 1280). Pass the actual slot width — do not inflate." },
      height: { type: "number", description: "Target height in pixels (e.g. 720). Pass the actual slot height — do not inflate." },
      count: {
        type: "number",
        description: "How many candidates to return (1-6). Default 3. Pick the best one — prefer well-lit, professionally-shot over high-match-score.",
      },
    },
    required: ["query", "width", "height"],
  },
  async execute(raw, signal, context) {
    const { query, width, height, count } = raw as SearchImagesInput;
    if (!query?.trim()) throw new Error("query is required");
    if (!width || width <= 0) throw new Error("width must be a positive number");
    if (!height || height <= 0) throw new Error("height must be a positive number");

    const results = await searchImages(query, width, height, count ?? 3, signal, context?.userId);
    if (results.length === 0) {
      return {
        results: [],
        note:
          "No Google Images matches for that query even after broadening. Call `generate_image` for this slot instead, or omit the image.",
      };
    }
    return { results };
  },
};
