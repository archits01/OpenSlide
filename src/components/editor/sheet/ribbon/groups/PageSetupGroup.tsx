"use client";

import { RibbonGroup, RibbonButtonLarge } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";

function MarginsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="3" y="2" width="14" height="16" rx="1" />
      <rect x="5" y="5" width="10" height="10" rx="0.5" strokeDasharray="2 1" opacity="0.5" />
    </svg>
  );
}

function OrientationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="5" y="2" width="10" height="16" rx="1" />
      <path d="M8 14 L10 16 L12 14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SizeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="3" y="2" width="14" height="16" rx="1" />
      <path d="M7 6 L13 6 M7 9 L13 9 M7 12 L11 12" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function PageSetupGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);

  const cycleMargins = () => {
    try {
      const current = commands.layoutState.margins;
      const next = current === "normal" ? "wide" : current === "wide" ? "narrow" : "normal";
      commands.setMargins(next);
    } catch { /* */ }
  };

  const toggleOrientation = () => {
    try {
      const current = commands.layoutState.orientation;
      commands.setPageOrientation(current === "portrait" ? "landscape" : "portrait");
    } catch { /* */ }
  };

  const cycleSize = () => {
    try {
      const current = commands.layoutState.paperSize;
      const order = ["letter", "a4", "legal", "a3"] as const;
      const idx = order.indexOf(current as typeof order[number]);
      const next = order[(idx + 1) % order.length];
      commands.setPaperSize(next);
    } catch { /* */ }
  };

  return (
    <RibbonGroup label="Page Setup" minWidth={160}>
      <div style={{ display: "flex", gap: 2, alignItems: "flex-start", padding: "2px 0" }}>
        <RibbonButtonLarge
          icon={<MarginsIcon />}
          label="Margins"
          tooltip={`Margins: ${commands.layoutState.margins}`}
          onClick={cycleMargins}
        />
        <RibbonButtonLarge
          icon={<OrientationIcon />}
          label="Orientation"
          tooltip={`Orientation: ${commands.layoutState.orientation}`}
          onClick={toggleOrientation}
        />
        <RibbonButtonLarge
          icon={<SizeIcon />}
          label="Size"
          tooltip={`Paper Size: ${commands.layoutState.paperSize.toUpperCase()}`}
          onClick={cycleSize}
        />
      </div>
    </RibbonGroup>
  );
}
