/**
 * GET /api/brand-kits/[id]/thumbnail?pattern=<index>
 *
 * Renders the Nth pattern from the kit's layout-library.md as a 1280x720 PNG
 * via the pdf-server's /render-thumbnail endpoint. Caches at the CDN level
 * (immutable per kit version + pattern index — bust by version bump).
 *
 * If PDF_SERVER_URL is unset, returns a 1×1 transparent PNG so the UI
 * gracefully falls back to a placeholder.
 */

import { NextRequest } from "next/server";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { substituteBrandVars } from "@/lib/brand/template";
import { DEFAULT_BRAND_VARS, type BrandVars } from "@/lib/brand/types";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63wAAAABJRU5ErkJggg==",
  "base64",
);

function extractPatternHtml(libraryMd: string, patternIndex: number): string | null {
  // Pattern blocks are ## Pattern N: <name> ... ```html ... ```
  // Pull the Nth html code block, where N is 0-indexed by appearance order.
  const codeBlocks = libraryMd.match(/```html\s*\n([\s\S]+?)```/g);
  if (!codeBlocks) return null;
  const block = codeBlocks[patternIndex];
  if (!block) return null;
  const m = block.match(/```html\s*\n([\s\S]+?)```/);
  return m ? m[1].trim() : null;
}

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const user = await requireAuth();
  if (isResponse(user)) return user;
  const { id } = await ctx.params;

  const url = new URL(req.url);
  const idx = Math.max(0, Math.min(50, Number(url.searchParams.get("pattern") ?? 0)));

  const kit = await prisma.brandKit.findUnique({
    where: { id },
    select: { userId: true, layoutLibraryMd: true, brandVars: true, version: true },
  });
  if (!kit || kit.userId !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  const layoutLibraryMd = kit.layoutLibraryMd ?? "";
  const html = extractPatternHtml(layoutLibraryMd, idx);
  if (!html) {
    return new Response(TRANSPARENT_PNG, {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }

  const rawVars = (kit.brandVars as Partial<BrandVars> | null) ?? {};
  const vars: BrandVars = {
    ...DEFAULT_BRAND_VARS,
    ...rawVars,
    colors: { ...DEFAULT_BRAND_VARS.colors, ...rawVars.colors },
    fonts: { ...DEFAULT_BRAND_VARS.fonts, ...rawVars.fonts },
    logo: { ...DEFAULT_BRAND_VARS.logo, ...rawVars.logo },
  };
  const substituted = substituteBrandVars(html, vars).output;

  const PDF_SERVER_URL = process.env.PDF_SERVER_URL ?? "";
  const PDF_SERVER_SECRET = process.env.PDF_SERVER_SECRET ?? "";
  if (!PDF_SERVER_URL) {
    return new Response(TRANSPARENT_PNG, {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }

  try {
    const upstream = await fetch(`${PDF_SERVER_URL}/render-thumbnail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(PDF_SERVER_SECRET ? { Authorization: `Bearer ${PDF_SERVER_SECRET}` } : {}),
      },
      body: JSON.stringify({ html: substituted }),
    });
    if (!upstream.ok) {
      return new Response(TRANSPARENT_PNG, {
        status: 200,
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        // Bust cache by kit version so re-extractions show new thumbnails.
        "Cache-Control": `public, max-age=300, s-maxage=86400`,
        "X-Kit-Version": String(kit.version),
      },
    });
  } catch {
    return new Response(TRANSPARENT_PNG, {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }
}
