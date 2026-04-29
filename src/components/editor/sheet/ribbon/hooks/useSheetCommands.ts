"use client";

import { useCallback, useMemo } from "react";
import type { FacadeRef } from "./types";
import { safeExec } from "./types";
import { useFontCommands, type FontCommands } from "./useFontCommands";
import { useAlignmentCommands, type AlignmentCommands } from "./useAlignmentCommands";
import { useNumberCommands, type NumberCommands } from "./useNumberCommands";
import { useCellsCommands, type CellsCommands } from "./useCellsCommands";
import { useClipboardCommands, type ClipboardCommands } from "./useClipboardCommands";
import { useEditingCommands, type EditingCommands } from "./useEditingCommands";
import { useStylesCommands, type StylesCommands } from "./useStylesCommands";
import { useInsertCommands, type InsertCommands } from "./useInsertCommands";
import { useLayoutCommands, type LayoutCommands } from "./useLayoutCommands";
import { useFormulaCommands, type FormulaCommands } from "./useFormulaCommands";
import { useDataCommands, type DataCommands } from "./useDataCommands";
import { useViewCommands, type ViewCommands } from "./useViewCommands";

export interface SheetCommands extends
  FontCommands,
  AlignmentCommands,
  NumberCommands,
  CellsCommands,
  ClipboardCommands,
  EditingCommands,
  StylesCommands,
  InsertCommands,
  LayoutCommands,
  FormulaCommands,
  DataCommands,
  ViewCommands {
  undo: () => void;
  redo: () => void;
}

export function useSheetCommands(facadeRef: FacadeRef): SheetCommands {
  const font = useFontCommands(facadeRef);
  const alignment = useAlignmentCommands(facadeRef);
  const number = useNumberCommands(facadeRef);
  const cells = useCellsCommands(facadeRef);
  const clipboard = useClipboardCommands(facadeRef);
  const editing = useEditingCommands(facadeRef);
  const styles = useStylesCommands(facadeRef);
  const insert = useInsertCommands(facadeRef);
  const layout = useLayoutCommands(facadeRef);
  const formula = useFormulaCommands(facadeRef);
  const data = useDataCommands(facadeRef);
  const view = useViewCommands(facadeRef);

  const undo = useCallback(() => {
    try {
      const r = facadeRef.current?.undo?.();
      if (r && typeof r.then === "function") r.catch(() => {});
    } catch {
      safeExec(facadeRef, "univer.command.undo");
    }
  }, [facadeRef]);

  const redo = useCallback(() => {
    try {
      const r = facadeRef.current?.redo?.();
      if (r && typeof r.then === "function") r.catch(() => {});
    } catch {
      safeExec(facadeRef, "univer.command.redo");
    }
  }, [facadeRef]);

  return useMemo(() => ({
    ...font,
    ...alignment,
    ...number,
    ...cells,
    ...clipboard,
    ...editing,
    ...styles,
    ...insert,
    ...layout,
    ...formula,
    ...data,
    ...view,
    undo,
    redo,
  }), [font, alignment, number, cells, clipboard, editing, styles, insert, layout, formula, data, view, undo, redo]);
}
