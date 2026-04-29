"use client";

import { createContext, useContext, type RefObject } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SheetFacadeContext = createContext<RefObject<any> | null>(null);

export function useSheetFacade() {
  const ctx = useContext(SheetFacadeContext);
  if (!ctx) throw new Error("useSheetFacade must be used within SheetFacadeContext.Provider");
  return ctx;
}
