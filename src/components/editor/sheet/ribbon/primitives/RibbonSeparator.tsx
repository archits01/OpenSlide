"use client";

import { SHEET_TOKENS } from "../../sheet-tokens";

export function RibbonSeparator() {
  return (
    <div
      style={{
        width: 1,
        height: 20,
        background: SHEET_TOKENS.ribbon.groupDividerColor,
        margin: "0 2px",
        flexShrink: 0,
      }}
    />
  );
}
