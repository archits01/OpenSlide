"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpDown, Filter, X, RotateCcw,
} from "lucide-react";
import { RibbonGroup, RibbonButton, RibbonButtonLarge } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";

// ─── Custom Sort Dialog ────────────────────────────────────────────────────

function CustomSortDialog({ open, onClose, commands, anchorRef }: {
  open: boolean; onClose: () => void;
  commands: ReturnType<typeof useSheetCommands>;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [column, setColumn] = useState(0);
  const [ascending, setAscending] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 2, left: rect.left });
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node) && anchorRef.current && !anchorRef.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const COLUMNS = Array.from({ length: 26 }, (_, i) => ({ value: i, label: `Column ${String.fromCharCode(65 + i)}` }));

  return createPortal(
    <div ref={dialogRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, minWidth: 260, background: "#FFF", border: "1px solid #C8C6C4", borderRadius: 4, boxShadow: "0 4px 8px rgba(0,0,0,0.12)", zIndex: 10000, padding: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 10 }}>Sort</div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Sort by</label>
        <select value={column} onChange={(e) => setColumn(Number(e.target.value))} style={{ width: "100%", height: 28, fontSize: 12, border: "1px solid #C8C6C4", borderRadius: 3, padding: "0 6px" }}>
          {COLUMNS.map((col) => <option key={col.value} value={col.value}>{col.label}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Order</label>
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer" }}>
            <input type="radio" checked={ascending} onChange={() => setAscending(true)} /> Ascending
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer" }}>
            <input type="radio" checked={!ascending} onChange={() => setAscending(false)} /> Descending
          </label>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
        <button onClick={onClose} style={{ height: 26, padding: "0 12px", fontSize: 12, border: "1px solid #C8C6C4", borderRadius: 3, background: "#FFF", cursor: "pointer" }}>Cancel</button>
        <button onClick={() => { commands.sortCustom({ keys: [{ column, ascending }] }); onClose(); }} style={{ height: 26, padding: "0 12px", fontSize: 12, border: "1px solid #0078D4", borderRadius: 3, background: "#0078D4", color: "#FFF", cursor: "pointer" }}>OK</button>
      </div>
    </div>,
    document.body
  );
}

// ─── DataSortFilterGroup ───────────────────────────────────────────────────

export function DataSortFilterGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  return (
    <RibbonGroup label="Sort & Filter" minWidth={180}>
      <div style={{ display: "flex", gap: 2, alignItems: "flex-start", padding: "2px 0" }}>
        {/* Sort — large button with dropdown for custom sort */}
        <div ref={sortRef}>
          <RibbonButtonLarge
            icon={<ArrowUpDown size={20} />}
            label="Sort"
            tooltip="Sort"
            onClick={() => commands.sortAscending()}
            onDropdownClick={() => setSortDialogOpen((o) => !o)}
          />
        </div>
        <CustomSortDialog open={sortDialogOpen} onClose={() => setSortDialogOpen(false)} commands={commands} anchorRef={sortRef} />

        {/* Filter — large button */}
        <RibbonButtonLarge
          icon={<Filter size={20} />}
          label="Filter"
          tooltip="Toggle Auto Filter"
          onClick={() => commands.toggleFilter()}
        />

        {/* Clear + Reapply stacked */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
          <RibbonButton
            icon={<X size={14} />}
            label="Clear"
            tooltip="Clear Filter"
            onClick={() => commands.clearFilter()}
            showLabel
            size="sm"
          />
          <RibbonButton
            icon={<RotateCcw size={14} />}
            label="Reapply"
            tooltip="Reapply Filter"
            onClick={() => commands.reapplyFilter()}
            showLabel
            size="sm"
          />
        </div>
      </div>
    </RibbonGroup>
  );
}
