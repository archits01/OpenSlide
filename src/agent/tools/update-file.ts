import type { AgentTool } from "./types";

const MAX_FILE_SIZE = 256 * 1024;
// Allow parens for Expo Router route groups like app/(tabs)/index.tsx
const PATH_REGEX = /^[a-zA-Z0-9._\-()/]+$/;

function validatePath(path: string): string | null {
  if (!path) return "Path is required";
  if (path.startsWith("/")) return "Paths must be relative";
  if (path.includes("..")) return "Paths may not contain ..";
  if (!PATH_REGEX.test(path)) return "Invalid path characters";
  return null;
}

export const updateFileTool: AgentTool = {
  name: "update_file",
  description:
    "Rewrite an existing source file. The file must already exist (call list_files to see what exists). " +
    "Provide the full new content — this is a full rewrite, not a patch. " +
    "Call read_file first if you're not sure of the current state.",
  input_schema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path of the existing file" },
      content: { type: "string", description: "Full replacement content (max 256KB)" },
    },
    required: ["path", "content"],
  },
  async execute(raw, _signal, context) {
    const { path, content } = raw as { path: string; content: string };
    const err = validatePath(path);
    if (err) throw new Error(err);
    if (typeof content !== "string") throw new Error("content must be a string");
    if (content.length > MAX_FILE_SIZE) {
      throw new Error(`File exceeds 256KB limit. Split into smaller modules.`);
    }
    const files = context?.websiteFiles ?? {};
    if (!(path in files)) {
      throw new Error(`File "${path}" does not exist. Use create_file to create it, or list_files to see what exists.`);
    }
    return { path, content, sizeBytes: content.length };
  },
};
