// POST /api/website-snapshot?sessionId=... — upload WebContainer FS snapshot.
// Body: raw octet-stream (the .bin from wc.export).
// Server: stores in Supabase Storage bucket `website-snapshots` as ${userId}/${sessionId}.bin
// and patches Session.webcontainerSnapshotUrl.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { getSession, saveSession } from "@/lib/redis";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "website-snapshots";
const MAX_BYTES = 500 * 1024 * 1024; // 500MB hard cap
// Supabase free tier has a global 50MB project-level file size limit that
// overrides bucket limits. Skip gracefully rather than getting a 413 back.
const SKIP_BYTES = 45 * 1024 * 1024; // 45MB safe threshold

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return Response.json({ error: "Missing sessionId" }, { status: 400 });

  const session = await getSession(sessionId);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (session.userId && session.userId !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.type !== "website") {
    return Response.json({ error: "Not a website session" }, { status: 400 });
  }

  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.byteLength === 0) {
    return Response.json({ error: "Empty body" }, { status: 400 });
  }
  if (buf.byteLength > MAX_BYTES) {
    return Response.json({ error: "Snapshot exceeds 500MB" }, { status: 413 });
  }
  // Free-tier Supabase has a global 50MB project limit that overrides bucket settings.
  // Skip silently so the client doesn't retry — user just pays npm install on next reload.
  if (buf.byteLength > SKIP_BYTES) {
    console.warn(`[website-snapshot] skipping upload (${(buf.byteLength / 1024 / 1024).toFixed(1)}MB > 45MB limit)`);
    return Response.json({ ok: false, skipped: true, reason: "too_large", bytes: buf.byteLength }, { status: 200 });
  }

  const supabase = await createClient();
  const path = `${user.id}/${sessionId}.bin`;
  // Client uploads gzipped bytes with Content-Type: application/gzip. Preserve
  // that type so the signed-URL download serves the right MIME and clients
  // (or CDNs) can apply their own decompression if they want to.
  const clientContentType = req.headers.get("content-type") ?? "application/octet-stream";
  const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: clientContentType,
    upsert: true,
  });
  if (uploadErr) {
    console.error(`[website-snapshot] upload failed (${buf.byteLength} bytes):`, uploadErr);
    // Surface a hint when the bucket rejects for size so the developer can
    // raise the bucket limit in the Supabase dashboard if needed.
    const status = uploadErr.message?.toLowerCase().includes("size") ? 413 : 500;
    return Response.json(
      {
        error: uploadErr.message,
        bytes: buf.byteLength,
        hint: status === 413
          ? "Raise 'Maximum file size' on the website-snapshots bucket in Supabase Storage settings."
          : undefined,
      },
      { status },
    );
  }

  // Signed URL valid for 7 days — rotated on next snapshot upload.
  // Longer than 24h so users who come back mid-week don't fall off the fast path.
  const { data: signedUrlData, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signErr || !signedUrlData?.signedUrl) {
    console.warn("[website-snapshot] sign failed:", signErr);
  }

  session.webcontainerSnapshotUrl = signedUrlData?.signedUrl ?? null;
  session.websiteSandboxDirty = false;
  try {
    await saveSession(session);
  } catch (saveErr) {
    console.error("[website-snapshot] session save failed:", saveErr);
  }

  // Also patch the DB directly in case save failed (fire-and-forget is ok since it's durability backup)
  void prisma.session
    .update({
      where: { id: sessionId },
      data: {
        webcontainerSnapshotUrl: signedUrlData?.signedUrl ?? null,
        websiteSandboxDirty: false,
      },
    })
    .catch((err) => console.warn("[website-snapshot] prisma update failed:", err));

  return Response.json({ ok: true, url: signedUrlData?.signedUrl ?? null }, { status: 202 });
}
