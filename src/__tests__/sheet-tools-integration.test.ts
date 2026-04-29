/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { createSheetTool } from "../agent/tools/create-sheet";
import { updateSheetTool } from "../agent/tools/update-sheet";
import { SheetEngine } from "../lib/sheet-engine";
import type { Slide } from "../lib/types";

describe("Sheet tools integration", () => {
  it("create_sheet produces both JSON and HTML", async () => {
    const result = (await createSheetTool.execute({
      title: "Financial Model",
      sheets: [
        {
          name: "Assumptions",
          columns: [{ header: "Param" }, { header: "Value" }],
          rows: [
            ["Growth Rate", 0.15],
          ],
        },
        {
          name: "Revenue",
          columns: [{ header: "Year" }, { header: "Revenue" }],
          rows: [
            [2024, 1000000],
          ],
          formulas: [
            { cell: "B3", formula: "=B2*(1+Assumptions!B2)" },
          ],
        },
      ],
    })) as Slide;

    // Has both workbook JSON and HTML content
    expect(result.workbookJson).toBeTruthy();
    expect(typeof result.workbookJson).toBe("string");
    expect(result.content).toContain("<");
    expect(result.content).toContain("html");
    expect(result.type).toBe("table");
    expect(result.workbookSheetCount).toBe(2);

    // Deserialize and verify formula evaluation
    const engine = new SheetEngine();
    try {
      const wb = engine.fromJSON(JSON.parse(result.workbookJson!));
      await engine.evaluate();

      // Find the Revenue sheet
      const revenueSheet = engine.getSheetByName(wb, "Revenue");
      expect(revenueSheet).not.toBeNull();

      // B3 = B2 * (1 + Assumptions!B2) = 1000000 * 1.15 = 1150000
      const b3 = engine.getCellValue(revenueSheet!, 2, 1);
      expect(b3).toBe(1150000);
    } finally {
      engine.dispose();
    }
  }, 15000); // 15s timeout for formula evaluation

  it("update_sheet applies patches and recalculates", async () => {
    // First create a sheet
    const created = (await createSheetTool.execute({
      title: "Budget",
      sheets: [
        {
          name: "Assumptions",
          columns: [{ header: "Param" }, { header: "Value" }],
          rows: [["Growth Rate", 0.15]],
        },
        {
          name: "Revenue",
          columns: [{ header: "Year" }, { header: "Revenue" }],
          rows: [[2024, 1000000]],
          formulas: [{ cell: "B3", formula: "=B2*(1+Assumptions!B2)" }],
        },
      ],
    })) as Slide;

    expect(created.workbookJson).toBeTruthy();

    // Now update: change growth rate from 0.15 to 0.20
    const updated = (await updateSheetTool.execute(
      {
        sheetId: created.id,
        patches: [
          {
            sheetName: "Assumptions",
            range: "B2",
            values: [[0.20]],
          },
        ],
      },
      undefined,
      { userId: "test", slides: [created] }
    )) as { slideId: string; workbookJson?: string; content?: string; changeSummary: string };

    expect(updated.slideId).toBe(created.id);
    expect(updated.workbookJson).toBeTruthy();
    expect(updated.changeSummary).toContain("Assumptions");
    expect(updated.changeSummary).toContain("Recalculated");

    // Verify the formula recalculated: 1000000 * 1.20 = 1200000
    const engine = new SheetEngine();
    try {
      const wb = engine.fromJSON(JSON.parse(updated.workbookJson!));
      await engine.evaluate();

      const revenueSheet = engine.getSheetByName(wb, "Revenue");
      expect(revenueSheet).not.toBeNull();

      const b3 = engine.getCellValue(revenueSheet!, 2, 1);
      expect(b3).toBe(1200000);
    } finally {
      engine.dispose();
    }
  }, 20000);

  it("update_sheet rejects legacy HTML sheets", async () => {
    // Create a legacy slide with only HTML content, no workbookJson
    const legacySlide: Slide = {
      id: "legacy_sheet_1",
      index: 0,
      title: "Old Sheet",
      content: "<html><body><table><tr><td>data</td></tr></table></body></html>",
      layout: "content",
      type: "table",
      // No workbookJson — this is a legacy HTML-only sheet
    };

    const result = (await updateSheetTool.execute(
      {
        sheetId: "legacy_sheet_1",
        patches: [{ sheetName: "Sheet1", range: "A1", values: [["new"]] }],
      },
      undefined,
      { userId: "test", slides: [legacySlide] }
    )) as { slideId: string; changeSummary: string };

    expect(result.changeSummary).toContain("legacy HTML");
    expect(result.changeSummary).toContain("recreate");
  });
});
