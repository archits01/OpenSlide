// Coordinates synchronous shell results between the agent loop (SSE request)
// and the website-shell-result route (separate HTTP request).
//
// Two layers:
//   1. In-memory Map (primary) — works when both the agent loop and the API
//      route run in the same Node process (dev mode + Vercel Fluid Compute
//      hot instances). Survives HMR via globalThis.
//   2. Redis (backup) — bridges across function instances in production.
//
// Why both: Upstash DNS hiccups (or any Redis outage) used to break the
// entire sync mechanism, falling back to {queued: true} so the agent never
// awaited shell exit codes. With the in-memory layer as primary, single-
// process environments work without Redis at all, and Redis is only needed
// when requests genuinely land on different instances.

import { Redis } from "@upstash/redis";

const RESULT_KEY = (id: string) => `shell:sync:${id}`;
const POLL_INTERVAL_MS = 150;
const RESULT_TTL_SECS = 60;
const RESULT_TTL_MS = RESULT_TTL_SECS * 1000;

export interface ShellSyncResult {
  output: string;
  exitCode: number;
}

// In-memory cache attached to globalThis so it survives Next.js HMR.
const MEM_KEY = "__openslidesShellSync__" as const;
function getMemCache(): Map<string, ShellSyncResult> {
  const g = globalThis as typeof globalThis & { [MEM_KEY]?: Map<string, ShellSyncResult> };
  if (!g[MEM_KEY]) g[MEM_KEY] = new Map();
  return g[MEM_KEY]!;
}

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

/**
 * Called from the agent loop. Polls in-memory first, then Redis, until either
 * source has the result. Throws on timeout so the caller can fall back gracefully.
 */
export async function waitForShellResult(
  toolUseId: string,
  timeoutMs: number,
): Promise<ShellSyncResult> {
  const memCache = getMemCache();
  const deadline = Date.now() + timeoutMs;
  let redisDownLogged = false;

  while (Date.now() < deadline) {
    // ── Layer 1: in-memory ─────────────────────────────────────────────
    const memResult = memCache.get(toolUseId);
    if (memResult !== undefined) {
      memCache.delete(toolUseId);
      // Best-effort Redis cleanup (ignore failures)
      try {
        await getRedis().del(RESULT_KEY(toolUseId));
      } catch {
        // Redis down — that's fine, in-memory already gave us the result
      }
      return memResult;
    }

    // ── Layer 2: Redis (cross-instance bridge in prod) ─────────────────
    try {
      const raw = await getRedis().get<string>(RESULT_KEY(toolUseId));
      if (raw !== null) {
        await getRedis().del(RESULT_KEY(toolUseId)).catch(() => { /* ignore */ });
        return (typeof raw === "string" ? JSON.parse(raw) : raw) as ShellSyncResult;
      }
    } catch (err) {
      if (!redisDownLogged) {
        console.warn(`[shell-sync] Redis poll failed (in-memory cache still active): ${String(err).slice(0, 200)}`);
        redisDownLogged = true;
      }
      // Keep polling in-memory only — don't break out of the loop
    }

    await new Promise<void>((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(
    `Shell command sync timed out after ${timeoutMs / 1000}s — browser did not respond in time`,
  );
}

/**
 * Called from /api/website-shell-result. Writes the result to BOTH in-memory
 * and Redis so waitForShellResult unblocks regardless of which layer it
 * happens to poll first. Redis errors are swallowed because in-memory writes
 * always succeed and that's enough for single-process environments.
 */
export async function resolveShellResult(
  toolUseId: string,
  output: string,
  exitCode: number,
): Promise<void> {
  const payload: ShellSyncResult = { output, exitCode };

  // ── Layer 1: in-memory (always succeeds) ─────────────────────────────
  const memCache = getMemCache();
  memCache.set(toolUseId, payload);
  // Auto-cleanup if no consumer ever picks it up (prevents leak when the
  // agent loop already timed out before the result arrived).
  setTimeout(() => memCache.delete(toolUseId), RESULT_TTL_MS);

  // ── Layer 2: Redis (best-effort, bridges across instances) ──────────
  try {
    await getRedis().set(RESULT_KEY(toolUseId), JSON.stringify(payload), {
      ex: RESULT_TTL_SECS,
    });
  } catch (err) {
    console.warn(`[shell-sync] Redis write failed (in-memory still works): ${String(err).slice(0, 200)}`);
  }
}
