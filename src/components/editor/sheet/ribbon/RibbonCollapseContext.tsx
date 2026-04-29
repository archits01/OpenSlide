"use client";

import { createContext, useContext } from "react";

/**
 * Set of group labels that should render in collapsed (icon-only) mode.
 * SheetRibbon populates this based on container width.
 */
export const RibbonCollapseContext = createContext<Set<string>>(new Set());

export function useRibbonCollapsed(groupLabel: string): boolean {
  return useContext(RibbonCollapseContext).has(groupLabel);
}
