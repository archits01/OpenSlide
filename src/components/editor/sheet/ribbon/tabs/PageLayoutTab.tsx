"use client";

import { RibbonTabPanel } from "../primitives";
import { PageSetupGroup } from "../groups/PageSetupGroup";
import { PageScaleToFitGroup } from "../groups/PageScaleToFitGroup";
import { PageSheetOptionsGroup } from "../groups/PageSheetOptionsGroup";

export function PageLayoutTab() {
  return (
    <RibbonTabPanel>
      <PageSetupGroup />
      <PageScaleToFitGroup />
      <PageSheetOptionsGroup />
    </RibbonTabPanel>
  );
}
