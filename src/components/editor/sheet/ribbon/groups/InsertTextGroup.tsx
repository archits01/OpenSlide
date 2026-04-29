"use client";

import { useRef, useState } from "react";
import { Type } from "lucide-react";
import { RibbonGroup, RibbonButtonLarge, InputPopover } from "../primitives";
import { useSheetFacade } from "../SheetFacadeContext";

export function InsertTextGroup() {
  const facadeRef = useSheetFacade();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const insertText = (text: string) => {
    try {
      const wb = facadeRef.current?.getActiveWorkbook?.();
      const ws = wb?.getActiveSheet?.();
      const range = wb?.getActiveRange?.()?.getRange?.();
      if (ws && range) {
        ws.getRange?.(range.startRow, range.startColumn)?.setValue?.(text);
      }
    } catch { /* */ }
  };

  return (
    <RibbonGroup label="Text">
      <div ref={anchorRef} style={{ display: "flex", gap: 2, alignItems: "flex-start", padding: "2px 0" }}>
        <RibbonButtonLarge
          icon={<Type size={20} />}
          label="Text Box"
          tooltip="Insert Text Box"
          onClick={() => setOpen(true)}
        />
      </div>
      <InputPopover
        open={open}
        anchorRef={anchorRef}
        title="Insert Text"
        label="Text"
        placeholder="Enter text to insert at the active cell"
        submitLabel="Insert"
        onSubmit={insertText}
        onClose={() => setOpen(false)}
      />
    </RibbonGroup>
  );
}
