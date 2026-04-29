"use client";

import { RibbonTabPanel } from "../primitives";
import { InsertTablesGroup } from "../groups/InsertTablesGroup";
import { InsertChartsGroup } from "../groups/InsertChartsGroup";
import { InsertIllustrationsGroup } from "../groups/InsertIllustrationsGroup";
import { InsertLinksGroup } from "../groups/InsertLinksGroup";
import { InsertTextGroup } from "../groups/InsertTextGroup";

export function InsertTab() {
  return (
    <RibbonTabPanel>
      <InsertTablesGroup />
      <InsertChartsGroup />
      <InsertIllustrationsGroup />
      <InsertLinksGroup />
      <InsertTextGroup />
    </RibbonTabPanel>
  );
}
