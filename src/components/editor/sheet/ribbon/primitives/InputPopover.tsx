"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Small inline popover that prompts for a single text/number value.
 * Replaces blocking window.prompt() calls across the ribbon.
 */
export function InputPopover({
  open,
  anchorRef,
  title,
  label,
  placeholder,
  defaultValue = "",
  inputType = "text",
  submitLabel = "OK",
  onSubmit,
  onClose,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  title: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: "text" | "number";
  submitLabel?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left });
    setValue(defaultValue);
  }, [open, anchorRef, defaultValue]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(t) &&
        anchorRef.current && !anchorRef.current.contains(t)
      ) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === "undefined") return null;

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onSubmit(v);
    onClose();
  };

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        minWidth: 240,
        background: "#FFF",
        border: "1px solid #C8C6C4",
        borderRadius: 6,
        boxShadow: "0 4px 12px rgba(0,0,0,0.14)",
        zIndex: 10_000,
        padding: 12,
        fontFamily: "var(--font-geist-sans, system-ui)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "#111", marginBottom: 10 }}>
        {title}
      </div>
      {label && (
        <label style={{ display: "block", fontSize: 11, color: "#555", marginBottom: 4 }}>{label}</label>
      )}
      <input
        autoFocus
        type={inputType}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: 28,
          padding: "0 8px",
          border: "1px solid #D0D0D0",
          borderRadius: 4,
          fontSize: 12,
          marginBottom: 12,
          outline: "none",
        }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          onClick={onClose}
          style={{ height: 26, padding: "0 12px", fontSize: 12, border: "1px solid #D0D0D0", borderRadius: 3, background: "#FFF", color: "#333", cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          style={{ height: 26, padding: "0 12px", fontSize: 12, border: "1px solid #0078D4", borderRadius: 3, background: "#0078D4", color: "#FFF", cursor: "pointer" }}
        >
          {submitLabel}
        </button>
      </div>
    </div>,
    document.body,
  );
}
