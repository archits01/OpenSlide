import type { AgentTool } from "./index";

export interface DeleteSlideInput {
  slideId: string;
}

export const deleteSlideTool: AgentTool = {
  name: "delete_slide",
  description:
    "Delete a slide from the presentation by its ID. " +
    "Use this when restructuring or when a slide is redundant.",
  input_schema: {
    type: "object",
    properties: {
      slideId: {
        type: "string",
        description: "The ID of the slide to delete",
      },
    },
    required: ["slideId"],
  },

  async execute(rawInput: unknown): Promise<{ deleted: string }> {
    const input = rawInput as DeleteSlideInput;
    return { deleted: input.slideId };
  },
};
