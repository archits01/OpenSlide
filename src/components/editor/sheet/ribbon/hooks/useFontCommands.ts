"use client";

import { useCallback, useMemo } from "react";
import type { FacadeRef, BorderConfig } from "./types";

function getActiveRange(facadeRef: FacadeRef) {
  const wb = facadeRef.current?.getActiveWorkbook?.();
  return wb?.getActiveRange?.() ?? null;
}

export interface FontCommands {
  setBold: (value?: boolean) => void;
  setItalic: (value?: boolean) => void;
  setUnderline: (value?: boolean) => void;
  setStrikethrough: (value?: boolean) => void;
  setFontFamily: (family: string) => void;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  setFontColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setBorder: (config: BorderConfig) => void;
  clearFormatting: () => void;
}

export function useFontCommands(facadeRef: FacadeRef): FontCommands {
  const setBold = useCallback((value?: boolean) => {
    const range = getActiveRange(facadeRef);
    if (!range) return;
    if (value === undefined) {
      const current = range.getCellStyleData?.()?.bl === 1;
      range.setFontWeight?.(current ? "normal" : "bold");
    } else {
      range.setFontWeight?.(value ? "bold" : "normal");
    }
  }, [facadeRef]);

  const setItalic = useCallback((value?: boolean) => {
    const range = getActiveRange(facadeRef);
    if (!range) return;
    if (value === undefined) {
      const current = range.getCellStyleData?.()?.it === 1;
      range.setFontStyle?.(current ? "normal" : "italic");
    } else {
      range.setFontStyle?.(value ? "italic" : "normal");
    }
  }, [facadeRef]);

  const setUnderline = useCallback((value?: boolean) => {
    const range = getActiveRange(facadeRef);
    if (!range) return;
    if (value === undefined) {
      const current = range.getCellStyleData?.()?.ul?.s === 1;
      range.setFontLine?.(current ? "none" : "underline");
    } else {
      range.setFontLine?.(value ? "underline" : "none");
    }
  }, [facadeRef]);

  const setStrikethrough = useCallback((value?: boolean) => {
    const range = getActiveRange(facadeRef);
    if (!range) return;
    // Univer's setFontLine handles underline OR strikethrough — not both simultaneously.
    // For strikethrough we use the lower-level style approach.
    if (value === undefined) {
      const current = range.getCellStyleData?.()?.st?.s === 1;
      try {
        // Try setFontLine('line-through') first — works in most Univer versions
        range.setFontLine?.(current ? "none" : "line-through");
      } catch {
        // Fallback: noop — will be handled when Univer upgrades
      }
    } else {
      try {
        range.setFontLine?.(value ? "line-through" : "none");
      } catch { /* */ }
    }
  }, [facadeRef]);

  const setFontFamily = useCallback((family: string) => {
    getActiveRange(facadeRef)?.setFontFamily?.(family);
  }, [facadeRef]);

  const setFontSize = useCallback((size: number) => {
    const clamped = Math.max(1, Math.min(409, size));
    getActiveRange(facadeRef)?.setFontSize?.(clamped);
  }, [facadeRef]);

  const increaseFontSize = useCallback(() => {
    const range = getActiveRange(facadeRef);
    if (!range) return;
    const current = range.getCellStyleData?.()?.fs ?? 11;
    range.setFontSize?.(Math.min(409, current + 1));
  }, [facadeRef]);

  const decreaseFontSize = useCallback(() => {
    const range = getActiveRange(facadeRef);
    if (!range) return;
    const current = range.getCellStyleData?.()?.fs ?? 11;
    range.setFontSize?.(Math.max(1, current - 1));
  }, [facadeRef]);

  const setFontColor = useCallback((color: string) => {
    getActiveRange(facadeRef)?.setFontColor?.(color || null);
  }, [facadeRef]);

  const setFillColor = useCallback((color: string) => {
    getActiveRange(facadeRef)?.setBackgroundColor?.(color || "");
  }, [facadeRef]);

  const setBorder = useCallback((config: BorderConfig) => {
    const range = getActiveRange(facadeRef);
    const facade = facadeRef.current;
    if (!range || !facade) return;

    const borderEnum = facade.Enum?.BorderType;
    const styleEnum = facade.Enum?.BorderStyleTypes;
    if (!borderEnum || !styleEnum) return;

    const posMap: Record<string, unknown> = {
      all: borderEnum.ALL,
      outer: borderEnum.OUTER,
      inner: borderEnum.INNER,
      top: borderEnum.TOP,
      bottom: borderEnum.BOTTOM,
      left: borderEnum.LEFT,
      right: borderEnum.RIGHT,
      none: borderEnum.NONE,
    };

    const styleMap: Record<string, unknown> = {
      thin: styleEnum.THIN,
      medium: styleEnum.MEDIUM,
      thick: styleEnum.THICK,
      dashed: styleEnum.DASHED,
      dotted: styleEnum.DOTTED,
      double: styleEnum.DOUBLE,
    };

    const pos = posMap[config.position] ?? borderEnum.ALL;
    const style = styleMap[config.style ?? "thin"] ?? styleEnum.THIN;

    range.setBorder?.(pos, style, config.color ?? "#000000");
  }, [facadeRef]);

  const clearFormatting = useCallback(() => {
    getActiveRange(facadeRef)?.clearFormat?.();
  }, [facadeRef]);

  return useMemo(() => ({
    setBold, setItalic, setUnderline, setStrikethrough,
    setFontFamily, setFontSize, increaseFontSize, decreaseFontSize,
    setFontColor, setFillColor, setBorder, clearFormatting,
  }), [setBold, setItalic, setUnderline, setStrikethrough, setFontFamily, setFontSize, increaseFontSize, decreaseFontSize, setFontColor, setFillColor, setBorder, clearFormatting]);
}
