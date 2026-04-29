"use client";

import { SHEET_TOKENS } from "../../sheet-tokens";
import { RibbonTooltip } from "./RibbonTooltip";
import type { RibbonButtonBaseProps } from "./types";

const t = SHEET_TOKENS.ribbon;

interface RibbonButtonProps extends RibbonButtonBaseProps {
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function RibbonButton({
  icon,
  label,
  tooltip,
  shortcut,
  disabled,
  active,
  onClick,
  testId,
  size = "md",
  showLabel,
}: RibbonButtonProps) {
  const px = size === "sm" ? 22 : t.buttonHeight;
  const tooltipContent = tooltip ?? label ?? "";

  const btn = (
    <button
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: showLabel ? "flex-start" : "center",
        gap: showLabel ? 4 : 0,
        width: showLabel ? "auto" : px,
        height: px,
        padding: showLabel ? "0 6px" : 0,
        border: active ? `1px solid ${t.buttonToggledBorder}` : "1px solid transparent",
        borderRadius: 2,
        background: active ? t.buttonToggledBg : "transparent",
        color: disabled ? "#A0A0A0" : "#333",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "background 80ms, border-color 80ms",
        flexShrink: 0,
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
      {icon && <span style={{ display: "flex", width: t.iconSize, height: t.iconSize, flexShrink: 0 }}>{icon}</span>}
      {showLabel && label && <span style={{ fontSize: t.fontSize, whiteSpace: "nowrap" }}>{label}</span>}
    </button>
  );

  return tooltipContent ? (
    <RibbonTooltip content={tooltipContent} shortcut={shortcut}>{btn}</RibbonTooltip>
  ) : btn;
}
