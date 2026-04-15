import { NextRequest } from "next/server";
import { createSession, listSessions, getSession, deleteSession, touchSession } from "@/lib/redis";
import { requireAuth, isResponse, requireOwnership } from "@/lib/api-helpers";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET /api/sessions — list sessions for the authenticated user
// Optional ?type=slides|docs to filter by session type
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  try {
    const type = req.nextUrl.searchParams.get("type");
    const cursor = req.nextUrl.searchParams.get("cursor");
    const { sessions, nextCursor } = await listSessions(20, user.id, type, cursor);
    return Response.json({ sessions, nextCursor });
  } catch (err) {
    console.error("[sessions] GET error:", err);
    return Response.json({ error: "Failed to list sessions" }, { status: 500 });
  }
}

// POST /api/sessions — create a new session
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  try {
    const body = await req.json().catch(() => ({}));
    const id = body.id ?? randomUUID();
    const type = body.docsMode ? "docs" : "slides" as const;
    const title = body.title ?? (type === "docs" ? "Untitled Document" : "Untitled Presentation");

    const session = await createSession(id, title, user.id, type);
    return Response.json({ session }, { status: 201 });
  } catch (err) {
    console.error("[sessions] POST error:", err);
    return Response.json({ error: "Failed to create session" }, { status: 500 });
  }
}

// PATCH /api/sessions — touch lastOpenedAt (called when user opens a session)
export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const body = await req.json().catch(() => ({}));
  const id = body.id;
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  try {
    const session = await getSession(id);
    const denied = requireOwnership(session, user.id);
    if (denied) return denied;

    await touchSession(id);
    return Response.json({ touched: id });
  } catch (err) {
    console.error("[sessions] PATCH error:", err);
    return Response.json({ error: "Failed to touch session" }, { status: 500 });
  }
}

// DELETE /api/sessions?id=... — delete a session (ownership verified)
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  try {
    const session = await getSession(id);
    const denied = requireOwnership(session, user.id);
    if (denied) return denied;

    await deleteSession(id);
    return Response.json({ deleted: id });
  } catch (err) {
    console.error("[sessions] DELETE error:", err);
    return Response.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
