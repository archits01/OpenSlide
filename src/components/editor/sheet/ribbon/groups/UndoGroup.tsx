"use client";

import { Undo2, Redo2 } from "lucide-react";
import { RibbonGroup, RibbonButton } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";

export function UndoGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);

  return (
    <RibbonGroup label="Undo">
      <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "2px 0" }}>
        <RibbonButton
          icon={<Undo2 size={14} />}
          tooltip="Undo (Ctrl+Z)"
          onClick={() => commands.undo()}
          size="sm"
        />
        <RibbonButton
          icon={<Redo2 size={14} />}
          tooltip="Redo (Ctrl+Y)"
          onClick={() => commands.redo()}
          size="sm"
        />
      </div>
    </RibbonGroup>
  );
}
