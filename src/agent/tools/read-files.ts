import type { AgentTool } from "./types";

const MAX_FILES = 10;

export const readFilesTool: AgentTool = {
  name: "read_files",
  description:
    "Read multiple files at once. More efficient than calling read_file N times when you need to understand " +
    "several related files (e.g. a component + its types + its styles). Returns each file's content keyed by path. " +
    `Max ${MAX_FILES} files per call. Missing files are reported in the errors field, not thrown.`,
  input_schema: {
    type: "object",
    properties: {
      paths: {
        type: "array",
        items: { type: "string" },
        description: `Relative paths of files to read. Max ${MAX_FILES}.`,
        maxItems: MAX_FILES,
      },
    },
    required: ["paths"],
  },
  async execute(raw, _signal, context) {
    const { paths } = raw as { paths: string[] };
    if (!Array.isArray(paths) || paths.length === 0) throw new Error("paths must be a non-empty array");
    if (paths.length > MAX_FILES) throw new Error(`Too many files requested. Max is ${MAX_FILES}.`);

    const files = context?.websiteFiles ?? {};
    const results: Record<string, string> = {};
    const errors: Record<string, string> = {};

    for (const path of paths) {
      if (path in files) {
        results[path] = files[path];
      } else {
        errors[path] = "File not found";
      }
    }

    return { results, errors, readCount: Object.keys(results).length };
  },
};
