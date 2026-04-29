"use client";

import { useCallback, useMemo } from "react";
import type { FacadeRef } from "./types";
import { safeExec } from "./types";
import { renderChartSvg, renderSparklineSvg, svgToDataUrl, parseA1Range, type ChartType } from "../../chart-renderer";
import { emitSheetToast } from "../../sheet-toast";

export interface InsertCommands {
  insertImage: (src: string) => Promise<void>;
  insertHyperlink: (url: string, text: string) => void;
  insertComment: (text: string) => void;
  insertChart: (type: ChartType, range: string) => Promise<void>;
  insertSparkline: (range?: string) => Promise<void>;
  insertPivotTable: (range: string) => void;
  insertSymbol: (char: string) => void;
  insertTable: (style: "light" | "medium" | "dark") => void;
  /** Returns the active range in A1 notation (e.g. "A1:D10") or null. */
  getActiveRangeRef: () => string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readRangeData(ws: any, r: { startRow: number; startCol: number; endRow: number; endCol: number }) {
  const rows: Array<Array<string | number>> = [];
  for (let row = r.startRow; row <= r.endRow; row++) {
    const cols: Array<string | number> = [];
    for (let col = r.startCol; col <= r.endCol; col++) {
      const cell = ws.getRange?.(row, col);
      const v = cell?.getValue?.();
      cols.push(typeof v === "number" ? v : (v ?? ""));
    }
    rows.push(cols);
  }
  return rows;
}

export function useInsertCommands(facadeRef: FacadeRef): InsertCommands {
  const insertImage = useCallback(async (src: string) => {
    if (!src) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wb: any = facadeRef.current?.getActiveWorkbook?.();
    const ws = wb?.getActiveSheet?.();
    if (!ws) {
      emitSheetToast("No active sheet", "error");
      return;
    }
    // Anchor to active cell (or A1 fallback)
    const active = wb?.getActiveRange?.()?.getRange?.();
    const col = active?.startColumn ?? 0;
    const row = active?.startRow ?? 0;
    try {
      if (typeof ws.insertImage === "function") {
        const ok = await ws.insertImage(src, col, row);
        if (ok) {
          emitSheetToast("Image inserted", "success");
        } else {
          emitSheetToast("Could not insert image", "error");
        }
      } else {
        safeExec(facadeRef, "sheet.command.insert-float-image", { imageUrl: src });
      }
    } catch (err) {
      console.error("[InsertCommands] insertImage failed:", err);
      emitSheetToast("Image insert failed — check the URL", "error");
    }
  }, [facadeRef]);

  const insertHyperlink = useCallback((url: string, text: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wb: any = facadeRef.current?.getActiveWorkbook?.();
    const ws = wb?.getActiveSheet?.();
    const range = wb?.getActiveRange?.();
    if (!ws || !range) return;

    const display = text || url;

    // Preferred: use the facade method if the hyperlink plugin exposes it
    try {
      const r = range.getRange?.();
      if (r && typeof ws.getRange === "function") {
        const cell = ws.getRange(r.startRow, r.startColumn);
        // Try the facade hyperlink API first
        if (typeof wb.createRichText === "function" && typeof cell.setHyperlink === "function") {
          cell.setHyperlink({ url, label: display });
          return;
        }
      }
    } catch { /* fall through */ }

    // Try the plugin command
    safeExec(facadeRef, "sheet.command.add-hyper-link", { payload: { display, url } });
    // Always set visible text as a safety net so the cell shows something
    try { range.setValue?.(display); } catch { /* */ }
  }, [facadeRef]);

  const insertComment = useCallback((text: string) => {
    if (!text) return;
    safeExec(facadeRef, "sheet.command.add-comment", { text });
  }, [facadeRef]);

  const insertChart = useCallback(async (type: ChartType, rangeRef: string) => {
    const parsed = parseA1Range(rangeRef);
    if (!parsed) {
      emitSheetToast(`Invalid range: ${rangeRef}`, "error");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wb: any = facadeRef.current?.getActiveWorkbook?.();
    const ws = wb?.getActiveSheet?.();
    if (!ws) {
      emitSheetToast("No active sheet", "error");
      return;
    }

    const rows = readRangeData(ws, parsed);
    if (rows.length === 0 || rows[0].length === 0) {
      emitSheetToast("Selected range is empty", "error");
      return;
    }

    // First row = headers when it contains any non-numeric entry; otherwise
    // fall back to generic numeric column names
    const firstRow = rows[0];
    const hasStringHeader = firstRow.some((v) => typeof v !== "number");
    const headerRow = hasStringHeader ? firstRow.map(String) : firstRow.map((_, i) => `Col ${i + 1}`);
    const dataRows = hasStringHeader ? rows.slice(1) : rows;

    // First column = category labels; remaining columns = series
    const categories = dataRows.map((r) => String(r[0] ?? ""));
    const series = headerRow.slice(1).map((name, seriesIdx) => ({
      name,
      data: dataRows.map((r) => {
        const v = r[seriesIdx + 1];
        return typeof v === "number" ? v : Number(v) || 0;
      }),
    }));

    if (series.length === 0) {
      emitSheetToast("Need at least one numeric column", "error");
      return;
    }

    const title = headerRow.length > 1 ? headerRow.slice(1).join(" vs ") : headerRow[0] ?? "";
    const svg = renderChartSvg({ type, title, categories, series });
    const dataUrl = svgToDataUrl(svg);

    // Anchor chart two columns to the right of the range
    const anchorCol = parsed.endCol + 2;
    const anchorRow = parsed.startRow;
    try {
      if (typeof ws.insertImage === "function") {
        const ok = await ws.insertImage(dataUrl, anchorCol, anchorRow);
        if (ok) emitSheetToast(`${type} chart inserted`, "success");
        else emitSheetToast("Chart insert returned false", "error");
      } else {
        emitSheetToast("Drawing plugin not available", "error");
      }
    } catch (err) {
      console.error("[InsertCommands] insertChart failed:", err);
      emitSheetToast("Chart insert failed", "error");
    }
  }, [facadeRef]);

  const insertPivotTable = useCallback((rangeRef: string) => {
    const parsed = parseA1Range(rangeRef);
    if (!parsed) {
      emitSheetToast(`Invalid range: ${rangeRef}`, "error");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wb: any = facadeRef.current?.getActiveWorkbook?.();
    const ws = wb?.getActiveSheet?.();
    if (!ws) return;

    const rows = readRangeData(ws, parsed);
    if (rows.length < 2) {
      emitSheetToast("Pivot needs at least 2 rows", "error");
      return;
    }

    const headers = rows[0].map((v) => String(v ?? ""));
    const dataRows = rows.slice(1);
    const groupIdx = 0;
    const numericIdx = headers.findIndex((_, i) => i > 0 && dataRows.every((r) => typeof r[i] === "number" || r[i] === ""));
    const valueIdx = numericIdx === -1 ? 1 : numericIdx;

    const groups = new Map<string, number>();
    for (const r of dataRows) {
      const key = String(r[groupIdx] ?? "");
      const val = typeof r[valueIdx] === "number" ? (r[valueIdx] as number) : Number(r[valueIdx]) || 0;
      groups.set(key, (groups.get(key) ?? 0) + val);
    }

    const outCol = parsed.endCol + 2;
    const outRowStart = parsed.startRow;
    try {
      ws.getRange?.(outRowStart, outCol)?.setValue?.(headers[groupIdx] || "Group");
      ws.getRange?.(outRowStart, outCol + 1)?.setValue?.(`Sum of ${headers[valueIdx] || "Value"}`);
      let i = 1;
      for (const [key, total] of groups.entries()) {
        ws.getRange?.(outRowStart + i, outCol)?.setValue?.(key);
        ws.getRange?.(outRowStart + i, outCol + 1)?.setValue?.(total);
        i++;
      }
      emitSheetToast(`Pivot table created (${groups.size} groups)`, "success");
    } catch (err) {
      console.error("[InsertCommands] pivot failed:", err);
      emitSheetToast("Pivot insert failed", "error");
    }
  }, [facadeRef]);

  const insertSymbol = useCallback((char: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wb: any = facadeRef.current?.getActiveWorkbook?.();
    const ws = wb?.getActiveSheet?.();
    const range = wb?.getActiveRange?.();
    if (!ws || !range) return;

    const r = range.getRange?.();
    if (!r) return;

    const currentVal = ws.getRange?.(r.startRow, r.startColumn)?.getValue?.();
    const newVal = (currentVal != null ? String(currentVal) : "") + char;
    ws.getRange?.(r.startRow, r.startColumn)?.setValue?.(newVal);
  }, [facadeRef]);

  const insertTable = useCallback((style: "light" | "medium" | "dark") => {
    const TABLE_STYLES = {
      light: { headerBg: "#DDEBF7", headerText: "#1A1A1A", altRowBg: "#F2F2F2", borderColor: "#B4C6E7" },
      medium: { headerBg: "#5B9BD5", headerText: "#FFFFFF", altRowBg: "#D9E1F2", borderColor: "#9BC2E6" },
      dark: { headerBg: "#44546A", headerText: "#FFFFFF", altRowBg: "#D9D9D9", borderColor: "#8497B0" },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wb: any = facadeRef.current?.getActiveWorkbook?.();
    const ws = wb?.getActiveSheet?.();
    const range = wb?.getActiveRange?.();
    if (!ws || !range) return;

    const r = range.getRange?.();
    if (!r) return;

    const { startRow, startColumn, endRow, endColumn } = r;
    const colors = TABLE_STYLES[style];
    const borderEnum = facadeRef.current?.Enum?.BorderType;
    const borderStyle = facadeRef.current?.Enum?.BorderStyleTypes;

    for (let c = startColumn; c <= endColumn; c++) {
      const cell = ws.getRange?.(startRow, c);
      cell?.setBackgroundColor?.(colors.headerBg);
      cell?.setFontColor?.(colors.headerText);
      cell?.setFontWeight?.("bold");
    }

    for (let row = startRow + 1; row <= endRow; row++) {
      const isEven = (row - startRow) % 2 === 0;
      for (let c = startColumn; c <= endColumn; c++) {
        const cell = ws.getRange?.(row, c);
        cell?.setBackgroundColor?.(isEven ? colors.altRowBg : "#FFFFFF");
      }
    }

    if (borderEnum && borderStyle) {
      range.setBorder?.(borderEnum.ALL, borderStyle.THIN, colors.borderColor);
    }
  }, [facadeRef]);

  const getActiveRangeRef = useCallback((): string | null => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wb: any = facadeRef.current?.getActiveWorkbook?.();
    const range = wb?.getActiveRange?.();
    if (!range) return null;
    try {
      if (typeof range.getA1Notation === "function") return range.getA1Notation();
      const r = range.getRange?.();
      if (!r) return null;
      const colLetter = (n: number) => {
        let s = "";
        let x = n;
        do { s = String.fromCharCode(65 + (x % 26)) + s; x = Math.floor(x / 26) - 1; } while (x >= 0);
        return s;
      };
      return `${colLetter(r.startColumn)}${r.startRow + 1}:${colLetter(r.endColumn)}${r.endRow + 1}`;
    } catch {
      return null;
    }
  }, [facadeRef]);

  const insertSparkline = useCallback(async (rangeRef?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wb: any = facadeRef.current?.getActiveWorkbook?.();
    const ws = wb?.getActiveSheet?.();
    if (!ws) return;

    const refStr = rangeRef ?? getActiveRangeRef();
    const parsed = refStr ? parseA1Range(refStr) : null;
    if (!parsed) {
      emitSheetToast("Select a range first", "error");
      return;
    }
    const rows = readRangeData(ws, parsed);
    const values = rows.flat().map((v) => (typeof v === "number" ? v : Number(v) || 0));
    const svg = renderSparklineSvg(values);
    const dataUrl = svgToDataUrl(svg);
    const anchorCol = parsed.endCol + 1;
    const anchorRow = parsed.startRow;
    try {
      if (typeof ws.insertImage === "function") {
        const ok = await ws.insertImage(dataUrl, anchorCol, anchorRow);
        if (ok) emitSheetToast("Sparkline inserted", "success");
      }
    } catch (err) {
      console.error("[InsertCommands] sparkline failed:", err);
      emitSheetToast("Sparkline insert failed", "error");
    }
  }, [facadeRef, getActiveRangeRef]);

  return useMemo(() => ({
    insertImage, insertHyperlink, insertComment, insertChart, insertSparkline,
    insertPivotTable, insertSymbol, insertTable, getActiveRangeRef,
  }), [insertImage, insertHyperlink, insertComment, insertChart, insertSparkline, insertPivotTable, insertSymbol, insertTable, getActiveRangeRef]);
}
