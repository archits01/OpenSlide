"use client";

import { useCallback, useMemo } from "react";
import type { FacadeRef } from "./types";

function getActiveRange(facadeRef: FacadeRef) {
  return facadeRef.current?.getActiveWorkbook?.()?.getActiveRange?.() ?? null;
}

const CURRENCY_FORMATS: Record<string, string> = {
  USD: "$#,##0.00;-$#,##0.00",
  EUR: "€#,##0.00;-€#,##0.00",
  GBP: "£#,##0.00;-£#,##0.00",
  INR: "₹#,##,##0.00;-₹#,##,##0.00",
  JPY: "¥#,##0;-¥#,##0",
};

export interface NumberCommands {
  setNumberFormat: (format: string) => void;
  setCurrency: (currency: "USD" | "EUR" | "GBP" | "INR" | "JPY") => void;
  setPercent: () => void;
  setComma: () => void;
  increaseDecimal: () => void;
  decreaseDecimal: () => void;
}

export function useNumberCommands(facadeRef: FacadeRef): NumberCommands {
  const setNumberFormat = useCallback((format: string) => {
    getActiveRange(facadeRef)?.setNumberFormat?.(format);
  }, [facadeRef]);

  const setCurrency = useCallback((currency: "USD" | "EUR" | "GBP" | "INR" | "JPY") => {
    const fmt = CURRENCY_FORMATS[currency] ?? CURRENCY_FORMATS.USD;
    getActiveRange(facadeRef)?.setNumberFormat?.(fmt);
  }, [facadeRef]);

  const setPercent = useCallback(() => {
    getActiveRange(facadeRef)?.setNumberFormat?.("0.00%");
  }, [facadeRef]);

  const setComma = useCallback(() => {
    getActiveRange(facadeRef)?.setNumberFormat?.("#,##0.00");
  }, [facadeRef]);

  const increaseDecimal = useCallback(() => {
    const range = getActiveRange(facadeRef);
    if (!range) return;
    const current = range.getNumberFormat?.() ?? "General";
    const dotIdx = current.indexOf(".");
    if (dotIdx === -1) {
      // No decimal — add one: e.g., "#,##0" → "#,##0.0"
      const baseEnd = current.lastIndexOf("0");
      if (baseEnd >= 0) {
        range.setNumberFormat?.(current.slice(0, baseEnd + 1) + ".0" + current.slice(baseEnd + 1));
      } else {
        range.setNumberFormat?.("#,##0.0");
      }
    } else {
      // Add another zero after the decimal
      const afterDot = current.slice(dotIdx);
      const zeroCount = (afterDot.match(/0/g) ?? []).length;
      range.setNumberFormat?.(current.slice(0, dotIdx) + "." + "0".repeat(zeroCount + 1) + current.slice(dotIdx + 1 + zeroCount));
    }
  }, [facadeRef]);

  const decreaseDecimal = useCallback(() => {
    const range = getActiveRange(facadeRef);
    if (!range) return;
    const current = range.getNumberFormat?.() ?? "General";
    const dotIdx = current.indexOf(".");
    if (dotIdx === -1) return; // No decimal to remove
    const afterDot = current.slice(dotIdx);
    const zeroCount = (afterDot.match(/0/g) ?? []).length;
    if (zeroCount <= 1) {
      // Remove the decimal entirely
      range.setNumberFormat?.(current.slice(0, dotIdx) + current.slice(dotIdx + 2));
    } else {
      range.setNumberFormat?.(current.slice(0, dotIdx) + "." + "0".repeat(zeroCount - 1) + current.slice(dotIdx + 1 + zeroCount));
    }
  }, [facadeRef]);

  return useMemo(() => ({
    setNumberFormat, setCurrency, setPercent, setComma, increaseDecimal, decreaseDecimal,
  }), [setNumberFormat, setCurrency, setPercent, setComma, increaseDecimal, decreaseDecimal]);
}
