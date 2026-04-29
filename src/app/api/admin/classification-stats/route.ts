import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "").split(",").filter(Boolean);

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  if (!ADMIN_USER_IDS.includes(user.id)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const daysParam = req.nextUrl.searchParams.get("days");
  const days = Math.min(Math.max(parseInt(daysParam ?? "7", 10) || 7, 1), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [categoryDist, confidenceDist, methodDist, totalCount] = await Promise.all([
    prisma.classificationEvent.groupBy({
      by: ["category"],
      _count: { id: true },
      where: { createdAt: { gte: since } },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.classificationEvent.groupBy({
      by: ["confidence"],
      _count: { id: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.classificationEvent.groupBy({
      by: ["method"],
      _count: { id: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.classificationEvent.count({
      where: { createdAt: { gte: since } },
    }),
  ]);

  return Response.json({
    days,
    since: since.toISOString(),
    total: totalCount,
    byCategory: categoryDist.map((r) => ({
      category: r.category,
      count: r._count.id,
      pct: totalCount ? Math.round((r._count.id / totalCount) * 100) : 0,
    })),
    byConfidence: confidenceDist.map((r) => ({
      confidence: r.confidence,
      count: r._count.id,
    })),
    byMethod: methodDist.map((r) => ({
      method: r.method,
      count: r._count.id,
    })),
  });
}
