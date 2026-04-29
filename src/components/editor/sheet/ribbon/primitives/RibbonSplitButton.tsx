"use client";

import { ChevronDown } from "lucide-react";
import { SHEET_TOKENS } from "../../sheet-tokens";
import { RibbonTooltip } from "./RibbonTooltip";
import type { RibbonButtonBaseProps } from "./types";

const t = SHEET_TOKENS.ribbon;

interface RibbonSplitButtonProps extends RibbonButtonBaseProps {
  onDropdownClick: () => void;
  dropdownOpen?: boolean;
  /** Color swatch indicator below the icon (for Fill Color / Font Color buttons) */
  colorIndicator?: string;
}

export function RibbonSplitButton({
  icon,
  label,
  tooltip,
  shortcut,
  disabled,
  active,
  onClick,
  onDropdownClick,
  dropdownOpen,
  colorIndicator,
  testId,
}: RibbonSplitButtonProps) {
  const tooltipContent = tooltip ?? label ?? "";

  return (
    <RibbonTooltip content={tooltipContent} shortcut={shortcut}>
    <div
      data-testid={testId}
      style={{
        display: "flex",
        alignItems: "center",
        height: t.buttonHeight,
        borderRadius: 2,
        border: active ? `1px solid ${t.buttonToggledBorder}` : "1px solid transparent",
        overflow: "hidden",
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
      }}
    >
      {/* Main icon button */}
      <button
        disabled={disabled}
        onClick={onClick}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: "100%",
          background: active ? t.buttonToggledBg : "transparent",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          color: "#333",
          padding: 0,
          gap: 0,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !active) e.currentTarget.style.background = t.buttonHoverBg;
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.background = active ? t.buttonToggledBg : "transparent";
        }}
        onMouseDown={(e) => {
          if (!disabled) e.currentTarget.style.background = t.buttonActiveBg;
        }}
        onMouseUp={(e) => {
          if (!disabled) e.currentTarget.style.background = active ? t.buttonToggledBg : t.buttonHoverBg;
        }}
      >
        {icon && <span style={{ display: "flex", width: t.iconSize, height: t.iconSize }}>{icon}</span>}
        {colorIndicator && (
          <div style={{ width: 14, height: 3, borderRadius: 1, background: colorIndicator, marginTop: 1 }} />
        )}
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 16, background: t.groupDividerColor, flexShrink: 0 }} />

      {/* Dropdown arrow */}
      <button
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); onDropdownClick(); }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 14,
          height: "100%",
          background: dropdownOpen ? t.buttonActiveBg : "transparent",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          color: "#666",
          padding: 0,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !dropdownOpen) e.currentTarget.style.background = t.buttonHoverBg;
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.background = dropdownOpen ? t.buttonActiveBg : "transparent";
        }}
      >
        <ChevronDown size={10} />
      </button>
    </div>
    </RibbonTooltip>
  );
}
