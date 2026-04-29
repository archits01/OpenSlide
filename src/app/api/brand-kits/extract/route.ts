/**
 * POST /api/brand-kits/extract
 *
 * Accepts a PPTX or PDF upload + brand metadata, runs the brand-kit writer
 * pipeline, persists the result to a BrandKit row, returns the kit.
 *
 * Async-aware v1: the kit row is created at the start with status "extracting"
 * and the extraction log is written to it progressively. This means:
 *   - The kit shows up in the user's list immediately (with an "Extracting…"
 *     pill).
 *   - If the user navigates away from /brand/new, they can come back to
 *     /brand/[id] and see the live log via polling.
 *   - On completion, status flips to "ready" or "failed".
 *
 * The HTTP response still blocks until extraction is done so /brand/new can
 * redirect with the final state. True fire-and-forget would require Vercel
 * Queues; the current pattern is good enough for v1 and works on any host.
 */

import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { runBrandKitWriter } from "@/lib/brand/writer";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_BRAND_VARS } from "@/lib/brand/types";
import type { BrandExtractionLogEntry } from "@/lib/brand/types";

export const runtime = "nodejs";
export const maxDuration = 300;

// OSS build: extraction is unlimited — users plug in their own keys, so cost
// is on them. No daily cap.

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (isResponse(user)) return user;

  const form = await req.formData().catch(() => null);
  if (!form) {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  const url = (form.get("url") as string | null)?.trim() || null;
  const brandName = (form.get("name") as string | null)?.trim();
  const isDefault = form.get("isDefault") === "true";
  const description = (form.get("description") as string | null)?.trim() || null;
  const kitId = (form.get("kitId") as string | null)?.trim() || null;

  if (!brandName) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  // Either a file upload OR a URL is required.
  let kind: "pptx" | "pdf" | "url";
  let tmpPath: string | null = null;
  let originalName: string;
  if (file instanceof File) {
    const filename = file.name.toLowerCase();
    if (filename.endsWith(".pptx")) kind = "pptx";
    else if (filename.endsWith(".pdf")) kind = "pdf";
    else {
      return Response.json({ error: "Only .pptx and .pdf are supported" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    tmpPath = path.join(os.tmpdir(), `brand-source-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
    fs.writeFileSync(tmpPath, buf);
    originalName = file.name;
  } else if (url) {
    if (!/^https?:\/\//i.test(url)) {
      return Response.json({ error: "url must start with http:// or https://" }, { status: 400 });
    }
    kind = "url";
    originalName = url;
  } else {
    return Response.json({ error: "Either a file or url is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const newKitId = (await import("crypto")).randomUUID();

  // ── Pre-create the kit row with status "extracting" ──
  // Existing kits (re-extract path) just have their status flipped to
  // "extracting"; new kits get a placeholder row that the writer fills in.
  let workingKitId: string;
  if (kitId) {
    const existing = await prisma.brandKit.findUnique({ where: { id: kitId } });
    if (!existing || existing.userId !== user.id) {
      return Response.json({ error: "Kit not found" }, { status: 404 });
    }
    workingKitId = kitId;
    // Snapshot current state before re-extracting so the user can roll back.
    await (await import("@/lib/brand/snapshot")).snapshotKit(kitId, "before re-extraction").catch(() => {});
    await prisma.brandKit.update({
      where: { id: kitId },
      data: { status: "extracting", extractionLog: [] },
    });
  } else {
    if (isDefault) {
      await prisma.brandKit.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    workingKitId = newKitId;
    await prisma.brandKit.create({
      data: {
        id: newKitId,
        userId: user.id,
        name: brandName,
        description,
        isDefault,
        brandVars: DEFAULT_BRAND_VARS as unknown as object,
        status: "extracting",
        sourceFiles: [{
          kind,
          storageUrl: "",
          originalName,
          uploadedAt: new Date().toISOString(),
        }] as unknown as object,
        userEditedFiles: [],
        version: 0,
        extractionLog: [],
      },
    });
  }

  // ── Live progress callback writes log entries to the DB ──
  // This lets the detail page poll the kit row and see progress without
  // needing a separate SSE/queue layer. We debounce DB writes so we don't
  // hammer Postgres with one update per step.
  const liveLog: BrandExtractionLogEntry[] = [];
  let pendingWrite: NodeJS.Timeout | null = null;
  const flushLog = async () => {
    pendingWrite = null;
    try {
      await prisma.brandKit.update({
        where: { id: workingKitId },
        data: { extractionLog: liveLog as unknown as object },
      });
    } catch {
      /* non-fatal — final write at end will catch up */
    }
  };
  const onProgress = (step: string, status: "started" | "succeeded" | "failed", message?: string) => {
    liveLog.push({
      step,
      status,
      message,
      ts: new Date().toISOString(),
    });
    if (!pendingWrite) {
      pendingWrite = setTimeout(flushLog, 750);
    }
  };

  // Pull layoutCap from the kit row (set in Variables tab) — defaults to 12.
  const kitRow = await prisma.brandKit.findUnique({
    where: { id: workingKitId },
    select: { layoutCap: true },
  });
  const maxPatterns = kitRow?.layoutCap ?? 12;

  try {
    const result = await runBrandKitWriter({
      brandName,
      source: kind === "url"
        ? { kind: "url", url: url as string }
        : { kind, path: tmpPath as string },
      maxPatterns,
      onProgress,
      uploadLogo: async (buffer, ext, mimeType) => {
        const objectPath = `${user.id}/${workingKitId}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("brand-logos")
          .upload(objectPath, buffer, { contentType: mimeType, upsert: true, cacheControl: "31536000" });
        if (upErr) throw new Error(`Logo upload failed: ${upErr.message}`);
        const { data: pub } = supabase.storage.from("brand-logos").getPublicUrl(objectPath);
        return `${pub.publicUrl}?v=${Date.now()}`;
      },
    });

    // Flush any pending log writes before final commit.
    if (pendingWrite) { clearTimeout(pendingWrite); pendingWrite = null; }

    // Honor userEditedFiles on re-extraction (kitId path).
    let preserved: string[] | undefined;
    if (kitId) {
      const existing = await prisma.brandKit.findUnique({ where: { id: kitId } });
      const locked = new Set(existing?.userEditedFiles ?? []);
      const updateData: Record<string, unknown> = {
        brandVars: result.brandVars as unknown as object,
        status: "ready",
        version: { increment: 1 },
        extractionLog: result.log as unknown as object,
      };
      if (!locked.has("skillMd")) updateData.skillMd = result.skillMd;
      if (!locked.has("designSystemMd")) updateData.designSystemMd = result.designSystemMd;
      if (!locked.has("layoutLibraryMd")) updateData.layoutLibraryMd = result.layoutLibraryMd;
      await prisma.brandKit.update({ where: { id: kitId }, data: updateData });
      if (locked.size > 0) preserved = Array.from(locked);
    } else {
      await prisma.brandKit.update({
        where: { id: newKitId },
        data: {
          // Auto-fill description from the writer's heuristic if user didn't provide one.
          description: description ?? result.autoDescription ?? null,
          brandVars: result.brandVars as unknown as object,
          skillMd: result.skillMd,
          designSystemMd: result.designSystemMd,
          layoutLibraryMd: result.layoutLibraryMd,
          status: "ready",
          version: 1,
          extractionLog: result.log as unknown as object,
        },
      });
    }

    const final = await prisma.brandKit.findUnique({
      where: { id: workingKitId },
      select: { id: true, name: true, isDefault: true, status: true, version: true },
    });

    return Response.json({
      kit: final,
      validation: result.validation,
      log: result.log,
      preserved,
    });
  } catch (err) {
    if (pendingWrite) { clearTimeout(pendingWrite); pendingWrite = null; }
    console.error("[brand-kits/extract] pipeline failed:", err);
    // Mark kit as failed so the UI can surface it.
    try {
      await prisma.brandKit.update({
        where: { id: workingKitId },
        data: {
          status: "failed",
          extractionLog: [
            ...liveLog,
            {
              step: "fatal",
              status: "failed",
              error: err instanceof Error ? err.message : String(err),
              ts: new Date().toISOString(),
            },
          ] as unknown as object,
        },
      });
    } catch { /* best effort */ }
    return Response.json(
      { error: err instanceof Error ? err.message : String(err), kitId: workingKitId },
      { status: 500 },
    );
  } finally {
    if (tmpPath) {
      try { fs.unlinkSync(tmpPath); } catch { /* best effort */ }
    }
  }
}
