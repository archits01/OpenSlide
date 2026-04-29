/**
 * Load a BrandKit from Postgres and convert it into a Skill[] that the
 * existing skills-loader / buildSkillsSection pipeline can consume.
 *
 * This is the adapter that lets brand kits live in the same skill-injection
 * flow as disk-based skills — no special-casing in the prompt builder.
 */

import type { Skill } from "@/lib/skills-loader";
import { prisma } from "@/lib/db";
import { substituteBrandVars } from "./template";
import { DEFAULT_BRAND_VARS, type BrandKitRecord, type BrandVars } from "./types";

/**
 * Hydrate a Prisma BrandKit row into a runtime BrandKitRecord with typed
 * brandVars (deep-merged with defaults so partial vars are safe).
 */
function hydrate(row: {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  domain?: string | null;
  layoutCap?: number;
  brandVars: unknown;
  skillMd: string | null;
  designSystemMd: string | null;
  layoutLibraryMd: string | null;
  sourceFiles: unknown;
  sourceNotes: string | null;
  status: string;
  extractionLog: unknown;
  version: number;
  userEditedFiles: string[];
  createdAt: Date;
  updatedAt: Date;
}): BrandKitRecord {
  const rawVars = (row.brandVars as Partial<BrandVars> | null) ?? {};
  const brandVars: BrandVars = {
    ...DEFAULT_BRAND_VARS,
    ...rawVars,
    colors: { ...DEFAULT_BRAND_VARS.colors, ...rawVars.colors },
    fonts: { ...DEFAULT_BRAND_VARS.fonts, ...rawVars.fonts },
    logo: { ...DEFAULT_BRAND_VARS.logo, ...rawVars.logo },
  };

  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    isDefault: row.isDefault,
    domain: row.domain ?? null,
    layoutCap: row.layoutCap,
    brandVars,
    skillMd: row.skillMd,
    designSystemMd: row.designSystemMd,
    layoutLibraryMd: row.layoutLibraryMd,
    sourceFiles: (row.sourceFiles as BrandKitRecord["sourceFiles"]) ?? [],
    sourceNotes: row.sourceNotes,
    status: row.status as BrandKitRecord["status"],
    extractionLog: (row.extractionLog as BrandKitRecord["extractionLog"]) ?? [],
    version: row.version,
    userEditedFiles: row.userEditedFiles as BrandKitRecord["userEditedFiles"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Convert a BrandKitRecord into a Skill that the existing prompt builder can
 * inject. The substituted markdown becomes the skill's body; design-system
 * and layout-library go into sharedBody so the existing buildSkillsSection
 * concatenation works unchanged.
 *
 * Phase 0 always emits both body and sharedBody — there is no longer a
 * legitimate reason to strip shared content (the whole point of the brand
 * skill is to PROVIDE the design system and layouts).
 */
export function brandKitToSkill(kit: BrandKitRecord): Skill {
  const skillBodyRaw = kit.skillMd ?? "";
  const designSystemRaw = kit.designSystemMd ?? "";
  const layoutLibraryRaw = kit.layoutLibraryMd ?? "";

  const { output: body, missing: bodyMissing } = substituteBrandVars(
    skillBodyRaw,
    kit.brandVars,
  );

  const sharedParts: string[] = [];
  const allMissing: string[] = [...bodyMissing];

  if (designSystemRaw) {
    const { output, missing } = substituteBrandVars(
      designSystemRaw,
      kit.brandVars,
    );
    sharedParts.push(output.trim());
    allMissing.push(...missing);
  }
  if (layoutLibraryRaw) {
    const { output, missing } = substituteBrandVars(
      layoutLibraryRaw,
      kit.brandVars,
    );
    sharedParts.push(output.trim());
    allMissing.push(...missing);
  }

  if (allMissing.length) {
    const unique = Array.from(new Set(allMissing)).sort();
    console.warn(
      `[brand] Kit ${kit.id} (${kit.name}) has unresolved placeholders: ${unique.join(", ")}`,
    );
  }

  return {
    name: `Brand Kit — ${kit.name}`,
    description:
      kit.description ??
      `Custom brand kit for ${kit.brandVars.brandName}. Authoritative design system and layouts for this brand.`,
    body: body.trim(),
    sharedBody: sharedParts.length ? `\n\n---\n\n${sharedParts.join("\n\n---\n\n")}` : "",
    filePath: `db://brand_kits/${kit.id}`,
  };
}

/**
 * Load a brand kit by id. Returns null if not found or status is not "ready".
 */
export async function loadBrandKitById(
  kitId: string,
): Promise<BrandKitRecord | null> {
  const row = await prisma.brandKit.findUnique({ where: { id: kitId } });
  if (!row) return null;
  return hydrate(row);
}

/**
 * Load the user's default brand kit (if any).
 */
export async function loadDefaultBrandKit(
  userId: string,
): Promise<BrandKitRecord | null> {
  const row = await prisma.brandKit.findFirst({
    where: { userId, isDefault: true },
  });
  if (!row) return null;
  return hydrate(row);
}

/**
 * Resolve which brand kit applies to a given session:
 *  1. If session has explicit brandKitId → use that
 *  2. Else fall back to the user's default kit
 *  3. Else null (no brand)
 *
 * Only returns kits with status "ready" — drafts/extracting/failed kits don't
 * affect generation.
 */
export async function resolveBrandKitForSession(
  userId: string,
  explicitBrandKitId: string | null | undefined,
): Promise<BrandKitRecord | null> {
  if (explicitBrandKitId) {
    const explicit = await loadBrandKitById(explicitBrandKitId);
    if (explicit && explicit.userId === userId && explicit.status === "ready") {
      return explicit;
    }
  }
  const fallback = await loadDefaultBrandKit(userId);
  if (fallback && fallback.status === "ready") return fallback;
  return null;
}
