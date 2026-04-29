"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { FacadeRef, SheetSelectionState } from "./types";
import { EMPTY_SELECTION, colToA1 } from "./types";

/** Reads the current selection state from Univer and keeps it in sync. */
export function useSheetSelection(facadeRef: FacadeRef): SheetSelectionState {
  const [state, setState] = useState<SheetSelectionState>(EMPTY_SELECTION);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const readSelection = useCallback(() => {
    const facade = facadeRef.current;
    if (!facade) return;

    try {
      const wb = facade.getActiveWorkbook?.();
      if (!wb) { setState(EMPTY_SELECTION); return; }

      const ws = wb.getActiveSheet?.();
      if (!ws) { setState(EMPTY_SELECTION); return; }

      const range = wb.getActiveRange?.();
      if (!range) { setState({ ...EMPTY_SELECTION, hasSelection: false }); return; }

      const r = range.getRange?.();
      const startRow = r?.startRow ?? 0;
      const startCol = r?.startColumn ?? 0;
      const endRow = r?.endRow ?? startRow;
      const endCol = r?.endColumn ?? startCol;

      const activeCellRef = `${colToA1(startCol)}${startRow + 1}`;
      const selectedRange = startRow === endRow && startCol === endCol
        ? activeCellRef
        : `${activeCellRef}:${colToA1(endCol)}${endRow + 1}`;

      // Read style from the active cell (top-left of selection)
      const cellRange = ws.getRange?.(startRow, startCol);
      const style = cellRange?.getCellStyleData?.();
      const cellData = cellRange?.getCellData?.();

      const fontFamily = style?.ff ?? "";
      const fontSize = style?.fs ?? 11;
      const isBold = style?.bl === 1;
      const isItalic = style?.it === 1;
      const fontLine = style?.ul?.s ?? 0;
      const isUnderline = fontLine === 1;
      const stLine = style?.st?.s ?? 0;
      const isStrikethrough = stLine === 1;
      const fontColor = style?.cl?.rgb ?? "";
      const fillColor = style?.bg?.rgb ?? "";

      // Alignment
      let horizontalAlign: SheetSelectionState["horizontalAlign"] = "";
      if (style?.ht === 1) horizontalAlign = "left";
      else if (style?.ht === 2) horizontalAlign = "center";
      else if (style?.ht === 3) horizontalAlign = "right";

      let verticalAlign: SheetSelectionState["verticalAlign"] = "";
      if (style?.vt === 1) verticalAlign = "top";
      else if (style?.vt === 2) verticalAlign = "middle";
      else if (style?.vt === 3) verticalAlign = "bottom";

      const isWrapped = (style?.tb ?? 0) === 2; // WrapStrategy.WRAP = 2 in Univer
      const isMerged = cellRange?.isMerged?.() ?? false;

      // Number format — from numfmt plugin
      const numberFormat = cellRange?.getNumberFormat?.() ?? "General";

      setState({
        activeCellRef,
        selectedRange,
        rangeAddress: { startRow, startCol, endRow, endCol },
        fontFamily,
        fontSize,
        isBold,
        isItalic,
        isUnderline,
        isStrikethrough,
        fontColor,
        fillColor,
        horizontalAlign,
        verticalAlign,
        isWrapped,
        isMerged,
        numberFormat,
        hasSelection: true,
        isReadOnly: false,
      });
    } catch {
      // Facade not ready or workbook not loaded yet
    }
  }, [facadeRef]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let disposable: { dispose?(): void } | null | undefined = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    function trySetup(): boolean {
      const facade = facadeRef.current;
      if (!facade) return false;
      disposable = facade.onCommandExecuted?.(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(readSelection, 50);
      });
      readSelection();
      return true;
    }

    if (!trySetup()) {
      // facadeRef.current is null on first mount because Univer loads async.
      // Poll until the facade is available, then subscribe once.
      pollTimer = setInterval(() => {
        if (trySetup()) {
          clearInterval(pollTimer!);
          pollTimer = null;
        }
      }, 100);
    }

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      disposable?.dispose?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
