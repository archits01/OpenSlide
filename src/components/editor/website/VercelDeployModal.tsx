"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckmarkCircle01Icon, LinkSquare01Icon } from "@hugeicons/core-free-icons";

interface VercelDeployModalProps {
  open: boolean;
  onClose: () => void;
  sessionTitle: string;
  sessionId: string;
  files: Record<string, string>;
  initialPublishedUrl?: string | null;
  onPublished?: (url: string) => void;
}

type Stage = "idle" | "deploying" | "done" | "error";

const STORAGE_KEY = (sessionId: string) => `openslides-vercel-deploy-${sessionId}`;

export function VercelDeployModal({ open, onClose, sessionTitle, sessionId, files, initialPublishedUrl, onPublished }: VercelDeployModalProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Preparing deployment…");

  // Check for prior deploy — prefer DB-persisted URL over localStorage
  useEffect(() => {
    if (!open) return;
    if (initialPublishedUrl) {
      setDeployUrl(initialPublishedUrl);
      setStage("done");
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY(sessionId));
    if (stored) {
      try {
        const data = JSON.parse(stored) as { url: string };
        setDeployUrl(data.url);
        setStage("done");
      } catch { /* ignore */ }
    } else {
      setStage("idle");
      setDeployUrl(null);
    }
  }, [open, sessionId, initialPublishedUrl]);

  async function handleDeploy() {
    setStage("deploying");
    setError(null);

    const steps = [
      { text: "Preparing deployment…", delay: 0 },
      { text: "Installing dependencies…", delay: 8000 },
      { text: "Building your app…", delay: 20000 },
      { text: "Almost live…", delay: 50000 },
    ];
    steps.forEach(({ text, delay }) => setTimeout(() => setStatusText(text), delay));

    try {
      const res = await fetch("/api/deploy/vercel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, projectName: sessionTitle, sessionId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Deploy failed (${res.status})`);
      }

      const data = await res.json() as { url: string };
      setDeployUrl(data.url);
      setStage("done");
      localStorage.setItem(STORAGE_KEY(sessionId), JSON.stringify({ url: data.url }));
      onPublished?.(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deploy failed");
      setStage("error");
    }
  }

  function handleRedeploy() {
    localStorage.removeItem(STORAGE_KEY(sessionId));
    setDeployUrl(null);
    setStage("idle");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={stage === "deploying" ? undefined : onClose}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            style={{
              position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              zIndex: 201, width: 400, background: "var(--bg)",
              border: "1px solid var(--border)", borderRadius: 16,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 0 20px" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "#000", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 76 65" fill="white">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
                  Deploy to Vercel
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text3)" }}>
                  {stage === "done" ? "Your app is live" : "Get a live URL in ~1 minute"}
                </p>
              </div>
              {stage !== "deploying" && (
                <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--text)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; }}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: "16px 20px 20px" }}>

              {/* Idle */}
              {stage === "idle" && (
                <>
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg2)", border: "1px solid var(--border)", marginBottom: 16 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>
                      Your project will be built and deployed automatically. You&apos;ll get a live <strong style={{ color: "var(--text)" }}>vercel.app</strong> URL.
                    </p>
                  </div>
                  <button onClick={handleDeploy} style={{ width: "100%", height: 36, borderRadius: 8, border: "none", background: "#000", color: "white", fontSize: 13.5, fontWeight: 500, cursor: "pointer", letterSpacing: "-0.01em", transition: "opacity 100ms" }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                  >
                    Deploy now
                  </button>
                </>
              )}

              {/* Deploying */}
              {stage === "deploying" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0 4px" }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="11" stroke="#000" strokeWidth="2.5" strokeOpacity="0.15" />
                    <path d="M14 3a11 11 0 0 1 11 11" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0 14 14" to="360 14 14" dur="0.75s" repeatCount="indefinite" />
                    </path>
                  </svg>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>{statusText}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text3)" }}>This usually takes 30–90 seconds</p>
                </div>
              )}

              {/* Done */}
              {stage === "done" && deployUrl && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, background: "var(--green-soft)", border: "1px solid rgba(22,163,74,0.2)", marginBottom: 14 }}>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: "var(--green)", flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: 13, color: "var(--green)", fontWeight: 500 }}>Your app is live</p>
                  </div>
                  <a href={deployUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg2)", textDecoration: "none", marginBottom: 12, transition: "border-color 100ms" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                  >
                    <svg width="14" height="12" viewBox="0 0 76 65" fill="currentColor" style={{ color: "var(--text2)", flexShrink: 0 }}>
                      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                    </svg>
                    <span style={{ fontSize: 12.5, color: "var(--text)", fontFamily: "var(--font-geist-mono, monospace)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {deployUrl.replace("https://", "")}
                    </span>
                    <HugeiconsIcon icon={LinkSquare01Icon} size={13} style={{ color: "var(--text3)", flexShrink: 0 }} />
                  </a>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleRedeploy} style={{ flex: 1, height: 34, borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--bg)", color: "var(--text2)", fontSize: 13, fontWeight: 500, cursor: "pointer", letterSpacing: "-0.01em", transition: "border-color 100ms, color 100ms" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text2)"; }}
                    >
                      New deploy
                    </button>
                    <button onClick={handleDeploy} style={{ flex: 1, height: 34, borderRadius: 8, border: "none", background: "#000", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer", letterSpacing: "-0.01em", transition: "opacity 100ms" }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                    >
                      Redeploy
                    </button>
                  </div>
                </>
              )}

              {/* Error */}
              {stage === "error" && (
                <>
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--red-soft)", border: "1px solid rgba(220,38,38,0.2)", marginBottom: 12 }}>
                    <p style={{ margin: 0, fontSize: 12.5, color: "var(--red)" }}>{error}</p>
                  </div>
                  <button onClick={handleDeploy} style={{ width: "100%", height: 36, borderRadius: 8, border: "none", background: "#000", color: "white", fontSize: 13.5, fontWeight: 500, cursor: "pointer", letterSpacing: "-0.01em" }}>
                    Try again
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
