/**
 * GET    /api/brand-kits/[id]/versions      → list snapshots (newest first)
 * POST   /api/brand-kits/[id]/versions      → roll back to a specific version
 *
 * Rolling back snapshots the current state first (so the rollback itself can
 * be undone), then writes the prior version's content into the live kit.
 */

import { NextRequest } from "next/server";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { snapshotKit } from "@/lib/brand/snapshot";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const user = await requireAuth();
  if (isResponse(user)) return user;
  const { id } = await ctx.params;

  const kit = await prisma.brandKit.findUnique({ where: { id }, select: { userId: true } });
  if (!kit || kit.userId !== user.id) return Response.json({ error: "Not found" }, { status: 404 });

  const versions = await prisma.brandKitVersion.findMany({
    where: { brandKitId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, version: true, changeReason: true, createdAt: true,
      // omit md content from list response — fetched per-version on demand
    },
  });
  return Response.json({ versions });
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const user = await requireAuth();
  if (isResponse(user)) return user;
  const { id } = await ctx.params;

  const kit = await prisma.brandKit.findUnique({ where: { id } });
  if (!kit || kit.userId !== user.id) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const versionId = typeof body.versionId === "string" ? body.versionId : null;
  if (!versionId) return Response.json({ error: "versionId required" }, { status: 400 });

  const target = await prisma.brandKitVersion.findUnique({ where: { id: versionId } });
  if (!target || target.brandKitId !== id) {
    return Response.json({ error: "Version not found for this kit" }, { status: 404 });
  }

  // Snapshot current before overwriting so the rollback is itself undoable.
  await snapshotKit(id, `before rollback to v${target.version}`).catch(() => {});

  await prisma.brandKit.update({
    where: { id },
    data: {
      brandVars: target.brandVars as unknown as object,
      skillMd: target.skillMd,
      designSystemMd: target.designSystemMd,
      layoutLibraryMd: target.layoutLibraryMd,
      version: { increment: 1 },
    },
  });

  return Response.json({ ok: true, rolledBackToVersion: target.version });
}
