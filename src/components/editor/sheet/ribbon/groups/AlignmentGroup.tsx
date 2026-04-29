"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  WrapText, TableCellsMerge,
  IndentIncrease, IndentDecrease,
  RotateCcw,
} from "lucide-react";
import {
  RibbonGroup, RibbonButton, RibbonSplitButton,
  RibbonDropdown, RibbonSeparator,
} from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetSelection } from "../hooks/useSheetSelection";
import { useSheetFacade } from "../SheetFacadeContext";
import { useRibbonCollapsed } from "../RibbonCollapseContext";
import type { SheetSelectionState } from "../hooks/types";

// ─── MergeSplitButton ───────────────────────────────────────────────────────

function MergeSplitButton({
  commands,
  selection,
}: {
  commands: ReturnType<typeof useSheetCommands>;
  selection: SheetSelectionState;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastMerge, setLastMerge] = useState<"all" | "horizontal" | "vertical">("all");
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

  const applyLast = () => {
    if (selection.isMerged) {
      commands.unmergeCells();
    } else {
      commands.mergeCells(lastMerge);
    }
  };

  const MERGE_OPTIONS = [
    { label: "Merge & Center", value: "all" as const },
    { label: "Merge Across", value: "horizontal" as const },
    { label: "Merge Cells", value: "vertical" as const },
    { label: "Unmerge Cells", value: "unmerge" as const },
  ];

  return (
    <>
      <div ref={anchorRef}>
        <RibbonSplitButton
          icon={<TableCellsMerge size={14} />}
          tooltip={selection.isMerged ? "Unmerge Cells" : "Merge & Center"}
          active={selection.isMerged}
          onClick={applyLast}
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
            minWidth: 160,
            background: "#FFFFFF",
            border: "1px solid #C8C6C4",
            borderRadius: 4,
            boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
            zIndex: 10000,
            padding: "4px 0",
          }}
        >
          {MERGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                if (opt.value === "unmerge") {
                  commands.unmergeCells();
                } else {
                  setLastMerge(opt.value);
                  commands.mergeCells(opt.value);
                }
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
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ─── AlignmentGroup ─────────────────────────────────────────────────────────

export function AlignmentGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const selection = useSheetSelection(facadeRef);
  const collapsed = useRibbonCollapsed("Alignment");

  return (
    <RibbonGroup label="Alignment" minWidth={200} collapsed={collapsed} collapsedIcon={<AlignCenter size={20} />}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "2px 0" }}>
        {/* Row 1: Vertical align + Orientation + Wrap */}
        <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
          <RibbonButton
            icon={<AlignStartVertical size={14} />}
            tooltip="Top Align"
            active={selection.verticalAlign === "top"}
            onClick={() => commands.setVerticalAlign("top")}
            size="sm"
          />
          <RibbonButton
            icon={<AlignCenterVertical size={14} />}
            tooltip="Middle Align"
            active={selection.verticalAlign === "middle"}
            onClick={() => commands.setVerticalAlign("middle")}
            size="sm"
          />
          <RibbonButton
            icon={<AlignEndVertical size={14} />}
            tooltip="Bottom Align"
            active={selection.verticalAlign === "bottom"}
            onClick={() => commands.setVerticalAlign("bottom")}
            size="sm"
          />
          <RibbonSeparator />
          <RibbonDropdown
            icon={<RotateCcw size={12} />}
            tooltip="Orientation"
            options={[
              { value: 0, label: "Horizontal" },
              { value: 45, label: "Angle Counterclockwise" },
              { value: -45, label: "Angle Clockwise" },
              { value: 90, label: "Vertical Text" },
              { value: -90, label: "Rotate Text Up" },
            ]}
            onChange={(degrees) => commands.setOrientation(degrees as number)}
            width={80}
          />
          <RibbonButton
            icon={<WrapText size={14} />}
            tooltip="Wrap Text"
            active={selection.isWrapped}
            onClick={() => commands.setWrapText()}
            size="sm"
          />
        </div>

        {/* Row 2: Horizontal align + Indent + Merge */}
        <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
          <RibbonButton
            icon={<AlignLeft size={14} />}
            tooltip="Align Left"
            active={selection.horizontalAlign === "left"}
            onClick={() => commands.setHorizontalAlign("left")}
            size="sm"
          />
          <RibbonButton
            icon={<AlignCenter size={14} />}
            tooltip="Center"
            active={selection.horizontalAlign === "center"}
            onClick={() => commands.setHorizontalAlign("center")}
            size="sm"
          />
          <RibbonButton
            icon={<AlignRight size={14} />}
            tooltip="Align Right"
            active={selection.horizontalAlign === "right"}
            onClick={() => commands.setHorizontalAlign("right")}
            size="sm"
          />
          <RibbonSeparator />
          <RibbonButton
            icon={<IndentDecrease size={14} />}
            tooltip="Decrease Indent"
            onClick={() => commands.decreaseIndent()}
            size="sm"
          />
          <RibbonButton
            icon={<IndentIncrease size={14} />}
            tooltip="Increase Indent"
            onClick={() => commands.increaseIndent()}
            size="sm"
          />
          <RibbonSeparator />
          <MergeSplitButton commands={commands} selection={selection} />
        </div>
      </div>
    </RibbonGroup>
  );
}
