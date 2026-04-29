"use client";

import { useCallback, useMemo, useState } from "react";
import type { FacadeRef } from "./types";
import { safeExec } from "./types";

export interface LayoutState {
  orientation: "portrait" | "landscape";
  paperSize: "letter" | "a4" | "legal" | "a3";
  margins: "normal" | "wide" | "narrow" | "custom";
  gridlinesView: boolean;
  gridlinesPrint: boolean;
  headingsView: boolean;
  headingsPrint: boolean;
  printArea: string | null;
  scale: number;
}

export interface LayoutCommands {
  layoutState: LayoutState;
  setMargins: (preset: "normal" | "wide" | "narrow" | "custom") => void;
  setPageOrientation: (o: "portrait" | "landscape") => void;
  setPaperSize: (size: "letter" | "a4" | "legal" | "a3") => void;
  setPrintArea: (range: string | null) => void;
  toggleGridlinesView: () => void;
  toggleGridlinesPrint: () => void;
  toggleHeadingsView: () => void;
  toggleHeadingsPrint: () => void;
  setScale: (scale: number) => void;
}

export function useLayoutCommands(facadeRef: FacadeRef): LayoutCommands {
  const [layoutState, setLayoutState] = useState<LayoutState>({
    orientation: "portrait",
    paperSize: "letter",
    margins: "normal",
    gridlinesView: true,
    gridlinesPrint: false,
    headingsView: true,
    headingsPrint: false,
    printArea: null,
    scale: 100,
  });

  // Affects export metadata only — Univer canvas rendering is unaffected
  const setMargins = useCallback((preset: "normal" | "wide" | "narrow" | "custom") => {
    setLayoutState((s) => ({ ...s, margins: preset }));
  }, []);

  const setPageOrientation = useCallback((o: "portrait" | "landscape") => {
    setLayoutState((s) => ({ ...s, orientation: o }));
  }, []);

  const setPaperSize = useCallback((size: "letter" | "a4" | "legal" | "a3") => {
    setLayoutState((s) => ({ ...s, paperSize: size }));
  }, []);

  const setPrintArea = useCallback((range: string | null) => {
    setLayoutState((s) => ({ ...s, printArea: range }));
  }, []);

  const toggleGridlinesView = useCallback(() => {
    setLayoutState((s) => {
      const next = !s.gridlinesView;
      safeExec(facadeRef, "sheet.command.toggle-gridlines", { visible: next });
      return { ...s, gridlinesView: next };
    });
  }, [facadeRef]);

  const toggleGridlinesPrint = useCallback(() => {
    setLayoutState((s) => ({ ...s, gridlinesPrint: !s.gridlinesPrint }));
  }, []);

  const toggleHeadingsView = useCallback(() => {
    setLayoutState((s) => {
      const next = !s.headingsView;
      safeExec(facadeRef, "sheet.command.toggle-row-col-headers", { visible: next });
      return { ...s, headingsView: next };
    });
  }, [facadeRef]);

  const toggleHeadingsPrint = useCallback(() => {
    setLayoutState((s) => ({ ...s, headingsPrint: !s.headingsPrint }));
  }, []);

  const setScale = useCallback((scale: number) => {
    const clamped = Math.max(10, Math.min(400, scale));
    setLayoutState((s) => ({ ...s, scale: clamped }));
  }, []);

  return useMemo(() => ({
    layoutState,
    setMargins, setPageOrientation, setPaperSize, setPrintArea,
    toggleGridlinesView, toggleGridlinesPrint,
    toggleHeadingsView, toggleHeadingsPrint,
    setScale,
  }), [layoutState, setMargins, setPageOrientation, setPaperSize, setPrintArea, toggleGridlinesView, toggleGridlinesPrint, toggleHeadingsView, toggleHeadingsPrint, setScale]);
}
