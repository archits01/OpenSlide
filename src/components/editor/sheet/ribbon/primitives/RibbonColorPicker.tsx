"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { SHEET_TOKENS } from "../../sheet-tokens";
import type { RibbonColorOption } from "./types";

const t = SHEET_TOKENS.ribbon;

const DEFAULT_COLORS: RibbonColorOption[] = [
  // Theme colors row
  { color: "#FFFFFF", label: "White" },
  { color: "#000000", label: "Black" },
  { color: "#E7E6E6", label: "Light Grey" },
  { color: "#44546A", label: "Dark Grey" },
  { color: "#4472C4", label: "Blue" },
  { color: "#ED7D31", label: "Orange" },
  { color: "#A5A5A5", label: "Grey" },
  { color: "#FFC000", label: "Gold" },
  { color: "#5B9BD5", label: "Accent Blue" },
  { color: "#70AD47", label: "Green" },
  // Standard colors row
  { color: "#C00000", label: "Dark Red" },
  { color: "#FF0000", label: "Red" },
  { color: "#FFC000", label: "Orange" },
  { color: "#FFFF00", label: "Yellow" },
  { color: "#92D050", label: "Light Green" },
  { color: "#00B050", label: "Green" },
  { color: "#00B0F0", label: "Light Blue" },
  { color: "#0070C0", label: "Blue" },
  { color: "#002060", label: "Dark Blue" },
  { color: "#7030A0", label: "Purple" },
];

interface RibbonColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  colors?: RibbonColorOption[];
  showAutomatic?: boolean;
  showCustom?: boolean;
  /** External open state — overrides internal state when provided */
  externalOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function RibbonColorPicker({
  value,
  onChange,
  colors,
  showAutomatic = true,
  showCustom = true,
  externalOpen,
  onOpenChange,
}: RibbonColorPickerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = (v: boolean) => { setInternalOpen(v); onOpenChange?.(v); };
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const palette = colors ?? DEFAULT_COLORS;
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.left + rect.width / 2 - 98 });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <>
      <div ref={anchorRef}>
        {/* Hidden native color input */}
        <input
          ref={colorInputRef}
          type="color"
          value={value || "#000000"}
          onChange={(e) => { onChange(e.target.value); setOpen(false); }}
          style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
        />
      </div>

      {/* Popover rendered via portal */}
      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            background: t.dropdownBg,
            border: `1px solid ${t.dropdownBorder}`,
            borderRadius: 6,
            boxShadow: t.dropdownShadow,
            zIndex: 10000,
            padding: 8,
            width: 196,
          }}
        >
          {showAutomatic && (
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                height: 28,
                padding: "0 8px",
                border: "none",
                borderRadius: 3,
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
                color: "#333",
                marginBottom: 4,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.buttonHoverBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: 2,
                background: "linear-gradient(135deg, #333 50%, transparent 50%)",
                border: "1px solid #CCC",
              }} />
              Automatic
            </button>
          )}

          {/* Color grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 2, padding: "4px 0" }}>
            {palette.map((c, i) => (
              <button
                key={`${c.color}-${i}`}
                title={c.label}
                onClick={() => { onChange(c.color); setOpen(false); }}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 2,
                  background: c.color,
                  border: c.color === value
                    ? "2px solid #333"
                    : c.color === "#FFFFFF"
                    ? "1px solid #CCC"
                    : "1px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#666"; }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = c.color === value ? "#333" : c.color === "#FFFFFF" ? "#CCC" : "transparent";
                }}
              />
            ))}
          </div>

          {showCustom && (
            <button
              onClick={() => colorInputRef.current?.click()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                height: 28,
                padding: "0 8px",
                border: "none",
                borderRadius: 3,
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
                color: "#333",
                marginTop: 4,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.buttonHoverBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              More Colors...
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

/** Hook to control the color picker from a parent split button */
export function useColorPicker() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, toggle: () => setOpen((o) => !o) };
}
