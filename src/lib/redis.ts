import { Redis } from "@upstash/redis";
import { prisma } from "./db";

// ─── Re-export all types (zero import changes elsewhere) ──────────────────────
export type {
  Message,
  ContentBlock,
  Session,
  Slide,
  OutlineSlideType,
  OutlineSlide,
  Outline,
  SessionSummary,
  ToolCallEntry,
  SessionAttachment,
} from "./types";

import type {
  Message,
  Session,
  Slide,
  OutlineSlide,
  SessionSummary,
  ToolCallEntry,
  SessionAttachment,
} from "./types";

// ─── Redis cache (Upstash) ────────────────────────────────────────────────────

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

const CACHE_TTL = 60 * 60; // 1 hour

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map a Prisma session row + relations back to the Session interface */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSession(row: any): Session {
  return {
    id: row.id,
    title: row.title,
    type: (row.type === "docs" ? "docs" : "slides") as "slides" | "docs",
    logoUrl: row.logoUrl ?? null,
    theme: row.theme ?? null,
    themeColors: (row.themeColors as Record<string, string>) ?? null,
    isPublic: row.isPublic,
    isReplay: row.isReplay,
    userId: row.userId ?? null,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
    messages: (row.messages as Message[]) ?? [],
    toolHistory: (row.toolHistory as ToolCallEntry[]) ?? [],
    attachments: (row.attachments as SessionAttachment[]) ?? [],
    slideCategory: row.slideCategory ?? null,
    presentationType: row.presentationType ?? null,
    classificationConfidence: (row.classificationConfidence as Session["classificationConfidence"]) ?? null,
    classificationMethod: (row.classificationMethod as Session["classificationMethod"]) ?? null,
    classifiedAt: row.classifiedAt?.getTime() ?? null,
    slides: row.slides.map((s: any) => ({
      id: s.id,
      index: s.index,
      title: s.title,
      content: s.content,
      layout: s.layout as Slide["layout"],
      theme: s.theme ?? undefined,
      notes: s.notes ?? undefined,
    })),
    outline: row.outline
      ? {
          id: row.outline.id,
          presentation_title: row.outline.presentationTitle,
          slides: row.outline.slides as OutlineSlide[],
        }
      : null,
  };
}

// ─── Data functions ───────────────────────────────────────────────────────────

export async function getSession(id: string): Promise<Session | null> {
  // 1. Check Redis cache
  const redis = getRedis();
  const cached = await redis.get<Session>(`session:${id}`);
  if (cached) return cached;

  // 2. Miss — fetch from Postgres
  const row = await prisma.session.findUnique({
    where: { id },
    include: {
      slides: { orderBy: { index: "asc" } },
      outline: true,
      // theme and themeColors are scalar fields — no include needed
    },
  });
  if (!row) return null;

  const session = toSession(row);

  // 3. Warm cache
  await redis.setex(`session:${id}`, CACHE_TTL, JSON.stringify(session));
  return session;
}

export async function createSession(
  id: string,
  title = "Untitled Presentation",
  userId?: string | null,
  type: "slides" | "docs" = "slides"
): Promise<Session> {
  const now = new Date();

  await prisma.session.create({
    data: {
      id,
      title,
      type,
      messages: [],
      toolHistory: [],
      createdAt: now,
      updatedAt: now,
      userId: userId ?? null,
    },
  });

  const session: Session = {
    id,
    title,
    type,
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
    messages: [],
    slides: [],
    outline: null,
    logoUrl: null,
    userId: userId ?? null,
    toolHistory: [],
    attachments: [],
  };

  // Warm cache
  const redis = getRedis();
  await redis.setex(`session:${id}`, CACHE_TTL, JSON.stringify(session));

  return session;
}

export async function saveSession(session: Session): Promise<void> {
  session.updatedAt = Date.now();
  const updatedAt = new Date(session.updatedAt);

  // 1. Write to Redis first so data is safe even if Postgres is slow
  const redis = getRedis();
  await redis.setex(`session:${session.id}`, CACHE_TTL, JSON.stringify(session));

  // 2. Persist to Postgres — fire-and-forget durability backup
  //    Redis is the primary store (written above). Postgres is for durability.
  //    Don't block the SSE response on a slow PgBouncer transaction.
  void persistToPostgres(session, updatedAt).catch((err) => {
    console.error("[saveSession] Postgres write failed (data safe in Redis):", err);
  });
}

/** Persist session to Postgres. Runs as fire-and-forget from saveSession(). */
async function persistToPostgres(session: Session, updatedAt: Date): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.$transaction(async (tx: any) => {
    // Common fields shared between create and update — single source of truth
    const sessionFields = {
      title: session.title,
      type: session.type ?? "slides",
      logoUrl: session.logoUrl ?? null,
      theme: session.theme ?? null,
      themeColors: session.themeColors ?? undefined,
      isPublic: session.isPublic ?? false,
      isReplay: session.isReplay ?? false,
      messages: session.messages as object[],
      toolHistory: (session.toolHistory ?? []) as object[],
      attachments: (session.attachments ?? []) as object[],
      slideCategory: session.slideCategory ?? null,
      presentationType: session.presentationType ?? null,
      classificationConfidence: session.classificationConfidence ?? null,
      classificationMethod: session.classificationMethod ?? null,
      classifiedAt: session.classifiedAt ? new Date(session.classifiedAt) : null,
      updatedAt,
      userId: session.userId ?? null,
    };

    await tx.session.upsert({
      where: { id: session.id },
      create: { id: session.id, createdAt: new Date(session.createdAt), ...sessionFields },
      update: sessionFields,
    });

    // Upsert each slide + delete removed ones (avoids delete/recreate churn)
    const currentSlideIds = session.slides.map((s) => s.id);
    await tx.slide.deleteMany({
      where: { sessionId: session.id, id: { notIn: currentSlideIds } },
    });
    for (const s of session.slides) {
      await tx.slide.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          sessionId: session.id,
          index: s.index,
          title: s.title,
          content: s.content,
          layout: s.layout,
          theme: s.theme ?? null,
          notes: s.notes ?? null,
        },
        update: {
          index: s.index,
          title: s.title,
          content: s.content,
          layout: s.layout,
          theme: s.theme ?? null,
          notes: s.notes ?? null,
        },
      });
    }

    if (session.outline) {
      await tx.outline.upsert({
        where: { sessionId: session.id },
        create: {
          id: session.outline.id,
          sessionId: session.id,
          presentationTitle: session.outline.presentation_title,
          slides: session.outline.slides as object[],
        },
        update: {
          presentationTitle: session.outline.presentation_title,
          slides: session.outline.slides as object[],
        },
      });
    }
  }, { timeout: 60000, maxWait: 10000 });
}

export async function listSessions(
  limit = 20,
  userId?: string | null,
  type?: string | null,
  cursor?: string | null
): Promise<{ sessions: SessionSummary[]; nextCursor: string | null }> {
  // Direct Postgres query — no Redis (list changes on every save)
  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (type) where.type = type;
  const rows = await prisma.session.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { updatedAt: "desc" },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      title: true,
      updatedAt: true,
      lastOpenedAt: true,
      slides: {
        take: 1,
        orderBy: { index: "asc" },
        select: { content: true, theme: true },
      },
      _count: { select: { slides: true } },
    },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  // Sort by most recent activity: whichever is newer — lastOpenedAt or updatedAt
  const sorted = [...items].sort((a, b) => {
    const aTime = Math.max(a.lastOpenedAt?.getTime() ?? 0, a.updatedAt.getTime());
    const bTime = Math.max(b.lastOpenedAt?.getTime() ?? 0, b.updatedAt.getTime());
    return bTime - aTime;
  });

  const sessions = sorted.map((r) => ({
    id: r.id,
    title: r.title,
    updatedAt: Math.max(r.lastOpenedAt?.getTime() ?? 0, r.updatedAt.getTime()),
    slideCount: r._count.slides,
    firstSlide: r.slides[0]
      ? {
          content: r.slides[0].content,
          theme: r.slides[0].theme ?? "minimal",
        }
      : undefined,
  }));

  return {
    sessions,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

/** Update lastOpenedAt to now — called when user opens a session */
export async function touchSession(id: string): Promise<void> {
  await prisma.session.update({
    where: { id },
    data: { lastOpenedAt: new Date() },
  });
}

export async function deleteSession(id: string): Promise<void> {
  // Postgres delete (cascades to slides + outline automatically)
  await prisma.session.delete({ where: { id } });

  // Invalidate Redis cache
  const redis = getRedis();
  await redis.del(`session:${id}`);
}
