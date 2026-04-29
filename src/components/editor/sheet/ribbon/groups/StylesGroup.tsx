"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Paintbrush, Table } from "lucide-react";
import { RibbonGroup, RibbonSplitButton } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";
import { useRibbonCollapsed } from "../RibbonCollapseContext";

// ─── Conditional Formatting panel values (from Univer source) ──────────────
// These map to the OpenConditionalFormattingOperator's `value` param enum
const CF_PANEL = {
  createRule: 1,
  viewRule: 2,
  highlightCell: 3,
  rank: 4,
  formula: 5,
  colorScale: 6,
  dataBar: 7,
  icon: 8,
  clearRangeRules: 9,
  clearWorkSheetRules: 10,
} as const;

const CF_COMMAND_ID = "sheet.operation.open.conditional.formatting.panel";

const CF_OPTIONS = [
  { label: "Highlight Cells Rules", value: CF_PANEL.highlightCell },
  { label: "Top/Bottom Rules", value: CF_PANEL.rank },
  { label: "Data Bars", value: CF_PANEL.dataBar },
  { label: "Color Scales", value: CF_PANEL.colorScale },
  { label: "Icon Sets", value: CF_PANEL.icon },
  { label: "divider", value: -1 },
  { label: "New Rule...", value: CF_PANEL.createRule },
  { label: "Clear Rules from Selection", value: CF_PANEL.clearRangeRules },
  { label: "Clear Rules from Sheet", value: CF_PANEL.clearWorkSheetRules },
  { label: "Manage Rules...", value: CF_PANEL.viewRule },
];

// ─── Conditional Formatting icon ───────────────────────────────────────────

function ConditionalFormattingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="1" y="1" width="12" height="5" rx="1" fill="#DDEBF7" stroke="none" />
      <rect x="1" y="8" width="12" height="5" rx="1" fill="#FDE8E8" stroke="none" />
      <line x1="1" y1="3.5" x2="8" y2="3.5" stroke="#2563EB" strokeWidth="1.5" />
      <line x1="1" y1="10.5" x2="5" y2="10.5" stroke="#DC2626" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Format as Table gallery styles ────────────────────────────────────────

const TABLE_GALLERY = [
  { key: "light" as const, label: "Light", headerBg: "#DDEBF7", altRowBg: "#F2F2F2", borderColor: "#B4C6E7" },
  { key: "medium" as const, label: "Medium", headerBg: "#5B9BD5", altRowBg: "#D9E1F2", borderColor: "#9BC2E6" },
  { key: "dark" as const, label: "Dark", headerBg: "#44546A", altRowBg: "#D9D9D9", borderColor: "#8497B0" },
];

function TablePreview({ headerBg, altRowBg, borderColor }: { headerBg: string; altRowBg: string; borderColor: string }) {
  return (
    <svg width="60" height="40" viewBox="0 0 60 40">
      <rect x="0" y="0" width="60" height="10" fill={headerBg} stroke={borderColor} strokeWidth="0.5" />
      <rect x="0" y="10" width="60" height="10" fill="#FFFFFF" stroke={borderColor} strokeWidth="0.5" />
      <rect x="0" y="20" width="60" height="10" fill={altRowBg} stroke={borderColor} strokeWidth="0.5" />
      <rect x="0" y="30" width="60" height="10" fill="#FFFFFF" stroke={borderColor} strokeWidth="0.5" />
    </svg>
  );
}

// ─── ConditionalFormattingSplitButton ───────────────────────────────────────

function ConditionalFormattingSplitButton({ facadeRef }: { facadeRef: ReturnType<typeof useSheetFacade> }) {
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

  const executeCommand = (value: number) => {
    try {
      const facade = facadeRef.current;
      if (!facade) return;
      // Use Univer's command service to open the conditional formatting panel
      const commandService = facade.getCommandService?.();
      if (commandService) {
        commandService.executeCommand(CF_COMMAND_ID, { value });
      }
    } catch {
      // Conditional formatting plugin may not be loaded — silently fail
    }
    setMenuOpen(false);
  };

  return (
    <>
      <div ref={anchorRef}>
        <RibbonSplitButton
          icon={<ConditionalFormattingIcon />}
          tooltip="Conditional Formatting"
          onClick={() => executeCommand(CF_PANEL.highlightCell)}
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
            minWidth: 210,
            background: "#FFFFFF",
            border: "1px solid #C8C6C4",
            borderRadius: 4,
            boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
            zIndex: 10000,
            padding: "4px 0",
          }}
        >
          {CF_OPTIONS.map((opt, i) =>
            opt.label === "divider" ? (
              <div key={`div-${i}`} style={{ height: 1, background: "#E8E8E8", margin: "4px 0" }} />
            ) : (
              <button
                key={opt.value}
                onClick={() => executeCommand(opt.value)}
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
                {opt.label}
              </button>
            )
          )}
        </div>,
        document.body
      )}
    </>
  );
}

// ─── FormatAsTableButton ───────────────────────────────────────────────────

function FormatAsTableButton({ commands }: { commands: ReturnType<typeof useSheetCommands> }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!galleryOpen || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 2, left: rect.left });
  }, [galleryOpen]);

  useEffect(() => {
    if (!galleryOpen) return;
    function onDown(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) setGalleryOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setGalleryOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [galleryOpen]);

  return (
    <>
      <div ref={anchorRef}>
        <RibbonSplitButton
          icon={<Table size={14} />}
          tooltip="Format as Table"
          onClick={() => commands.formatAsTable("light")}
          onDropdownClick={() => setGalleryOpen((o) => !o)}
          dropdownOpen={galleryOpen}
        />
      </div>
      {galleryOpen && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            background: "#FFFFFF",
            border: "1px solid #C8C6C4",
            borderRadius: 4,
            boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
            zIndex: 10000,
            padding: 8,
            display: "flex",
            gap: 8,
          }}
        >
          {TABLE_GALLERY.map((style) => (
            <button
              key={style.key}
              onClick={() => {
                commands.formatAsTable(style.key);
                setGalleryOpen(false);
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: 4,
                border: "1px solid transparent",
                borderRadius: 4,
                background: "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.border = "1px solid #B4C6E7"; e.currentTarget.style.background = "#F0F6FF"; }}
              onMouseLeave={(e) => { e.currentTarget.style.border = "1px solid transparent"; e.currentTarget.style.background = "transparent"; }}
            >
              <TablePreview headerBg={style.headerBg} altRowBg={style.altRowBg} borderColor={style.borderColor} />
              <span style={{ fontSize: 11, color: "#333" }}>{style.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ─── StylesGroup ───────────────────────────────────────────────────────────

export function StylesGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const collapsed = useRibbonCollapsed("Styles");

  return (
    <RibbonGroup label="Styles" minWidth={80} collapsed={collapsed} collapsedIcon={<Paintbrush size={20} />}>
      <div style={{ display: "flex", gap: 2, alignItems: "center", padding: "2px 0" }}>
        <ConditionalFormattingSplitButton facadeRef={facadeRef} />
        <FormatAsTableButton commands={commands} />
      </div>
    </RibbonGroup>
  );
}
