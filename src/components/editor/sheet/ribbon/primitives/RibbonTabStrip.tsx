"use client";

import { SHEET_TOKENS } from "../../sheet-tokens";

const t = SHEET_TOKENS.ribbon;

interface RibbonTabStripProps {
  tabs: Array<{ id: string; label: string }>;
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  /** Content rendered at the right end of the strip (e.g. Tell Me search) */
  rightContent?: React.ReactNode;
}

export function RibbonTabStrip({ tabs, activeTabId, onTabChange, rightContent }: RibbonTabStripProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        height: t.tabStripHeight,
        background: t.tabStripBg,
        borderBottom: `1px solid ${t.groupDividerColor}`,
        paddingLeft: 8,
        userSelect: "none",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: "0 14px",
              fontSize: t.fontSize,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              color: isActive ? t.tabActiveText : t.tabInactiveText,
              background: "transparent",
              border: "none",
              borderBottom: isActive ? `2px solid ${t.tabActiveUnderline}` : "2px solid transparent",
              cursor: "pointer",
              transition: "color 100ms, border-color 100ms",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = t.tabActiveText;
                e.currentTarget.style.background = "rgba(0,0,0,0.03)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = t.tabInactiveText;
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            {tab.label}
          </button>
        );
      })}
      {rightContent && (
        <>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", paddingRight: 8 }}>
            {rightContent}
          </div>
        </>
      )}
    </div>
  );
}
