"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { useSheetCommands } from "./ribbon/hooks/useSheetCommands";
import { useSheetFacade } from "./ribbon/SheetFacadeContext";

// ─── Types ─────────────────────────────────────────────────────────────────

type ContextTarget = "cell" | "row-header" | "col-header" | "sheet-tab";

interface MenuPosition {
  x: number;
  y: number;
}

interface MenuItemDef {
  label: string;
  action?: () => void;
  disabled?: boolean;
  divider?: boolean;
  shortcut?: string;
  submenu?: MenuItemDef[];
}

// ─── Menu rendering ────────────────────────────────────────────────────────

const MENU_STYLE: React.CSSProperties = {
  position: "fixed",
  minWidth: 200,
  background: "#FFFFFF",
  border: "1px solid #C8C6C4",
  borderRadius: 6,
  boxShadow: "0 6px 16px rgba(0,0,0,0.14)",
  zIndex: 2000,
  padding: "4px 0",
  fontFamily: "var(--font-geist-sans, system-ui)",
};

const ITEM_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  width: "100%",
  height: 30,
  padding: "0 12px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 12,
  color: "#333",
  textAlign: "left",
};

function MenuItemComponent({ item, onClose }: { item: MenuItemDef; onClose: () => void }) {
  const [subOpen, setSubOpen] = useState(false);

  if (item.divider) {
    return <div style={{ height: 1, background: "#E8E8E8", margin: "4px 0" }} />;
  }

  if (item.submenu) {
    return (
      <div
        style={{ position: "relative" }}
        onMouseEnter={() => setSubOpen(true)}
        onMouseLeave={() => setSubOpen(false)}
      >
        <button
          style={{ ...ITEM_STYLE, opacity: item.disabled ? 0.4 : 1 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#E5F1FB"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <span>{item.label}</span>
          <ChevronRight size={12} style={{ color: "#999" }} />
        </button>
        {subOpen && (
          <div style={{ ...MENU_STYLE, position: "absolute", top: -4, left: "100%", marginLeft: 2 }}>
            {item.submenu.map((sub, i) => (
              <MenuItemComponent key={`${sub.label}-${i}`} item={sub} onClose={onClose} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      disabled={item.disabled}
      onClick={() => {
        item.action?.();
        onClose();
      }}
      style={{ ...ITEM_STYLE, opacity: item.disabled ? 0.4 : 1, cursor: item.disabled ? "not-allowed" : "pointer" }}
      onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = "#E5F1FB"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <span>{item.label}</span>
      {item.shortcut && (
        <span style={{ fontSize: 10, color: "#999", fontFamily: "monospace" }}>{item.shortcut}</span>
      )}
    </button>
  );
}

// ─── Menu builders ─────────────────────────────────────────────────────────

function buildCellMenu(commands: ReturnType<typeof useSheetCommands>): MenuItemDef[] {
  return [
    { label: "Cut", action: () => commands.cut(), shortcut: "Ctrl+X" },
    { label: "Copy", action: () => commands.copy(), shortcut: "Ctrl+C" },
    { label: "Paste", action: () => commands.paste(), shortcut: "Ctrl+V" },
    { label: "", divider: true },
    { label: "Insert Row Above", action: () => commands.insertRowAbove() },
    { label: "Insert Column Left", action: () => commands.insertColumnLeft() },
    { label: "Delete Row", action: () => commands.deleteRow() },
    { label: "Delete Column", action: () => commands.deleteColumn() },
    { label: "", divider: true },
    { label: "Clear Contents", action: () => commands.clearContents() },
    { label: "Clear Formats", action: () => commands.clearFormats() },
    { label: "Clear All", action: () => commands.clearAll() },
    { label: "", divider: true },
    {
      label: "Sort",
      submenu: [
        { label: "Sort A to Z", action: () => commands.sortAscending() },
        { label: "Sort Z to A", action: () => commands.sortDescending() },
      ],
    },
    { label: "Filter", action: () => commands.toggleFilter() },
    { label: "", divider: true },
    { label: "Format Cells...", disabled: true },
  ];
}

function buildRowMenu(commands: ReturnType<typeof useSheetCommands>): MenuItemDef[] {
  return [
    { label: "Cut", action: () => commands.cut(), shortcut: "Ctrl+X" },
    { label: "Copy", action: () => commands.copy(), shortcut: "Ctrl+C" },
    { label: "Paste", action: () => commands.paste(), shortcut: "Ctrl+V" },
    { label: "", divider: true },
    { label: "Insert Row", action: () => commands.insertRowAbove() },
    { label: "Delete Row", action: () => commands.deleteRow() },
    { label: "Clear Contents", action: () => commands.clearContents() },
    { label: "", divider: true },
    {
      label: "Row Height...",
      action: () => {
        const val = prompt("Row height:", "20");
        if (val) commands.setRowHeight(Number(val));
      },
    },
    { label: "AutoFit Row Height", action: () => commands.autofitRowHeight() },
    { label: "Hide Row", action: () => commands.hideRow() },
    { label: "Unhide Row", action: () => commands.unhideRow() },
  ];
}

function buildColMenu(commands: ReturnType<typeof useSheetCommands>): MenuItemDef[] {
  return [
    { label: "Cut", action: () => commands.cut(), shortcut: "Ctrl+X" },
    { label: "Copy", action: () => commands.copy(), shortcut: "Ctrl+C" },
    { label: "Paste", action: () => commands.paste(), shortcut: "Ctrl+V" },
    { label: "", divider: true },
    { label: "Insert Column", action: () => commands.insertColumnLeft() },
    { label: "Delete Column", action: () => commands.deleteColumn() },
    { label: "Clear Contents", action: () => commands.clearContents() },
    { label: "", divider: true },
    {
      label: "Column Width...",
      action: () => {
        const val = prompt("Column width:", "80");
        if (val) commands.setColumnWidth(Number(val));
      },
    },
    { label: "AutoFit Column Width", action: () => commands.autofitColumnWidth() },
    { label: "Hide Column", action: () => commands.hideColumn() },
    { label: "Unhide Column", action: () => commands.unhideColumn() },
  ];
}

function buildSheetTabMenu(
  commands: ReturnType<typeof useSheetCommands>,
  facadeRef: ReturnType<typeof useSheetFacade>,
): MenuItemDef[] {
  return [
    {
      label: "Insert Sheet",
      action: () => {
        try { facadeRef.current?.getActiveWorkbook?.()?.create?.("Sheet", 1000, 26); } catch { /* */ }
      },
    },
    {
      label: "Delete Sheet",
      action: () => {
        try {
          const wb = facadeRef.current?.getActiveWorkbook?.();
          const ws = wb?.getActiveSheet?.();
          if (ws && (wb?.getSheets?.()?.length ?? 1) > 1) ws.delete?.();
        } catch { /* */ }
      },
    },
    {
      label: "Rename Sheet",
      action: () => {
        try {
          const ws = facadeRef.current?.getActiveWorkbook?.()?.getActiveSheet?.();
          if (ws) {
            const name = prompt("Rename sheet:", ws.getSheetName?.() ?? "Sheet1");
            if (name) ws.setName?.(name);
          }
        } catch { /* */ }
      },
    },
    { label: "", divider: true },
    { label: "Move or Copy...", disabled: true },
    { label: "Tab Color", disabled: true },
    { label: "", divider: true },
    { label: "Hide Sheet", disabled: true },
    { label: "Unhide Sheet...", disabled: true },
  ];
}

// ─── Context target detection ──────────────────────────────────────────────

function detectTarget(e: MouseEvent): ContextTarget {
  const target = e.target as HTMLElement;
  // Walk up to find context clues from Univer's DOM
  let el: HTMLElement | null = target;
  while (el) {
    const cls = el.className || "";
    const dataType = el.getAttribute("data-type") || "";
    // Univer row header
    if (cls.includes("univer-row-header") || dataType === "row-header") return "row-header";
    // Univer column header
    if (cls.includes("univer-col-header") || cls.includes("univer-column-header") || dataType === "col-header") return "col-header";
    // Sheet tab
    if (cls.includes("sheet-tab") || cls.includes("univer-sheet-bar") || dataType === "sheet-tab") return "sheet-tab";
    el = el.parentElement;
  }
  return "cell";
}

// ─── SheetContextMenu ──────────────────────────────────────────────────────

export function SheetContextMenu() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const [menuState, setMenuState] = useState<{
    open: boolean;
    pos: MenuPosition;
    target: ContextTarget;
  }>({ open: false, pos: { x: 0, y: 0 }, target: "cell" });
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setMenuState((s) => ({ ...s, open: false })), []);

  // Listen for contextmenu on the sheet canvas shell
  useEffect(() => {
    function onContext(e: MouseEvent) {
      // Only intercept inside .sheet-canvas-shell
      const shell = (e.target as HTMLElement).closest(".sheet-canvas-shell");
      if (!shell) return;
      // Don't intercept on the ribbon itself
      const ribbon = (e.target as HTMLElement).closest(".sheet-ribbon-root");
      if (ribbon) return;

      e.preventDefault();
      const target = detectTarget(e);

      // Flip menu if near screen edge
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const x = e.clientX + 200 > vw ? e.clientX - 200 : e.clientX;
      const y = e.clientY + 300 > vh ? Math.max(0, e.clientY - 300) : e.clientY;

      setMenuState({ open: true, pos: { x, y }, target });
    }

    document.addEventListener("contextmenu", onContext);
    return () => document.removeEventListener("contextmenu", onContext);
  }, []);

  // Close on outside click or Escape
  useEffect(() => {
    if (!menuState.open) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuState.open, close]);

  if (!menuState.open) return null;

  let items: MenuItemDef[];
  switch (menuState.target) {
    case "row-header":
      items = buildRowMenu(commands);
      break;
    case "col-header":
      items = buildColMenu(commands);
      break;
    case "sheet-tab":
      items = buildSheetTabMenu(commands, facadeRef);
      break;
    default:
      items = buildCellMenu(commands);
  }

  return (
    <div
      ref={menuRef}
      style={{
        ...MENU_STYLE,
        left: menuState.pos.x,
        top: menuState.pos.y,
      }}
    >
      {items.map((item, i) => (
        <MenuItemComponent key={`${item.label}-${i}`} item={item} onClose={close} />
      ))}
    </div>
  );
}
