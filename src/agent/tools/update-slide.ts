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

  async execute(rawInput: unknown, _signal?: AbortSignal, context?: import("./types").AgentToolContext): Promise<Partial<Slide> & { slideId: string; changeFields?: string[]; bytesBefore?: number; bytesAfter?: number }> {
    const input = rawInput as UpdateSlideInput;
    const changes: Partial<Slide> & { slideId: string; changeFields?: string[]; bytesBefore?: number; bytesAfter?: number } = { slideId: input.slideId };

    // Track which fields are changing — surfaced back to the agent + persisted
    // so the editor's history view can show "Slide N corrected: title, content".
    const changedFields: string[] = [];
    if (input.title !== undefined) { changes.title = input.title; changedFields.push("title"); }
    if (input.content !== undefined) {
      changes.content = input.content;
      changedFields.push("content");
      // Capture byte delta when we have access to the prior slide via context.slides.
      if (Array.isArray(context?.slides)) {
        const prev = (context.slides as Array<{ id: string; content?: string }>).find((s) => s.id === input.slideId);
        if (prev?.content !== undefined) {
          changes.bytesBefore = prev.content.length;
          changes.bytesAfter = input.content.length;
        }
      }
    }
    if (input.layout !== undefined) { changes.layout = input.layout; changedFields.push("layout"); }
    if (input.notes !== undefined) { changes.notes = input.notes; changedFields.push("notes"); }
    if (input.theme !== undefined) { changes.theme = input.theme; changedFields.push("theme"); }
    changes.changeFields = changedFields;
    return changes;
  },
};
