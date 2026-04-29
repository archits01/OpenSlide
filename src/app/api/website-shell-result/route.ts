// POST /api/website-shell-result — client reports the result of a shell command
// it ran in WebContainer.
//
// Two modes:
//   sync  (toolUseId + output present): writes result to Redis so the agent loop
//         unblocks and injects the output directly into the tool_result same turn.
//   async (no toolUseId): fire-and-forget; appends a synthetic user message on
//         non-zero exit so the model can self-correct next turn.

import { NextRequest } from "next/server";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { getSession, saveSession } from "@/lib/redis";
import { resolveShellResult } from "@/lib/shell-sync";

export const runtime = "nodejs";

function classifyShellError(cmd: string, args: string[], stderr: string): { title: string; details: string } {
  const s = stderr.slice(0, 3000);
  const cmdFull = `${cmd} ${args.join(" ")}`.trim();

  if (s.includes("Cannot find module") || s.includes("Module not found")) {
    return { title: `Module not found — check your import path or run \`npm install\``, details: s.slice(0, 800) };
  }
  if (s.includes("SyntaxError") || s.includes("Unexpected token")) {
    return { title: `Syntax error — check the file for typos`, details: s.slice(0, 800) };
  }
  if (s.includes("ENOENT") || s.includes("no such file or directory")) {
    return { title: `File not found`, details: s.slice(0, 800) };
  }
  if (s.includes("EADDRINUSE")) {
    return { title: `Port already in use — restart the dev server`, details: s.slice(0, 800) };
  }
  if (s.includes("npm ERR! code E404")) {
    return { title: `npm package not found — check the package name`, details: s.slice(0, 800) };
  }
  if (s.includes("vite: command not found") || s.includes("sh: vite") || s.includes("not found\nvite")) {
    return { title: `Vite not installed — run \`npm install\` first`, details: s.slice(0, 800) };
  }
  if (s.includes("error TS") || s.includes("tsc:")) {
    return { title: `TypeScript error`, details: s.slice(0, 800) };
  }
  return { title: `\`${cmdFull}\` failed with a non-zero exit code`, details: s.slice(0, 1500) };
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.sessionId !== "string") {
    return Response.json({ error: "Missing sessionId" }, { status: 400 });
  }
  const { sessionId, cmd, args, exitCode, stderrTail, toolUseId, output } = body as {
    sessionId: string;
    cmd: string;
    args: string[];
    exitCode: number;
    stderrTail?: string;
    toolUseId?: string;
    output?: string;
  };

  // ── Sync path: unblock the waiting agent loop via Redis ──────────────────
  if (toolUseId && output !== undefined) {
    await resolveShellResult(toolUseId, output, exitCode).catch((err) => {
      console.warn("[shell-result] Redis resolve failed:", err);
    });
    return Response.json({ ok: true, sync: true });
  }

  // ── Async path: synthesize error message for the model next turn ─────────
  const session = await getSession(sessionId);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (session.userId && session.userId !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.type !== "website") {
    return Response.json({ error: "Not a website session" }, { status: 400 });
  }

  if (exitCode !== 0) {
    const { title, details } = classifyShellError(cmd, args, stderrTail ?? "");
    session.messages = [
      ...session.messages,
      {
        role: "user",
        content: `${title}\n\n\`\`\`sh\n${details}\n\`\`\`\n\nPlease fix.`,
      },
    ];
    await saveSession(session);
  }

  return Response.json({ ok: true });
}
