"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

interface GitHubImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: (files: Record<string, string>, repoName: string) => void;
}

type Stage = "idle" | "fetching" | "done" | "error";

export function GitHubImportModal({ open, onClose, onImported }: GitHubImportModalProps) {
  const [url, setUrl] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ fileCount: number; repoName: string } | null>(null);

  function reset() {
    setStage("idle");
    setError(null);
    setResult(null);
  }

  async function handleImport() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setStage("fetching");
    setError(null);
    try {
      const res = await fetch("/api/import/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const body = await res.json() as { files?: Record<string, string>; fileCount?: number; repoName?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? `Import failed (${res.status})`);
      const files = body.files ?? {};
      const repoName = body.repoName ?? "repo";
      const fileCount = body.fileCount ?? Object.keys(files).length;
      setResult({ fileCount, repoName });
      setStage("done");
      onImported(files, repoName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStage("error");
    }
  }

  function handleClose() {
    if (stage === "fetching") return;
    reset();
    setUrl("");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            style={{
              position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              zIndex: 201, width: 440, background: "var(--bg)",
              border: "1px solid var(--border)", borderRadius: 16,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 0 20px" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "var(--bg2)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--text)" }}>
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
                  Import from GitHub
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text3)" }}>
                  {stage === "done" ? `${result?.fileCount} files imported` : "Paste a public GitHub repo URL"}
                </p>
              </div>
              {stage !== "fetching" && (
                <button onClick={handleClose} style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--text)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; }}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: "16px 20px 20px" }}>

              {stage === "done" ? (
                <>
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--green-soft)", border: "1px solid rgba(22,163,74,0.2)", marginBottom: 14 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--green)", fontWeight: 500 }}>
                      Imported {result?.fileCount} files from {result?.repoName}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--green)", opacity: 0.8 }}>
                      Files are now in your project. The agent can build on top of them.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={reset} style={{ flex: 1, height: 34, borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--bg)", color: "var(--text2)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                      Import another
                    </button>
                    <button onClick={handleClose} style={{ flex: 1, height: 34, borderRadius: 8, border: "none", background: "#000", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                      Done
                    </button>
                  </div>
                </>
              ) : stage === "fetching" ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0 4px" }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="11" stroke="#000" strokeWidth="2.5" strokeOpacity="0.15" />
                    <path d="M14 3a11 11 0 0 1 11 11" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0 14 14" to="360 14 14" dur="0.75s" repeatCount="indefinite" />
                    </path>
                  </svg>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>Fetching repository…</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text3)" }}>Downloading and extracting files</p>
                </div>
              ) : (
                <>
                  {stage === "error" && (
                    <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--red-soft)", border: "1px solid rgba(220,38,38,0.2)", marginBottom: 12 }}>
                      <p style={{ margin: 0, fontSize: 12.5, color: "var(--red)" }}>{error}</p>
                    </div>
                  )}
                  <div style={{ marginBottom: 12 }}>
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") void handleImport(); }}
                      placeholder="https://github.com/owner/repo"
                      style={{
                        width: "100%", height: 36, padding: "0 12px",
                        borderRadius: 8, border: "1px solid var(--border-strong)",
                        background: "var(--bg2)", color: "var(--text)",
                        fontSize: 13, outline: "none", boxSizing: "border-box",
                        fontFamily: "var(--font-mono, ui-monospace, monospace)",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                      autoFocus
                    />
                  </div>
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--bg2)", border: "1px solid var(--border)", marginBottom: 14 }}>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>
                      Only <strong style={{ color: "var(--text2)" }}>public</strong> repositories are supported. Large files and binaries are skipped automatically.
                    </p>
                  </div>
                  <button
                    onClick={() => void handleImport()}
                    disabled={!url.trim()}
                    style={{
                      width: "100%", height: 36, borderRadius: 8, border: "none",
                      background: url.trim() ? "#000" : "var(--bg2)",
                      color: url.trim() ? "white" : "var(--text3)",
                      fontSize: 13.5, fontWeight: 500, cursor: url.trim() ? "pointer" : "default",
                      letterSpacing: "-0.01em", transition: "opacity 100ms",
                    }}
                    onMouseEnter={(e) => { if (url.trim()) e.currentTarget.style.opacity = "0.85"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                  >
                    Import repository
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
