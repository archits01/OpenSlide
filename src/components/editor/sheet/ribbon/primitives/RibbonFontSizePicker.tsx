"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { SHEET_TOKENS } from "../../sheet-tokens";

const t = SHEET_TOKENS.ribbon;

const DEFAULT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72];

interface RibbonFontSizePickerProps {
  value: number;
  onChange: (size: number) => void;
  sizes?: number[];
}

export function RibbonFontSizePicker({ value, onChange, sizes }: RibbonFontSizePickerProps) {
  const sizeList = sizes ?? DEFAULT_SIZES;
  const [open, setOpen] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setEditValue(String(value)); }, [value]);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 2, left: rect.left });
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

  function commit(raw: string) {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 1 && n <= 409) {
      onChange(n);
    }
    setOpen(false);
  }

  return (
    <>
      <div ref={anchorRef} style={{ flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 24,
            border: `1px solid ${open ? t.dropdownBorder : "transparent"}`,
            borderRadius: 2,
            background: open ? t.dropdownBg : "transparent",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            if (!open) (e.currentTarget as HTMLDivElement).style.border = `1px solid ${t.dropdownBorder}`;
          }}
          onMouseLeave={(e) => {
            if (!open) (e.currentTarget as HTMLDivElement).style.border = "1px solid transparent";
          }}
        >
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onFocus={() => inputRef.current?.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") { commit(editValue); e.currentTarget.blur(); }
              if (e.key === "Escape") { setEditValue(String(value)); setOpen(false); }
            }}
            onBlur={() => commit(editValue)}
            style={{
              width: 32,
              height: "100%",
              border: "none",
              background: "transparent",
              textAlign: "center",
              fontSize: t.fontSize,
              color: "#333",
              outline: "none",
              padding: 0,
            }}
          />
          <button
            onClick={() => setOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 14,
              height: "100%",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#999",
              padding: 0,
            }}
          >
            <ChevronDown size={10} />
          </button>
        </div>
      </div>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            width: 60,
            maxHeight: 300,
            overflowY: "auto",
            background: t.dropdownBg,
            border: `1px solid ${t.dropdownBorder}`,
            borderRadius: 4,
            boxShadow: t.dropdownShadow,
            zIndex: 10000,
            padding: "4px 0",
          }}
        >
          {sizeList.map((s) => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: 24,
                border: "none",
                background: s === value ? "#EFF6FC" : "transparent",
                cursor: "pointer",
                fontSize: 12,
                color: "#333",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.buttonHoverBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = s === value ? "#EFF6FC" : "transparent"; }}
            >
              {s}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
