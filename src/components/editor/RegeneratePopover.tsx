"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const REGENERATE_REASONS = [
  { code: "overflow",      label: "Content overflowed" },
  { code: "too_basic",     label: "Design too basic" },
  { code: "too_much_text", label: "Too much text" },
  { code: "wrong_content", label: "Doesn't match my request" },
  { code: "poor_layout",   label: "Poor layout" },
  { code: "needs_visuals", label: "Needs more visuals" },
  { code: "other",         label: "Other…" },
] as const;

export type ReasonCode = (typeof REGENERATE_REASONS)[number]["code"];

interface RegeneratePopoverProps {
  onSelect: (reasonCode: string, freeText?: string) => void;
  onClose: () => void;
}

export function RegeneratePopover({ onSelect, onClose }: RegeneratePopoverProps) {
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      style={{
        position: "absolute",
        top: 36,
        right: 0,
        width: 220,
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "10px 12px 6px" }}>
        <p style={{ margin: 0, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text3)" }}>
          Why regenerate?
        </p>
      </div>

      {/* Reasons */}
      <div style={{ padding: "0 6px 6px" }}>
        {REGENERATE_REASONS.map((r) => (
          <button
            key={r.code}
            onClick={() => {
              if (r.code === "other") { setShowOther(true); return; }
              onSelect(r.code);
            }}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              padding: "7px 8px", borderRadius: "var(--r-md)",
              border: "none", background: "transparent",
              fontSize: 13, color: "var(--text)", cursor: "pointer",
              textAlign: "left", letterSpacing: "-0.01em",
              transition: "background 100ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Other text input */}
      <AnimatePresence>
        {showOther && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: "hidden", borderTop: "1px solid var(--border)" }}
          >
            <div style={{ padding: "8px 10px" }}>
              <textarea
                autoFocus
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Describe the issue…"
                rows={2}
                style={{
                  width: "100%", resize: "none",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)",
                  padding: "6px 8px",
                  fontSize: 12.5, color: "var(--text)",
                  background: "var(--bg2)",
                  outline: "none", fontFamily: "inherit",
                  letterSpacing: "-0.01em",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              />
              <button
                onClick={() => { if (otherText.trim()) onSelect("other", otherText.trim()); }}
                disabled={!otherText.trim()}
                style={{
                  marginTop: 6, width: "100%",
                  padding: "6px 0", borderRadius: "var(--r-md)",
                  border: "none",
                  background: otherText.trim() ? "var(--accent)" : "var(--bg2)",
                  color: otherText.trim() ? "#fff" : "var(--text3)",
                  fontSize: 12.5, fontWeight: 500, cursor: otherText.trim() ? "pointer" : "default",
                  transition: "background 120ms, color 120ms",
                  letterSpacing: "-0.01em",
                }}
              >
                Regenerate
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Hover button shown on slide card ──────────────────────────────────────────

interface RegenerateButtonProps {
  visible: boolean;
  onSelect: (reasonCode: string, freeText?: string) => void;
  /** When true, renders inline (no absolute positioning wrapper) for use inside a flex container */
  inline?: boolean;
}

export function RegenerateButton({ visible, onSelect, inline }: RegenerateButtonProps) {
  const [open, setOpen] = useState(false);

  // Close popover when button becomes invisible (slide un-hovered)
  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  if (!visible && !open) return null;

  return (
    <div style={inline ? { position: "relative", zIndex: 10 } : { position: "absolute", top: 10, right: 10, zIndex: 10 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          height: 28, padding: "0 10px",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--border-hover)",
          background: "var(--bg)",
          color: "var(--text2)",
          fontSize: 12, fontWeight: 500,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          letterSpacing: "-0.01em",
          transition: "border-color 120ms, color 120ms, background 120ms",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.color = "var(--accent-text)";
          e.currentTarget.style.background = "var(--accent-soft)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-hover)";
          e.currentTarget.style.color = "var(--text2)";
          e.currentTarget.style.background = "var(--bg)";
        }}
      >
        {/* Refresh icon */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        Regenerate
      </button>

      <AnimatePresence>
        {open && (
          <RegeneratePopover
            onSelect={(code, text) => { setOpen(false); onSelect(code, text); }}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
