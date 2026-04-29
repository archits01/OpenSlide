"use client";

import { useRef } from "react";
import { Image, Shapes, Camera, SlidersHorizontal } from "lucide-react";
import { RibbonGroup, RibbonButtonLarge } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";

export function InsertIllustrationsGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <RibbonGroup label="Illustrations">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => commands.insertImage(reader.result as string);
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
      <div style={{ display: "flex", gap: 2, alignItems: "flex-start", padding: "2px 0" }}>
        <RibbonButtonLarge
          icon={<Image size={20} />}
          label="Picture"
          tooltip="Insert picture from file"
          onClick={() => fileInputRef.current?.click()}
        />
        <RibbonButtonLarge
          icon={<Shapes size={20} />}
          label="Shapes"
          tooltip="Shapes — requires drawing plugin (not available)"
          disabled
        />
        <RibbonButtonLarge
          icon={<Camera size={20} />}
          label="Camera"
          tooltip="Camera — requires drawing plugin (not available)"
          disabled
        />
        <RibbonButtonLarge
          icon={<SlidersHorizontal size={20} />}
          label="Controls"
          tooltip="Form Controls — requires control plugin (not available)"
          disabled
        />
      </div>
    </RibbonGroup>
  );
}
