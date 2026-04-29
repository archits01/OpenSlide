/**
 * Brand kits API — list and create.
 *
 * v2 brand system. A brand kit is stored as markdown skill files plus
 * structured brand variables. This route handles the create-from-vars
 * path (Phase 0): the user provides palette/fonts/logo, we seed the kit
 * from the generic skill scaffold with brand-var placeholders.
 *
 * The PPTX/PDF/URL extraction paths (Phase 1+) write to the same table.
 */

import { NextRequest } from "next/server";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { seedBrandSkillFromGeneric } from "@/lib/brand/seed-from-generic";
import { DEFAULT_BRAND_VARS, type BrandVars } from "@/lib/brand/types";

export const runtime = "nodejs";

// ─── GET: list user's brand kits ────────────────────────────────────────────

export async function GET() {
  const user = await requireAuth();
  if (isResponse(user)) return user;

  const kits = await prisma.brandKit.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      description: true,
      isDefault: true,
      brandVars: true,
      status: true,
      version: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  return Response.json({ kits });
}

// ─── POST: create a new brand kit (from manual brand vars) ──────────────────

interface CreateBody {
  name: string;
  description?: string;
  isDefault?: boolean;
  brandVars: Partial<BrandVars>;
}

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (isResponse(user)) return user;

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  if (!body.brandVars || typeof body.brandVars !== "object") {
    return Response.json({ error: "brandVars is required" }, { status: 400 });
  }

  // Deep-merge incoming vars with defaults so partial submissions don't crash
  // the templating step (which expects every used field to resolve).
  const mergedVars: BrandVars = {
    ...DEFAULT_BRAND_VARS,
    ...body.brandVars,
    colors: { ...DEFAULT_BRAND_VARS.colors, ...body.brandVars.colors },
    fonts: { ...DEFAULT_BRAND_VARS.fonts, ...body.brandVars.fonts },
    logo: { ...DEFAULT_BRAND_VARS.logo, ...body.brandVars.logo },
  };

  // Seed markdown files from the generic skill scaffold. This is the Phase 0
  // baseline — Phase 1+ writers will overwrite these once extraction runs.
  const seeded = seedBrandSkillFromGeneric(mergedVars.brandName || body.name);

  // If marking this as default, clear existing defaults in a transaction.
  const result = await prisma.$transaction(async (tx) => {
    if (body.isDefault) {
      await tx.brandKit.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.brandKit.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        isDefault: !!body.isDefault,
        brandVars: mergedVars as unknown as object,
        skillMd: seeded.skillMd,
        designSystemMd: seeded.designSystemMd,
        layoutLibraryMd: seeded.layoutLibraryMd,
        status: "ready",
        sourceFiles: [],
        userEditedFiles: [],
      },
      select: {
        id: true,
        name: true,
        description: true,
        isDefault: true,
        brandVars: true,
        status: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  return Response.json({ kit: result }, { status: 201 });
}
