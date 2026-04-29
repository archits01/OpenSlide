"use client";

import { ChevronDown } from "lucide-react";
import { SHEET_TOKENS } from "../../sheet-tokens";
import { RibbonTooltip } from "./RibbonTooltip";
import type { RibbonButtonBaseProps } from "./types";

const t = SHEET_TOKENS.ribbon;

interface RibbonButtonLargeProps extends RibbonButtonBaseProps {
  onDropdownClick?: () => void;
}

export function RibbonButtonLarge({
  icon,
  label,
  tooltip,
  shortcut,
  disabled,
  active,
  onClick,
  onDropdownClick,
  testId,
}: RibbonButtonLargeProps) {
  const tooltipContent = tooltip ?? label ?? "";

  return (
    <RibbonTooltip content={tooltipContent} shortcut={shortcut}>
    <div
      data-testid={testId}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 46,
        height: t.largeButtonHeight,
        borderRadius: 2,
        border: active ? `1px solid ${t.buttonToggledBorder}` : "1px solid transparent",
        background: active ? t.buttonToggledBg : "transparent",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        overflow: "hidden",
      }}
    >
      {/* Main button area */}
      <button
        disabled={disabled}
        onClick={onClick}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          padding: "4px 8px 0",
          background: "transparent",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          color: "#333",
          width: "100%",
        }}
        onMouseEnter={(e) => {
          if (!disabled && !active) e.currentTarget.style.background = t.buttonHoverBg;
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.background = "transparent";
        }}
      >
        {icon && <span style={{ display: "flex", width: t.largeIconSize, height: t.largeIconSize }}>{icon}</span>}
        <span style={{ fontSize: 11, lineHeight: "14px", whiteSpace: "nowrap" }}>{label}</span>
      </button>

      {/* Dropdown arrow */}
      {onDropdownClick && (
        <button
          disabled={disabled}
          onClick={(e) => { e.stopPropagation(); onDropdownClick(); }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: 14,
            background: "transparent",
            border: "none",
            borderTop: `1px solid ${t.groupDividerColor}`,
            cursor: disabled ? "not-allowed" : "pointer",
            color: "#666",
          }}
          onMouseEnter={(e) => {
            if (!disabled) e.currentTarget.style.background = t.buttonHoverBg;
          }}
          onMouseLeave={(e) => {
            if (!disabled) e.currentTarget.style.background = "transparent";
          }}
        >
          <ChevronDown size={10} />
        </button>
      )}
    </div>
    </RibbonTooltip>
  );
}
