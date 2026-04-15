import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/templates — public, returns active templates sorted by sortOrder
// Includes ALL slides for each template's session (for the detail modal thumbnail strip)
export async function GET() {
  try {
    const rows = await prisma.template.findMany({
      where: { isActive: true },
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

    const templates = rows.map((r: typeof rows[number]) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      category: r.category,
      tags: r.tags,
      bg: r.bg,
      prompt: r.prompt,
      sessionId: r.sessionId,
      theme: r.session?.theme ?? r.session?.slides[0]?.theme ?? "minimal",
      themeColors: r.session?.themeColors as Record<string, string> | null ?? null,
      slides: r.session?.slides.map((s: { id: string; index: number; title: string | null; content: string | null; theme: string | null; layout: string }) => ({
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
