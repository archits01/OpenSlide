"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckmarkCircle01Icon, LinkSquare01Icon } from "@hugeicons/core-free-icons";

interface GitHubDeployModalProps {
  open: boolean;
  onClose: () => void;
  sessionTitle: string;
  sessionId: string;
  files: Record<string, string>;
  /** If GitHub is not connected, call this to trigger the connect flow */
  onNeedsConnect: () => void;
}

type Stage = "idle" | "pushing" | "done" | "error";

function sanitize(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]|[-.]$/g, "")
    .slice(0, 100) || "my-openslides-app";
}

const STORAGE_KEY = (sessionId: string) => `openslides-gh-repo-${sessionId}`;

export function GitHubDeployModal({ open, onClose, sessionTitle, sessionId, files, onNeedsConnect }: GitHubDeployModalProps) {
  const [repoName, setRepoName] = useState(() => sanitize(sessionTitle));
  const [isPrivate, setIsPrivate] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check localStorage for a prior deploy on this session
  useEffect(() => {
    if (!open) return;
    const stored = localStorage.getItem(STORAGE_KEY(sessionId));
    if (stored) {
      try {
        const data = JSON.parse(stored) as { repoUrl: string; repoName: string };
        setRepoUrl(data.repoUrl);
        setRepoName(data.repoName);
        setIsReturning(true);
        setStage("done");
      } catch { /* ignore */ }
    } else {
      setRepoName(sanitize(sessionTitle));
      setStage("idle");
      setRepoUrl(null);
      setIsReturning(false);
    }
  }, [open, sessionId, sessionTitle]);

  // Focus input on open
  useEffect(() => {
    if (open && stage === "idle") {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, stage]);

  async function handlePush() {
    setStage("pushing");
    setError(null);
    try {
      const commitMessage = isReturning ? "Update from OpenSlides" : "Initial commit from OpenSlides";
      const res = await fetch("/api/deploy/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoName, isPrivate, files, commitMessage }),
      });

      if (res.status === 403) {
        const body = await res.json() as { needs_connection?: boolean };
        if (body.needs_connection) {
          onClose();
          onNeedsConnect();
          return;
        }
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Push failed (${res.status})`);
      }

      const data = await res.json() as { repoUrl: string; repoName: string; fileCount: number };
      setRepoUrl(data.repoUrl);
      setStage("done");
      setIsReturning(false);
      localStorage.setItem(STORAGE_KEY(sessionId), JSON.stringify({ repoUrl: data.repoUrl, repoName: data.repoName }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Push failed");
      setStage("error");
    }
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY(sessionId));
    setStage("idle");
    setRepoUrl(null);
    setIsReturning(false);
    setRepoName(sanitize(sessionTitle));
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={stage === "pushing" ? undefined : onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 201, width: 420,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 16,
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
                  Push to GitHub
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text3)" }}>
                  {isReturning ? "Update your existing repository" : "Create a new repository from your project"}
                </p>
              </div>
              {stage !== "pushing" && (
                <button
                  onClick={onClose}
                  style={{
                    width: 28, height: 28, borderRadius: 7, border: "none",
                    background: "transparent", cursor: "pointer", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text3)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--text)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; }}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: "16px 20px 20px" }}>

              {/* Done state */}
              {stage === "done" && repoUrl && (
                <div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 14px", borderRadius: 10,
                    background: "var(--green-soft)", border: "1px solid rgba(22,163,74,0.2)",
                    marginBottom: 14,
                  }}>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: "var(--green)", flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: 13, color: "var(--green)", fontWeight: 500 }}>
                      {isReturning ? "Repository pushed successfully" : "Repository created and pushed"}
                    </p>
                  </div>

                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 12px", borderRadius: 9,
                      border: "1px solid var(--border)", background: "var(--bg2)",
                      textDecoration: "none", marginBottom: 12,
                      transition: "border-color 100ms",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--text2)", flexShrink: 0 }}>
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span style={{ fontSize: 12.5, color: "var(--text)", fontFamily: "var(--font-geist-mono, monospace)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {repoUrl.replace("https://", "")}
                    </span>
                    <HugeiconsIcon icon={LinkSquare01Icon} size={13} style={{ color: "var(--text3)", flexShrink: 0 }} />
                  </a>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleReset}
                      style={{
                        flex: 1, height: 34, borderRadius: 8,
                        border: "1px solid var(--border-strong)",
                        background: "var(--bg)", color: "var(--text2)",
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        letterSpacing: "-0.01em",
                        transition: "border-color 100ms, color 100ms",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text2)"; }}
                    >
                      Push to new repo
                    </button>
                    <button
                      onClick={handlePush}
                      style={{
                        flex: 1, height: 34, borderRadius: 8,
                        border: "none", background: "var(--accent)", color: "white",
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        letterSpacing: "-0.01em",
                        transition: "background 100ms",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
                    >
                      Push update
                    </button>
                  </div>
                </div>
              )}

              {/* Idle / error state */}
              {(stage === "idle" || stage === "error") && (
                <>
                  {/* Repo name */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text2)", marginBottom: 6 }}>
                      Repository name
                    </label>
                    <input
                      ref={inputRef}
                      value={repoName}
                      onChange={(e) => setRepoName(sanitize(e.target.value))}
                      placeholder="my-awesome-app"
                      style={{
                        width: "100%", height: 36, borderRadius: 8,
                        border: "1px solid var(--border-strong)",
                        background: "var(--bg2)", color: "var(--text)",
                        fontSize: 13, padding: "0 10px",
                        fontFamily: "var(--font-geist-mono, monospace)",
                        outline: "none", boxSizing: "border-box",
                        transition: "border-color 100ms",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                    />
                  </div>

                  {/* Visibility */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                        {isPrivate ? "Private" : "Public"} repository
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--text3)" }}>
                        {isPrivate ? "Only you can see this" : "Anyone can view this repository"}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsPrivate((p) => !p)}
                      style={{
                        width: 40, height: 22, borderRadius: 999,
                        border: "none", cursor: "pointer", flexShrink: 0,
                        background: isPrivate ? "var(--accent)" : "var(--border-strong)",
                        transition: "background 150ms", position: "relative",
                        padding: 0,
                      }}
                    >
                      <span style={{
                        position: "absolute", top: 3, width: 16, height: 16, borderRadius: "50%",
                        background: "white", transition: "left 150ms",
                        left: isPrivate ? 21 : 3,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }} />
                    </button>
                  </div>

                  {/* Error */}
                  {stage === "error" && error && (
                    <div style={{
                      padding: "10px 12px", borderRadius: 8,
                      background: "var(--red-soft)", border: "1px solid rgba(220,38,38,0.2)",
                      marginBottom: 12,
                    }}>
                      <p style={{ margin: 0, fontSize: 12.5, color: "var(--red)" }}>{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handlePush}
                    disabled={!repoName}
                    style={{
                      width: "100%", height: 36, borderRadius: 8,
                      border: "none", background: repoName ? "var(--accent)" : "var(--border)",
                      color: repoName ? "white" : "var(--text3)",
                      fontSize: 13.5, fontWeight: 500, cursor: repoName ? "pointer" : "default",
                      letterSpacing: "-0.01em",
                      transition: "background 100ms",
                    }}
                    onMouseEnter={(e) => { if (repoName) e.currentTarget.style.background = "var(--accent-hover)"; }}
                    onMouseLeave={(e) => { if (repoName) e.currentTarget.style.background = "var(--accent)"; }}
                  >
                    Push to GitHub
                  </button>
                </>
              )}

              {/* Pushing state */}
              {stage === "pushing" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0 4px" }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="11" stroke="var(--accent)" strokeWidth="2.5" strokeOpacity="0.2" />
                    <path d="M14 3a11 11 0 0 1 11 11" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0 14 14" to="360 14 14" dur="0.75s" repeatCount="indefinite" />
                    </path>
                  </svg>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>
                    Pushing to GitHub…
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text3)" }}>
                    Creating commit and updating repository
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
