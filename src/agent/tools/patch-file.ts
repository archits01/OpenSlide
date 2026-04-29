import type { AgentTool } from "./types";

const MAX_FILE_SIZE = 256 * 1024;
// Allow parens for Expo Router route groups like app/(tabs)/index.tsx
const PATH_REGEX = /^[a-zA-Z0-9._\-()/]+$/;
const MAX_PATCHES = 20;

function validatePath(path: string): string | null {
  if (!path) return "Path is required";
  if (path.startsWith("/")) return "Paths must be relative";
  if (path.includes("..")) return "Paths may not contain ..";
  if (!PATH_REGEX.test(path)) return "Invalid path characters";
  return null;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    count++;
    idx += needle.length;
  }
  return count;
}

interface PatchInput {
  path: string;
  patches: Array<{ find: string; replace: string }>;
}

export const patchFileTool: AgentTool = {
  name: "patch_file",
  description:
    "Make small, targeted edits to an existing file by find/replace. " +
    "PREFERRED over `update_file` for iterations — changing one section, one element, one class name, or one string. " +
    "Each patch's `find` string must appear EXACTLY ONCE in the current file. If it's missing or appears multiple times, " +
    "the tool errors and you must re-read the file (via `read_file`) and try again with more unique context. " +
    "Use `update_file` only when you're rewriting the whole file structure.",
  input_schema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path of the existing file" },
      patches: {
        type: "array",
        description:
          "Ordered list of find/replace operations. Each is applied to the result of the previous. " +
          "Include at least 2-3 lines of surrounding context in `find` so it's unambiguous. " +
          "A single patch is typical; batch when multiple edits in the same file reduce round-trips.",
        items: {
          type: "object",
          properties: {
            find: {
              type: "string",
              description:
                "Exact substring to locate in the file. Must appear exactly once; include surrounding context if the snippet would otherwise match multiple places.",
            },
            replace: {
              type: "string",
              description: "Replacement string. Can be empty to delete the matched section.",
            },
          },
          required: ["find", "replace"],
        },
      },
    },
    required: ["path", "patches"],
  },
  async execute(raw, _signal, context) {
    const { path, patches } = raw as PatchInput;
    const pathErr = validatePath(path);
    if (pathErr) throw new Error(pathErr);

    if (!Array.isArray(patches) || patches.length === 0) {
      throw new Error("patches must be a non-empty array");
    }
    if (patches.length > MAX_PATCHES) {
      throw new Error(`Too many patches (${patches.length}). Max is ${MAX_PATCHES} per call — split into separate calls or use update_file for a full rewrite.`);
    }

    const files = context?.websiteFiles ?? {};
    if (!(path in files)) {
      throw new Error(`File "${path}" does not exist. Use create_file to create it, or list_files to see what exists.`);
    }

    let content = files[path];
    const originalLength = content.length;

    for (let i = 0; i < patches.length; i++) {
      const { find, replace } = patches[i];
      if (typeof find !== "string" || typeof replace !== "string") {
        throw new Error(`Patch ${i + 1}: find and replace must be strings.`);
      }
      if (!find) {
        throw new Error(`Patch ${i + 1}: find string is empty.`);
      }
      const hits = countOccurrences(content, find);
      if (hits === 0) {
        throw new Error(
          `Patch ${i + 1} failed: the find string was not found in "${path}". ` +
            `Re-read the file with read_file and update your patch — the file may have changed since you last saw it. ` +
            `First 120 chars of your find string: ${JSON.stringify(find.slice(0, 120))}`,
        );
      }
      if (hits > 1) {
        throw new Error(
          `Patch ${i + 1} is ambiguous: the find string appears ${hits} times in "${path}". ` +
            `Include more surrounding context (2-3 more lines above/below) so the match is unique, then retry.`,
        );
      }
      content = content.replace(find, replace);
    }

    if (content.length > MAX_FILE_SIZE) {
      throw new Error(`Patched file exceeds 256KB limit. Split into smaller modules.`);
    }

    return {
      path,
      content,
      patchesApplied: patches.length,
      sizeBytes: content.length,
      sizeDelta: content.length - originalLength,
    };
  },
};
