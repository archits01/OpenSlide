import type { AgentTool } from "./types";

export const readFileTool: AgentTool = {
  name: "read_file",
  description:
    "Read the current contents of a file from the website project. " +
    "Use this liberally before editing — it's cheap and ensures you see the latest state.",
  input_schema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path of the file to read" },
    },
    required: ["path"],
  },
  async execute(raw, _signal, context) {
    const { path } = raw as { path: string };
    if (!path) throw new Error("path is required");
    const files = context?.websiteFiles ?? {};
    if (!(path in files)) {
      throw new Error(`File "${path}" does not exist. Call list_files to see what exists.`);
    }
    return { path, content: files[path], sizeBytes: files[path].length };
  },
};
