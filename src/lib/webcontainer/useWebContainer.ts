"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WebContainer as WebContainerType } from "@webcontainer/api";
import { filesRecordToFsTree } from "./fs-tree";
import {
  acquireForSession,
  cachePreviewUrl,
  getCachedPreviewUrl,
  markSessionMounted,
  teardownSingleton,
  setFullBootInProgress,
  isFullBootInProgress,
} from "./singleton";
import { EDIT_MODE_SCRIPT } from "./edit-mode-script";
import { PersistentShell } from "./persistent-shell";

export type WCState =
  | "idle"
  | "booting"
  | "mounting"
  | "installing"
  | "running"
  | "error"
  | "crashed";

export interface ShellOutputChunk {
  stream: "stdout" | "stderr";
  data: string;
  ts: number;
  cmd?: string;
}

export interface TerminalSession {
  /** Write data to the shell stdin (keypresses, paste, resize escape codes). */
  write: (data: string) => void;
  /** Resize the pseudo-terminal. */
  resize: (cols: number, rows: number) => void;
  /** Readable stream of output bytes — pipe into xterm.js Terminal.write(). */
  output: ReadableStream<string>;
  /** Resolves when the shell exits. */
  exit: Promise<number>;
}

export interface UseWebContainerResult {
  state: WCState;
  previewUrl: string | null;
  previewPorts: Map<number, string>;
  shellOutput: ShellOutputChunk[];
  unsupportedReason: string | null;
  errorOverlay: string | null;
  writeFile: (path: string, content: string) => Promise<void>;
  removeFile: (path: string) => Promise<void>;
  runCommand: (cmd: string, args: string[]) => Promise<{ exitCode: number; stderrTail: string; output: string }>;
  captureScreenshot: () => Promise<Blob | null>;
  iframeRef: React.MutableRefObject<HTMLIFrameElement | null>;
  /** Teardown the cached WebContainer and re-run the boot cycle. Use when the iframe fails to load or the dev server is stale. */
  reboot: () => void;
  /** Open an interactive shell session. Returns null if WebContainer isn't ready. */
  spawnTerminal: () => Promise<TerminalSession | null>;
}

const MAX_OUTPUT_LINES = 500;

/**
 * Manages a WebContainer instance for a website session.
 *
 * Lifecycle:
 *   idle → booting → mounting → installing → running
 *                                          ↘ error/crashed on failure
 *
 * On mount: if snapshotUrl present, fetch and wc.mount(bytes) to skip npm install.
 * Otherwise mount files, run npm install, upload snapshot on success, then npm run dev.
 *
 * Returns imperative helpers writeFile/removeFile/runCommand for SSE event handlers to apply.
 */
export function useWebContainer(
  sessionId: string,
  initialFiles: Record<string, string>,
  snapshotUrl: string | null,
  envVars: Record<string, string>,
  bootEnabled = true,
  templateName?: string,
): UseWebContainerResult {
  const [state, setState] = useState<WCState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewPorts, setPreviewPorts] = useState<Map<number, string>>(new Map());
  const [shellOutput, setShellOutput] = useState<ShellOutputChunk[]>([]);
  const [unsupportedReason, setUnsupportedReason] = useState<string | null>(null);
  const [errorOverlay, setErrorOverlay] = useState<string | null>(null);
  const [rebootVersion, setRebootVersion] = useState(0);

  const wcRef = useRef<WebContainerType | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const dirtyRef = useRef(false);
  const initialFilesRef = useRef(initialFiles);
  const envRef = useRef(envVars);
  // Dev-server auto-retry counter. Reset on each mount (ref per-hook-instance).
  // A healthy dev server runs forever, but npm registry flakes / transient boot
  // failures can kill it seconds after spawn. Cap at 2 retries before surfacing
  // crash state so the user sees the manual Retry button.
  const devRetryRef = useRef(0);
  // Serial queue for file writes — ensures all writes complete before any
  // subsequent runCommand (e.g. npm run dev) spawns Vite. Without this, Vite
  // starts before some fs.writeFile promises resolve → ENOENT on src/main.tsx etc.
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  // Serial queue for spawn commands — mirrors bolt.diy's #currentExecutionPromise.
  // Forces strict sequencing: `npm run dev` cannot start until `npm install` has
  // exited. Without this, two website_shell_command SSE events fired back-to-back
  // would race → Vite boots against half-installed node_modules → "dev server stopped".
  // For dev-server spawns, runCommand returns early (line ~570), so the queue
  // extends only until startup completes, not for the dev server's lifetime.
  const spawnQueueRef = useRef<Promise<void>>(Promise.resolve());
  // Persistent jsh shell — all agent shell commands type into this single process.
  // Mirrors bolt.diy's BoltShell pattern. Preserves shell state (cwd, env vars)
  // across commands and uses OSC escape codes to detect completion. Initialized
  // lazily after boot completes; null when not yet ready or after teardown.
  const shellRef = useRef<PersistentShell | null>(null);
  // Buffer for ops that arrive before WebContainer finishes booting.
  // Without this, early tool calls (create_file, run_shell_command) get silently
  // dropped because wcRef.current is null. Flushed in order after boot.
  const pendingOpsRef = useRef<Array<
    | { kind: "write"; path: string; content: string }
    | { kind: "remove"; path: string }
    | { kind: "run"; cmd: string; args: string[]; resolve: (r: { exitCode: number; stderrTail: string; output: string }) => void }
  >>([]);

  const appendOutput = useCallback((chunk: ShellOutputChunk) => {
    setShellOutput((prev) => {
      const next = [...prev, chunk];
      return next.length > MAX_OUTPUT_LINES ? next.slice(next.length - MAX_OUTPUT_LINES) : next;
    });
  }, []);

  // ─── Boot lifecycle ───────────────────────────────────────────────────
  useEffect(() => {
    // Gate: caller tells us when they're ready for boot (e.g. after session
    // fetch completes so initialFiles is actually populated). Avoid booting
    // empty; agent tool calls can't retroactively trigger auto-install.
    if (!bootEnabled) return;

    // Early unsupported check — Safari / mobile won't have SharedArrayBuffer
    if (typeof SharedArrayBuffer === "undefined") {
      setState("error");
      setUnsupportedReason(
        "SharedArrayBuffer unavailable — use a desktop Chromium-based browser (Chrome, Edge, Arc, or Firefox) to build websites.",
      );
      return;
    }

    // Refresh captured initial state when we actually boot (rather than at
    // React mount time when files may still be empty).
    initialFilesRef.current = initialFiles;
    envRef.current = envVars;

    let cancelled = false;
    let snapshotAbort: AbortController | null = null;

    (async () => {
      try {
        setState("booting");
        // Singleton dedupes boot across HMR, route remount, and async races.
        const { wc, isFresh } = await acquireForSession(sessionId);
        if (cancelled) return;
        wcRef.current = wc;

        wc.on("server-ready", (port, url) => {
          console.log(`[wc] server-ready port=${port} url=${url}`);
          setPreviewUrl(url);
          setPreviewPorts((prev) => { const n = new Map(prev); n.set(port, url); return n; });
          cachePreviewUrl(url);
          setFullBootInProgress(false);
          setState("running");
        });
        wc.on("error", (err) => {
          appendOutput({ stream: "stderr", data: `[webcontainer error] ${err.message}`, ts: Date.now() });
        });
        wc.on("port", (port, type, url) => {
          if (type === "open" && url) {
            console.log(`[wc] port open port=${port} url=${url}`);
            setPreviewPorts((prev) => { const n = new Map(prev); n.set(port, url); return n; });
            if (templateName === "expo") {
              // Metro never fires server-ready — port open is our signal
              setPreviewUrl(url);
              cachePreviewUrl(url);
              setState("running");
            }
          } else if (type === "close") {
            setPreviewPorts((prev) => { const n = new Map(prev); n.delete(port); return n; });
          }
        });

        if (!isFresh) {
          const cachedUrl = getCachedPreviewUrl();
          if (cachedUrl) {
            console.log(`[wc] restoring cached preview url: ${cachedUrl}`);
            setPreviewUrl(cachedUrl);
            setState("running");
          } else if (isFullBootInProgress()) {
            // A valid boot is still running (coldInstall + dev server start).
            // This re-entry is caused by React StrictMode's double-invoke or a
            // bootEnabled re-trigger — not a real crash. Stay in "installing"
            // so the UI shows progress; the server-ready listener registered
            // above will flip us to "running" when Vite fires it.
            console.log("[wc] cache hit, no url yet — full boot in progress, waiting for server-ready");
            setState("installing");
          } else {
            // No preview URL and no boot in progress. Could be:
            //   (a) Genuine crash — dev server ran and died (node_modules present)
            //   (b) Fresh agent-driven session — dev server hasn't been started yet,
            //       agent will fire `npm install` + `npm run dev` itself
            // Probe node_modules to distinguish so we don't surface a false "crashed" UI.
            let nodeModulesPresent = false;
            try {
              await wc.fs.readdir("node_modules");
              nodeModulesPresent = true;
            } catch {
              // absent
            }
            if (nodeModulesPresent) {
              console.warn("[wc] cache hit, node_modules present but no preview url — dev server crashed. Flipping to crashed for Retry.");
              setState("crashed");
            } else {
              console.log("[wc] cache hit, agent still scaffolding (no node_modules yet) — staying idle");
              setState("idle");
            }
          }
          // Re-init persistent shell on cache-hit too — the previous boot's
          // shell may have died (reboot, HMR teardown).
          if (!shellRef.current?.isReady()) {
            try {
              const newShell = new PersistentShell();
              await newShell.init(wc, {
                onDisplay: (chunk) => appendOutput({ stream: "stdout", data: chunk, ts: Date.now() }),
                env: envRef.current,
              });
              if (cancelled) void newShell.teardown();
              else shellRef.current = newShell;
            } catch (shellErr) {
              console.warn("[wc] persistent shell init (cache-hit) failed:", shellErr);
              shellRef.current = null;
            }
          }
          await flushPendingOps(wc);
          return;
        }

        setState("mounting");
        if (snapshotUrl) {
          snapshotAbort = new AbortController();
          try {
            const res = await fetch(snapshotUrl, { signal: snapshotAbort.signal });
            if (!res.ok) throw new Error(`snapshot fetch failed ${res.status}`);
            const bytes = await maybeDecompressSnapshot(new Uint8Array(await res.arrayBuffer()));
            await wc.mount(bytes);
            // Overlay latest source files — snapshot may be stale compared to
            // the user's latest tool-call edits persisted in websiteFilesJson.
            // Without this, reloads show the old version of the site.
            for (const [path, content] of Object.entries(initialFilesRef.current)) {
              try {
                // mkdir parent dir before writeFile (WC throws ENOENT otherwise)
                const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
                if (dir) {
                  try { await wc.fs.mkdir(dir, { recursive: true }); } catch { /* dir may exist */ }
                }
                await wc.fs.writeFile(path, content);
              } catch {
                // Some paths may be directories in the snapshot; ignore.
              }
            }
          } catch (snapErr) {
            console.warn("[wc] snapshot mount failed, falling back to cold path:", snapErr);
            await wc.mount(filesRecordToFsTree(initialFilesRef.current));
            if (Object.keys(initialFilesRef.current).includes("package.json")) {
              await coldInstall(wc);
            }
          }
        } else {
          await wc.mount(filesRecordToFsTree(initialFilesRef.current));
          if (Object.keys(initialFilesRef.current).includes("package.json")) {
            await coldInstall(wc);
          }
        }
        if (cancelled) return;

        // Inject the click-to-edit script into the WC filesystem. The script is
        // written in two locations so it's served at `/__opensl-edit.js`
        // regardless of stack:
        //   - Vite's `public/` is served from root → `/public/__opensl-edit.js` → `/__opensl-edit.js`
        //   - `serve` (static) serves from the project root → `/__opensl-edit.js` directly
        // Failures are non-fatal (e.g. fs permission issues); click-to-edit degrades silently.
        try {
          await wc.fs.mkdir("public", { recursive: true }).catch(() => { /* dir may exist */ });
          await wc.fs.writeFile("public/__opensl-edit.js", EDIT_MODE_SCRIPT);
          await wc.fs.writeFile("__opensl-edit.js", EDIT_MODE_SCRIPT);
        } catch (err) {
          console.warn("[wc] edit-mode script injection failed:", err);
        }

        // Init the persistent jsh shell — all subsequent agent shell commands
        // type into this single process (mirrors bolt.diy's BoltShell). Init
        // happens AFTER mount + edit-script injection so the shell sees a
        // populated filesystem, but BEFORE flushPendingOps so any "run" ops
        // queued during boot get the shell.
        try {
          const newShell = new PersistentShell();
          await newShell.init(wc, {
            onDisplay: (chunk) => {
              appendOutput({ stream: "stdout", data: chunk, ts: Date.now() });
            },
            env: envRef.current,
          });
          if (cancelled) {
            void newShell.teardown();
          } else {
            // Tear down any previous shell instance (e.g. on reboot)
            const prev = shellRef.current;
            shellRef.current = newShell;
            if (prev) void prev.teardown();
          }
        } catch (shellErr) {
          console.warn("[wc] persistent shell init failed (falling back to per-command spawn):", shellErr);
          shellRef.current = null;
        }

        // Flush pending ops FIRST — scaffold files from SSE arrive here as
        // pendingOps writes. package.json won't be on disk until after this.
        // Previously the dev-server check ran before flush, so it never found
        // package.json for template-scaffolded sessions → skipped install →
        // agent called npm run dev → vite not found → exit 127.
        await flushPendingOps(wc);
        markSessionMounted(sessionId);

        // Auto-start dev server ONLY on snapshot-reload paths (where node_modules
        // already exists from the snapshot). Fresh sessions are agent-driven:
        // the model fires `npm install` and `npm run dev` itself via run_shell_command
        // once it has finished writing all files. This mirrors bolt.diy's gating:
        // while the model is streaming, only file actions execute — shell/start
        // are deferred to the model. Auto-firing them here led to "dev server
        // stopped" errors because Vite tried to boot against a half-written tree.
        let pkgJson: string | null = null;
        try {
          pkgJson = await wc.fs.readFile("package.json", "utf-8");
        } catch {
          // no package.json on disk
        }
        let hasNodeModules = false;
        try {
          await wc.fs.readdir("node_modules");
          hasNodeModules = true;
        } catch {
          // absent
        }
        if (pkgJson && hasNodeModules) {
          // Snapshot reload — preview should come back up automatically.
          try {
            const parsed = JSON.parse(pkgJson) as { scripts?: Record<string, string> };
            if (parsed.scripts?.dev) {
              setFullBootInProgress(true);
              await startDevServer(wc);
              // Expo (Metro) never fires WebContainer's server-ready event —
              // flip to "running" here so the ExpoPreview panel is shown.
              if (templateName === "expo") {
                setState("running");
              }
            } else {
              console.warn("[wc] package.json has no dev script — preview won't start");
            }
          } catch (parseErr) {
            console.warn("[wc] package.json parse failed:", parseErr);
          }
        } else if (pkgJson) {
          console.log("[wc] node_modules absent — agent will drive npm install + npm run dev");
        } else {
          console.log("[wc] no package.json on disk — agent will scaffold first");
        }
        console.log(`[wc] session ${sessionId} fully mounted`);

        // If nothing was installed/spawned and no server is running yet, drop
        // the "mounting" status — otherwise the status strip is misleading.
        // server-ready (when it eventually fires) will flip us to "running".
        setState((prev) => (prev === "mounting" ? "idle" : prev));
      } catch (err) {
        if (cancelled) return;
        console.error("[wc] boot failed:", err);
        setFullBootInProgress(false);
        setState("error");
        setUnsupportedReason(String(err));
      }
    })();

    async function startDevServer(wc: WebContainerType) {
      console.log("[wc] spawning npm run dev");
      const devProc = await wc.spawn("npm", ["run", "dev"], { env: envRef.current });
      pipeOutput(devProc.output, "stdout", "npm run dev");
      // Watch for early exit — a healthy dev server runs forever. Flaky npm
      // registry / transient boot failures can kill it right after spawn,
      // before server-ready fires. Retry up to 2x before giving up and
      // surfacing crash state for manual Retry.
      void devProc.exit.then(async (code) => {
        if (cancelled) return;
        console.warn(`[wc] npm run dev exited code=${code}`);
        if (devRetryRef.current < 2) {
          devRetryRef.current++;
          console.warn(`[wc] auto-retrying dev server (attempt ${devRetryRef.current}/2)`);
          appendOutput({
            stream: "stderr",
            data: `[wc] dev server exited — auto-retrying (${devRetryRef.current}/2)`,
            ts: Date.now(),
          });
          await new Promise((r) => setTimeout(r, 500));
          if (cancelled) return;
          try {
            await startDevServer(wc);
          } catch (e) {
            console.error("[wc] retry spawn failed:", e);
            setFullBootInProgress(false);
            setState("crashed");
          }
        } else {
          setFullBootInProgress(false);
          setState("crashed");
        }
      });
    }

    async function flushPendingOps(wc: WebContainerType) {
      const pending = pendingOpsRef.current.splice(0);
      for (const op of pending) {
        if (cancelled) return;
        try {
          if (op.kind === "write") {
            // mkdir parent before writeFile — WC throws ENOENT otherwise
            const dir = op.path.includes("/") ? op.path.slice(0, op.path.lastIndexOf("/")) : "";
            if (dir) {
              try { await wc.fs.mkdir(dir, { recursive: true }); } catch { /* dir may exist */ }
            }
            await wc.fs.writeFile(op.path, op.content);
            dirtyRef.current = true;
          } else if (op.kind === "remove") {
            await wc.fs.rm(op.path).catch(() => { /* file may not exist */ });
            dirtyRef.current = true;
          } else if (op.kind === "run") {
            const proc = await wc.spawn(op.cmd, op.args, { env: envRef.current });
            let outputBuf = "";
            const MAX_OUTPUT = 50_000;
            proc.output.pipeTo(new WritableStream({
              write(chunk) {
                if (outputBuf.length < MAX_OUTPUT) outputBuf += chunk;
                appendOutput({ stream: "stdout", data: chunk, ts: Date.now(), cmd: `${op.cmd} ${op.args.join(" ")}` });
                if (chunk.includes("Internal server error:") || chunk.includes("Failed to compile")) {
                  setErrorOverlay(chunk.slice(0, 400));
                }
              },
            })).catch(() => { /* stream closed */ });
            const exitCode = await proc.exit;
            op.resolve({ exitCode, stderrTail: outputBuf.slice(-1200), output: outputBuf });
          }
        } catch (flushErr) {
          console.warn(`[wc] pending ${op.kind} failed:`, flushErr);
        }
      }
    }

    async function coldInstall(wc: WebContainerType) {
      setState("installing");
      const install = await wc.spawn("npm", ["install"], { env: envRef.current });
      pipeOutput(install.output, "stdout", "npm install");
      // 5-minute timeout — prevents the UI from sitting at "Installing…" forever
      // if the WebContainer hangs (slow network, npm registry issue, etc).
      const INSTALL_TIMEOUT_MS = 5 * 60 * 1000;
      let timedOut = false;
      const timeoutPromise = new Promise<number>((_, reject) =>
        setTimeout(() => { timedOut = true; reject(new Error("npm install timed out after 5 minutes")); }, INSTALL_TIMEOUT_MS),
      );
      let code: number;
      try {
        code = await Promise.race([install.exit, timeoutPromise]);
      } catch (err) {
        setState("error");
        appendOutput({ stream: "stderr", data: String(err), ts: Date.now() });
        throw err;
      }
      if (timedOut) return;
      if (code !== 0) {
        setState("error");
        appendOutput({ stream: "stderr", data: `npm install failed with exit ${code}`, ts: Date.now() });
        throw new Error(`npm install exit ${code}`);
      }
      dirtyRef.current = true;
      // CRITICAL: upload snapshot immediately so the next reload skips install.
      // Previously this was deferred to `visibilitychange → hidden` which does
      // NOT fire on a plain refresh — meaning reloads always did a fresh install.
      // This is the fix that takes reload time from ~30-60s to ~3-5s.
      void uploadSnapshotFromWC(wc, sessionId)
        .then(() => { dirtyRef.current = false; })
        .catch(() => { /* already logged in helper */ });
    }

    function pipeOutput(stream: ReadableStream<string>, type: "stdout" | "stderr", cmd: string) {
      stream.pipeTo(
        new WritableStream({
          write(chunk) {
            // Detect Vite's HMR error overlay in output (crude but effective — Vite prints failure lines)
            if (
              chunk.includes("Internal server error:") ||
              chunk.includes("Failed to compile") ||
              chunk.includes("Pre-transform error:") ||
              chunk.includes("Failed to load url") ||
              chunk.includes("Failed to resolve entry") ||
              chunk.includes("Failed to resolve import")
            ) {
              setErrorOverlay(chunk.slice(0, 400));
            }
            appendOutput({ stream: type, data: chunk, ts: Date.now(), cmd });
          },
        }),
      ).catch(() => { /* stream closed */ });
    }

    return () => {
      cancelled = true;
      snapshotAbort?.abort();
      // Teardown is owned by the singleton (on session change or tab close).
      // The persistent shell is process-bound so it dies with the WC; we still
      // null the ref so the next boot doesn't try to reuse a dead shell.
      const prevShell = shellRef.current;
      shellRef.current = null;
      if (prevShell) void prevShell.teardown().catch(() => { /* ignore */ });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, snapshotUrl, bootEnabled, rebootVersion, templateName]);

  const reboot = useCallback(() => {
    console.warn("[wc] reboot requested");
    setPreviewUrl(null);
    setState("idle");
    wcRef.current = null;
    void teardownSingleton().then(() => {
      setRebootVersion((v) => v + 1);
    });
  }, []);

  // ─── Imperative helpers (called by SSE event handlers in the page) ─────
  const writeFile = useCallback(async (path: string, content: string) => {
    if (!wcRef.current) {
      // Buffer until boot completes — don't silently drop
      pendingOpsRef.current.push({ kind: "write", path, content });
      return;
    }
    // Chain onto the write queue so runCommand always sees a fully-written FS.
    const write = writeQueueRef.current.then(async () => {
      // CRITICAL: WebContainer's fs.writeFile throws ENOENT if the parent
      // directory doesn't exist. Files like `src/main.tsx` fail silently if
      // `src/` hasn't been created yet. Mirrors bolt.diy's action-runner.ts:319.
      const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
      if (dir) {
        try {
          await wcRef.current!.fs.mkdir(dir, { recursive: true });
        } catch (err) {
          console.warn(`[wc] mkdir ${dir} failed (continuing):`, err);
        }
      }
      try {
        await wcRef.current!.fs.writeFile(path, content);
        dirtyRef.current = true;
      } catch (err) {
        // SURFACE the error — don't silently swallow. Old behavior dropped writes
        // for any path inside a missing directory and we lost half the project.
        console.error(`[wc] writeFile ${path} FAILED:`, err);
        appendOutput({
          stream: "stderr",
          data: `[wc] writeFile failed: ${path} — ${String(err).slice(0, 200)}`,
          ts: Date.now(),
        });
        throw err;
      }
    });
    writeQueueRef.current = write.catch(() => { /* keep queue alive on individual failures */ });
    await write;
  }, [appendOutput]);

  const removeFile = useCallback(async (path: string) => {
    if (!wcRef.current) {
      pendingOpsRef.current.push({ kind: "remove", path });
      return;
    }
    try {
      await wcRef.current.fs.rm(path);
      dirtyRef.current = true;
    } catch {
      // File might not exist yet — ignore
    }
  }, []);

  const runCommand = useCallback(
    async (cmd: string, args: string[]): Promise<{ exitCode: number; stderrTail: string; output: string }> => {
      if (!wcRef.current) {
        // Buffer: return a Promise that resolves when the op actually runs post-boot
        return new Promise<{ exitCode: number; stderrTail: string; output: string }>((resolve) => {
          pendingOpsRef.current.push({ kind: "run", cmd, args, resolve });
        });
      }

      // Chain onto the spawn queue — sequential execution mirrors bolt.diy's
      // #currentExecutionPromise (action-runner.ts:138). Without this, two
      // shell-command SSE events fired back-to-back race: `npm run dev` starts
      // before `npm install` finishes → Vite boots against half-installed
      // node_modules → "dev server stopped". The queue forces strict ordering
      // so the next command never starts until the previous has exited.
      const prevSpawn = spawnQueueRef.current;
      let releaseQueue: () => void = () => { /* set below */ };
      spawnQueueRef.current = new Promise<void>((resolve) => { releaseQueue = resolve; });

      try {
        await prevSpawn;
        // Drain any in-flight file writes before spawning. Vite resolves imports
        // synchronously at startup — if writeFile promises are still pending when
        // spawn() is called, Vite sees ENOENT on src/main.tsx, src/App.tsx, etc.
        await writeQueueRef.current;

        // Detect agent-initiated installs / dev-server spawns so we can reflect
        // them in the user-visible state. Before this, both ran invisibly — if
        // dev-server died (e.g. agent skipped `npm install`), state stayed "idle"
        // and the UI looked like a silently blank pane.
        const isInstall = cmd === "npm" && args[0] === "install";
        const isDevServer = cmd === "npm" && args[0] === "run" && args[1] === "dev";
        if (isInstall) {
          setState((prev) => (prev === "running" ? prev : "installing"));
        }

        // ── Pre-spawn disk probe for dev server ──────────────────────────
        // Logs the exact filesystem state Vite is about to scan. If Vite
        // can't find src/main.tsx, this probe will tell us whether the file
        // is genuinely missing on disk (silent SSE write loss) or present
        // (Vite-internal resolution issue).
        if (isDevServer) {
          try {
            const allFiles = await listAllFiles(wcRef.current!);
            const sorted = allFiles.sort();
            const critical = ["index.html", "package.json", "src/main.tsx", "src/App.tsx", "src/index.css", "vite.config.ts", "vite.config.js"];
            const present = critical.filter((f) => sorted.includes(f));
            const missing = critical.filter((f) => !sorted.includes(f));
            console.warn(`[wc-probe] Pre-dev-server probe: ${sorted.length} files on disk`);
            console.warn(`[wc-probe] Critical files PRESENT: ${present.join(", ") || "(none)"}`);
            if (missing.length) console.error(`[wc-probe] Critical files MISSING: ${missing.join(", ")}`);
            console.warn(`[wc-probe] Full file list:\n  ${sorted.slice(0, 200).join("\n  ")}${sorted.length > 200 ? `\n  ...and ${sorted.length - 200} more` : ""}`);
            appendOutput({
              stream: "stdout",
              data: `[wc-probe] ${sorted.length} files on disk. Critical present: ${present.join(", ")}${missing.length ? ` | MISSING: ${missing.join(", ")}` : ""}`,
              ts: Date.now(),
            });
            if (missing.length) {
              appendOutput({
                stream: "stderr",
                data: `[wc-probe] !!! Vite is about to start but ${missing.length} critical file(s) are NOT on disk: ${missing.join(", ")}`,
                ts: Date.now(),
              });
            }
          } catch (probeErr) {
            console.warn("[wc-probe] probe failed (non-fatal):", probeErr);
          }
        }

        // Build the full command string for the persistent shell. Args go
        // through unquoted because the agent only emits whitelisted commands
        // (npm/npx/node/grep/find/etc.) with simple args — no special chars
        // that would need shell escaping.
        const fullCommand = [cmd, ...args].join(" ");
        const shell = shellRef.current;

        // ── Persistent-shell path (preferred) ────────────────────────────
        // Routes the command into a single jsh process that all agent shell
        // commands share. Preserves cwd / env across commands and uses OSC
        // codes for synchronous exit detection (see persistent-shell.ts).
        if (shell?.isReady()) {
          if (isDevServer) {
            // Long-running: type the command, don't await its eventual exit.
            // The shell's own queueing will Ctrl+C this when the next command
            // arrives. We watch the in-flight promise for early failure.
            const spawnedAt = Date.now();
            const spawnedShell = shell;
            const { exit } = await shell.startCommand(fullCommand);
            void exit.then((result) => {
              // Stale-shell guard: if the shell was replaced (reboot) or
              // torn down, this exit is expected.
              if (shellRef.current !== spawnedShell) return;
              // exit code 130 = SIGINT (Ctrl+C from a subsequent command) —
              // not a crash, just normal interruption.
              if (result.exitCode === 130 || result.exitCode === 0) return;
              const runtime = Date.now() - spawnedAt;
              console.warn(`[wc] agent-run dev server exited code=${result.exitCode} after ${runtime}ms`);
              appendOutput({
                stream: "stderr",
                data: `[wc] dev server exited with code ${result.exitCode} after ${runtime}ms (a healthy dev server runs forever — this means startup failed, often because deps aren't installed)`,
                ts: Date.now(),
              });
              setState((prev) => (prev === "running" ? prev : "crashed"));
            });
            // 2s grace so Vite binds its port before the next command runs.
            // Mirrors bolt.diy's setTimeout(2000) after start actions.
            await new Promise((r) => setTimeout(r, 2000));
            return { exitCode: 0, stderrTail: "", output: "" };
          }

          // Normal command: type it, await full exit, return result.
          // The shell's executeCommand also surfaces output via the onDisplay
          // callback set during init (so the shell panel still shows progress).
          const result = await shell.executeCommand(fullCommand);
          // Detect Vite errors in the output and surface to the build-error UI
          if (
            result.output.includes("Internal server error:") ||
            result.output.includes("Failed to compile") ||
            result.output.includes("Pre-transform error:") ||
            result.output.includes("Failed to load url") ||
            result.output.includes("Failed to resolve entry") ||
            result.output.includes("Failed to resolve import")
          ) {
            setErrorOverlay(result.output.slice(-400));
          }
          if (isInstall) {
            if (result.exitCode === 0) {
              dirtyRef.current = true;
              const wc = wcRef.current;
              if (wc) {
                void uploadSnapshotFromWC(wc, sessionId)
                  .then(() => { dirtyRef.current = false; })
                  .catch(() => { /* already logged */ });
              }
              setState((prev) => (prev === "installing" ? "idle" : prev));
            } else {
              setState("error");
            }
          }
          return {
            exitCode: result.exitCode,
            stderrTail: result.output.slice(-1200),
            output: result.output,
          };
        }

        // ── Fallback: per-command spawn (only used if shell init failed) ─
        const proc = await wcRef.current!.spawn(cmd, args, { env: envRef.current });
        let outputBuf = "";
        const MAX_OUTPUT = 50_000;
        proc.output.pipeTo(
          new WritableStream({
            write(chunk) {
              if (outputBuf.length < MAX_OUTPUT) outputBuf += chunk;
              appendOutput({ stream: "stdout", data: chunk, ts: Date.now(), cmd: `${cmd} ${args.join(" ")}` });
              if (
                chunk.includes("Internal server error:") ||
                chunk.includes("Failed to compile") ||
                chunk.includes("Pre-transform error:") ||
                chunk.includes("Failed to load url") ||
                chunk.includes("Failed to resolve entry") ||
                chunk.includes("Failed to resolve import")
              ) {
                setErrorOverlay(chunk.slice(0, 400));
              }
            },
          }),
        ).catch(() => { /* stream closed */ });
        if (isDevServer) {
          const spawnedAt = Date.now();
          const spawnedWc = wcRef.current;
          void proc.exit.then((code) => {
            if (wcRef.current !== spawnedWc) return;
            const runtime = Date.now() - spawnedAt;
            console.warn(`[wc] agent-run dev server exited code=${code} after ${runtime}ms`);
            appendOutput({
              stream: "stderr",
              data: `[wc] dev server exited with code ${code} after ${runtime}ms (a healthy dev server runs forever — this means startup failed, often because deps aren't installed)`,
              ts: Date.now(),
            });
            setState((prev) => (prev === "running" ? prev : "crashed"));
          });
          await new Promise((r) => setTimeout(r, 2000));
          return { exitCode: 0, stderrTail: "", output: "" };
        }
        const exitCode = await proc.exit;
        if (isInstall) {
          if (exitCode === 0) {
            dirtyRef.current = true;
            const wc = wcRef.current;
            if (wc) {
              void uploadSnapshotFromWC(wc, sessionId)
                .then(() => { dirtyRef.current = false; })
                .catch(() => { /* already logged */ });
            }
            setState((prev) => (prev === "installing" ? "idle" : prev));
          } else {
            setState("error");
          }
        }
        return { exitCode, stderrTail: outputBuf.slice(-1200), output: outputBuf };
      } finally {
        // Release the queue so the next runCommand call can proceed.
        // For dev server: this fires on the early return after the 2s grace.
        // For other commands: this fires after proc.exit resolves.
        // For errors: still released so we don't deadlock the queue.
        releaseQueue();
      }
    },
    [appendOutput, sessionId],
  );

  // ─── Interactive terminal ─────────────────────────────────────────────────
  const spawnTerminal = useCallback(async (): Promise<TerminalSession | null> => {
    const wc = wcRef.current;
    if (!wc) return null;
    const proc = await wc.spawn("jsh", [], {
      terminal: { cols: 80, rows: 24 },
      env: envRef.current,
    });
    const writer = proc.input.getWriter();
    return {
      output: proc.output,
      exit: proc.exit,
      write(data: string) {
        writer.write(data).catch(() => { /* terminal closed */ });
      },
      resize(cols: number, rows: number) {
        proc.resize?.({ cols, rows });
      },
    };
  }, []);

  // ─── Screenshot — html-to-image on the iframe's contentDocument.body ───
  const captureScreenshot = useCallback(async (): Promise<Blob | null> => {
    if (!iframeRef.current) return null;
    try {
      const { toBlob } = await import("html-to-image");
      const doc = iframeRef.current.contentDocument;
      if (!doc?.body) return null;
      const blob = await toBlob(doc.body, { pixelRatio: 1 });
      return blob ?? null;
    } catch (err) {
      console.warn("[wc] screenshot capture failed:", err);
      return null;
    }
  }, []);

  // ─── Snapshot upload trigger on visibilitychange + tab unload ──────────
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden" && dirtyRef.current && wcRef.current) {
        void uploadSnapshotFromWC(wcRef.current, sessionId).then(() => {
          dirtyRef.current = false;
        });
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [sessionId]);

  return {
    state,
    previewUrl,
    previewPorts,
    shellOutput,
    unsupportedReason,
    errorOverlay,
    writeFile,
    removeFile,
    runCommand,
    captureScreenshot,
    iframeRef,
    reboot,
    spawnTerminal,
  };
}

// Recursively list all files in the WC filesystem (skipping node_modules / .git
// to keep output bounded). Used by the pre-dev-server probe to surface what's
// actually on disk vs what we think should be there.
async function listAllFiles(wc: WebContainerType, dir = ".", acc: string[] = []): Promise<string[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries = await (wc.fs as any).readdir(dir, { withFileTypes: true }) as Array<{ name: string; isDirectory(): boolean }>;
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      const path = dir === "." ? entry.name : `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        await listAllFiles(wc, path, acc);
      } else {
        acc.push(path);
      }
    }
  } catch {
    // Directory may not exist yet — ignore
  }
  return acc;
}

async function uploadSnapshotFromWC(wc: WebContainerType, sessionId: string): Promise<void> {
  try {
    // Probe liveness before export — wc.export() crashes the WASM runtime if the
    // container is mid-teardown or in a degraded state (RuntimeError: unreachable).
    await wc.fs.readdir("/");
    const exported = await wc.export("/", { format: "binary" });
    const rawBlob = new Blob([exported as unknown as BlobPart], { type: "application/octet-stream" });

    // Gzip the export before uploading. WebContainer's binary format is a
    // tar-like stream of text files (source + JSON) that compresses 3-5x. The
    // previous raw upload blew past Supabase Storage's per-object size cap
    // (HTTP 413 from the bucket), so reload-skip-install never worked. Use
    // the browser's native CompressionStream — no dep.
    let uploadBlob: Blob = rawBlob;
    let encoding = "raw";
    if (typeof CompressionStream !== "undefined") {
      try {
        const gzipped = await new Response(
          rawBlob.stream().pipeThrough(new CompressionStream("gzip")),
        ).blob();
        uploadBlob = new Blob([gzipped], { type: "application/gzip" });
        encoding = "gzip";
        console.log(`[wc] snapshot gzipped ${rawBlob.size} → ${uploadBlob.size} bytes (${((1 - uploadBlob.size / rawBlob.size) * 100).toFixed(1)}% smaller)`);
      } catch (gzErr) {
        console.warn("[wc] snapshot gzip failed, uploading raw:", gzErr);
      }
    }

    const res = await fetch(`/api/website-snapshot?sessionId=${encodeURIComponent(sessionId)}`, {
      method: "POST",
      body: uploadBlob,
      headers: { "Content-Type": uploadBlob.type, "x-snapshot-encoding": encoding },
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "unknown");
      console.warn(`[wc] snapshot upload failed HTTP ${res.status}: ${errBody.slice(0, 300)}`);
    } else {
      const body = await res.json().catch(() => null) as { ok?: boolean; skipped?: boolean; bytes?: number } | null;
      if (body?.skipped) {
        console.info(`[wc] snapshot skipped (${((body.bytes ?? 0) / 1024 / 1024).toFixed(1)}MB exceeds storage limit — npm install will run on next reload)`);
      }
    }
  } catch (err) {
    // Silently drop WASM internal crashes — these happen when the container is
    // mid-teardown or in a degraded state. Not actionable, not user-visible.
    if (err instanceof Error && err.message.includes("unreachable")) return;
    console.warn("[wc] snapshot upload failed:", err);
  }
}

// Legacy snapshots (pre-gzip) are uncompressed bytes. New snapshots start with
// gzip magic `0x1f 0x8b`. Sniff and decompress only when needed so both old
// and new sessions keep working.
async function maybeDecompressSnapshot(raw: Uint8Array): Promise<Uint8Array> {
  if (raw.length < 2 || raw[0] !== 0x1f || raw[1] !== 0x8b) return raw;
  if (typeof DecompressionStream === "undefined") return raw;
  try {
    const decoded = await new Response(
      new Blob([raw as unknown as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip")),
    ).arrayBuffer();
    console.log(`[wc] snapshot ungzipped ${raw.byteLength} → ${decoded.byteLength} bytes`);
    return new Uint8Array(decoded);
  } catch (err) {
    console.warn("[wc] snapshot ungzip failed, using raw bytes:", err);
    return raw;
  }
}
