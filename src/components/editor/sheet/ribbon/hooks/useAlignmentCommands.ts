"use client";

import { useCallback, useMemo } from "react";
import type { FacadeRef } from "./types";
import { safeExec } from "./types";

function getActiveRange(facadeRef: FacadeRef) {
  return facadeRef.current?.getActiveWorkbook?.()?.getActiveRange?.() ?? null;
}

export interface AlignmentCommands {
  setHorizontalAlign: (align: "left" | "center" | "right" | "justify") => void;
  setVerticalAlign: (align: "top" | "middle" | "bottom") => void;
  setWrapText: (wrap?: boolean) => void;
  mergeCells: (mode: "all" | "horizontal" | "vertical") => void;
  unmergeCells: () => void;
  increaseIndent: () => void;
  decreaseIndent: () => void;
  setOrientation: (degrees: number) => void;
}

export function useAlignmentCommands(facadeRef: FacadeRef): AlignmentCommands {
  const setHorizontalAlign = useCallback((align: "left" | "center" | "right" | "justify") => {
    getActiveRange(facadeRef)?.setHorizontalAlignment?.(align);
  }, [facadeRef]);

  const setVerticalAlign = useCallback((align: "top" | "middle" | "bottom") => {
    getActiveRange(facadeRef)?.setVerticalAlignment?.(align);
  }, [facadeRef]);

  const setWrapText = useCallback((wrap?: boolean) => {
    const range = getActiveRange(facadeRef);
    if (!range) return;
    if (wrap === undefined) {
      const current = range.getWrap?.() ?? false;
      range.setWrap?.(!current);
    } else {
      range.setWrap?.(wrap);
    }
  }, [facadeRef]);

  const mergeCells = useCallback((mode: "all" | "horizontal" | "vertical") => {
    const range = getActiveRange(facadeRef);
    if (!range) return;
    if (mode === "horizontal") range.mergeAcross?.();
    else if (mode === "vertical") range.mergeVertically?.();
    else range.merge?.();
  }, [facadeRef]);

  const unmergeCells = useCallback(() => {
    getActiveRange(facadeRef)?.breakApart?.();
  }, [facadeRef]);

  // Indent via executeCommand — no direct facade method
  const increaseIndent = useCallback(() => {
    safeExec(facadeRef, "sheet.command.set-text-indent", { direction: "right" });
  }, [facadeRef]);

  const decreaseIndent = useCallback(() => {
    safeExec(facadeRef, "sheet.command.set-text-indent", { direction: "left" });
  }, [facadeRef]);

  const setOrientation = useCallback((degrees: number) => {
    getActiveRange(facadeRef)?.setTextRotation?.(degrees);
  }, [facadeRef]);

  return useMemo(() => ({
    setHorizontalAlign, setVerticalAlign, setWrapText,
    mergeCells, unmergeCells, increaseIndent, decreaseIndent, setOrientation,
  }), [setHorizontalAlign, setVerticalAlign, setWrapText, mergeCells, unmergeCells, increaseIndent, decreaseIndent, setOrientation]);
}
