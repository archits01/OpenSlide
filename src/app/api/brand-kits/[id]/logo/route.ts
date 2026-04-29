/**
 * POST /api/brand-kits/[id]/logo  — upload a logo image to the kit
 * DELETE /api/brand-kits/[id]/logo — clear the kit's logo
 *
 * Storage bucket: `brand-logos` (public). Path: ${userId}/${kitId}.${ext}.
 * On upload, updates BrandKit.brandVars.logo.url with the public URL.
 */

import { NextRequest } from "next/server";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_BRAND_VARS, type BrandVars } from "@/lib/brand/types";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

interface RouteCtx {
  params: Promise<{ id: string }>;
}

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/png": return "png";
    case "image/jpeg": return "jpg";
    case "image/svg+xml": return "svg";
    case "image/webp": return "webp";
    default: return "bin";
  }
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const user = await requireAuth();
  if (isResponse(user)) return user;
  const { id } = await ctx.params;

  const kit = await prisma.brandKit.findUnique({ where: { id } });
  if (!kit || kit.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "file field is required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: `Unsupported type ${file.type}. Use PNG / JPG / SVG / WebP.` }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: `File too large (${file.size} bytes). Max 5MB.` }, { status: 400 });
  }

  const supabase = await createClient();
  const ext = extFromMime(file.type);
  const objectPath = `${user.id}/${id}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await supabase.storage
    .from("brand-logos")
    .upload(objectPath, buf, { contentType: file.type, upsert: true, cacheControl: "31536000" });
  if (uploadErr) {
    return Response.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from("brand-logos").getPublicUrl(objectPath);
  const publicUrl = `${pub.publicUrl}?v=${Date.now()}`; // bust cache on replace

  // Merge into brandVars.logo.url
  const currentVars = (kit.brandVars as Partial<BrandVars> | null) ?? {};
  const updatedVars: BrandVars = {
    ...DEFAULT_BRAND_VARS,
    ...currentVars,
    colors: { ...DEFAULT_BRAND_VARS.colors, ...currentVars.colors },
    fonts: { ...DEFAULT_BRAND_VARS.fonts, ...currentVars.fonts },
    logo: { ...DEFAULT_BRAND_VARS.logo, ...currentVars.logo, url: publicUrl },
  };

  const updated = await prisma.brandKit.update({
    where: { id },
    data: { brandVars: updatedVars as unknown as object },
    select: { id: true, brandVars: true },
  });

  return Response.json({ kit: updated, logoUrl: publicUrl });
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  const user = await requireAuth();
  if (isResponse(user)) return user;
  const { id } = await ctx.params;

  const kit = await prisma.brandKit.findUnique({ where: { id } });
  if (!kit || kit.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  // Best-effort delete: try all known extensions
  for (const ext of ["png", "jpg", "svg", "webp"]) {
    await supabase.storage.from("brand-logos").remove([`${user.id}/${id}.${ext}`]).catch(() => {});
  }

  const currentVars = (kit.brandVars as Partial<BrandVars> | null) ?? {};
  const updatedVars: BrandVars = {
    ...DEFAULT_BRAND_VARS,
    ...currentVars,
    colors: { ...DEFAULT_BRAND_VARS.colors, ...currentVars.colors },
    fonts: { ...DEFAULT_BRAND_VARS.fonts, ...currentVars.fonts },
    logo: { ...DEFAULT_BRAND_VARS.logo, ...currentVars.logo, url: "" },
  };

  await prisma.brandKit.update({
    where: { id },
    data: { brandVars: updatedVars as unknown as object },
  });

  return Response.json({ ok: true });
}
