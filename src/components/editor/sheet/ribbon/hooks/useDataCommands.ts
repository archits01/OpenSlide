"use client";

import { useCallback, useMemo } from "react";
import type { FacadeRef } from "./types";
import { safeExec } from "./types";

export interface SortConfig {
  keys: Array<{ column: number; ascending: boolean }>;
}

export interface DataCommands {
  importCsv: (text: string) => void;
  sortAscending: () => void;
  sortDescending: () => void;
  sortCustom: (config: SortConfig) => void;
  toggleFilter: () => void;
  clearFilter: () => void;
  reapplyFilter: () => void;
  removeDuplicates: (columns: number[], hasHeaders: boolean) => number;
  textToColumns: (delimiter: string) => void;
  insertDataValidation: (type: "list" | "number" | "date" | "textLength", config: Record<string, unknown>) => void;
}

export function useDataCommands(facadeRef: FacadeRef): DataCommands {
  const importCsv = useCallback((text: string) => {
    const wb = facadeRef.current?.getActiveWorkbook?.();
    const ws = wb?.getActiveSheet?.();
    const range = wb?.getActiveRange?.();
    if (!ws || !range) return;

    const r = range.getRange?.();
    const startRow = r?.startRow ?? 0;
    const startCol = r?.startColumn ?? 0;

    // Parse CSV (handle quoted fields)
    const rows = parseCsv(text);
    for (let ri = 0; ri < rows.length; ri++) {
      for (let ci = 0; ci < rows[ri].length; ci++) {
        const cell = ws.getRange?.(startRow + ri, startCol + ci);
        const val = rows[ri][ci];
        const num = Number(val);
        cell?.setValue?.(val !== "" && !isNaN(num) ? num : val);
      }
    }
  }, [facadeRef]);

  const sortAscending = useCallback(() => {
    safeExec(facadeRef, "sheet.command.sort-range-asc");
  }, [facadeRef]);

  const sortDescending = useCallback(() => {
    safeExec(facadeRef, "sheet.command.sort-range-desc");
  }, [facadeRef]);

  const sortCustom = useCallback((config: SortConfig) => {
    safeExec(facadeRef, "sheet.command.sort-range", {
      orderRules: config.keys.map((k) => ({ colIndex: k.column, ascending: k.ascending })),
    });
  }, [facadeRef]);

  const toggleFilter = useCallback(() => {
    safeExec(facadeRef, "sheet.command.toggle-auto-filter");
  }, [facadeRef]);

  const clearFilter = useCallback(() => {
    safeExec(facadeRef, "sheet.command.clear-auto-filter");
  }, [facadeRef]);

  const reapplyFilter = useCallback(() => {
    safeExec(facadeRef, "sheet.command.reapply-auto-filter");
  }, [facadeRef]);

  const removeDuplicates = useCallback((columns: number[], hasHeaders: boolean): number => {
    const wb = facadeRef.current?.getActiveWorkbook?.();
    const ws = wb?.getActiveSheet?.();
    const range = wb?.getActiveRange?.();
    if (!ws || !range) return 0;

    const r = range.getRange?.();
    if (!r) return 0;

    const { startRow, startColumn, endRow, endColumn } = r;
    const dataStart = hasHeaders ? startRow + 1 : startRow;
    const colIndices = columns.length > 0 ? columns : Array.from({ length: endColumn - startColumn + 1 }, (_, i) => startColumn + i);

    // Collect rows and find duplicates
    const seen = new Set<string>();
    const dupeRows: number[] = [];

    for (let row = dataStart; row <= endRow; row++) {
      const key = colIndices.map((c) => String(ws.getRange?.(row, c)?.getValue?.() ?? "")).join("\0");
      if (seen.has(key)) {
        dupeRows.push(row);
      } else {
        seen.add(key);
      }
    }

    // Delete duplicate rows bottom-up to preserve indices
    for (let i = dupeRows.length - 1; i >= 0; i--) {
      try {
        ws.getRange?.(dupeRows[i], startColumn, 1, endColumn - startColumn + 1)?.clear?.();
      } catch { /* */ }
    }

    return dupeRows.length;
  }, [facadeRef]);

  const textToColumns = useCallback((delimiter: string) => {
    const wb = facadeRef.current?.getActiveWorkbook?.();
    const ws = wb?.getActiveSheet?.();
    const range = wb?.getActiveRange?.();
    if (!ws || !range) return;

    const r = range.getRange?.();
    if (!r) return;

    const { startRow, startColumn, endRow } = r;

    for (let row = startRow; row <= endRow; row++) {
      const cell = ws.getRange?.(row, startColumn);
      const val = cell?.getValue?.();
      if (val == null) continue;

      const parts = String(val).split(delimiter);
      for (let ci = 0; ci < parts.length; ci++) {
        const target = ws.getRange?.(row, startColumn + ci);
        const num = Number(parts[ci].trim());
        target?.setValue?.(!isNaN(num) && parts[ci].trim() !== "" ? num : parts[ci].trim());
      }
    }
  }, [facadeRef]);

  const insertDataValidation = useCallback((type: "list" | "number" | "date" | "textLength", config: Record<string, unknown>) => {
    safeExec(facadeRef, "sheet.command.add-data-validation", { type, ...config });
  }, [facadeRef]);

  return useMemo(() => ({
    importCsv, sortAscending, sortDescending, sortCustom,
    toggleFilter, clearFilter, reapplyFilter,
    removeDuplicates, textToColumns, insertDataValidation,
  }), [importCsv, sortAscending, sortDescending, sortCustom, toggleFilter, clearFilter, reapplyFilter, removeDuplicates, textToColumns, insertDataValidation]);
}

// ─── CSV parser (handles quoted fields) ────────────────────────────────────

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === "," || ch === "\t") {
        current.push(field);
        field = "";
      } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
        current.push(field);
        field = "";
        rows.push(current);
        current = [];
        if (ch === "\r") i++;
      } else {
        field += ch;
      }
    }
  }

  // Last field / row
  current.push(field);
  if (current.length > 1 || current[0] !== "") {
    rows.push(current);
  }

  return rows;
}
