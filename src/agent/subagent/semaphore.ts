import { Redis } from "@upstash/redis";

// Redis-based counting semaphore — equivalent to OpenClaw's CommandLane with maxConcurrent.
// Gates concurrent subagent Anthropic calls across distributed Vercel functions.
//
// OpenClaw uses an in-process queue on globalThis (command-queue.ts).
// We can't do that across Vercel invocations, so Redis is the shared state instead.
//
// Slot lifecycle: acquired before runAgentLoop(), released in finally.
// TTL = 320s (> maxDuration 300s) so a crashed function auto-releases its slot.

const SEMAPHORE_KEY = "openslides:sem:subagent";
const MAX_CONCURRENT = Math.max(1, parseInt(process.env.SUBAGENT_MAX_CONCURRENT ?? "2", 10) || 2);
const LEASE_TTL_SECONDS = 320;
const POLL_INTERVAL_MS = 500;
const WARN_AFTER_MS = 10_000; // log a warning if waiting more than 10s, like OpenClaw's warnAfterMs

function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// Atomically increment counter if below max, refresh TTL on every acquire.
// TTL is refreshed each time so every invocation's lease is anchored to its own acquire time.
// Without this, a second invocation acquiring at T=100s would inherit the TTL set by the
// first at T=0, expiring at T=320 while the second can legitimately run until T=400.
const ACQUIRE_SCRIPT = `
local c = tonumber(redis.call('GET', KEYS[1]) or '0')
if c < tonumber(ARGV[1]) then
  local new = redis.call('INCR', KEYS[1])
  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
  return new
end
return -1
`;

// Atomically decrement counter, floor at 0.
const RELEASE_SCRIPT = `
local c = tonumber(redis.call('GET', KEYS[1]) or '0')
if c > 0 then
  return redis.call('DECR', KEYS[1])
end
return 0
`;

export async function withSubagentSemaphore<T>(
  runId: string,
  fn: () => Promise<T>
): Promise<T> {
  const redis = getRedis();
  const enqueuedAt = Date.now();
  let acquired = false;

  while (true) {
    const raw = await redis.eval(
      ACQUIRE_SCRIPT,
      [SEMAPHORE_KEY],
      [String(MAX_CONCURRENT), String(LEASE_TTL_SECONDS)]
    );
    // Lua returns a Redis integer (slot count) on acquire, or -1 if full.
    // Guard against null/unexpected types — treat anything that isn't a positive
    // integer as "not acquired" so a Redis error never silently bypasses the gate.
    const result = typeof raw === "number" ? raw : -1;

    if (result > 0) {
      acquired = true;
      console.log(`[semaphore:${runId}] acquired slot ${result}/${MAX_CONCURRENT} after ${Date.now() - enqueuedAt}ms`);
      break;
    }

    const waitedMs = Date.now() - enqueuedAt;
    if (waitedMs >= WARN_AFTER_MS) {
      console.warn(`[semaphore:${runId}] still waiting for slot after ${waitedMs}ms (max ${MAX_CONCURRENT} reached)`);
    }

    // Add ±100ms jitter so concurrent waiters don't all poll Redis at the same instant
    const jitter = Math.random() * 200 - 100;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS + jitter));
  }

  try {
    return await fn();
  } finally {
    if (acquired) {
      await redis
        .eval(RELEASE_SCRIPT, [SEMAPHORE_KEY], [])
        .then((v) => console.log(`[semaphore:${runId}] released slot, counter now ${v}`))
        .catch(() => {});
    }
  }
}
