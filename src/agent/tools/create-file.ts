import type { AgentTool } from "./types";

const MAX_FILE_SIZE = 256 * 1024; // 256KB
// Allow parens for Expo Router route groups like app/(tabs)/index.tsx
const PATH_REGEX = /^[a-zA-Z0-9._\-()/]+$/;

function validatePath(path: string): string | null {
  if (!path) return "Path is required";
  if (path.startsWith("/")) return "Paths must be relative (no leading slash)";
  if (path.includes("..")) return "Paths may not contain ..";
  if (path.startsWith("node_modules/")) return "Do not create files in node_modules";
  if (!PATH_REGEX.test(path)) return "Path may only contain letters, digits, ._-/";
  return null;
}

export const createFileTool: AgentTool = {
  name: "create_file",
  description:
    "Create a new source file in the website project. Use relative paths with forward slashes. " +
    "Max 256KB per file. Never create node_modules/ or files outside the project root. " +
    "Smallest logical file per call — do not dump the whole app at once.",
  input_schema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path, e.g. 'src/App.tsx' or 'package.json'" },
      content: { type: "string", description: "Full file content (max 256KB)" },
    },
    required: ["path", "content"],
  },
  async execute(raw) {
    const { path, content } = raw as { path: string; content: string };
    const err = validatePath(path);
    if (err) throw new Error(err);
    if (typeof content !== "string") throw new Error("content must be a string");
    if (content.length > MAX_FILE_SIZE) {
      throw new Error(`File exceeds 256KB limit (${content.length} bytes). Split into smaller modules.`);
    }
    return { path, content, sizeBytes: content.length };
  },
};
