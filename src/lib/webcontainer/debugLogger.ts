class CircularBuffer<T> {
  private buf: T[] = [];
  constructor(private capacity: number) {}
  push(item: T) {
    if (this.buf.length >= this.capacity) this.buf.shift();
    this.buf.push(item);
  }
  toArray() { return [...this.buf]; }
  get length() { return this.buf.length; }
}

interface LogEntry { ts: number; level: string; args: string[] }
interface NetworkEntry { ts: number; method: string; url: string; status?: number; durationMs?: number; error?: string }
interface ErrorEntry { ts: number; msg: string; file?: string; line?: number; stack?: string; type?: string }
interface ActionEntry { ts: number; action: string; [key: string]: unknown }
interface ShellEntry { ts: number; stream: "stdout" | "stderr"; data: string; cmd?: string }

export class DebugLogger {
  private consoleLogs = new CircularBuffer<LogEntry>(200);
  private networkReqs = new CircularBuffer<NetworkEntry>(100);
  private jsErrors = new CircularBuffer<ErrorEntry>(50);
  private userActions = new CircularBuffer<ActionEntry>(100);
  private shellOutput = new CircularBuffer<ShellEntry>(200);

  private started = false;
  private originalConsole: Partial<Record<"error" | "warn" | "log" | "info", (...args: unknown[]) => void>> = {};
  private originalFetch: typeof fetch | null = null;

  start() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    this._interceptConsole();
    this._interceptFetch();
    this._interceptErrors();
  }

  private _safeSerialize(args: unknown[]): string[] {
    return args.map((a) => {
      if (typeof a === "string") return a;
      try { return JSON.stringify(a); } catch { return String(a); }
    });
  }

  private _interceptConsole() {
    const levels = ["error", "warn", "log", "info"] as const;
    for (const level of levels) {
      const orig = console[level].bind(console);
      this.originalConsole[level] = orig;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (console as any)[level] = (...args: unknown[]) => {
        orig(...args);
        this.consoleLogs.push({ ts: Date.now(), level, args: this._safeSerialize(args) });
      };
    }
  }

  private _interceptFetch() {
    if (typeof fetch === "undefined") return;
    this.originalFetch = fetch.bind(window);
    const logger = this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).fetch = async function (...args: Parameters<typeof fetch>) {
      const url = typeof args[0] === "string" ? args[0] : (args[0] instanceof URL ? args[0].href : String(args[0]));
      const method = (args[1]?.method ?? "GET").toUpperCase();
      const start = Date.now();
      try {
        const res = await logger.originalFetch!(...args);
        logger.networkReqs.push({ ts: start, method, url, status: res.status, durationMs: Date.now() - start });
        return res;
      } catch (err) {
        logger.networkReqs.push({ ts: start, method, url, error: String(err), durationMs: Date.now() - start });
        throw err;
      }
    };
  }

  private _interceptErrors() {
    window.addEventListener("error", (e) => {
      this.jsErrors.push({ ts: Date.now(), msg: e.message, file: e.filename, line: e.lineno, stack: e.error?.stack });
    });
    window.addEventListener("unhandledrejection", (e) => {
      this.jsErrors.push({ ts: Date.now(), msg: String(e.reason), type: "unhandledRejection" });
    });
  }

  stop() {
    if (!this.started || typeof window === "undefined") return;
    for (const level of ["error", "warn", "log", "info"] as const) {
      if (this.originalConsole[level]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (console as any)[level] = this.originalConsole[level];
      }
    }
    if (this.originalFetch) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).fetch = this.originalFetch;
    }
    this.started = false;
  }

  logAction(action: string, detail?: object) {
    this.userActions.push({ ts: Date.now(), action, ...detail });
  }

  logShell(stream: "stdout" | "stderr", data: string, cmd?: string) {
    this.shellOutput.push({ ts: Date.now(), stream, data: data.slice(0, 500), cmd });
  }

  private _systemInfo() {
    const nav = navigator;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mem = (performance as any).memory;
    return {
      userAgent: nav.userAgent,
      platform: nav.platform,
      language: nav.language,
      cookiesEnabled: nav.cookieEnabled,
      screen: `${screen.width}x${screen.height} @${window.devicePixelRatio}x`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      memory: mem ? {
        usedMB: Math.round(mem.usedJSHeapSize / 1024 / 1024),
        totalMB: Math.round(mem.totalJSHeapSize / 1024 / 1024),
        limitMB: Math.round(mem.jsHeapSizeLimit / 1024 / 1024),
      } : null,
      connection: (() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c = (navigator as any).connection;
        return c ? { type: c.effectiveType, downlink: c.downlink, rtt: c.rtt } : null;
      })(),
      sharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",
    };
  }

  private _fmt(ts: number): string {
    return new Date(ts).toISOString().slice(11, 23); // HH:MM:SS.mmm
  }

  generateReport(): string {
    const errors = this.jsErrors.toArray();
    const consoleErrors = this.consoleLogs.toArray().filter((l) => l.level === "error" || l.level === "warn");
    const network = this.networkReqs.toArray();
    const shell = this.shellOutput.toArray();
    const actions = this.userActions.toArray();

    const lines: string[] = [
      "═══════════════════════════════════════",
      " OpenSlides Debug Report",
      ` Generated: ${new Date().toISOString()}`,
      "═══════════════════════════════════════",
      "",
      "── SYSTEM ──────────────────────────────",
      JSON.stringify(this._systemInfo(), null, 2),
      "",
      `── JS ERRORS (${errors.length}) ─────────────────────`,
      ...errors.map((e) =>
        `[${this._fmt(e.ts)}] ${e.type ?? "error"}: ${e.msg}` +
        (e.file ? ` @ ${e.file}:${e.line}` : "") +
        (e.stack ? `\n${e.stack.split("\n").slice(1, 4).join("\n")}` : "")
      ),
      "",
      `── CONSOLE WARNINGS/ERRORS (${consoleErrors.length}) ──────`,
      ...consoleErrors.map((l) => `[${this._fmt(l.ts)}] [${l.level}] ${l.args.join(" ").slice(0, 300)}`),
      "",
      `── NETWORK (${network.length}) ──────────────────────`,
      ...network.map((n) =>
        `[${this._fmt(n.ts)}] ${n.method} ${n.url.slice(0, 120)} → ${n.status ?? "ERR"} (${n.durationMs}ms)${n.error ? " " + n.error : ""}`
      ),
      "",
      `── SHELL OUTPUT (${shell.length}) ───────────────────`,
      ...shell.map((s) =>
        `[${this._fmt(s.ts)}] [${s.stream}]${s.cmd ? " $ " + s.cmd : ""} ${s.data.replace(/\n/g, " ↵ ").slice(0, 200)}`
      ),
      "",
      `── USER ACTIONS (${actions.length}) ─────────────────`,
      ...actions.map((a) => {
        const { ts, action, ...rest } = a;
        return `[${this._fmt(ts)}] ${action}${Object.keys(rest).length ? " " + JSON.stringify(rest) : ""}`;
      }),
      "",
      "── RAW JSON ─────────────────────────────",
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        system: this._systemInfo(),
        jsErrors: errors,
        consoleWarningsErrors: consoleErrors,
        networkRequests: network,
        shellOutput: shell,
        userActions: actions,
      }, null, 2),
    ];

    return lines.join("\n");
  }

  download() {
    const blob = new Blob([this.generateReport()], { type: "text/plain" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `openslides-debug-${Date.now()}.txt`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

export const debugLogger = new DebugLogger();
