import type { AgentTool } from "./index";
import type { Outline, OutlineSlide } from "@/lib/redis";
import { randomUUID } from "crypto";

export const createOutlineTool: AgentTool = {
  name: "create_outline",
  description:
    "Create a structured outline for the presentation BEFORE building any slides. Shows the user the planned slide structure and waits for their approval. Do not call create_slide until the user explicitly approves the outline. Outlines now require grounded key_facts and sources for data/content slides. The model will be blocked from introducing new facts at slide-build time that weren't committed in the outline.",
  input_schema: {
    type: "object",
    properties: {
      presentation_title: {
        type: "string",
        description: "The overall presentation title",
      },
      slides: {
        type: "array",
        description: "Planned slides in order",
        items: {
          type: "object",
          properties: {
            index: { type: "number", description: "Zero-based slide index" },
            title: { type: "string", description: "Slide title" },
            type: {
              type: "string",
              enum: ["title", "content", "data", "quote", "image", "transition"],
              description:
                "Slide type — use 'title' for cover/section divider slides, " +
                "'content' for bullet points/text-heavy slides, " +
                "'data' for slides with statistics/charts/metrics, " +
                "'quote' for testimonials/notable quotes, " +
                "'image' for visual-heavy slides, " +
                "'transition' for section breaks between major topics. " +
                "Vary types across the deck — a good presentation mixes data, content, and visual slides.",
            },
            key_points: {
              type: "array",
              items: { type: "string" },
              description:
                "Detailed preview of what this slide will cover. Type-specific caps: " +
                "'title': 3–4 items. 'transition': 3–4 items. 'quote': 3–4 items. " +
                "'image': 4–5 items. 'data': 5–7 items with specific metrics from research. " +
                "'content': 5–7 items — this is where density matters most. " +
                "Be specific — use actual numbers, names, and claims, not vague labels. " +
                "Mix short punchy points (stat + context, ~8 words) with longer explanatory points (claim + evidence + implication, ~15-20 words). " +
                "Example mix: '$96B ARR, growing 18% YoY' AND 'App Store policy changes from EU DMA may compress take rates by 3-5pp starting 2026'. " +
                "Never write vague 3-5 word fragments like 'Revenue growth strong'. " +
                "Every key_point MUST appear on the built slide — never silently drop points.",
            },
            speaker_notes: {
              type: "string",
              description: "Brief speaker notes for this slide",
            },
            key_facts: {
              type: "array",
              items: { type: "string" },
              description: "Specific factual claims that will appear on this slide — each entry should be a complete, contextualized statement, not a bare fragment. Good: 'Services revenue reached $96B ARR in Q4 2025, up 18% YoY'. Bad: 'Revenue $96B'. Include the metric, timeframe, and trend/context in each entry. Each must come from research performed in this same turn (web_search results or Pre-Computed Research). Never include a key_fact you cannot trace to a source. Minimum 2 entries for slides with type 'data' or 'content'. Empty array allowed for slides with type 'title' or 'transition'."
            },
            sources: {
              type: "array",
              items: { type: "string" },
              description: "URLs of web pages or research citations that support this slide's key_facts. Each entry should be a full URL. Empty array allowed only for slides with type 'title' or 'transition'."
            },
            pattern_name: {
              type: "string",
              description: "Exact pattern name from the loaded layout library (e.g., 'B4: SVG Chart + 3-Panel Sidebar', 'Pattern 3: Standard Cards Row'). Match the slide's content shape to the best pattern using the Pattern Selection table in the system prompt. Title slides at index 0 use the cover archetype instead.",
            },
            layout_notes: {
              type: "string",
              description: "One sentence describing the visual layout: what goes where, how many items, what's the focal point. Include density hint if non-standard: 'data-heavy, 12px body'. E.g., 'Hero revenue chart left (60%), 3 stat cards stacked right (40%), dark footer with forward outlook'",
            },
            cover_panel: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["stats", "quote", "highlights"],
                  description: "Panel content type. 'stats' for business/corporate with quantifiable metrics. 'quote' for thought leadership, biographical, or inspirational topics. 'highlights' for product launches, feature showcases, or listicle-style topics.",
                },
                content: {
                  type: "string",
                  description: "Delimiter-separated content string. For 'stats': '$124.3B Revenue | ↑12% YoY Growth | 71% Margin'. For 'quote': 'Stay hungry, stay foolish. — Steve Jobs'. For 'highlights': '10x faster / Zero config / Open source'.",
                },
              },
              required: ["type", "content"],
              description: "Right panel content for the cover slide. Only for type 'title' at index 0. Omit entirely if nothing fits naturally — the right panel degrades gracefully to the default accent block.",
            },
          },
          required: ["index", "title", "type", "key_points"],
        },
      },
    },
    required: ["presentation_title", "slides"],
  },

  async execute(input) {
    const { presentation_title, slides } = input as {
      presentation_title: string;
      slides: OutlineSlide[];
    };

    const outline: Outline = {
      id: randomUUID(),
      presentation_title,
      slides,
    };

    return outline;
  },
};
