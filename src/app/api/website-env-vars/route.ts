// GET  /api/website-env-vars?sessionId=... — returns { names[] } — NEVER values.
// PUT  /api/website-env-vars — body { sessionId, vars } — encrypts, stores, returns { names[] }.

import { NextRequest } from "next/server";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { getSession, saveSession } from "@/lib/redis";
import { decryptEnvVars, encryptEnvVars } from "@/lib/encryption";

export const runtime = "nodejs";

async function loadSession(userId: string, sessionId: string) {
  const session = await getSession(sessionId);
  if (!session) return { error: Response.json({ error: "Session not found" }, { status: 404 }) };
  if (session.userId && session.userId !== userId) {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (session.type !== "website") {
    return { error: Response.json({ error: "Not a website session" }, { status: 400 }) };
  }
  return { session };
}

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return Response.json({ error: "Missing sessionId" }, { status: 400 });

  const { session, error } = await loadSession(user.id, sessionId);
  if (error) return error;

  let names: string[] = [];
  if (session!.websiteEnvVars) {
    try {
      names = Object.keys(decryptEnvVars(session!.websiteEnvVars));
    } catch (err) {
      console.warn("[website-env-vars] decrypt failed:", err);
    }
  }
  return Response.json({ names, hasValues: names.length > 0 });
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.sessionId !== "string" || !body.vars || typeof body.vars !== "object") {
    return Response.json({ error: "Missing sessionId or vars" }, { status: 400 });
  }
  const { sessionId, vars } = body as { sessionId: string; vars: Record<string, string> };

  // Validate key shape — prevent injection attempts via weird keys
  for (const key of Object.keys(vars)) {
    if (!/^[A-Z][A-Z0-9_]{0,63}$/.test(key)) {
      return Response.json({ error: `Invalid env var key: "${key}". Use UPPER_SNAKE_CASE.` }, { status: 400 });
    }
    if (typeof vars[key] !== "string") {
      return Response.json({ error: `Value for "${key}" must be a string.` }, { status: 400 });
    }
    if (vars[key].length > 4096) {
      return Response.json({ error: `Value for "${key}" exceeds 4096 chars.` }, { status: 400 });
    }
  }

  const { session, error } = await loadSession(user.id, sessionId);
  if (error) return error;

  // Merge with existing encrypted values (so partial updates preserve earlier keys)
  let merged: Record<string, string> = {};
  if (session!.websiteEnvVars) {
    try {
      merged = decryptEnvVars(session!.websiteEnvVars);
    } catch (err) {
      console.warn("[website-env-vars] existing decrypt failed, overwriting:", err);
      merged = {};
    }
  }
  merged = { ...merged, ...vars };

  try {
    session!.websiteEnvVars = encryptEnvVars(merged);
  } catch (err) {
    return Response.json({ error: String(err instanceof Error ? err.message : err) }, { status: 500 });
  }

  await saveSession(session!);
  return Response.json({ names: Object.keys(merged) });
}
