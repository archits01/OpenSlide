"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Lightbulb } from "lucide-react";
import { searchActions, type RibbonAction } from "./action-registry";
import { useSheetCommands } from "./hooks/useSheetCommands";
import { useSheetFacade } from "./SheetFacadeContext";
import { SHEET_TOKENS } from "../sheet-tokens";

const t = SHEET_TOKENS.ribbon;

/**
 * Maps action IDs to command executions.
 * Returns a function that executes the action.
 */
function useActionExecutor() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);

  return useCallback((actionId: string) => {
    const map: Record<string, () => void> = {
      // Clipboard
      paste: () => commands.paste(),
      cut: () => commands.cut(),
      copy: () => commands.copy(),
      formatPainter: () => commands.startFormatPainter(),
      // Font
      bold: () => commands.setBold(),
      italic: () => commands.setItalic(),
      underline: () => commands.setUnderline(),
      strikethrough: () => commands.setStrikethrough(),
      fontColor: () => commands.setFontColor("#FF0000"),
      fillColor: () => commands.setFillColor("#FFFF00"),
      clearFormatting: () => commands.clearFormatting(),
      // Alignment
      alignLeft: () => commands.setHorizontalAlign("left"),
      alignCenter: () => commands.setHorizontalAlign("center"),
      alignRight: () => commands.setHorizontalAlign("right"),
      topAlign: () => commands.setVerticalAlign("top"),
      middleAlign: () => commands.setVerticalAlign("middle"),
      bottomAlign: () => commands.setVerticalAlign("bottom"),
      wrapText: () => commands.setWrapText(),
      mergeCells: () => commands.mergeCells("all"),
      increaseIndent: () => commands.increaseIndent(),
      decreaseIndent: () => commands.decreaseIndent(),
      // Number
      currency: () => commands.setCurrency("USD"),
      percent: () => commands.setPercent(),
      comma: () => commands.setComma(),
      increaseDecimal: () => commands.increaseDecimal(),
      decreaseDecimal: () => commands.decreaseDecimal(),
      // Styles
      formatAsTable: () => commands.formatAsTable("light"),
      // Cells
      insertRow: () => commands.insertRowAbove(),
      insertColumn: () => commands.insertColumnLeft(),
      deleteRow: () => commands.deleteRow(),
      deleteColumn: () => commands.deleteColumn(),
      autofitColumn: () => commands.autofitColumnWidth(),
      autofitRow: () => commands.autofitRowHeight(),
      hideRow: () => commands.hideRow(),
      hideColumn: () => commands.hideColumn(),
      unhideRow: () => commands.unhideRow(),
      unhideColumn: () => commands.unhideColumn(),
      // Editing
      autoSum: () => commands.autoSum(),
      fillDown: () => commands.fillDown(),
      fillRight: () => commands.fillRight(),
      clearAll: () => commands.clearAll(),
      clearFormats: () => commands.clearFormats(),
      clearContents: () => commands.clearContents(),
      sortAsc: () => commands.sortAscending(),
      sortDesc: () => commands.sortDescending(),
      filter: () => commands.toggleFilter(),
      find: () => commands.findReplace(),
      replace: () => commands.findReplace(),
      // General
      undo: () => commands.undo(),
      redo: () => commands.redo(),
    };
    map[actionId]?.();
  }, [commands]);
}

export function TellMeSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RibbonAction[]>([]);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const executeAction = useActionExecutor();

  // Update results on query change
  useEffect(() => {
    const r = searchActions(query);
    setResults(r);
    setFocusIndex(r.length > 0 ? 0 : -1);
    setOpen(query.length > 0 && r.length > 0);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Global shortcut: Ctrl+Alt+Q
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const selectAction = useCallback((action: RibbonAction) => {
    executeAction(action.id);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }, [executeAction]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && focusIndex >= 0) {
      e.preventDefault();
      selectAction(results[focusIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  }, [open, focusIndex, results, selectAction]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          width: 220,
          height: 22,
          padding: "0 8px",
          background: "#F8F8F8",
          border: `1px solid ${open ? t.dropdownBorder : "#E0E0E0"}`,
          borderRadius: 3,
          fontSize: 11,
        }}
      >
        <Lightbulb size={12} style={{ color: "#999", flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query && results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Tell me what you want to do"
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontSize: 11,
            color: "#333",
            outline: "none",
          }}
        />
      </div>

      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            width: 300,
            background: t.dropdownBg,
            border: `1px solid ${t.dropdownBorder}`,
            borderRadius: 6,
            boxShadow: t.dropdownShadow,
            zIndex: 1200,
            padding: "4px 0",
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {results.map((action, i) => (
            <button
              key={action.id}
              onClick={() => selectAction(action)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                width: "100%",
                height: 32,
                padding: "0 12px",
                border: "none",
                background: i === focusIndex ? t.buttonHoverBg : "transparent",
                cursor: "pointer",
                fontSize: 12,
                color: "#333",
                textAlign: "left",
              }}
              onMouseEnter={() => setFocusIndex(i)}
            >
              <span style={{ fontWeight: 500 }}>{action.label}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: "#999" }}>
                  {action.tab} &gt; {action.group}
                </span>
                {action.shortcut && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "#666",
                      background: "#F0F0F0",
                      padding: "1px 4px",
                      borderRadius: 2,
                      fontFamily: "monospace",
                    }}
                  >
                    {action.shortcut}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
