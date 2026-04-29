"use client";

import { useCallback, useMemo } from "react";
import type { FacadeRef } from "./types";

function getWorksheet(facadeRef: FacadeRef) {
  return facadeRef.current?.getActiveWorkbook?.()?.getActiveSheet?.() ?? null;
}

function getSelectionRow(facadeRef: FacadeRef) {
  const range = facadeRef.current?.getActiveWorkbook?.()?.getActiveRange?.()?.getRange?.();
  return range?.startRow ?? 0;
}

function getSelectionCol(facadeRef: FacadeRef) {
  const range = facadeRef.current?.getActiveWorkbook?.()?.getActiveRange?.()?.getRange?.();
  return range?.startColumn ?? 0;
}

export interface CellsCommands {
  insertRowAbove: () => void;
  insertRowBelow: () => void;
  insertColumnLeft: () => void;
  insertColumnRight: () => void;
  deleteRow: () => void;
  deleteColumn: () => void;
  setRowHeight: (height: number) => void;
  setColumnWidth: (width: number) => void;
  autofitColumnWidth: () => void;
  autofitRowHeight: () => void;
  hideRow: () => void;
  hideColumn: () => void;
  unhideRow: () => void;
  unhideColumn: () => void;
}

/** Measure text width in pixels using a canvas context */
function measureTextWidth(text: string, fontFamily: string, fontSize: number): number {
  if (typeof document === "undefined") return text.length * 8;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return text.length * 8;
  ctx.font = `${fontSize}px ${fontFamily || "Arial"}`;
  return ctx.measureText(text).width;
}

export function useCellsCommands(facadeRef: FacadeRef): CellsCommands {
  const insertRowAbove = useCallback(() => {
    getWorksheet(facadeRef)?.insertRowBefore?.(getSelectionRow(facadeRef));
  }, [facadeRef]);

  const insertRowBelow = useCallback(() => {
    getWorksheet(facadeRef)?.insertRowAfter?.(getSelectionRow(facadeRef));
  }, [facadeRef]);

  const insertColumnLeft = useCallback(() => {
    getWorksheet(facadeRef)?.insertColumnBefore?.(getSelectionCol(facadeRef));
  }, [facadeRef]);

  const insertColumnRight = useCallback(() => {
    getWorksheet(facadeRef)?.insertColumnAfter?.(getSelectionCol(facadeRef));
  }, [facadeRef]);

  const deleteRow = useCallback(() => {
    getWorksheet(facadeRef)?.deleteRow?.(getSelectionRow(facadeRef));
  }, [facadeRef]);

  const deleteColumn = useCallback(() => {
    getWorksheet(facadeRef)?.deleteColumn?.(getSelectionCol(facadeRef));
  }, [facadeRef]);

  const setRowHeight = useCallback((height: number) => {
    getWorksheet(facadeRef)?.setRowHeight?.(getSelectionRow(facadeRef), height);
  }, [facadeRef]);

  const setColumnWidth = useCallback((width: number) => {
    getWorksheet(facadeRef)?.setColumnWidth?.(getSelectionCol(facadeRef), width);
  }, [facadeRef]);

  const autofitColumnWidth = useCallback(() => {
    const ws = getWorksheet(facadeRef);
    if (!ws) return;
    const col = getSelectionCol(facadeRef);
    const maxRows = ws.getMaxRows?.() ?? 100;
    let maxWidth = 40; // minimum

    for (let r = 0; r < Math.min(maxRows, 200); r++) {
      const cell = ws.getRange?.(r, col);
      const display = cell?.getDisplayValue?.() ?? "";
      if (!display) continue;
      const style = cell?.getCellStyleData?.();
      const fontSize = style?.fs ?? 11;
      const fontFamily = style?.ff ?? "Arial";
      const w = measureTextWidth(display, fontFamily, fontSize) + 16;
      if (w > maxWidth) maxWidth = w;
    }

    ws.setColumnWidth?.(col, Math.min(400, Math.ceil(maxWidth)));
  }, [facadeRef]);

  const autofitRowHeight = useCallback(() => {
    const ws = getWorksheet(facadeRef);
    if (!ws) return;
    const row = getSelectionRow(facadeRef);
    ws.setRowAutoHeight?.(row, 1);
  }, [facadeRef]);

  const hideRow = useCallback(() => {
    getWorksheet(facadeRef)?.hideRows?.(getSelectionRow(facadeRef), 1);
  }, [facadeRef]);

  const hideColumn = useCallback(() => {
    getWorksheet(facadeRef)?.hideColumns?.(getSelectionCol(facadeRef), 1);
  }, [facadeRef]);

  const unhideRow = useCallback(() => {
    getWorksheet(facadeRef)?.showRows?.(getSelectionRow(facadeRef), 1);
  }, [facadeRef]);

  const unhideColumn = useCallback(() => {
    getWorksheet(facadeRef)?.showColumns?.(getSelectionCol(facadeRef), 1);
  }, [facadeRef]);

  return useMemo(() => ({
    insertRowAbove, insertRowBelow, insertColumnLeft, insertColumnRight,
    deleteRow, deleteColumn, setRowHeight, setColumnWidth,
    autofitColumnWidth, autofitRowHeight,
    hideRow, hideColumn, unhideRow, unhideColumn,
  }), [insertRowAbove, insertRowBelow, insertColumnLeft, insertColumnRight, deleteRow, deleteColumn, setRowHeight, setColumnWidth, autofitColumnWidth, autofitRowHeight, hideRow, hideColumn, unhideRow, unhideColumn]);
}
