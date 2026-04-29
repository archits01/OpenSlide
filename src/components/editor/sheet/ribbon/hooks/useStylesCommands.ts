"use client";

import { useCallback, useMemo } from "react";
import type { FacadeRef } from "./types";

export interface StylesCommands {
  formatAsTable: (style: "light" | "medium" | "dark") => void;
}

const TABLE_STYLES = {
  light: { headerBg: "#DDEBF7", headerText: "#1A1A1A", altRowBg: "#F2F2F2", borderColor: "#B4C6E7" },
  medium: { headerBg: "#5B9BD5", headerText: "#FFFFFF", altRowBg: "#D9E1F2", borderColor: "#9BC2E6" },
  dark: { headerBg: "#44546A", headerText: "#FFFFFF", altRowBg: "#D9D9D9", borderColor: "#8497B0" },
} as const;

export function useStylesCommands(facadeRef: FacadeRef): StylesCommands {
  const formatAsTable = useCallback((style: "light" | "medium" | "dark") => {
    const wb = facadeRef.current?.getActiveWorkbook?.();
    const ws = wb?.getActiveSheet?.();
    const range = wb?.getActiveRange?.();
    if (!ws || !range) return;

    const r = range.getRange?.();
    if (!r) return;

    const { startRow, startColumn, endRow, endColumn } = r;
    const colors = TABLE_STYLES[style];
    const borderEnum = facadeRef.current?.Enum?.BorderType;
    const borderStyle = facadeRef.current?.Enum?.BorderStyleTypes;

    // Apply header row (first row of selection)
    for (let c = startColumn; c <= endColumn; c++) {
      const cell = ws.getRange?.(startRow, c);
      cell?.setBackgroundColor?.(colors.headerBg);
      cell?.setFontColor?.(colors.headerText);
      cell?.setFontWeight?.("bold");
    }

    // Apply alternating row shading to data rows
    for (let row = startRow + 1; row <= endRow; row++) {
      const isEven = (row - startRow) % 2 === 0;
      for (let c = startColumn; c <= endColumn; c++) {
        const cell = ws.getRange?.(row, c);
        cell?.setBackgroundColor?.(isEven ? colors.altRowBg : "#FFFFFF");
      }
    }

    // Apply thin borders to the entire range
    if (borderEnum && borderStyle) {
      range.setBorder?.(borderEnum.ALL, borderStyle.THIN, colors.borderColor);
    }
  }, [facadeRef]);

  return useMemo(() => ({ formatAsTable }), [formatAsTable]);
}
