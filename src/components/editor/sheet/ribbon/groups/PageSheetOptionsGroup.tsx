"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Settings } from "lucide-react";
import { RibbonGroup, RibbonButtonLarge } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", fontSize: 12, color: "#333", cursor: "pointer" }}>
      {label}
      <input type="checkbox" checked={checked} onChange={onChange} />
    </label>
  );
}

export function PageSheetOptionsGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 2, left: rect.left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && anchorRef.current && !anchorRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <RibbonGroup label="Sheet Options">
      <div style={{ display: "flex", gap: 2, alignItems: "flex-start", padding: "2px 0" }}>
        <div ref={anchorRef}>
          <RibbonButtonLarge
            icon={<Settings size={20} />}
            label="Sheet Options"
            tooltip="Gridlines and headings settings"
            onClick={() => setOpen((o) => !o)}
          />
        </div>
        {open && createPortal(
          <div ref={menuRef} style={{ position: "fixed", top: pos.top, left: pos.left, width: 240, background: "#FFF", border: "1px solid #C8C6C4", borderRadius: 6, boxShadow: "0 4px 8px rgba(0,0,0,0.12)", zIndex: 10000, padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Sheet Options</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 4 }}>Gridlines</div>
            <ToggleRow label="View" checked={commands.layoutState.gridlinesView} onChange={() => commands.toggleGridlinesView()} />
            <ToggleRow label="Print" checked={commands.layoutState.gridlinesPrint} onChange={() => commands.toggleGridlinesPrint()} />
            <div style={{ fontSize: 11, fontWeight: 600, color: "#666", marginTop: 8, marginBottom: 4 }}>Headings</div>
            <ToggleRow label="View" checked={commands.layoutState.headingsView} onChange={() => commands.toggleHeadingsView()} />
            <ToggleRow label="Print" checked={commands.layoutState.headingsPrint} onChange={() => commands.toggleHeadingsPrint()} />
          </div>,
          document.body
        )}
      </div>
    </RibbonGroup>
  );
}
