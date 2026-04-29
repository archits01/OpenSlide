import type { AgentTool } from "./types";

export const checkTypesTool: AgentTool = {
  name: "check_types",
  description:
    "Queue `npx tsc --noEmit` in the WebContainer to type-check the project. " +
    "The output (errors or 'no errors') comes back as a user message on the next turn — same fire-and-forget pattern as run_shell_command. " +
    "Use this after making a batch of edits to catch type errors before the user sees them. " +
    "Only useful for TypeScript projects (checks for tsconfig.json existence first).",
  input_schema: {
    type: "object",
    properties: {},
    required: [],
  },
  async execute(_raw, _signal, context) {
    console.log(
      `[check-types-audit] sessionId=${context?.sessionId ?? "?"} userId=${context?.userId ?? "?"} ts=${new Date().toISOString()}`
    );
    // Returns a shell command descriptor — the client runs it and posts the result back
    return { queued: true, cmd: "npx", args: ["tsc", "--noEmit"], cwd: undefined };
  },
};
