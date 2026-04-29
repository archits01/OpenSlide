"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { TerminalSession } from "@/lib/webcontainer/useWebContainer";

interface TerminalPanelProps {
  spawnTerminal: () => Promise<TerminalSession | null>;
  isReady: boolean;
}

export function TerminalPanel({ spawnTerminal, isReady }: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<import("@xterm/xterm").Terminal | null>(null);
  const fitRef = useRef<import("@xterm/addon-fit").FitAddon | null>(null);
  const sessionRef = useRef<TerminalSession | null>(null);
  const [status, setStatus] = useState<"waiting" | "connecting" | "ready" | "exited">("waiting");
  const mountedRef = useRef(false);

  const connect = useCallback(async () => {
    if (!containerRef.current || sessionRef.current) return;
    setStatus("connecting");

    const [{ Terminal }, { FitAddon }] = await Promise.all([
      import("@xterm/xterm"),
      import("@xterm/addon-fit"),
    ]);

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: "var(--font-mono, 'Menlo', 'Monaco', 'Cascadia Code', monospace)",
      lineHeight: 1.4,
      scrollback: 1000,
      theme: {
        background: "#0f0f11",
        foreground: "#e8e8e8",
        cursor: "#9b9de8",
        selectionBackground: "rgba(155,157,232,0.25)",
        black: "#1e1e2e",
        red: "#f38ba8",
        green: "#a6e3a1",
        yellow: "#f9e2af",
        blue: "#89b4fa",
        magenta: "#cba6f7",
        cyan: "#89dceb",
        white: "#cdd6f4",
        brightBlack: "#45475a",
        brightRed: "#f38ba8",
        brightGreen: "#a6e3a1",
        brightYellow: "#f9e2af",
        brightBlue: "#89b4fa",
        brightMagenta: "#cba6f7",
        brightCyan: "#89dceb",
        brightWhite: "#cdd6f4",
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();

    termRef.current = term;
    fitRef.current = fit;

    const session = await spawnTerminal();
    if (!session || !mountedRef.current) {
      term.dispose();
      termRef.current = null;
      setStatus("waiting");
      return;
    }
    sessionRef.current = session;
    setStatus("ready");

    // Pipe shell output → terminal
    const reader = session.output.getReader();
    (async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        term.write(value);
      }
      if (mountedRef.current) setStatus("exited");
    })();

    // Pipe terminal input → shell stdin
    term.onData((data) => {
      session.write(data);
    });

    // Auto-resize
    const observer = new ResizeObserver(() => {
      try { fit.fit(); } catch { /* ignore */ }
      if (sessionRef.current) {
        sessionRef.current.resize(term.cols, term.rows);
      }
    });
    if (containerRef.current.parentElement) {
      observer.observe(containerRef.current.parentElement);
    }

    // Cleanup on exit
    session.exit.then(() => {
      if (mountedRef.current) setStatus("exited");
      observer.disconnect();
    });
  }, [spawnTerminal]);

  // Auto-connect once ready
  useEffect(() => {
    mountedRef.current = true;
    if (isReady) connect();
    return () => {
      mountedRef.current = false;
      termRef.current?.dispose();
      termRef.current = null;
      fitRef.current = null;
      sessionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0f0f11",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Status bar */}
      <div
        style={{
          height: 28,
          display: "flex",
          alignItems: "center",
          paddingLeft: 12,
          gap: 6,
          background: "#1a1a1f",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
            background: status === "ready" ? "#a6e3a1" : status === "exited" ? "#f38ba8" : status === "connecting" ? "#f9e2af" : "rgba(255,255,255,0.2)",
          }}
        />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono, monospace)" }}>
          {status === "waiting" ? "Waiting for sandbox…" : status === "connecting" ? "Connecting…" : status === "ready" ? "jsh" : "Session ended"}
        </span>
        {status === "exited" && (
          <button
            onClick={() => {
              setStatus("waiting");
              sessionRef.current = null;
              termRef.current?.dispose();
              termRef.current = null;
              fitRef.current = null;
              connect();
            }}
            style={{
              marginLeft: "auto", marginRight: 8,
              fontSize: 10, color: "rgba(255,255,255,0.4)",
              background: "transparent", border: "none", cursor: "pointer",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            Restart ↺
          </button>
        )}
      </div>

      {/* xterm container */}
      <div
        ref={containerRef}
        style={{ flex: 1, padding: "6px 4px", overflow: "hidden", minHeight: 0 }}
      />
    </div>
  );
}
