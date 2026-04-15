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

  // If going private, also turn off replay
  if (session!.isPublic === false) session!.isReplay = false;

  // Slide content update (from in-place editor)
  if (typeof body.slideId === "string" && typeof body.content === "string") {
    const slide = session!.slides.find(s => s.id === body.slideId);
    if (slide) slide.content = body.content;
  }

  await saveSession(session!);

  return Response.json({ isPublic: session!.isPublic, isReplay: session!.isReplay });
}
