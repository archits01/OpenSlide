import type { RefObject } from "react";

/** Ref to the Univer Facade API — passed to all command hooks */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FacadeRef = RefObject<any>;

export interface SheetSelectionState {
  activeCellRef: string;
  selectedRange: string;
  rangeAddress: { startRow: number; startCol: number; endRow: number; endCol: number } | null;
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  fontColor: string;
  fillColor: string;
  horizontalAlign: "left" | "center" | "right" | "";
  verticalAlign: "top" | "middle" | "bottom" | "";
  isWrapped: boolean;
  isMerged: boolean;
  numberFormat: string;
  hasSelection: boolean;
  isReadOnly: boolean;
}

export interface BorderConfig {
  position: "all" | "outer" | "inner" | "top" | "bottom" | "left" | "right" | "none";
  style?: "thin" | "medium" | "thick" | "dashed" | "dotted" | "double";
  color?: string;
}

export const EMPTY_SELECTION: SheetSelectionState = {
  activeCellRef: "",
  selectedRange: "",
  rangeAddress: null,
  fontFamily: "",
  fontSize: 0,
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrikethrough: false,
  fontColor: "",
  fillColor: "",
  horizontalAlign: "",
  verticalAlign: "",
  isWrapped: false,
  isMerged: false,
  numberFormat: "General",
  hasSelection: false,
  isReadOnly: false,
};

/**
 * Safely execute a Univer command. Swallows both sync throws and async
 * promise rejections so unknown/unregistered commands never crash the UI.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeExec(facadeRef: FacadeRef, commandId: string, params?: any): void {
  try {
    const result = facadeRef.current?.executeCommand?.(commandId, params);
    if (result && typeof (result as Promise<unknown>).then === "function") {
      (result as Promise<unknown>).catch(() => { /* silent */ });
    }
  } catch {
    /* silent */
  }
}

/** Convert column index (0-based) to A1-notation letter */
export function colToA1(col: number): string {
  let result = "";
  let n = col;
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
}
