"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { SHEET_TOKENS } from "../../sheet-tokens";
import { RibbonTooltip } from "./RibbonTooltip";
import type { RibbonDropdownOption } from "./types";

const t = SHEET_TOKENS.ribbon;

interface RibbonDropdownProps<T = string> {
  icon?: React.ReactNode;
  label?: string;
  value?: T;
  options: RibbonDropdownOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  width?: number;
  tooltip?: string;
  shortcut?: string;
}

export function RibbonDropdown<T = string>({
  icon,
  label,
  value,
  options,
  onChange,
  disabled,
  width,
  tooltip,
  shortcut,
}: RibbonDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position menu below trigger using fixed positioning
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 2, left: rect.left });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
        setFocusIndex(0);
      }
      return;
    }
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIndex((i) => Math.min(i + 1, options.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setFocusIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && focusIndex >= 0) {
      e.preventDefault();
      const opt = options[focusIndex];
      if (opt && !opt.disabled) { onChange(opt.value); setOpen(false); }
    }
  }, [open, focusIndex, options, onChange]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? label ?? "";
  const tooltipContent = tooltip ?? label ?? "";

  return (
    <div style={{ flexShrink: 0 }}>
      <RibbonTooltip content={tooltipContent} shortcut={shortcut}>
      <button
        ref={triggerRef}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          height: 24,
          padding: "0 4px 0 6px",
          border: `1px solid ${open ? t.dropdownBorder : "transparent"}`,
          borderRadius: 2,
          background: open ? t.dropdownBg : "transparent",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.4 : 1,
          fontSize: t.fontSize,
          color: "#333",
          minWidth: width ?? "auto",
        }}
        onMouseEnter={(e) => {
          if (!disabled && !open) e.currentTarget.style.border = `1px solid ${t.dropdownBorder}`;
        }}
        onMouseLeave={(e) => {
          if (!disabled && !open) e.currentTarget.style.border = "1px solid transparent";
        }}
      >
        {icon && <span style={{ display: "flex", width: 14, height: 14 }}>{icon}</span>}
        <span style={{ flex: 1, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {selectedLabel}
        </span>
        <ChevronDown size={10} style={{ color: "#999", flexShrink: 0 }} />
      </button>
      </RibbonTooltip>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            minWidth: Math.max(width ?? 0, 200),
            maxHeight: 400,
            overflowY: "auto",
            background: t.dropdownBg,
            border: `1px solid ${t.dropdownBorder}`,
            borderRadius: 4,
            boxShadow: t.dropdownShadow,
            zIndex: 10000,
            padding: "4px 0",
          }}
          onKeyDown={handleKeyDown}
        >
          {options.map((opt, i) => (
            <div key={String(opt.value)}>
              {opt.divider && <div style={{ height: 1, background: "#E8E8E8", margin: "4px 0" }} />}
              <button
                disabled={opt.disabled}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  height: 28,
                  padding: "0 12px",
                  border: "none",
                  background: i === focusIndex ? t.buttonHoverBg : opt.value === value ? "#EFF6FC" : "transparent",
                  cursor: opt.disabled ? "not-allowed" : "pointer",
                  opacity: opt.disabled ? 0.4 : 1,
                  fontSize: 12,
                  color: "#333",
                  textAlign: "left",
                }}
                onMouseEnter={() => setFocusIndex(i)}
              >
                {opt.icon && <span style={{ display: "flex", width: 16, height: 16 }}>{opt.icon}</span>}
                <span style={{ flex: 1 }}>{opt.label}</span>
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
