import type { AgentTool } from "./types";

export const listFilesTool: AgentTool = {
  name: "list_files",
  description:
    "List every file currently in the website project with size in bytes. " +
    "Use this before editing after several turns — your memory of earlier files may be stale. " +
    "Returns a list sorted by path.",
  input_schema: {
    type: "object",
    properties: {},
  },
  async execute(_raw, _signal, context) {
    const files = context?.websiteFiles ?? {};
    const entries = Object.entries(files)
      .map(([path, content]) => ({ path, sizeBytes: content.length }))
      .sort((a, b) => a.path.localeCompare(b.path));
    return { files: entries, total: entries.length };
  },
};
