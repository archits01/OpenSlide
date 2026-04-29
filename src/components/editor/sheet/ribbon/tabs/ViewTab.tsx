"use client";

import { RibbonTabPanel } from "../primitives";
import { ViewShowHideGroup } from "../groups/ViewShowHideGroup";
import { ViewZoomGroup } from "../groups/ViewZoomGroup";
import { ViewViewportGroup } from "../groups/ViewViewportGroup";

export function ViewTab() {
  return (
    <RibbonTabPanel>
      <ViewShowHideGroup />
      <ViewZoomGroup />
      <ViewViewportGroup />
    </RibbonTabPanel>
  );
}
