"use client";

import { RibbonTabPanel } from "../primitives";
import { DataSortFilterGroup } from "../groups/DataSortFilterGroup";
import { DataToolsGroup } from "../groups/DataToolsGroup";

export function DataTab() {
  return (
    <RibbonTabPanel>
      <DataSortFilterGroup />
      <DataToolsGroup />
    </RibbonTabPanel>
  );
}
