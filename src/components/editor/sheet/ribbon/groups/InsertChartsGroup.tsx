"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { BarChart3, LineChart, PieChart, ScatterChart, BarChartBig, AreaChart } from "lucide-react";
import { RibbonGroup, RibbonButton, RibbonButtonLarge } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";
import { emitSheetToast } from "../../sheet-toast";
import type { ChartType } from "../../chart-renderer";

// ─── Custom icons ───────────────────────────────────────────────────────────

function BarcodeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="3" y1="3" x2="3" y2="17" /><line x1="6" y1="3" x2="6" y2="17" />
      <line x1="8" y1="3" x2="8" y2="17" strokeWidth="2" /><line x1="11" y1="3" x2="11" y2="17" />
      <line x1="14" y1="3" x2="14" y2="17" strokeWidth="2" /><line x1="17" y1="3" x2="17" y2="17" />
    </svg>
  );
}

function SparklineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,14 6,8 9,12 12,5 15,10 18,6" />
    </svg>
  );
}

// ─── Chart picker popup (uses active selection by default) ──────────────────

const CHART_TYPES: Array<{ type: ChartType; label: string; icon: React.ReactNode }> = [
  { type: "column", label: "Column", icon: <BarChart3 size={16} /> },
  { type: "bar", label: "Bar", icon: <BarChartBig size={16} style={{ transform: "rotate(90deg)" }} /> },
  { type: "line", label: "Line", icon: <LineChart size={16} /> },
  { type: "pie", label: "Pie", icon: <PieChart size={16} /> },
  { type: "area", label: "Area", icon: <AreaChart size={16} /> },
  { type: "scatter", label: "Scatter", icon: <ScatterChart size={16} /> },
];

function ChartPickerPopup({ open, onClose, anchorRef, commands }: {
  open: boolean; onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  commands: ReturnType<typeof useSheetCommands>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [customRange, setCustomRange] = useState("");

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 2, left: rect.left });
    setCustomRange(commands.getActiveRangeRef?.() ?? "");
  }, [open, anchorRef, commands]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) && anchorRef.current && !anchorRef.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const submit = (type: ChartType) => {
    const r = customRange.trim();
    if (!r) { emitSheetToast("Select a range first", "error"); return; }
    commands.insertChart(type, r);
    onClose();
  };

  return createPortal(
    <div ref={ref} style={{ position: "fixed", top: pos.top, left: pos.left, minWidth: 240, background: "#FFF", border: "1px solid #C8C6C4", borderRadius: 6, boxShadow: "0 4px 8px rgba(0,0,0,0.12)", zIndex: 10000, padding: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#333", marginBottom: 8, padding: "0 4px" }}>Insert Chart</div>
      <div style={{ marginBottom: 10, padding: "0 4px" }}>
        <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 3 }}>Data range</label>
        <input
          value={customRange}
          onChange={(e) => setCustomRange(e.target.value)}
          placeholder="e.g. A1:D10"
          style={{ width: "100%", height: 24, padding: "0 6px", fontSize: 11, border: "1px solid #D0D0D0", borderRadius: 3, fontFamily: "var(--font-geist-mono, monospace)" }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
        {CHART_TYPES.map((ct) => (
          <button key={ct.type} onClick={() => submit(ct.type)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: 8, border: "1px solid transparent", borderRadius: 4, background: "transparent", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.border = "1px solid #B4C6E7"; e.currentTarget.style.background = "#F0F6FF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.border = "1px solid transparent"; e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ display: "flex", color: "#555" }}>{ct.icon}</span>
            <span style={{ fontSize: 10, color: "#555" }}>{ct.label}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}

// ─── InsertChartsGroup ──────────────────────────────────────────────────────

export function InsertChartsGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const [pickerOpen, setPickerOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const quickChart = (type: ChartType) => {
    const r = commands.getActiveRangeRef?.();
    if (!r) { emitSheetToast("Select a range first", "error"); return; }
    commands.insertChart(type, r);
  };

  return (
    <RibbonGroup label="Charts">
      <div style={{ display: "flex", gap: 2, alignItems: "flex-start", padding: "2px 0" }}>
        <div ref={anchorRef}>
          <RibbonButtonLarge
            icon={<BarChartBig size={20} />}
            label="Charts"
            tooltip="Insert Chart"
            onClick={() => setPickerOpen((o) => !o)}
            onDropdownClick={() => setPickerOpen((o) => !o)}
          />
        </div>
        <ChartPickerPopup open={pickerOpen} onClose={() => setPickerOpen(false)} anchorRef={anchorRef} commands={commands} />

        <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "2px 0" }}>
          <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
            <RibbonButton icon={<BarChart3 size={14} />} tooltip="Column Chart (uses active selection)" onClick={() => quickChart("column")} size="sm" />
            <RibbonButton icon={<LineChart size={14} />} tooltip="Line Chart (uses active selection)" onClick={() => quickChart("line")} size="sm" />
            <RibbonButton icon={<PieChart size={14} />} tooltip="Pie Chart (uses active selection)" onClick={() => quickChart("pie")} size="sm" />
          </div>
          <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
            <RibbonButton icon={<BarcodeIcon />} tooltip="Barcode — requires barcode plugin (not available)" disabled size="sm" />
            <RibbonButton
              icon={<SparklineIcon />}
              tooltip="Sparkline (uses active selection)"
              onClick={() => commands.insertSparkline()}
              size="sm"
            />
          </div>
        </div>
      </div>
    </RibbonGroup>
  );
}
