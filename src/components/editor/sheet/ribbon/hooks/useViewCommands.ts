"use client";

import { useCallback, useMemo, useState } from "react";
import type { FacadeRef } from "./types";
import { safeExec } from "./types";

export type ViewMode = "normal" | "page-break-preview" | "page-layout";
export type FreezeMode = "first-row" | "first-column" | "at-selection" | "unfreeze";

export interface ViewCommands {
  viewMode: ViewMode;
  gridlinesVisible: boolean;
  headingsVisible: boolean;
  formulaBarVisible: boolean;
  currentZoom: number;
  setViewMode: (mode: ViewMode) => void;
  toggleGridlines: () => void;
  toggleHeadings: () => void;
  toggleFormulaBar: () => void;
  setZoom: (percent: number) => void;
  zoomTo100: () => void;
  zoomToSelection: () => void;
  freezePanes: (mode: FreezeMode) => void;
}

// Freeze command IDs from @univerjs/sheets-ui
const FREEZE_COMMANDS = {
  "first-row": "sheet.command.set-first-row-frozen",
  "first-column": "sheet.command.set-first-column-frozen",
  "at-selection": "sheet.command.set-selection-frozen",
  unfreeze: "sheet.command.cancel-frozen",
} as const;

export function useViewCommands(facadeRef: FacadeRef): ViewCommands {
  const [viewMode, setViewModeState] = useState<ViewMode>("normal");
  const [gridlinesVisible, setGridlinesVisible] = useState(true);
  const [headingsVisible, setHeadingsVisible] = useState(true);
  const [formulaBarVisible, setFormulaBarVisible] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(100);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    // Only "normal" is currently supported; others are future
    if (mode !== "normal") {
      console.warn(`[ViewCommands] ${mode} view is not yet supported`);
    }
  }, []);

  const toggleGridlines = useCallback(() => {
    setGridlinesVisible((v) => {
      const next = !v;
      try {
        const ws = facadeRef.current?.getActiveWorkbook?.()?.getActiveSheet?.();
        ws?.setHiddenGridlines?.(!next); // hidden = opposite of visible
      } catch {
        // Facade method may not be available
      }
      return next;
    });
  }, [facadeRef]);

  const toggleHeadings = useCallback(() => {
    setHeadingsVisible((v) => {
      const next = !v;
      safeExec(facadeRef, "sheet.command.toggle-row-col-headers", { visible: next });
      return next;
    });
  }, [facadeRef]);

  const toggleFormulaBar = useCallback(() => {
    setFormulaBarVisible((v) => {
      const next = !v;
      // Formula bar visibility requires Univer config change at init time;
      // runtime toggle may not be supported. safeExec swallows errors silently.
      safeExec(facadeRef, "sheet.ui.toggle-formula-bar", { visible: next });
      return next;
    });
  }, [facadeRef]);

  const setZoom = useCallback((percent: number) => {
    const clamped = Math.max(10, Math.min(400, percent));
    setCurrentZoom(clamped);
    try {
      const ws = facadeRef.current?.getActiveWorkbook?.()?.getActiveSheet?.();
      ws?.zoom?.(clamped / 100); // Univer uses ratio (1.0 = 100%)
    } catch {
      console.warn("[ViewCommands] Zoom not available");
    }
  }, [facadeRef]);

  const zoomTo100 = useCallback(() => {
    setZoom(100);
  }, [setZoom]);

  const zoomToSelection = useCallback(() => {
    // Approximate: get selection size, compute ratio to fit viewport
    // For now, reset to 100% as a safe fallback
    try {
      const ws = facadeRef.current?.getActiveWorkbook?.()?.getActiveSheet?.();
      ws?.zoom?.(1.0);
      setCurrentZoom(100);
    } catch { /* */ }
  }, [facadeRef]);

  const freezePanes = useCallback((mode: FreezeMode) => {
    safeExec(facadeRef, FREEZE_COMMANDS[mode]);
  }, [facadeRef]);

  return useMemo(() => ({
    viewMode, gridlinesVisible, headingsVisible, formulaBarVisible, currentZoom,
    setViewMode, toggleGridlines, toggleHeadings, toggleFormulaBar,
    setZoom, zoomTo100, zoomToSelection, freezePanes,
  }), [
    viewMode, gridlinesVisible, headingsVisible, formulaBarVisible, currentZoom,
    setViewMode, toggleGridlines, toggleHeadings, toggleFormulaBar,
    setZoom, zoomTo100, zoomToSelection, freezePanes,
  ]);
}
