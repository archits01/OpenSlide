"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { FacadeRef } from "./types";

export interface ClipboardCommands {
  cut: () => Promise<void>;
  copy: () => Promise<void>;
  paste: () => Promise<void>;
  pasteValues: () => Promise<void>;
  pasteFormatting: () => Promise<void>;
  startFormatPainter: () => void;
  exitFormatPainter: () => void;
  isFormatPainterActive: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StoredFormat = Record<string, any> | null;

export function useClipboardCommands(facadeRef: FacadeRef): ClipboardCommands {
  const [isFormatPainterActive, setFormatPainterActive] = useState(false);
  const storedFormatRef = useRef<StoredFormat>(null);

  const copy = useCallback(async () => {
    try {
      // Use Univer's copy command which handles both internal and clipboard
      await facadeRef.current?.executeCommand?.("sheet.command.copy");
    } catch {
      // Fallback: read selection as text and write to clipboard
      const range = facadeRef.current?.getActiveWorkbook?.()?.getActiveRange?.();
      if (!range) return;
      const values = range.getDisplayValues?.() ?? [];
      const tsv = values.map((row: string[]) => row.join("\t")).join("\n");
      await navigator.clipboard?.writeText(tsv);
    }
  }, [facadeRef]);

  const cut = useCallback(async () => {
    try {
      await facadeRef.current?.executeCommand?.("sheet.command.cut");
    } catch {
      await copy();
      facadeRef.current?.getActiveWorkbook?.()?.getActiveRange?.()?.clearContent?.();
    }
  }, [facadeRef, copy]);

  const paste = useCallback(async () => {
    try {
      await facadeRef.current?.executeCommand?.("sheet.command.paste");
    } catch {
      // Fallback: read clipboard text and parse as TSV
      const text = await navigator.clipboard?.readText();
      if (!text) return;
      const rows = text.split("\n").map((line) => line.split("\t"));
      const range = facadeRef.current?.getActiveWorkbook?.()?.getActiveRange?.();
      if (range) range.setValues?.(rows);
    }
  }, [facadeRef]);

  const pasteValues = useCallback(async () => {
    try {
      await facadeRef.current?.executeCommand?.("sheet.command.paste-special", { type: "values" });
    } catch {
      await paste(); // Fallback to regular paste
    }
  }, [facadeRef, paste]);

  const pasteFormatting = useCallback(async () => {
    try {
      await facadeRef.current?.executeCommand?.("sheet.command.paste-special", { type: "format" });
    } catch {
      // No fallback for format-only paste
    }
  }, [facadeRef]);

  const startFormatPainter = useCallback(() => {
    try {
      const range = facadeRef.current?.getActiveWorkbook?.()?.getActiveRange?.();
      if (!range) return;

      const style = range.getCellStyleData?.();
      if (!style) return;

      storedFormatRef.current = { ...style };
      setFormatPainterActive(true);

      const disposable = facadeRef.current?.onCommandExecuted?.((cmd: { id: string }) => {
        try {
          if (cmd.id?.includes("set-selections") || cmd.id?.includes("set-range")) {
            const newRange = facadeRef.current?.getActiveWorkbook?.()?.getActiveRange?.();
            const fmt = storedFormatRef.current;
            if (newRange && fmt) {
              if (fmt.bl) newRange.setFontWeight?.("bold");
              if (fmt.it) newRange.setFontStyle?.("italic");
              if (fmt.ff) newRange.setFontFamily?.(fmt.ff);
              if (fmt.fs) newRange.setFontSize?.(fmt.fs);
              if (fmt.cl?.rgb) newRange.setFontColor?.(fmt.cl.rgb);
              if (fmt.bg?.rgb) newRange.setBackgroundColor?.(fmt.bg.rgb);
            }
            storedFormatRef.current = null;
            setFormatPainterActive(false);
            disposable?.dispose?.();
          }
        } catch { /* silent */ }
      });
    } catch { /* silent */ }
  }, [facadeRef]);

  const exitFormatPainter = useCallback(() => {
    storedFormatRef.current = null;
    setFormatPainterActive(false);
  }, []);

  return useMemo(() => ({
    cut, copy, paste, pasteValues, pasteFormatting,
    startFormatPainter, exitFormatPainter, isFormatPainterActive,
  }), [cut, copy, paste, pasteValues, pasteFormatting, startFormatPainter, exitFormatPainter, isFormatPainterActive]);
}
