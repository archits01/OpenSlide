"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { RibbonGroup, RibbonButton } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";

function CheckboxButton({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        height: 20,
        padding: "0 6px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: 11,
        color: "#333",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#E5F1FB"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{
        width: 14, height: 14, borderRadius: 2,
        border: "1px solid #888",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: checked ? "#0078D4" : "#FFF",
      }}>
        {checked && <Check size={10} color="#FFF" strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}

export function ViewShowHideGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);

  const [rowHeader, setRowHeader] = useState(true);
  const [colHeader, setColHeader] = useState(true);
  const [vGridlines, setVGridlines] = useState(true);
  const [hGridlines, setHGridlines] = useState(true);
  const [tabStrip, setTabStrip] = useState(true);
  const [newTab, setNewTab] = useState(true);

  return (
    <RibbonGroup label="Show/Hide" minWidth={280}>
      <div style={{ display: "flex", gap: 16, padding: "2px 0" }}>
        {/* Column 1 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <CheckboxButton label="Row Header" checked={rowHeader} onChange={() => { setRowHeader((v) => !v); try { commands.toggleHeadings(); } catch { /* */ } }} />
          <CheckboxButton label="Column Header" checked={colHeader} onChange={() => { setColHeader((v) => !v); try { commands.toggleHeadings(); } catch { /* */ } }} />
        </div>
        {/* Column 2 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <CheckboxButton label="Vertical Gridlines" checked={vGridlines} onChange={() => { setVGridlines((v) => !v); try { commands.toggleGridlines(); } catch { /* */ } }} />
          <CheckboxButton label="Horizontal Gridlines" checked={hGridlines} onChange={() => { setHGridlines((v) => !v); try { commands.toggleGridlines(); } catch { /* */ } }} />
        </div>
        {/* Column 3 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <CheckboxButton label="Tab Strip" checked={tabStrip} onChange={() => setTabStrip((v) => !v)} />
          <CheckboxButton label="New Tab" checked={newTab} onChange={() => setNewTab((v) => !v)} />
        </div>
      </div>
    </RibbonGroup>
  );
}
