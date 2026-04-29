import type { AgentTool } from "./types";

export const deleteFileTool: AgentTool = {
  name: "delete_file",
  description:
    "Delete a file from the website project. Use sparingly — most edits should be update_file.",
  input_schema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path of the file to delete" },
    },
    required: ["path"],
  },
  async execute(raw, _signal, context) {
    const { path } = raw as { path: string };
    if (!path) throw new Error("path is required");
    const files = context?.websiteFiles ?? {};
    if (!(path in files)) {
      throw new Error(`File "${path}" does not exist.`);
    }
    return { path, deleted: true };
  },
};
