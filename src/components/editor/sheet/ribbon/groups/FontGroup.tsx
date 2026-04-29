"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Bold, Italic, Underline, Strikethrough,
  AArrowUp, AArrowDown, PaintBucket, Type, Eraser,
} from "lucide-react";
import {
  RibbonGroup,
  RibbonFontFamilyPicker,
  RibbonFontSizePicker,
  RibbonButton,
  RibbonSplitButton,
  RibbonColorPicker,
  RibbonSeparator,
} from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetSelection } from "../hooks/useSheetSelection";
import { useSheetFacade } from "../SheetFacadeContext";
import type { BorderConfig } from "../hooks/types";

// ─── Border SVG icons (14×14, stroke 1.5) ──────────────────────────────────

function AllBordersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="1" y="1" width="12" height="12" />
      <line x1="7" y1="1" x2="7" y2="13" />
      <line x1="1" y1="7" x2="13" y2="7" />
    </svg>
  );
}

function OutsideBordersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="12" height="12" />
    </svg>
  );
}

function ThickBoxIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="1.5" y="1.5" width="11" height="11" />
    </svg>
  );
}

function BottomBorderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor">
      <rect x="1" y="1" width="12" height="12" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
      <line x1="1" y1="13" x2="13" y2="13" strokeWidth="1.5" />
    </svg>
  );
}

function NoBorderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.4">
      <rect x="1" y="1" width="12" height="12" />
    </svg>
  );
}

// ─── Borders split-button sub-component ─────────────────────────────────────

const BORDER_OPTIONS: Array<{
  label: string;
  config: BorderConfig;
  icon: React.ReactNode;
}> = [
  { label: "All Borders", config: { position: "all", style: "thin", color: "#000000" }, icon: <AllBordersIcon /> },
  { label: "Outside Borders", config: { position: "outer", style: "thin", color: "#000000" }, icon: <OutsideBordersIcon /> },
  { label: "Thick Box Border", config: { position: "outer", style: "thick", color: "#000000" }, icon: <ThickBoxIcon /> },
  { label: "Bottom Border", config: { position: "bottom", style: "thin", color: "#000000" }, icon: <BottomBorderIcon /> },
  { label: "No Border", config: { position: "none" }, icon: <NoBorderIcon /> },
];

function BordersSplitButton({ commands }: { commands: ReturnType<typeof useSheetCommands> }) {
  const [lastBorder, setLastBorder] = useState<BorderConfig>({ position: "all", style: "thin", color: "#000000" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 2, left: rect.left });
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <div ref={anchorRef}>
        <RibbonSplitButton
          icon={<AllBordersIcon />}
          tooltip="Borders"
          onClick={() => commands.setBorder(lastBorder)}
          onDropdownClick={() => setMenuOpen((o) => !o)}
          dropdownOpen={menuOpen}
        />
      </div>
      {menuOpen && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            minWidth: 170,
            background: "#FFFFFF",
            border: "1px solid #C8C6C4",
            borderRadius: 4,
            boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
            zIndex: 10000,
            padding: "4px 0",
          }}
        >
          {BORDER_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                setLastBorder(opt.config);
                commands.setBorder(opt.config);
                setMenuOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
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
              <span style={{ display: "flex", width: 14, height: 14 }}>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Color split-button wrapper ─────────────────────────────────────────────

function ColorSplitButton({
  icon,
  tooltip,
  lastColor,
  onApply,
  onPick,
}: {
  icon: React.ReactNode;
  tooltip: string;
  lastColor: string;
  onApply: () => void;
  onPick: (color: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div>
      <RibbonSplitButton
        icon={icon}
        colorIndicator={lastColor}
        tooltip={tooltip}
        onClick={onApply}
        onDropdownClick={() => setPickerOpen((o) => !o)}
        dropdownOpen={pickerOpen}
      />
      <RibbonColorPicker
        value={lastColor}
        onChange={(c) => { onPick(c); setPickerOpen(false); }}
        externalOpen={pickerOpen}
        onOpenChange={setPickerOpen}
        showAutomatic
        showCustom
      />
    </div>
  );
}

// ─── FontGroup ──────────────────────────────────────────────────────────────

export function FontGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const selection = useSheetSelection(facadeRef);

  const [lastFillColor, setLastFillColor] = useState("#FFFF00");
  const [lastFontColor, setLastFontColor] = useState("#FF0000");

  return (
    <RibbonGroup label="Font" minWidth={220}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "2px 0" }}>
        {/* Row 1: Font family + size + inc/dec */}
        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          <RibbonFontFamilyPicker
            value={selection.fontFamily || "Calibri"}
            onChange={(font) => commands.setFontFamily(font)}
          />
          <RibbonFontSizePicker
            value={selection.fontSize || 11}
            onChange={(size) => commands.setFontSize(size)}
          />
          <RibbonButton
            icon={<AArrowUp size={14} />}
            tooltip="Increase Font Size"
            onClick={() => commands.increaseFontSize()}
            size="sm"
          />
          <RibbonButton
            icon={<AArrowDown size={14} />}
            tooltip="Decrease Font Size"
            onClick={() => commands.decreaseFontSize()}
            size="sm"
          />
        </div>

        {/* Row 2: B/I/U/S | Borders | Fill | Font Color | Clear */}
        <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
          <RibbonButton
            icon={<Bold size={14} />}
            tooltip="Bold (Ctrl+B)"
            active={selection.isBold}
            onClick={() => commands.setBold()}
            size="sm"
          />
          <RibbonButton
            icon={<Italic size={14} />}
            tooltip="Italic (Ctrl+I)"
            active={selection.isItalic}
            onClick={() => commands.setItalic()}
            size="sm"
          />
          <RibbonButton
            icon={<Underline size={14} />}
            tooltip="Underline (Ctrl+U)"
            active={selection.isUnderline}
            onClick={() => commands.setUnderline()}
            size="sm"
          />
          <RibbonButton
            icon={<Strikethrough size={14} />}
            tooltip="Strikethrough"
            active={selection.isStrikethrough}
            onClick={() => commands.setStrikethrough()}
            size="sm"
          />

          <RibbonSeparator />

          <BordersSplitButton commands={commands} />

          <ColorSplitButton
            icon={<PaintBucket size={14} />}
            tooltip={`Fill Color (${lastFillColor})`}
            lastColor={lastFillColor}
            onApply={() => commands.setFillColor(lastFillColor)}
            onPick={(c) => { setLastFillColor(c); commands.setFillColor(c); }}
          />

          <ColorSplitButton
            icon={<Type size={14} />}
            tooltip={`Font Color (${lastFontColor})`}
            lastColor={lastFontColor}
            onApply={() => commands.setFontColor(lastFontColor)}
            onPick={(c) => { setLastFontColor(c); commands.setFontColor(c); }}
          />

          <RibbonSeparator />

          <RibbonButton
            icon={<Eraser size={14} />}
            tooltip="Clear Formatting"
            onClick={() => commands.clearFormatting()}
            size="sm"
          />
        </div>
      </div>
    </RibbonGroup>
  );
}
