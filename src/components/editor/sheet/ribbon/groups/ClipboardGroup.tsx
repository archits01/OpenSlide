"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ClipboardPaste, Scissors, Copy, Paintbrush } from "lucide-react";
import { RibbonGroup, RibbonButtonLarge, RibbonButton } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetSelection } from "../hooks/useSheetSelection";
import { useSheetFacade } from "../SheetFacadeContext";

export function ClipboardGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const selection = useSheetSelection(facadeRef);
  const [pasteMenuOpen, setPasteMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate position when menu opens
  useEffect(() => {
    if (!pasteMenuOpen || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 2, left: rect.left });
  }, [pasteMenuOpen]);

  // Close paste menu on outside click
  useEffect(() => {
    if (!pasteMenuOpen) return;
    function onDown(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) setPasteMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPasteMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pasteMenuOpen]);

  const pasteOptions = [
    { label: "Paste", action: () => commands.paste() },
    { label: "Paste Values", action: () => commands.pasteValues() },
    { label: "Paste Formatting", action: () => commands.pasteFormatting() },
  ];

  return (
    <RibbonGroup label="Clipboard">
      {/* Large Paste button with dropdown */}
      <div ref={anchorRef}>
        <RibbonButtonLarge
          icon={<ClipboardPaste size={20} />}
          label="Paste"
          tooltip="Paste (Ctrl+V)"
          onClick={() => commands.paste()}
          onDropdownClick={() => setPasteMenuOpen((o) => !o)}
        />
      </div>

      {/* Paste special dropdown */}
      {pasteMenuOpen && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            minWidth: 160,
            background: "#FFFFFF",
            border: "1px solid #C8C6C4",
            borderRadius: 4,
            boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
            zIndex: 10000,
            padding: "4px 0",
          }}
        >
          {pasteOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => { opt.action(); setPasteMenuOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                height: 28,
                padding: "0 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
                color: "#333",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#E5F1FB"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Cut / Copy / Format Painter stack */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
        <RibbonButton
          icon={<Scissors size={14} />}
          label="Cut"
          showLabel
          tooltip="Cut (Ctrl+X)"
          disabled={!selection.hasSelection}
          onClick={() => commands.cut()}
          size="sm"
        />
        <RibbonButton
          icon={<Copy size={14} />}
          label="Copy"
          showLabel
          tooltip="Copy (Ctrl+C)"
          disabled={!selection.hasSelection}
          onClick={() => commands.copy()}
          size="sm"
        />
        <RibbonButton
          icon={<Paintbrush size={14} />}
          label="Format Painter"
          showLabel
          tooltip="Format Painter"
          disabled={!selection.hasSelection}
          active={commands.isFormatPainterActive}
          onClick={() =>
            commands.isFormatPainterActive
              ? commands.exitFormatPainter()
              : commands.startFormatPainter()
          }
          size="sm"
        />
      </div>
    </RibbonGroup>
  );
}
