import type { AgentTool } from "./types";

const ALLOWED_CMDS = new Set(["npm", "npx", "node", "pnpm", "bun", "mkdir", "cp", "mv", "rm", "grep", "find"]);

export const runShellCommandTool: AgentTool = {
  name: "run_shell_command",
  description:
    "Queue a shell command to run in the browser-based WebContainer. Fire-and-forget from your perspective — " +
    "the output streams to the user and the exit code comes back as a user message on the next turn. " +
    "Only these commands are allowed: npm, npx, node, pnpm, bun, mkdir, cp, mv, rm, grep, find. " +
    "Typical flow: `npm install` once after creating package.json, then `npm run dev` once. " +
    "Do NOT loop or re-run dev server. " +
    "Use `grep` to search file contents (e.g. grep -r 'useState' src/) and `find` to locate files (e.g. find src -name '*.tsx').",
  input_schema: {
    type: "object",
    properties: {
      cmd: {
        type: "string",
        enum: ["npm", "npx", "node", "pnpm", "bun", "mkdir", "cp", "mv", "rm", "grep", "find"],
        description: "Base command. Only whitelisted commands allowed.",
      },
      args: {
        type: "array",
        items: { type: "string" },
        description: "Command arguments, e.g. ['install'] or ['run', 'dev']",
      },
      cwd: { type: "string", description: "Optional working directory. Defaults to project root." },
    },
    required: ["cmd", "args"],
  },
  async execute(raw, _signal, context) {
    const { cmd, args, cwd } = raw as { cmd: string; args: string[]; cwd?: string };
    if (!ALLOWED_CMDS.has(cmd)) {
      throw new Error(`Command "${cmd}" is not allowed. Allowed: ${[...ALLOWED_CMDS].join(", ")}.`);
    }
    if (!Array.isArray(args)) throw new Error("args must be an array of strings");
    // Audit log — every shell intent is logged server-side for post-hoc review
    console.log(
      `[shell-audit] sessionId=${context?.sessionId ?? "?"} userId=${context?.userId ?? "?"} cmd=${cmd} args=${JSON.stringify(args)} cwd=${cwd ?? ""} ts=${new Date().toISOString()}`
    );
    return { queued: true, cmd, args, cwd };
  },
};
