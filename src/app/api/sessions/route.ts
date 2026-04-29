import { NextRequest } from "next/server";
import { createSession, listSessions, getSession, deleteSession, touchSession, saveSession } from "@/lib/redis";
import { requireAuth, isResponse, requireOwnership } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
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

// POST /api/sessions — create a new session (or fork an existing one)
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  try {
    const body = await req.json().catch(() => ({}));
    const id = body.id ?? randomUUID();

    // ── Fork path ────────────────────────────────────────────────────────────
    if (body.forkFromSessionId) {
      const source = await getSession(body.forkFromSessionId);
      if (!source) return Response.json({ error: "Source session not found" }, { status: 404 });
      const denied = requireOwnership(source, user.id);
      if (denied) return denied;

      const forkCount: number = body.forkMessageCount ?? source.messages.length;
      const forkFiles: Record<string, string> = body.forkWebsiteFiles ?? source.websiteFilesJson ?? {};
      const title = body.title ?? (source.title + " (fork)");

      const forked = await createSession(id, title, user.id, source.type);
      // Copy truncated messages + files
      forked.messages = source.messages.slice(0, forkCount);
      forked.websiteFilesJson = forkFiles;
      await saveSession(forked);
      return Response.json({ id, session: forked }, { status: 201 });
    }

    // ── Normal create path ────────────────────────────────────────────────────
    const type: "slides" | "docs" | "sheets" | "website" = body.websiteMode
      ? "website"
      : body.sheetsMode
        ? "sheets"
        : body.docsMode
          ? "docs"
          : "slides";
    const defaultTitle =
      type === "sheets" ? "Untitled Spreadsheet" : type === "docs" ? "Untitled Document" : type === "website" ? "Untitled Website" : "Untitled Presentation";
    const title = body.title ?? defaultTitle;

    const session = await createSession(id, title, user.id, type);
    return Response.json({ session }, { status: 201 });
  } catch (err) {
    console.error("[sessions] POST error:", err);
    return Response.json({ error: "Failed to create session" }, { status: 500 });
  }
}

// PATCH /api/sessions — touch lastOpenedAt or update specific fields
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

    // Optional field updates alongside the touch
    if (body.truncateMessagesTo !== undefined) {
      const count = Number(body.truncateMessagesTo);
      if (!Number.isFinite(count) || count < 0) {
        return Response.json({ error: "Invalid truncateMessagesTo" }, { status: 400 });
      }
      if (session) {
        const truncated = { ...session, messages: session.messages.slice(0, count) };
        await saveSession(truncated);
      }
    } else if (body.websitePublishedUrl !== undefined) {
      await prisma.session.update({
        where: { id },
        data: { websitePublishedUrl: body.websitePublishedUrl ?? null },
      });
      // Invalidate Redis so next load gets the fresh value
      if (session) {
        await saveSession({ ...session, websitePublishedUrl: body.websitePublishedUrl ?? null });
      }
    } else {
      await touchSession(id);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[sessions] PATCH error:", err);
    return Response.json({ error: "Failed to update session" }, { status: 500 });
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
