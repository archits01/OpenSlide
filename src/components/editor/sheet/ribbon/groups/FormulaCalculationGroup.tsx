"use client";

import { useState } from "react";
import { RefreshCw, FileSpreadsheet } from "lucide-react";
import { RibbonGroup, RibbonButton, RibbonButtonLarge, RibbonDropdown } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";

export function FormulaCalculationGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const [calcMode, setCalcMode] = useState("automatic");

  return (
    <RibbonGroup label="Calculation" minWidth={160}>
      <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <RibbonDropdown
            label="Calculation"
            value={calcMode}
            tooltip="Calculation Options"
            options={[
              { value: "automatic", label: "Automatic" },
              { value: "manual", label: "Manual" },
            ]}
            onChange={(v) => {
              setCalcMode(v);
              if (v === "automatic") commands.calculateNow();
            }}
            width={100}
          />
          <RibbonButton
            icon={<FileSpreadsheet size={14} />}
            label="Calculate Sheet"
            tooltip="Calculate Sheet"
            showLabel
            size="sm"
            onClick={() => commands.calculateSheet()}
          />
        </div>
        <RibbonButtonLarge
          icon={<RefreshCw size={18} />}
          label="Calculate Now"
          tooltip="Calculate Now"
          onClick={() => commands.calculateNow()}
        />
      </div>
    </RibbonGroup>
  );
}
