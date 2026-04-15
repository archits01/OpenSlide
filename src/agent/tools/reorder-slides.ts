import type { AgentTool } from "./index";

export interface ReorderSlidesInput {
  order: string[]; // Array of slide IDs in desired order
}

export const reorderSlidesTool: AgentTool = {
  name: "reorder_slides",
  description:
    "Reorder slides in the presentation. Pass the full ordered array of slide IDs. " +
    "All existing slide IDs must be included — this replaces the entire order.",
  input_schema: {
    type: "object",
    properties: {
      order: {
        type: "array",
        items: { type: "string" },
        description: "Array of all slide IDs in the desired display order",
      },
    },
    required: ["order"],
  },

  async execute(rawInput: unknown): Promise<{ order: string[] }> {
    const input = rawInput as ReorderSlidesInput;
    return { order: input.order };
  },
};
