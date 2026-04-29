"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Sigma, ArrowDown, ArrowRight,
  Eraser, ArrowUpDown, Search,
} from "lucide-react";
import {
  RibbonGroup, RibbonSplitButton, RibbonSeparator,
} from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetSelection } from "../hooks/useSheetSelection";
import { useSheetFacade } from "../SheetFacadeContext";
import { useRibbonCollapsed } from "../RibbonCollapseContext";
import type { SheetSelectionState } from "../hooks/types";
import { colToA1 } from "../hooks/types";

// ─── Shared menu helpers ───────────────────────────────────────────────────

const MENU_BASE_STYLE: React.CSSProperties = {
  minWidth: 180,
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
  textAlign: "left",
};

function usePortalMenu(
  anchorRef: React.RefObject<HTMLElement | null>,
  menuRef: React.RefObject<HTMLElement | null>,
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
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) setOpen(false);
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
  }, [open, menuRef, anchorRef, setOpen]);

  return menuPos;
}

function MenuItem({ label, onClick, disabled, shortcut }: { label: string; onClick: () => void; disabled?: boolean; shortcut?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...ITEM_STYLE, opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#E5F1FB"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      {shortcut && <span style={{ fontSize: 11, color: "#999" }}>{shortcut}</span>}
    </button>
  );
}

function MenuDivider() {
  return <div style={{ height: 1, background: "#E8E8E8", margin: "4px 0" }} />;
}

// ─── AutoSum split button ──────────────────────────────────────────────────

function AutoSumButton({
  commands,
  facadeRef,
  selection,
}: {
  commands: ReturnType<typeof useSheetCommands>;
  facadeRef: ReturnType<typeof useSheetFacade>;
  selection: SheetSelectionState;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPos = usePortalMenu(anchorRef, menuRef, menuOpen, setMenuOpen);

  const insertFunction = (fn: string) => {
    try {
      const wb = facadeRef.current?.getActiveWorkbook?.();
      const ws = wb?.getActiveSheet?.();
      const range = wb?.getActiveRange?.();
      if (!ws || !range) return;

      const r = range.getRange?.();
      const row = r?.startRow ?? 0;
      const col = r?.startColumn ?? 0;

      // Find contiguous numbers above
      let startRow = row - 1;
      while (startRow >= 0) {
        const val = ws.getRange?.(startRow, col)?.getValue?.();
        if (typeof val !== "number") break;
        startRow--;
      }
      startRow++;

      if (startRow < row) {
        const rangeRef = `${colToA1(col)}${startRow + 1}:${colToA1(col)}${row}`;
        ws.getRange?.(row, col)?.setValue?.({ f: `=${fn}(${rangeRef})` });
      }
    } catch { /* */ }
    setMenuOpen(false);
  };

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
        <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 10000, ...MENU_BASE_STYLE }}>
          <MenuItem label="Sum" onClick={() => insertFunction("SUM")} />
          <MenuItem label="Average" onClick={() => insertFunction("AVERAGE")} />
          <MenuItem label="Count Numbers" onClick={() => insertFunction("COUNT")} />
          <MenuItem label="Max" onClick={() => insertFunction("MAX")} />
          <MenuItem label="Min" onClick={() => insertFunction("MIN")} />
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Fill dropdown ─────────────────────────────────────────────────────────

function FillButton({ commands }: { commands: ReturnType<typeof useSheetCommands> }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPos = usePortalMenu(anchorRef, menuRef, menuOpen, setMenuOpen);

  return (
    <>
      <div ref={anchorRef}>
        <RibbonSplitButton
          icon={<ArrowDown size={14} />}
          tooltip="Fill"
          onClick={() => commands.fillDown()}
          onDropdownClick={() => setMenuOpen((o) => !o)}
          dropdownOpen={menuOpen}
        />
      </div>
      {menuOpen && createPortal(
        <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 10000, ...MENU_BASE_STYLE }}>
          <MenuItem label="Down" onClick={() => { commands.fillDown(); setMenuOpen(false); }} shortcut="Ctrl+D" />
          <MenuItem label="Right" onClick={() => { commands.fillRight(); setMenuOpen(false); }} shortcut="Ctrl+R" />
          <MenuItem label="Up" onClick={() => { commands.fillUp(); setMenuOpen(false); }} />
          <MenuItem label="Left" onClick={() => { commands.fillLeft(); setMenuOpen(false); }} />
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Clear dropdown ────────────────────────────────────────────────────────

function ClearButton({ commands }: { commands: ReturnType<typeof useSheetCommands> }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPos = usePortalMenu(anchorRef, menuRef, menuOpen, setMenuOpen);

  return (
    <>
      <div ref={anchorRef}>
        <RibbonSplitButton
          icon={<Eraser size={14} />}
          tooltip="Clear"
          onClick={() => commands.clearAll()}
          onDropdownClick={() => setMenuOpen((o) => !o)}
          dropdownOpen={menuOpen}
        />
      </div>
      {menuOpen && createPortal(
        <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 10000, ...MENU_BASE_STYLE }}>
          <MenuItem label="Clear All" onClick={() => { commands.clearAll(); setMenuOpen(false); }} />
          <MenuItem label="Clear Formats" onClick={() => { commands.clearFormats(); setMenuOpen(false); }} />
          <MenuItem label="Clear Contents" onClick={() => { commands.clearContents(); setMenuOpen(false); }} shortcut="Del" />
          <MenuDivider />
          <MenuItem label="Clear Comments" onClick={() => setMenuOpen(false)} disabled />
          <MenuItem label="Clear Hyperlinks" onClick={() => setMenuOpen(false)} disabled />
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Sort & Filter dropdown ────────────────────────────────────────────────

function SortFilterButton({ commands }: { commands: ReturnType<typeof useSheetCommands> }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPos = usePortalMenu(anchorRef, menuRef, menuOpen, setMenuOpen);

  return (
    <>
      <div ref={anchorRef}>
        <RibbonSplitButton
          icon={<ArrowUpDown size={14} />}
          tooltip="Sort & Filter"
          onClick={() => commands.sortAscending()}
          onDropdownClick={() => setMenuOpen((o) => !o)}
          dropdownOpen={menuOpen}
        />
      </div>
      {menuOpen && createPortal(
        <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 10000, ...MENU_BASE_STYLE }}>
          <MenuItem label="Sort A to Z" onClick={() => { commands.sortAscending(); setMenuOpen(false); }} />
          <MenuItem label="Sort Z to A" onClick={() => { commands.sortDescending(); setMenuOpen(false); }} />
          <MenuDivider />
          <MenuItem label="Filter" onClick={() => { commands.toggleFilter(); setMenuOpen(false); }} />
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Find & Select dropdown ────────────────────────────────────────────────

function FindSelectButton({ commands }: { commands: ReturnType<typeof useSheetCommands> }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPos = usePortalMenu(anchorRef, menuRef, menuOpen, setMenuOpen);

  return (
    <>
      <div ref={anchorRef}>
        <RibbonSplitButton
          icon={<Search size={14} />}
          tooltip="Find & Select"
          onClick={() => commands.findReplace()}
          onDropdownClick={() => setMenuOpen((o) => !o)}
          dropdownOpen={menuOpen}
        />
      </div>
      {menuOpen && createPortal(
        <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 10000, ...MENU_BASE_STYLE }}>
          <MenuItem label="Find..." onClick={() => { commands.findReplace(); setMenuOpen(false); }} shortcut="Ctrl+F" />
          <MenuItem label="Replace..." onClick={() => { commands.findReplace(); setMenuOpen(false); }} shortcut="Ctrl+H" />
          <MenuDivider />
          <MenuItem label="Go To..." onClick={() => setMenuOpen(false)} disabled />
          <MenuItem label="Go To Special..." onClick={() => setMenuOpen(false)} disabled />
        </div>,
        document.body
      )}
    </>
  );
}

// ─── EditingGroup ──────────────────────────────────────────────────────────

export function EditingGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const selection = useSheetSelection(facadeRef);
  const collapsed = useRibbonCollapsed("Editing");

  return (
    <RibbonGroup label="Editing" minWidth={180} collapsed={collapsed} collapsedIcon={<Sigma size={20} />}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "2px 0" }}>
        {/* Row 1: AutoSum | Fill | Clear */}
        <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
          <AutoSumButton commands={commands} facadeRef={facadeRef} selection={selection} />
          <FillButton commands={commands} />
          <ClearButton commands={commands} />
        </div>
        {/* Row 2: Sort & Filter | Find & Select */}
        <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
          <SortFilterButton commands={commands} />
          <FindSelectButton commands={commands} />
        </div>
      </div>
    </RibbonGroup>
  );
}
