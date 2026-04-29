"use client";

import { RibbonTabPanel } from "../primitives";
import { UndoGroup } from "../groups/UndoGroup";
import { ClipboardGroup } from "../groups/ClipboardGroup";
import { FontGroup } from "../groups/FontGroup";
import { AlignmentGroup } from "../groups/AlignmentGroup";
import { NumberGroup } from "../groups/NumberGroup";
import { StylesGroup } from "../groups/StylesGroup";
import { CellsGroup } from "../groups/CellsGroup";
import { EditingGroup } from "../groups/EditingGroup";

export function HomeTab() {
  return (
    <RibbonTabPanel>
      <UndoGroup />
      <ClipboardGroup />
      <FontGroup />
      <AlignmentGroup />
      <NumberGroup />
      <StylesGroup />
      <CellsGroup />
      <EditingGroup />
    </RibbonTabPanel>
  );
}
