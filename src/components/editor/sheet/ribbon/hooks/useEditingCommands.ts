"use client";

import { useCallback, useMemo } from "react";
import type { FacadeRef } from "./types";
import { colToA1, safeExec } from "./types";

function getActiveRange(facadeRef: FacadeRef) {
  return facadeRef.current?.getActiveWorkbook?.()?.getActiveRange?.() ?? null;
}

export interface EditingCommands {
  autoSum: () => void;
  fillDown: () => void;
  fillRight: () => void;
  fillUp: () => void;
  fillLeft: () => void;
  clearAll: () => void;
  clearFormats: () => void;
  clearContents: () => void;
  sortAscending: () => void;
  sortDescending: () => void;
  findReplace: () => void;
  toggleFilter: () => void;
}

export function useEditingCommands(facadeRef: FacadeRef): EditingCommands {
  const autoSum = useCallback(() => {
    const wb = facadeRef.current?.getActiveWorkbook?.();
    const ws = wb?.getActiveSheet?.();
    const range = wb?.getActiveRange?.();
    if (!ws || !range) return;

    const r = range.getRange?.();
    const row = r?.startRow ?? 0;
    const col = r?.startColumn ?? 0;

    // Find contiguous numbers above the active cell
    let startRow = row - 1;
    while (startRow >= 0) {
      const val = ws.getRange?.(startRow, col)?.getValue?.();
      if (typeof val !== "number") break;
      startRow--;
    }
    startRow++;

    if (startRow < row) {
      const formula = `=SUM(${colToA1(col)}${startRow + 1}:${colToA1(col)}${row})`;
      ws.getRange?.(row, col)?.setValue?.({ f: formula });
    }
  }, [facadeRef]);

  const fillDown = useCallback(() => {
    const range = getActiveRange(facadeRef);
    if (!range) return;
    try {
      const r = range.getRange?.();
      if (r && r.endRow > r.startRow) {
        const ws = facadeRef.current?.getActiveWorkbook?.()?.getActiveSheet?.();
        const targetRange = ws?.getRange?.(r.startRow + 1, r.startColumn, r.endRow - r.startRow, r.endColumn - r.startColumn + 1);
        if (targetRange) range.autoFill?.(targetRange);
      }
    } catch { /* autoFill may not be available */ }
  }, [facadeRef]);

  const fillRight = useCallback(() => {
    const range = getActiveRange(facadeRef);
    if (!range) return;
    try {
      const r = range.getRange?.();
      if (r && r.endColumn > r.startColumn) {
        const ws = facadeRef.current?.getActiveWorkbook?.()?.getActiveSheet?.();
        const targetRange = ws?.getRange?.(r.startRow, r.startColumn + 1, r.endRow - r.startRow + 1, r.endColumn - r.startColumn);
        if (targetRange) range.autoFill?.(targetRange);
      }
    } catch { /* */ }
  }, [facadeRef]);

  const fillUp = useCallback(() => {
    const wb = facadeRef.current?.getActiveWorkbook?.();
    const ws = wb?.getActiveSheet?.();
    const range = wb?.getActiveRange?.();
    if (!ws || !range) return;
    try {
      const r = range.getRange?.();
      if (r && r.endRow > r.startRow) {
        for (let col = r.startColumn; col <= r.endColumn; col++) {
          const srcVal = ws.getRange?.(r.endRow, col)?.getValue?.();
          for (let row = r.startRow; row < r.endRow; row++) {
            ws.getRange?.(row, col)?.setValue?.(srcVal);
          }
        }
      }
    } catch { /* */ }
  }, [facadeRef]);

  const fillLeft = useCallback(() => {
    const wb = facadeRef.current?.getActiveWorkbook?.();
    const ws = wb?.getActiveSheet?.();
    const range = wb?.getActiveRange?.();
    if (!ws || !range) return;
    try {
      const r = range.getRange?.();
      if (r && r.endColumn > r.startColumn) {
        for (let row = r.startRow; row <= r.endRow; row++) {
          const srcVal = ws.getRange?.(row, r.endColumn)?.getValue?.();
          for (let col = r.startColumn; col < r.endColumn; col++) {
            ws.getRange?.(row, col)?.setValue?.(srcVal);
          }
        }
      }
    } catch { /* */ }
  }, [facadeRef]);

  const clearAll = useCallback(() => {
    getActiveRange(facadeRef)?.clear?.();
  }, [facadeRef]);

  const clearFormats = useCallback(() => {
    getActiveRange(facadeRef)?.clearFormat?.();
  }, [facadeRef]);

  const clearContents = useCallback(() => {
    getActiveRange(facadeRef)?.clearContent?.();
  }, [facadeRef]);

  const sortAscending = useCallback(() => {
    safeExec(facadeRef, "sheet.command.sort-range-asc");
  }, [facadeRef]);

  const sortDescending = useCallback(() => {
    safeExec(facadeRef, "sheet.command.sort-range-desc");
  }, [facadeRef]);

  const findReplace = useCallback(() => {
    safeExec(facadeRef, "sheet.command.open-find-dialog");
  }, [facadeRef]);

  const toggleFilter = useCallback(() => {
    safeExec(facadeRef, "sheet.command.toggle-auto-filter");
  }, [facadeRef]);

  return useMemo(() => ({
    autoSum, fillDown, fillRight, fillUp, fillLeft,
    clearAll, clearFormats, clearContents,
    sortAscending, sortDescending, findReplace, toggleFilter,
  }), [autoSum, fillDown, fillRight, fillUp, fillLeft, clearAll, clearFormats, clearContents, sortAscending, sortDescending, findReplace, toggleFilter]);
}
