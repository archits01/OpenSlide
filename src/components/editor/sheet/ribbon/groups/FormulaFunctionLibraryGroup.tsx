"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Sigma, TrendingUp, ToggleLeft, Type, Calendar,
  Search as SearchIcon, Calculator, BarChart3, MoreHorizontal,
} from "lucide-react";
import { RibbonGroup, RibbonButton, RibbonSplitButton, InputPopover } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";
import {
  FUNCTION_CATEGORIES,
  getFunctionsByCategory,
  type FunctionCategory,
} from "../data/excel-functions";

// ─── Shared helpers ──────────────────────────────────────────────────────────

const POPUP_BASE_STYLE: React.CSSProperties = {
  minWidth: 200,
  background: "#FFFFFF",
  border: "1px solid #C8C6C4",
  borderRadius: 4,
  boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
  padding: "4px 0",
};

const ITEM_STYLE: React.CSSProperties = {
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
  textAlign: "left" as const,
};

function usePortalMenu(
  anchorRef: React.RefObject<HTMLDivElement | null>,
  menuRef: React.RefObject<HTMLDivElement | null>,
  open: boolean,
  setOpen: (v: boolean) => void,
) {
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 2, left: rect.left });
  }, [open, anchorRef]);
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && anchorRef.current && !anchorRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open, menuRef, anchorRef, setOpen]);
  return menuPos;
}

// ─── Category icon mapping ───────────────────────────────────────────────────

const CAT_ICONS: Record<FunctionCategory, React.ReactNode> = {
  Financial: <TrendingUp size={14} />,
  Logical: <ToggleLeft size={14} />,
  Text: <Type size={14} />,
  "Date & Time": <Calendar size={14} />,
  "Lookup & Reference": <SearchIcon size={14} />,
  "Math & Trig": <Calculator size={14} />,
  Statistical: <BarChart3 size={14} />,
};

const CAT_SHORT: Record<FunctionCategory, string> = {
  Financial: "Financial",
  Logical: "Logical",
  Text: "Text",
  "Date & Time": "Date & Time",
  "Lookup & Reference": "Lookup & Reference",
  "Math & Trig": "Math & Trig",
  Statistical: "Statistical",
};

// ─── AutoSum split button ────────────────────────────────────────────────────

function AutoSumSplitButton({ commands }: { commands: ReturnType<typeof useSheetCommands> }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPos = usePortalMenu(anchorRef, menuRef, menuOpen, setMenuOpen);

  const OPTIONS = [
    { label: "Sum", action: () => commands.autoSum() },
    { label: "Average", action: () => commands.autoAverage() },
    { label: "Count Numbers", action: () => commands.autoCount() },
    { label: "Max", action: () => commands.autoMax() },
    { label: "Min", action: () => commands.autoMin() },
  ];

  return (
    <>
      <div ref={anchorRef}>
        <RibbonSplitButton
          icon={<Sigma size={14} />}
          tooltip="AutoSum"
          onClick={() => commands.autoSum()}
          onDropdownClick={() => setMenuOpen((o) => !o)}
          dropdownOpen={menuOpen}
        />
      </div>
      {menuOpen && createPortal(
        <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 10000, ...POPUP_BASE_STYLE }}>
          {OPTIONS.map((opt) => (
            <button key={opt.label} onClick={() => { opt.action(); setMenuOpen(false); }} style={ITEM_STYLE}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#E5F1FB"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >{opt.label}</button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Category dropdown button ────────────────────────────────────────────────

function CategoryButton({ category, commands }: { category: FunctionCategory; commands: ReturnType<typeof useSheetCommands> }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPos = usePortalMenu(anchorRef, menuRef, menuOpen, setMenuOpen);
  const functions = useMemo(() => getFunctionsByCategory(category), [category]);

  return (
    <>
      <div ref={anchorRef}>
        <RibbonButton
          icon={CAT_ICONS[category]}
          label={CAT_SHORT[category]}
          tooltip={`${category} Functions`}
          onClick={() => setMenuOpen((o) => !o)}
          showLabel
          size="sm"
        />
      </div>
      {menuOpen && createPortal(
        <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 10000, ...POPUP_BASE_STYLE, minWidth: 280, maxHeight: 300, overflowY: "auto" }}>
          {functions.map((fn) => (
            <button key={fn.name} onClick={() => { commands.insertFunction(fn.name); setMenuOpen(false); }}
              style={{ ...ITEM_STYLE, justifyContent: "space-between" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#E5F1FB"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontWeight: 600, minWidth: 60 }}>{fn.name}</span>
              <span style={{ color: "#888", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{fn.description}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ─── FormulaFunctionLibraryGroup ─────────────────────────────────────────────

export function FormulaFunctionLibraryGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const moreFnAnchorRef = useRef<HTMLDivElement>(null);
  const [moreFnOpen, setMoreFnOpen] = useState(false);

  return (
    <RibbonGroup label="Functions Library" minWidth={320}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "2px 0" }}>
        {/* Row 1: AutoSum + first 4 categories */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <AutoSumSplitButton commands={commands} />
          {FUNCTION_CATEGORIES.slice(0, 4).map((cat) => (
            <CategoryButton key={cat} category={cat} commands={commands} />
          ))}
        </div>
        {/* Row 2: remaining categories + More Functions */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {FUNCTION_CATEGORIES.slice(4).map((cat) => (
            <CategoryButton key={cat} category={cat} commands={commands} />
          ))}
          <div ref={moreFnAnchorRef}>
            <RibbonButton
              icon={<MoreHorizontal size={14} />}
              label="More Functions"
              tooltip="Type any function name to insert"
              showLabel
              size="sm"
              onClick={() => setMoreFnOpen(true)}
            />
          </div>
          <InputPopover
            open={moreFnOpen}
            anchorRef={moreFnAnchorRef}
            title="Insert Function"
            label="Function name"
            placeholder="VLOOKUP, SUMIFS, etc."
            submitLabel="Insert"
            onSubmit={(v) => commands.insertFunction(v.toUpperCase().trim())}
            onClose={() => setMoreFnOpen(false)}
          />
        </div>
      </div>
    </RibbonGroup>
  );
}
