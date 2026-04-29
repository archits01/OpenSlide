"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Minus, Settings, ChevronRight } from "lucide-react";
import { RibbonGroup, RibbonButtonLarge, InputPopover } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";
import { useRibbonCollapsed } from "../RibbonCollapseContext";

// ─── Shared dropdown menu styles ───────────────────────────────────────────

const MENU_BASE_STYLE: React.CSSProperties = {
  minWidth: 190,
  background: "#FFFFFF",
  border: "1px solid #C8C6C4",
  borderRadius: 4,
  boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
  padding: "4px 0",
};

const SUB_MENU_STYLE: React.CSSProperties = {
  position: "absolute",
  top: -4,
  left: "100%",
  marginLeft: 2,
  minWidth: 180,
  background: "#FFFFFF",
  border: "1px solid #C8C6C4",
  borderRadius: 4,
  boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
  zIndex: 10001,
  padding: "4px 0",
};

const ITEM_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
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

const DIVIDER_STYLE: React.CSSProperties = {
  height: 1,
  background: "#E8E8E8",
  margin: "4px 0",
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

// ─── MenuItem helpers ──────────────────────────────────────────────────────

function MenuItem({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...ITEM_STYLE, opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#E5F1FB"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {label}
    </button>
  );
}

function MenuDivider() {
  return <div style={DIVIDER_STYLE} />;
}

function SubMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        style={ITEM_STYLE}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#E5F1FB"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <span>{label}</span>
        <ChevronRight size={12} style={{ color: "#999" }} />
      </button>
      {open && <div style={SUB_MENU_STYLE}>{children}</div>}
    </div>
  );
}

// ─── Insert dropdown ───────────────────────────────────────────────────────

function InsertDropdown({ commands, facadeRef }: { commands: ReturnType<typeof useSheetCommands>; facadeRef: ReturnType<typeof useSheetFacade> }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPos = usePortalMenu(anchorRef, menuRef, open, setOpen);

  const insertSheet = () => {
    try {
      const wb = facadeRef.current?.getActiveWorkbook?.();
      wb?.create?.("Sheet", 1000, 26);
    } catch { /* facade API may differ */ }
    setOpen(false);
  };

  return (
    <>
      <div ref={anchorRef}>
        <RibbonButtonLarge
          icon={<Plus size={18} />}
          label="Insert"
          tooltip="Insert"
          onClick={() => commands.insertRowAbove()}
          onDropdownClick={() => setOpen((o) => !o)}
        />
      </div>
      {open && createPortal(
        <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 10000, ...MENU_BASE_STYLE }}>
          <MenuItem label="Insert Sheet Rows" onClick={() => { commands.insertRowAbove(); setOpen(false); }} />
          <MenuItem label="Insert Sheet Columns" onClick={() => { commands.insertColumnLeft(); setOpen(false); }} />
          <MenuDivider />
          <MenuItem label="Insert Sheet" onClick={insertSheet} />
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Delete dropdown ───────────────────────────────────────────────────────

function DeleteDropdown({ commands, facadeRef }: { commands: ReturnType<typeof useSheetCommands>; facadeRef: ReturnType<typeof useSheetFacade> }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPos = usePortalMenu(anchorRef, menuRef, open, setOpen);

  const deleteSheet = () => {
    try {
      const wb = facadeRef.current?.getActiveWorkbook?.();
      const ws = wb?.getActiveSheet?.();
      if (ws) {
        const sheetCount = wb?.getSheets?.()?.length ?? 1;
        if (sheetCount > 1) {
          ws.delete?.();
        }
      }
    } catch { /* */ }
    setOpen(false);
  };

  return (
    <>
      <div ref={anchorRef}>
        <RibbonButtonLarge
          icon={<Minus size={18} />}
          label="Delete"
          tooltip="Delete"
          onClick={() => commands.deleteRow()}
          onDropdownClick={() => setOpen((o) => !o)}
        />
      </div>
      {open && createPortal(
        <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 10000, ...MENU_BASE_STYLE }}>
          <MenuItem label="Delete Sheet Rows" onClick={() => { commands.deleteRow(); setOpen(false); }} />
          <MenuItem label="Delete Sheet Columns" onClick={() => { commands.deleteColumn(); setOpen(false); }} />
          <MenuDivider />
          <MenuItem label="Delete Sheet" onClick={deleteSheet} />
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Format dropdown ───────────────────────────────────────────────────────

function FormatDropdown({ commands, facadeRef }: { commands: ReturnType<typeof useSheetCommands>; facadeRef: ReturnType<typeof useSheetFacade> }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPos = usePortalMenu(anchorRef, menuRef, open, setOpen);

  // Popover state for formerly prompt()-based inputs
  const [rowHeightOpen, setRowHeightOpen] = useState(false);
  const [colWidthOpen, setColWidthOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [currentSheetName, setCurrentSheetName] = useState("Sheet1");

  const openRowHeight = () => { setOpen(false); setRowHeightOpen(true); };
  const openColWidth = () => { setOpen(false); setColWidthOpen(true); };
  const openRename = () => {
    try {
      const wb = facadeRef.current?.getActiveWorkbook?.();
      const ws = wb?.getActiveSheet?.();
      setCurrentSheetName(ws?.getSheetName?.() ?? "Sheet1");
    } catch { /* */ }
    setOpen(false);
    setRenameOpen(true);
  };

  const applyRowHeight = (v: string) => {
    const n = Number(v);
    if (!isNaN(n) && n > 0) commands.setRowHeight(n);
  };
  const applyColumnWidth = (v: string) => {
    const n = Number(v);
    if (!isNaN(n) && n > 0) commands.setColumnWidth(n);
  };
  const applyRename = (v: string) => {
    try {
      const wb = facadeRef.current?.getActiveWorkbook?.();
      const ws = wb?.getActiveSheet?.();
      ws?.setName?.(v);
    } catch { /* */ }
  };

  return (
    <>
      <div ref={anchorRef}>
        <RibbonButtonLarge
          icon={<Settings size={18} />}
          label="Format"
          tooltip="Format"
          onClick={() => setOpen((o) => !o)}
          onDropdownClick={() => setOpen((o) => !o)}
        />
      </div>
      <InputPopover
        open={rowHeightOpen}
        anchorRef={anchorRef}
        title="Row Height"
        label="Height (pixels)"
        defaultValue="20"
        inputType="number"
        onSubmit={applyRowHeight}
        onClose={() => setRowHeightOpen(false)}
      />
      <InputPopover
        open={colWidthOpen}
        anchorRef={anchorRef}
        title="Column Width"
        label="Width (pixels)"
        defaultValue="80"
        inputType="number"
        onSubmit={applyColumnWidth}
        onClose={() => setColWidthOpen(false)}
      />
      <InputPopover
        open={renameOpen}
        anchorRef={anchorRef}
        title="Rename Sheet"
        label="Sheet name"
        defaultValue={currentSheetName}
        onSubmit={applyRename}
        onClose={() => setRenameOpen(false)}
      />
      {open && createPortal(
        <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 10000, ...MENU_BASE_STYLE }}>
          <MenuItem label="Row Height..." onClick={openRowHeight} />
          <MenuItem label="AutoFit Row Height" onClick={() => { commands.autofitRowHeight(); setOpen(false); }} />
          <MenuItem label="Column Width..." onClick={openColWidth} />
          <MenuItem label="AutoFit Column Width" onClick={() => { commands.autofitColumnWidth(); setOpen(false); }} />
          <MenuDivider />
          <SubMenu label="Hide & Unhide">
            <MenuItem label="Hide Rows" onClick={() => { commands.hideRow(); setOpen(false); }} />
            <MenuItem label="Hide Columns" onClick={() => { commands.hideColumn(); setOpen(false); }} />
            <MenuDivider />
            <MenuItem label="Unhide Rows" onClick={() => { commands.unhideRow(); setOpen(false); }} />
            <MenuItem label="Unhide Columns" onClick={() => { commands.unhideColumn(); setOpen(false); }} />
          </SubMenu>
          <MenuDivider />
          <SubMenu label="Organize Sheets">
            <MenuItem label="Rename Sheet" onClick={openRename} />
            <MenuItem label="Move or Copy Sheet..." onClick={() => setOpen(false)} disabled />
            <MenuItem label="Tab Color" onClick={() => setOpen(false)} disabled />
          </SubMenu>
          <MenuDivider />
          <MenuItem label="Protection" onClick={() => setOpen(false)} disabled />
        </div>,
        document.body
      )}
    </>
  );
}

// ─── CellsGroup ────────────────────────────────────────────────────────────

export function CellsGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const collapsed = useRibbonCollapsed("Cells");

  return (
    <RibbonGroup label="Cells" minWidth={140} collapsed={collapsed} collapsedIcon={<Settings size={20} />}>
      <div style={{ display: "flex", gap: 2, alignItems: "stretch", padding: "2px 0" }}>
        <InsertDropdown commands={commands} facadeRef={facadeRef} />
        <DeleteDropdown commands={commands} facadeRef={facadeRef} />
        <FormatDropdown commands={commands} facadeRef={facadeRef} />
      </div>
    </RibbonGroup>
  );
}
