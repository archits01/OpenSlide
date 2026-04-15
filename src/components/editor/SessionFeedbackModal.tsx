"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

const CATEGORIES = [
  { code: "design",       label: "Great design" },
  { code: "content",      label: "Good content" },
  { code: "fast",         label: "Fast generation" },
  { code: "layout",       label: "Layout issues" },
  { code: "wrong_style",  label: "Wrong style" },
  { code: "too_generic",  label: "Too generic" },
  { code: "bugs",         label: "Visual bugs" },
] as const;

const STAR_LABELS = ["Terrible", "Bad", "OK", "Good", "Excellent"];

interface SessionFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  sessionId?: string;
  promptSnapshot?: string;
  slideCount?: number;
  sessionType?: string;
  theme?: string;
  triggerSource: string;
}

export function SessionFeedbackModal({
  open,
  onClose,
  sessionId,
  promptSnapshot,
  slideCount,
  sessionType,
  theme,
  triggerSource,
}: SessionFeedbackModalProps) {
  const [rating, setRating]           = useState(0);
  const [hovered, setHovered]         = useState(0);
  const [categories, setCategories]   = useState<string[]>([]);
  const [freeText, setFreeText]       = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const backdropRef                   = useRef<HTMLDivElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setRating(0);
      setHovered(0);
      setCategories([]);
      setFreeText("");
      setSubmitted(false);
    }
  }, [open]);

  // Dismiss on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function toggleCategory(code: string) {
    setCategories((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  async function handleSubmit() {
    if (!rating || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/feedback/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId:      sessionId ?? null,
          rating,
          categories,
          freeText:       freeText.trim() || null,
          promptSnapshot: promptSnapshot ?? null,
          slideCount:     slideCount ?? 0,
          sessionType:    sessionType ?? "slides",
          theme:          theme ?? null,
          triggerSource,
        }),
      });
      setSubmitted(true);
      setTimeout(onClose, 1200);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hovered || rating;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={backdropRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.35)",
              zIndex: 900,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            style={{
              position: "fixed",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 420,
              maxWidth: "calc(100vw - 32px)",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-xl)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)",
              zIndex: 901,
              overflow: "hidden",
            }}
          >
            {submitted ? (
              /* Success state */
              <div style={{ padding: "40px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>
                  Thanks for the feedback!
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text3)" }}>
                  It helps us make OpenSlides better.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 0" }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text)" }}>
                    How was your experience?
                  </p>
                  <button
                    onClick={onClose}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 28, height: 28, borderRadius: "var(--r-md)",
                      border: "none", background: "transparent",
                      color: "var(--text3)", cursor: "pointer",
                      transition: "background 100ms",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={15} />
                  </button>
                </div>

                <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Stars */}
                  <div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onMouseEnter={() => setHovered(n)}
                          onMouseLeave={() => setHovered(0)}
                          onClick={() => setRating(n)}
                          style={{
                            width: 36, height: 36,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: "none", background: "transparent",
                            cursor: "pointer", borderRadius: "var(--r-md)",
                            fontSize: 22,
                            transition: "transform 120ms",
                            transform: n <= displayRating ? "scale(1.15)" : "scale(1)",
                          }}
                        >
                          <span style={{ lineHeight: 1, filter: n <= displayRating ? "none" : "grayscale(1) opacity(0.35)" }}>
                            ★
                          </span>
                        </button>
                      ))}
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: "var(--text3)", minHeight: 16, letterSpacing: "-0.01em" }}>
                      {displayRating > 0 ? STAR_LABELS[displayRating - 1] : "Tap to rate"}
                    </p>
                  </div>

                  {/* Category chips */}
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text3)" }}>
                      What stood out?
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {CATEGORIES.map((c) => {
                        const active = categories.includes(c.code);
                        return (
                          <button
                            key={c.code}
                            onClick={() => toggleCategory(c.code)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: 99,
                              border: `1px solid ${active ? "var(--accent)" : "var(--border-strong)"}`,
                              background: active ? "var(--accent-soft)" : "transparent",
                              color: active ? "var(--accent-text)" : "var(--text2)",
                              fontSize: 12, fontWeight: 500,
                              cursor: "pointer",
                              transition: "all 100ms",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Free text */}
                  <textarea
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder="Anything else you'd like to share? (optional)"
                    rows={3}
                    style={{
                      width: "100%", resize: "none",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-md)",
                      padding: "8px 10px",
                      fontSize: 12.5, color: "var(--text)",
                      background: "var(--bg2)",
                      outline: "none", fontFamily: "inherit",
                      letterSpacing: "-0.01em",
                      boxSizing: "border-box",
                      transition: "border-color 100ms",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                  />

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!rating || submitting}
                    style={{
                      width: "100%",
                      padding: "9px 0",
                      borderRadius: "var(--r-md)",
                      border: "none",
                      background: rating ? "var(--accent)" : "var(--bg2)",
                      color: rating ? "#fff" : "var(--text3)",
                      fontSize: 13, fontWeight: 500,
                      cursor: rating ? "pointer" : "default",
                      transition: "background 120ms, color 120ms",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {submitting ? "Sending…" : "Submit feedback"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Floating feedback button (fixed, bottom-right) ────────────────────────────

interface FeedbackButtonProps {
  onClick: () => void;
}

export function FeedbackButton({ onClick }: FeedbackButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Give feedback"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 200,
        display: "flex", alignItems: "center", gap: 6,
        height: 32, padding: "0 12px",
        borderRadius: 99,
        border: "1px solid var(--border-hover)",
        background: "var(--bg)",
        color: "var(--text2)",
        fontSize: 12, fontWeight: 500,
        cursor: "pointer",
        boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
        letterSpacing: "-0.01em",
        transition: "border-color 120ms, color 120ms, background 120ms, box-shadow 120ms",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.color = "var(--accent-text)";
        e.currentTarget.style.background = "var(--accent-soft)";
        e.currentTarget.style.boxShadow = "0 2px 16px rgba(67,56,202,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hover)";
        e.currentTarget.style.color = "var(--text2)";
        e.currentTarget.style.background = "var(--bg)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.10)";
      }}
    >
      {/* Smiley icon */}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
        <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
      </svg>
      Feedback
    </button>
  );
}

// ─── Post-generation nudge chip ────────────────────────────────────────────────

interface PostGenNudgeProps {
  visible: boolean;
  onOpen: () => void;
  onDismiss: () => void;
}

export function PostGenNudge({ visible, onOpen, onDismiss }: PostGenNudgeProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 10px 7px 12px",
            borderRadius: 99,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            pointerEvents: "auto",
          }}
        >
          <span style={{ fontSize: 12.5, color: "var(--text2)", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
            How do the slides look?
          </span>
          <button
            onClick={onOpen}
            style={{
              padding: "3px 10px",
              borderRadius: 99,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 12, fontWeight: 500,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            Rate it
          </button>
          <button
            onClick={onDismiss}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 20, height: 20, borderRadius: "50%",
              border: "none", background: "transparent",
              color: "var(--text3)", cursor: "pointer",
              transition: "background 100ms",
              padding: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
