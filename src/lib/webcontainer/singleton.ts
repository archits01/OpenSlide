import type { WebContainer as WC } from "@webcontainer/api";

// WebContainer.boot() is a tab-scoped singleton in the StackBlitz SDK — a second
// call in the same document always throws. We attach the instance to globalThis
// (not a module-level `let`) because Turbopack replaces the module on HMR, which
// would otherwise lose the reference and let a stale WC block a re-boot.

type Cache = {
  wc: WC | null;
  booting: Promise<WC> | null;
  /** Session ID claimed at boot start — set BEFORE mount/install completes.
   *  Used to detect cross-session reuse even when a previous session never
   *  reached `markSessionMounted` (e.g. interrupted, crashed, or torn down
   *  mid-boot). Without this, a zombie Vite from an interrupted previous
   *  session leaks into the next session's WC and emits ENOENT-style errors
   *  as the new agent's writeFile calls land. */
  claimedSessionId: string | null;
  /** Session ID after a successful mount + edit-script injection. Stays in
   *  sync with claimedSessionId on the happy path; differs only when boot
   *  failed or was interrupted. */
  mountedSessionId: string | null;
  previewUrl: string | null;
  /** True while coldInstall + startDevServer are running for this session.
   *  Lets a re-triggered effect (StrictMode, bootEnabled flip) distinguish
   *  "boot still in progress" from "server genuinely crashed". */
  fullBootInProgress: boolean;
};

const KEY = "__openslidesWC__" as const;

function cache(): Cache {
  const g = globalThis as typeof globalThis & { [KEY]?: Cache };
  if (!g[KEY]) {
    g[KEY] = { wc: null, booting: null, claimedSessionId: null, mountedSessionId: null, previewUrl: null, fullBootInProgress: false };
  }
  return g[KEY]!;
}

export interface AcquireResult {
  wc: WC;
  /** false when the returned instance is already mounted+installed for this session — caller should skip setup. */
  isFresh: boolean;
}

async function probeLiveness(wc: WC): Promise<boolean> {
  try {
    await wc.fs.readdir("/");
    return true;
  } catch (err) {
    console.warn("[wc] liveness probe failed:", err);
    return false;
  }
}

async function resetCache(c: Cache, reason: string): Promise<void> {
  console.log(`[wc] singleton reset: ${reason}`);
  // If a boot is in flight, wait for it to finish so we can teardown the
  // resulting WC. Without this, the in-flight closure resolves AFTER reset
  // completes and writes c.wc = wc onto stale state — leaking a WC that's
  // not under any session's control.
  if (c.booting) {
    try {
      const wc = await c.booting;
      await wc.teardown();
    } catch {
      // best-effort
    }
  } else if (c.wc) {
    try {
      await c.wc.teardown();
    } catch {
      // best-effort
    }
  }
  c.wc = null;
  c.booting = null;
  c.claimedSessionId = null;
  c.mountedSessionId = null;
  c.previewUrl = null;
  c.fullBootInProgress = false;
}

export async function acquireForSession(sessionId: string): Promise<AcquireResult> {
  const c = cache();

  // ── Cross-session reset ──────────────────────────────────────────────────
  // If the singleton was claimed by a different session — even one that
  // never finished mounting — tear it down. This kills any zombie processes
  // (stale Vite, half-started npm install) from the previous session before
  // we hand the WC to the new one. claimedSessionId is the source of truth
  // here because it's set BEFORE boot completes (unlike mountedSessionId,
  // which only flips after a successful mount).
  if (c.claimedSessionId && c.claimedSessionId !== sessionId) {
    await resetCache(c, `claimed-session change ${c.claimedSessionId} → ${sessionId}`);
  } else if (c.wc && c.mountedSessionId && c.mountedSessionId !== sessionId) {
    // Belt and suspenders — covers the rare case where claimedSessionId is
    // null but mountedSessionId got set (manual reset of claimedSessionId
    // without resetting mountedSessionId).
    await resetCache(c, `mounted-session change ${c.mountedSessionId} → ${sessionId}`);
  }

  // Claim this session immediately, before any async work. Any further
  // acquire calls for a different session will see the mismatch and reset.
  c.claimedSessionId = sessionId;

  if (c.wc) {
    const alive = await probeLiveness(c.wc);
    if (!alive) {
      await resetCache(c, "cached wc failed liveness probe");
      // resetCache cleared claimedSessionId — re-claim for this session
      c.claimedSessionId = sessionId;
    } else {
      const isFresh = c.mountedSessionId !== sessionId;
      console.log(`[wc] cache hit (isFresh=${isFresh}, session=${sessionId})`);
      return { wc: c.wc, isFresh };
    }
  }

  if (c.booting) {
    console.log("[wc] join in-flight boot");
    const wc = await c.booting;
    return { wc, isFresh: c.mountedSessionId !== sessionId };
  }

  console.log(`[wc] boot start (session=${sessionId})`);
  c.booting = (async () => {
    const { WebContainer } = await import("@webcontainer/api");
    const wc = await WebContainer.boot({ coep: "credentialless" });
    c.wc = wc;
    console.log("[wc] boot success");
    return wc;
  })();

  try {
    const wc = await c.booting;
    return { wc, isFresh: true };
  } catch (err) {
    console.error("[wc] boot failed:", err);
    // If boot failed, clear the claim so a retry starts fully fresh
    c.claimedSessionId = null;
    throw err;
  } finally {
    c.booting = null;
  }
}

export function markSessionMounted(sessionId: string): void {
  cache().mountedSessionId = sessionId;
}

export function cachePreviewUrl(url: string): void {
  cache().previewUrl = url;
}

export function getCachedPreviewUrl(): string | null {
  return cache().previewUrl;
}

export function setFullBootInProgress(val: boolean): void {
  cache().fullBootInProgress = val;
}

export function isFullBootInProgress(): boolean {
  return cache().fullBootInProgress;
}

export async function teardownSingleton(): Promise<void> {
  await resetCache(cache(), "explicit teardown");
}
