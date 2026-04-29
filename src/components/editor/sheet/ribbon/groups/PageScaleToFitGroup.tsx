"use client";

import { Maximize2, Minimize2, Percent } from "lucide-react";
import { RibbonGroup, RibbonDropdown } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";

export function PageScaleToFitGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);

  const currentScale = commands.layoutState.scale;

  return (
    <RibbonGroup label="Scale to Fit">
      <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "2px 0" }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <RibbonDropdown
            icon={<Maximize2 size={12} />}
            label="Width"
            value="auto"
            tooltip="Width — print scaling (visual only)"
            options={[
              { value: "auto", label: "Automatic" },
              { value: "1", label: "1 page" },
              { value: "2", label: "2 pages" },
            ]}
            onChange={() => {
              // Print width scaling — stored in layout state for export
            }}
            width={85}
          />
          <RibbonDropdown
            icon={<Minimize2 size={12} />}
            label="Height"
            value="auto"
            tooltip="Height — print scaling (visual only)"
            options={[
              { value: "auto", label: "Automatic" },
              { value: "1", label: "1 page" },
              { value: "2", label: "2 pages" },
            ]}
            onChange={() => {
              // Print height scaling — stored in layout state for export
            }}
            width={85}
          />
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <RibbonDropdown
            icon={<Percent size={12} />}
            label="Scale"
            value={`${currentScale}%`}
            tooltip="Scale percentage"
            options={[
              { value: "200%", label: "200%" },
              { value: "150%", label: "150%" },
              { value: "100%", label: "100%" },
              { value: "75%", label: "75%" },
              { value: "50%", label: "50%" },
            ]}
            onChange={(v) => {
              const n = parseInt(v, 10);
              if (!isNaN(n)) commands.setScale(n);
            }}
            width={85}
          />
        </div>
      </div>
    </RibbonGroup>
  );
}
