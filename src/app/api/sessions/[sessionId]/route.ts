export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAuth, isResponse, requireOwnership } from "@/lib/api-helpers";
import { getSession, saveSession } from "@/lib/redis";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const { sessionId } = await params;
  const session = await getSession(sessionId);
  const denied = requireOwnership(session, user.id);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  if (typeof body.isPublic === "boolean") session!.isPublic = body.isPublic;
  if (typeof body.isReplay === "boolean") session!.isReplay = body.isReplay;

  // Brand kit override for this session.
  //   - "string"  → set explicit kit (must belong to user)
  //   - null      → clear override (next chat turn falls back to user's default)
  //   - undefined → unchanged
  if (body.brandKitId === null) {
    session!.brandKitId = null;
  } else if (typeof body.brandKitId === "string") {
    const { prisma } = await import("@/lib/db");
    const kit = await prisma.brandKit.findUnique({
      where: { id: body.brandKitId },
      select: { id: true, userId: true },
    });
    if (!kit || kit.userId !== user.id) {
      return Response.json({ error: "Brand kit not found" }, { status: 404 });
    }
    session!.brandKitId = body.brandKitId;
  }

  // If going private, also turn off replay
  if (session!.isPublic === false) session!.isReplay = false;

  // Slide content update (from in-place editor)
  if (typeof body.slideId === "string" && typeof body.content === "string") {
    const slide = session!.slides.find(s => s.id === body.slideId);
    if (slide) slide.content = body.content;
  }

  // Sheet workbook update (from SheetCanvas edits)
  if (typeof body.slideId === "string" && typeof body.workbookJson === "string") {
    const slide = session!.slides.find(s => s.id === body.slideId);
    if (slide) {
      slide.workbookJson = body.workbookJson;
      if (typeof body.workbookSheetCount === "number") {
        slide.workbookSheetCount = body.workbookSheetCount;
      } else {
        // Derive sheet count from the workbook payload when not provided
        try {
          const parsed = JSON.parse(body.workbookJson);
          const order = Array.isArray(parsed?.sheetOrder) ? parsed.sheetOrder.length : undefined;
          if (typeof order === "number") slide.workbookSheetCount = order;
        } catch { /* ignore parse errors */ }
      }
    }
  }

  await saveSession(session!);

  return Response.json({
    isPublic: session!.isPublic,
    isReplay: session!.isReplay,
    brandKitId: session!.brandKitId ?? null,
  });
}
