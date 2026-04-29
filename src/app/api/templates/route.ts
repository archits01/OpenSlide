import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const VALID_MODES = new Set(["slides", "docs", "sheets", "website"]);

// GET /api/templates — public, returns active templates sorted by sortOrder
// Query params:
//   mode=slides|docs|sheets|website — filter to one mode (unknown values ignored)
// Includes ALL slides for each template's session (for the detail modal thumbnail strip)
export async function GET(req: NextRequest) {
  try {
    const modeParam = req.nextUrl.searchParams.get("mode");
    const modeFilter = modeParam && VALID_MODES.has(modeParam) ? modeParam : null;

    const rows = await prisma.template.findMany({
      where: { isActive: true, ...(modeFilter ? { mode: modeFilter } : {}) },
      orderBy: { sortOrder: "asc" },
      include: {
        session: {
          select: {
            theme: true,
            themeColors: true,
            slides: {
              orderBy: { index: "asc" },
              select: { id: true, index: true, content: true, theme: true, title: true, layout: true },
            },
          },
        },
      },
    });

    const templates = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      mode: r.mode,
      category: r.category,
      tags: r.tags,
      bg: r.bg,
      prompt: r.prompt,
      sessionId: r.sessionId,
      theme: r.session?.theme ?? r.session?.slides[0]?.theme ?? "minimal",
      themeColors: r.session?.themeColors as Record<string, string> | null ?? null,
      slides: r.session?.slides.map((s) => ({
        id: s.id,
        index: s.index,
        title: s.title,
        content: s.content,
        theme: s.theme,
        layout: s.layout,
      })) ?? [],
    }));

    return NextResponse.json({ templates });
  } catch (err) {
    console.error("[templates] GET error:", err);
    return NextResponse.json({ error: "Failed to list templates" }, { status: 500 });
  }
}
