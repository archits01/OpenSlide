// POST /api/website-screenshot — multipart upload of PNG blob from the client.
// Upload flow:
//   client html-to-image → PNG blob → this route → Supabase Storage `website-screenshots/${userId}/${sessionId}.png`
// → patch session.previewScreenshotUrl with a signed URL.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { getSession, saveSession } from "@/lib/redis";

export const runtime = "nodejs";

const BUCKET = "website-screenshots";
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const form = await req.formData();
  const file = form.get("file");
  const sessionId = form.get("sessionId");
  if (typeof sessionId !== "string" || !sessionId) {
    return Response.json({ error: "Missing sessionId" }, { status: 400 });
  }
  if (!(file instanceof Blob)) {
    return Response.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Screenshot exceeds 5MB" }, { status: 413 });
  }

  const session = await getSession(sessionId);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (session.userId && session.userId !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.type !== "website") {
    return Response.json({ error: "Not a website session" }, { status: 400 });
  }

  const supabase = await createClient();
  const path = `${user.id}/${sessionId}.png`;
  const arrayBuf = await file.arrayBuffer();
  const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, Buffer.from(arrayBuf), {
    contentType: "image/png",
    upsert: true,
  });
  if (uploadErr) {
    console.error("[website-screenshot] upload failed:", uploadErr);
    return Response.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7); // 7-day signed URL

  if (signErr || !signed?.signedUrl) {
    console.warn("[website-screenshot] sign failed:", signErr);
  }

  session.previewScreenshotUrl = signed?.signedUrl ?? null;
  try {
    await saveSession(session);
  } catch (saveErr) {
    console.error("[website-screenshot] session save failed:", saveErr);
  }
  void prisma.session
    .update({ where: { id: sessionId }, data: { previewScreenshotUrl: signed?.signedUrl ?? null } })
    .catch((err) => console.warn("[website-screenshot] prisma update failed:", err));

  return Response.json({ ok: true, url: signed?.signedUrl ?? null });
}
