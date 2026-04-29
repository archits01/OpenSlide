// POST /api/website-build-error — client reports a build error from the iframe's
// Vite HMR overlay. We append a synthetic user-role message so the model can
// self-correct on the next turn.

import { NextRequest } from "next/server";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { getSession, saveSession } from "@/lib/redis";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.sessionId !== "string" || typeof body.message !== "string") {
    return Response.json({ error: "Missing sessionId or message" }, { status: 400 });
  }
  const { sessionId, message, fileHint } = body as { sessionId: string; message: string; fileHint?: string };

  const session = await getSession(sessionId);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (session.userId && session.userId !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.type !== "website") {
    return Response.json({ error: "Not a website session" }, { status: 400 });
  }

  const hint = fileHint ? ` in \`${fileHint}\`` : "";
  session.messages = [
    ...session.messages,
    {
      role: "user",
      content: `Build error${hint}: ${message.slice(0, 2000)}\n\nPlease diagnose and fix.`,
    },
  ];
  await saveSession(session);

  return Response.json({ ok: true });
}
