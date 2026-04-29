"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Columns, Zap, Copy, Shield, Combine, GitBranch } from "lucide-react";
import { RibbonGroup, RibbonButton } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";

// ─── Text to Columns Popup ─────────────────────────────────────────────────

const DELIMITERS = [
  { label: "Comma", value: "," },
  { label: "Tab", value: "\t" },
  { label: "Semicolon", value: ";" },
  { label: "Space", value: " " },
];

function TextToColumnsPopup({
  open,
  onClose,
  commands,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  commands: ReturnType<typeof useSheetCommands>;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [customDelimiter, setCustomDelimiter] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);
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
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const btnStyle: React.CSSProperties = {
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

  return createPortal(
    <div
      ref={popupRef}
      style={{
        position: "fixed",
        top: menuPos.top,
        left: menuPos.left,
        minWidth: 200,
        background: "#FFFFFF",
        border: "1px solid #C8C6C4",
        borderRadius: 4,
        boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
        zIndex: 10000,
        padding: "4px 0",
      }}
    >
      <div style={{ fontSize: 11, color: "#666", padding: "4px 12px 6px" }}>
        Choose delimiter
      </div>
      {DELIMITERS.map((d) => (
        <button
          key={d.label}
          onClick={() => {
            commands.textToColumns(d.value);
            onClose();
          }}
          style={btnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#E5F1FB"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          {d.label}
        </button>
      ))}
      <div style={{ height: 1, background: "#E8E8E8", margin: "4px 0" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 12px" }}>
        <input
          type="text"
          placeholder="Custom..."
          value={customDelimiter}
          onChange={(e) => setCustomDelimiter(e.target.value)}
          style={{
            flex: 1,
            height: 24,
            fontSize: 12,
            border: "1px solid #C8C6C4",
            borderRadius: 3,
            padding: "0 6px",
            color: "#333",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && customDelimiter) {
              commands.textToColumns(customDelimiter);
              onClose();
            }
          }}
        />
        <button
          onClick={() => {
            if (customDelimiter) {
              commands.textToColumns(customDelimiter);
              onClose();
            }
          }}
          disabled={!customDelimiter}
          style={{
            height: 24,
            padding: "0 8px",
            fontSize: 11,
            border: "1px solid #C8C6C4",
            borderRadius: 3,
            background: customDelimiter ? "#0078D4" : "#F3F3F3",
            color: customDelimiter ? "#FFFFFF" : "#999",
            cursor: customDelimiter ? "pointer" : "default",
          }}
        >
          OK
        </button>
      </div>
    </div>,
    document.body
  );
}

// ─── Remove Duplicates Popup ───────────────────────────────────────────────

function RemoveDuplicatesPopup({
  open,
  onClose,
  commands,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  commands: ReturnType<typeof useSheetCommands>;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [hasHeaders, setHasHeaders] = useState(true);
  const popupRef = useRef<HTMLDivElement>(null);
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
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={popupRef}
      style={{
        position: "fixed",
        top: menuPos.top,
        left: menuPos.left,
        minWidth: 240,
        background: "#FFFFFF",
        border: "1px solid #C8C6C4",
        borderRadius: 4,
        boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
        zIndex: 10000,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 10 }}>
        Remove Duplicates
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#333", cursor: "pointer", marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={hasHeaders}
          onChange={(e) => setHasHeaders(e.target.checked)}
        />
        My data has headers
      </label>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
        <button
          onClick={onClose}
          style={{
            height: 26,
            padding: "0 12px",
            fontSize: 12,
            border: "1px solid #C8C6C4",
            borderRadius: 3,
            background: "#FFFFFF",
            color: "#333",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const count = commands.removeDuplicates([], hasHeaders);
            onClose();
            import("../../sheet-toast").then(({ emitSheetToast }) => {
              emitSheetToast(
                count === 0 ? "No duplicates found" : `${count} duplicate${count === 1 ? "" : "s"} removed`,
                count === 0 ? "info" : "success",
              );
            });
          }}
          style={{
            height: 26,
            padding: "0 12px",
            fontSize: 12,
            border: "1px solid #0078D4",
            borderRadius: 3,
            background: "#0078D4",
            color: "#FFFFFF",
            cursor: "pointer",
          }}
        >
          OK
        </button>
      </div>
    </div>,
    document.body
  );
}

// ─── DataToolsGroup ────────────────────────────────────────────────────────

export function DataToolsGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const [ttcOpen, setTtcOpen] = useState(false);
  const [rdOpen, setRdOpen] = useState(false);
  const ttcRef = useRef<HTMLDivElement>(null);
  const rdRef = useRef<HTMLDivElement>(null);

  return (
    <RibbonGroup label="Data Tools" minWidth={200}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "2px 0" }}>
        {/* Row 1: Text to Columns, Flash Fill, Remove Duplicates */}
        <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
          <div ref={ttcRef}>
            <RibbonButton
              icon={<Columns size={14} />}
              label="Text to Columns"
              tooltip="Split column by delimiter"
              onClick={() => setTtcOpen((o) => !o)}
              showLabel
              size="sm"
            />
          </div>
          <TextToColumnsPopup
            open={ttcOpen}
            onClose={() => setTtcOpen(false)}
            commands={commands}
            anchorRef={ttcRef}
          />
          <RibbonButton
            icon={<Zap size={14} />}
            label="Flash Fill"
            tooltip="Flash Fill — requires pattern recognition (not available)"
            disabled
            showLabel
            size="sm"
          />
          <div ref={rdRef}>
            <RibbonButton
              icon={<Copy size={14} />}
              label="Remove Duplicates"
              tooltip="Remove duplicate rows"
              onClick={() => setRdOpen((o) => !o)}
              showLabel
              size="sm"
            />
          </div>
          <RemoveDuplicatesPopup
            open={rdOpen}
            onClose={() => setRdOpen(false)}
            commands={commands}
            anchorRef={rdRef}
          />
        </div>

        {/* Row 2: Data Validation, Consolidate, Relationships */}
        <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
          <RibbonButton
            icon={<Shield size={14} />}
            label="Data Validation"
            tooltip="Add data validation to selected cells"
            showLabel
            size="sm"
            onClick={() => {
              try {
                const type = prompt("Validation type (list / number / date / textLength):", "list");
                if (!type) return;
                const normalized = type.trim().toLowerCase();
                if (normalized === "list") {
                  const values = prompt("Enter comma-separated allowed values:");
                  if (values) commands.insertDataValidation("list", { values: values.split(",").map((s: string) => s.trim()) });
                } else if (normalized === "number") {
                  const minStr = prompt("Minimum value:", "0");
                  const maxStr = prompt("Maximum value:", "100");
                  const min = Number(minStr);
                  const max = Number(maxStr);
                  if (!isNaN(min) && !isNaN(max)) commands.insertDataValidation("number", { min, max });
                } else if (normalized === "date") {
                  commands.insertDataValidation("date", {});
                } else if (normalized === "textlength") {
                  const maxStr = prompt("Maximum text length:", "50");
                  const max = Number(maxStr);
                  if (!isNaN(max)) commands.insertDataValidation("textLength", { max });
                }
              } catch { /* silent */ }
            }}
          />
          <RibbonButton
            icon={<Combine size={14} />}
            label="Consolidate"
            tooltip="Consolidate — requires multi-range aggregation (not available)"
            disabled
            showLabel
            size="sm"
          />
          <RibbonButton
            icon={<GitBranch size={14} />}
            label="Relationships"
            tooltip="Relationships — requires data model (not available)"
            disabled
            showLabel
            size="sm"
          />
        </div>
      </div>
    </RibbonGroup>
  );
}
