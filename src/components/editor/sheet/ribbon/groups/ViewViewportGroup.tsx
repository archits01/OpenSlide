"use client";

import { Columns, Rows } from "lucide-react";
import { RibbonGroup, RibbonButtonLarge } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";

function FreezePanesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="2" width="16" height="16" rx="1" />
      <line x1="2" y1="7" x2="18" y2="7" />
      <line x1="7" y1="2" x2="7" y2="18" />
      <rect x="2" y="2" width="5" height="5" fill="rgba(0,120,212,0.15)" stroke="none" />
    </svg>
  );
}

function UnfreezePanesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="2" width="16" height="16" rx="1" />
      <line x1="2" y1="7" x2="18" y2="7" strokeDasharray="2 2" opacity="0.4" />
      <line x1="7" y1="2" x2="7" y2="18" strokeDasharray="2 2" opacity="0.4" />
    </svg>
  );
}

export function ViewViewportGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);

  return (
    <RibbonGroup label="Viewport">
      <div style={{ display: "flex", gap: 2, alignItems: "flex-start", padding: "2px 0" }}>
        <RibbonButtonLarge
          icon={<FreezePanesIcon />}
          label="Freeze Panes"
          tooltip="Freeze Panes at current selection"
          onClick={() => commands.freezePanes("at-selection")}
          onDropdownClick={() => commands.freezePanes("first-row")}
        />
        <RibbonButtonLarge
          icon={<UnfreezePanesIcon />}
          label="Unfreeze Panes"
          tooltip="Unfreeze all panes"
          onClick={() => commands.freezePanes("unfreeze")}
        />
      </div>
    </RibbonGroup>
  );
}
