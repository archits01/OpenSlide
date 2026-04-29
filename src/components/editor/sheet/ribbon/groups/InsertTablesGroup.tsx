"use client";

import { Table } from "lucide-react";
import { RibbonGroup, RibbonButtonLarge } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";

export function InsertTablesGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);

  return (
    <RibbonGroup label="Tables">
      <div style={{ display: "flex", gap: 2, alignItems: "flex-start", padding: "2px 0" }}>
        <RibbonButtonLarge
          icon={<Table size={20} />}
          label="Table"
          tooltip="Format selection as a table"
          onClick={() => {
            try { commands.formatAsTable("light"); } catch { /* */ }
          }}
        />
      </div>
    </RibbonGroup>
  );
}
