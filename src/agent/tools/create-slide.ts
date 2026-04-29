import type { AgentTool } from "./index";
import type { Slide } from "@/lib/redis";

let slideCounter = 0;

function generateId(): string {
  return `slide_${Date.now()}_${++slideCounter}`;
}

export interface CreateSlideInput {
  title: string;
  content: string;
  layout?: "title" | "content" | "split" | "image" | "blank";
  type?: "title" | "content" | "data" | "quote" | "image" | "transition";
  notes?: string;
  index?: number;
  theme?: string;
  cover_data?: {
    brand_name: string;
    headline: string;
    accent_phrase?: string;
    subtitle?: string;
    tagline?: string;
    hero_image_url?: string;
    prepared_for?: string;
    cover_panel?: { type: "stats" | "quote" | "highlights"; content: string };
  };
}

export const createSlideTool: AgentTool = {
  name: "create_slide",
  description:
    "Create a new slide in the presentation. Returns the created slide object. " +
    "The content field should be HTML that will be rendered inside the slide canvas. " +
    "Use semantic slide classes: slide-headline, slide-heading, slide-bullets, slide-stat, slide-split. " +
    "For slide 1 (cover slide, type: 'title'): if the loaded skill has a cover pattern, write the HTML in content directly for maximum variety. " +
    "Only use cover_data as a fallback when no skill-specific cover pattern is available — it renders a standard template.",
  input_schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Slide title (shown in thumbnail strip and used for navigation)",
      },
      content: {
        type: "string",
        description:
          "HTML content for the slide body. Use slide-* CSS classes for proper theming. " +
          "Use <h1> for title slides, <h2> for section headers. Include ALL key_points from the outline for this slide. " +
          "Mix bullet lengths: short stat bullets (~8 words) and longer explanatory bullets (~15-20 words, max 2 lines). Aim for 2-3 short + 2-3 long per slide.",
      },
      layout: {
        type: "string",
        enum: ["title", "content", "split", "image", "blank"],
        description:
          "Slide layout type. 'title' for openers/section breaks, 'content' for bullets/text, " +
          "'split' for two-column, 'image' for visual-heavy, 'blank' for custom.",
      },
      type: {
        type: "string",
        enum: ["title", "content", "data", "quote", "image", "transition"],
        description:
          "Slide type from outline. Guides pattern selection: title→cover/divider, data→metrics/charts, " +
          "content→bullets/lists, quote→testimonials, image→visual-heavy, transition→section breaks.",
      },
      notes: {
        type: "string",
        description: "Speaker notes for this slide (not shown on screen, conversational tone)",
      },
      index: {
        type: "number",
        description:
          "Position to insert the slide (0-based). Omit to append at the end.",
      },
      cover_data: {
        type: "object",
        description:
          "Only for slide 1 (cover slide, type: 'title'). If provided, content field is ignored and the cover is rendered from a deterministic template matching Pattern 1.",
        properties: {
          brand_name: {
            type: "string",
            description: "Brand or company name displayed at the top of the cover slide.",
          },
          headline: {
            type: "string",
            description: "Main headline for the cover slide.",
          },
          accent_phrase: {
            type: "string",
            description: "Word or phrase within headline to render in accent color.",
          },
          subtitle: {
            type: "string",
            description: "Optional subtitle below the headline.",
          },
          tagline: {
            type: "string",
            description: "One-line tagline that captures the value proposition.",
          },
          hero_image_url: {
            type: "string",
            description: "URL of a hero image for the right panel. If omitted, a solid accent panel is shown.",
          },
          prepared_for: {
            type: "string",
            description: "Attribution line, e.g. 'Investor Name / Date'.",
          },
          cover_panel: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["stats", "quote", "highlights"],
                description: "Panel type: 'stats' for metrics, 'quote' for quotes, 'highlights' for value props.",
              },
              content: {
                type: "string",
                description: "Delimiter-separated string. Stats: 'val label | val label'. Quote: 'text — attribution'. Highlights: 'point / point / point'.",
              },
            },
            required: ["type", "content"],
            description: "Right panel content for cover slide. Omit if nothing fits naturally.",
          },
        },
        required: ["brand_name", "headline"],
      },
    },
    required: ["title", "content"],
  },

  async execute(rawInput: unknown, _signal?: AbortSignal, context?: import("./types").AgentToolContext): Promise<Slide> {
    const input = rawInput as CreateSlideInput;

    // Architectural guard: when a brand kit is active, the model must not embed
    // literal external image URLs (it tends to hallucinate logo CDNs). Strip
    // any <img> with a non-placeholder src and surface a warning.
    if (context?.activeBrandKit && input.content) {
      const hallucinatedImgRe = /<img[^>]*\bsrc=["']https?:\/\/[^"']+["'][^>]*>/gi;
      const matches = input.content.match(hallucinatedImgRe);
      if (matches && matches.length > 0) {
        console.warn(
          `[create-slide] Brand-kit active (${context.activeBrandKit.brandName}) — stripping ${matches.length} inline <img> tag(s) with literal URLs. Model should use {{brand.logo.url}} or omit images instead.`,
        );
        // Surgically remove offending tags. The placeholder template (if any)
        // remains; literal-URL tags are dropped.
        input.content = input.content.replace(hallucinatedImgRe, "");
      }
    }

    // Template-driven cover slide
    if (input.type === "title" && (input.index === 0 || input.index === undefined || input.index === -1) && input.cover_data) {
      const { renderCoverSlide } = await import("@/agent/templates/cover-slide");
      const content = renderCoverSlide(input.cover_data);
      const slide: Slide = {
        id: generateId(),
        index: input.index ?? -1,
        title: input.title,
        content,
        layout: "title",
        notes: input.notes,
        theme: input.theme,
        type: "title",
      };
      return slide;
    }

    // Log warning if cover slide built without template
    if (input.type === "title" && (input.index === 0 || input.index === undefined || input.index === -1) && !input.cover_data) {
      console.warn("[create-slide] Cover slide built without template — model generated raw HTML");
    }

    const slide: Slide = {
      id: generateId(),
      index: input.index ?? -1, // -1 means append — resolved by the loop
      title: input.title,
      content: input.content,
      layout: input.layout ?? "content",
      notes: input.notes,
      theme: input.theme,
      type: input.type,
    };
    return slide;
  },
};
