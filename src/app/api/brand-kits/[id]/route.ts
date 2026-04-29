/**
 * Brand kit detail — GET / PATCH / DELETE.
 */

import { NextRequest } from "next/server";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { DEFAULT_BRAND_VARS, type BrandVars } from "@/lib/brand/types";
import { seedBrandSkillFromGeneric } from "@/lib/brand/seed-from-generic";
import { snapshotKit } from "@/lib/brand/snapshot";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const user = await requireAuth();
  if (isResponse(user)) return user;
  const { id } = await ctx.params;

  const kit = await prisma.brandKit.findUnique({ where: { id } });
  if (!kit || kit.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ kit });
}

// ─── PATCH ───────────────────────────────────────────────────────────────────

interface PatchBody {
  name?: string;
  description?: string | null;
  isDefault?: boolean;
  brandVars?: Partial<BrandVars>;
  /** When true, regenerate skill markdown from updated brandVars (loses any user edits). */
  regenerateFromVars?: boolean;
  skillMd?: string;
  designSystemMd?: string;
  layoutLibraryMd?: string;
  /** Replace the userEditedFiles set wholesale (used by the lock toggle). */
  userEditedFiles?: string[];
  /** Registered domain for blocked-domain checks (fetch_logo). */
  domain?: string | null;
  /** Cap on layout patterns generated during extraction. */
  layoutCap?: number;
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const user = await requireAuth();
  if (isResponse(user)) return user;
  const { id } = await ctx.params;

  const existing = await prisma.brandKit.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Merge brandVars if provided.
  const currentVars = (existing.brandVars as unknown as BrandVars) ?? DEFAULT_BRAND_VARS;
  const mergedVars: BrandVars = body.brandVars
    ? {
        ...currentVars,
        ...body.brandVars,
        colors: { ...currentVars.colors, ...body.brandVars.colors },
        fonts: { ...currentVars.fonts, ...body.brandVars.fonts },
        logo: { ...currentVars.logo, ...body.brandVars.logo },
      }
    : currentVars;

  // Build the userEditedFiles update — bumping any explicit overrides to the lock list.
  // If body.userEditedFiles is provided, that's a wholesale replacement (lock toggle).
  // Otherwise, additively lock files that the user explicitly edited via this request.
  const userEdited = Array.isArray(body.userEditedFiles)
    ? new Set<string>(body.userEditedFiles)
    : new Set<string>(existing.userEditedFiles);
  if (!Array.isArray(body.userEditedFiles)) {
    if (typeof body.skillMd === "string") userEdited.add("skillMd");
    if (typeof body.designSystemMd === "string") userEdited.add("designSystemMd");
    if (typeof body.layoutLibraryMd === "string") userEdited.add("layoutLibraryMd");
  }

  // Optional: regenerate from vars (only files NOT in userEditedFiles).
  let regenerated: { skillMd?: string; designSystemMd?: string; layoutLibraryMd?: string } = {};
  if (body.regenerateFromVars) {
    const seeded = seedBrandSkillFromGeneric(mergedVars.brandName || existing.name);
    if (!userEdited.has("skillMd")) regenerated.skillMd = seeded.skillMd;
    if (!userEdited.has("designSystemMd")) regenerated.designSystemMd = seeded.designSystemMd;
    if (!userEdited.has("layoutLibraryMd")) regenerated.layoutLibraryMd = seeded.layoutLibraryMd;
  }

  // Snapshot before applying when content changes (skip for trivial isDefault/lock toggles).
  const contentChanging =
    body.brandVars !== undefined ||
    body.skillMd !== undefined ||
    body.designSystemMd !== undefined ||
    body.layoutLibraryMd !== undefined ||
    body.regenerateFromVars === true;
  if (contentChanging) {
    await snapshotKit(id, "manual edit").catch(() => {});
  }

  const updated = await prisma.$transaction(async (tx) => {
    // If toggling default to true, clear existing defaults first.
    if (body.isDefault === true && !existing.isDefault) {
      await tx.brandKit.updateMany({
        where: { userId: user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return tx.brandKit.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? undefined,
        description:
          body.description === undefined
            ? undefined
            : body.description === null
              ? null
              : body.description.trim() || null,
        isDefault: body.isDefault,
        domain: body.domain === undefined ? undefined : (body.domain || null),
        layoutCap: typeof body.layoutCap === "number" ? Math.max(4, Math.min(20, Math.round(body.layoutCap))) : undefined,
        brandVars: body.brandVars ? (mergedVars as unknown as object) : undefined,
        skillMd: body.skillMd ?? regenerated.skillMd,
        designSystemMd: body.designSystemMd ?? regenerated.designSystemMd,
        layoutLibraryMd: body.layoutLibraryMd ?? regenerated.layoutLibraryMd,
        userEditedFiles: Array.from(userEdited),
      },
    });
  });

  return Response.json({ kit: updated });
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const user = await requireAuth();
  if (isResponse(user)) return user;
  const { id } = await ctx.params;

  const existing = await prisma.brandKit.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // ?check=true — return the count of sessions referencing this kit so the UI
  // can surface a "12 sessions reference this kit" confirmation.
  const url = new URL(req.url);
  if (url.searchParams.get("check") === "true") {
    const sessionCount = await prisma.session.count({ where: { brandKitId: id } });
    return Response.json({ sessionCount });
  }

  // Best-effort: remove the kit's logo from storage so we don't leak files.
  try {
    const supabase = await (await import("@/lib/supabase/server")).createClient();
    for (const ext of ["png", "jpg", "svg", "webp"]) {
      await supabase.storage.from("brand-logos").remove([`${user.id}/${id}.${ext}`]).catch(() => {});
    }
  } catch { /* non-fatal */ }

  await prisma.brandKit.delete({ where: { id } });
  return Response.json({ ok: true });
}
