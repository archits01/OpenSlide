"use client";

import { RibbonTabPanel } from "../primitives";
import { FormulaFunctionsGroup } from "../groups/FormulaFunctionsGroup";
import { FormulaFunctionLibraryGroup } from "../groups/FormulaFunctionLibraryGroup";
import { FormulaCalculationGroup } from "../groups/FormulaCalculationGroup";

export function FormulasTab() {
  return (
    <RibbonTabPanel>
      <FormulaFunctionsGroup />
      <FormulaFunctionLibraryGroup />
      <FormulaCalculationGroup />
    </RibbonTabPanel>
  );
}
