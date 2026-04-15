import type { AgentTool } from "./index";
import type { Slide } from "@/lib/redis";

export interface UpdateSlideInput {
  slideId: string;
  title?: string;
  content?: string;
  layout?: "title" | "content" | "split" | "image" | "blank";
  notes?: string;
  theme?: string;
}

export const updateSlideTool: AgentTool = {
  name: "update_slide",
  description:
    "Update an existing slide. Only provide the fields you want to change. " +
    "Use this to refine content, fix typos, change layout, or update speaker notes.",
  input_schema: {
    type: "object",
    properties: {
      slideId: {
        type: "string",
        description: "The ID of the slide to update",
      },
      title: {
        type: "string",
        description: "New slide title",
      },
      content: {
        type: "string",
        description: "New HTML content for the slide body",
      },
      layout: {
        type: "string",
        enum: ["title", "content", "split", "image", "blank"],
        description: "New layout type",
      },
      notes: {
        type: "string",
        description: "New speaker notes",
      },
      theme: {
        type: "string",
        description: "Override theme for this specific slide",
      },
    },
    required: ["slideId"],
  },

  async execute(rawInput: unknown): Promise<Partial<Slide> & { slideId: string }> {
    const input = rawInput as UpdateSlideInput;
    const changes: Partial<Slide> & { slideId: string } = { slideId: input.slideId };
    if (input.title !== undefined) changes.title = input.title;
    if (input.content !== undefined) changes.content = input.content;
    if (input.layout !== undefined) changes.layout = input.layout;
    if (input.notes !== undefined) changes.notes = input.notes;
    if (input.theme !== undefined) changes.theme = input.theme;
    return changes;
  },
};
