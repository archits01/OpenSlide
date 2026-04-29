"use client";

import { SHEET_TOKENS } from "../../sheet-tokens";

const t = SHEET_TOKENS.ribbon;

interface RibbonTabPanelProps {
  children: React.ReactNode;
}

export function RibbonTabPanel({ children }: RibbonTabPanelProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        height: t.tabPanelHeight,
        background: t.backgroundColor,
        borderBottom: `1px solid #D0D0D0`,
        padding: "2px 0",
        overflowX: "auto",
        overflowY: "hidden",
        scrollbarWidth: "none",
      }}
      className="[&::-webkit-scrollbar]:hidden"
    >
      {children}
    </div>
  );
}
