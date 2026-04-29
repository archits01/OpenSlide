"use client";

import { useCallback, useMemo } from "react";
import type { FacadeRef } from "./types";
import { colToA1, safeExec } from "./types";

const RECENTLY_USED_KEY = "openslides-recent-functions";
const MAX_RECENT = 10;

export interface FormulaCommands {
  insertFunction: (funcName: string) => void;
  autoSum: () => void;
  autoAverage: () => void;
  autoCount: () => void;
  autoMax: () => void;
  autoMin: () => void;
  getRecentlyUsed: () => string[];
  defineName: (name: string, refersTo: string) => void;
  showFormulas: () => void;
  calculateNow: () => void;
  calculateSheet: () => void;
}

function trackRecentFunction(funcName: string) {
  try {
    const stored = localStorage.getItem(RECENTLY_USED_KEY);
    const recent: string[] = stored ? JSON.parse(stored) : [];
    const filtered = recent.filter((f) => f !== funcName);
    filtered.unshift(funcName);
    localStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)));
  } catch { /* localStorage unavailable */ }
}

export function useFormulaCommands(facadeRef: FacadeRef): FormulaCommands {
  const insertFunction = useCallback((funcName: string) => {
    const wb = facadeRef.current?.getActiveWorkbook?.();
    const ws = wb?.getActiveSheet?.();
    const range = wb?.getActiveRange?.();
    if (!ws || !range) return;

    const r = range.getRange?.();
    if (!r) return;

    // Insert "=FUNC(" into the active cell
    ws.getRange?.(r.startRow, r.startColumn)?.setValue?.({ f: `=${funcName}()` });
    trackRecentFunction(funcName);
  }, [facadeRef]);

  const autoAggregate = useCallback((func: string) => {
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
      const formula = `=${func}(${colToA1(col)}${startRow + 1}:${colToA1(col)}${row})`;
      ws.getRange?.(row, col)?.setValue?.({ f: formula });
    }
    trackRecentFunction(func);
  }, [facadeRef]);

  const autoSum = useCallback(() => autoAggregate("SUM"), [autoAggregate]);
  const autoAverage = useCallback(() => autoAggregate("AVERAGE"), [autoAggregate]);
  const autoCount = useCallback(() => autoAggregate("COUNT"), [autoAggregate]);
  const autoMax = useCallback(() => autoAggregate("MAX"), [autoAggregate]);
  const autoMin = useCallback(() => autoAggregate("MIN"), [autoAggregate]);

  const getRecentlyUsed = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem(RECENTLY_USED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  }, []);

  const defineName = useCallback((name: string, refersTo: string) => {
    safeExec(facadeRef, "sheet.command.define-name", { name, refersTo });
  }, [facadeRef]);

  const showFormulas = useCallback(() => {
    safeExec(facadeRef, "sheet.command.toggle-show-formulas");
  }, [facadeRef]);

  const calculateNow = useCallback(() => {
    safeExec(facadeRef, "formula.command.recalculate");
  }, [facadeRef]);

  const calculateSheet = useCallback(() => {
    safeExec(facadeRef, "formula.command.recalculate-sheet");
    // Fallback to full recalc (also safe)
    safeExec(facadeRef, "formula.command.recalculate");
  }, [facadeRef]);

  return useMemo(() => ({
    insertFunction, autoSum, autoAverage, autoCount, autoMax, autoMin,
    getRecentlyUsed, defineName, showFormulas, calculateNow, calculateSheet,
  }), [insertFunction, autoSum, autoAverage, autoCount, autoMax, autoMin, getRecentlyUsed, defineName, showFormulas, calculateNow, calculateSheet]);
}
