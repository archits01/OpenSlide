import type { AgentTool } from "./index";
import type { Slide } from "@/lib/types";
import { SheetEngine } from "@/lib/sheet-engine";
import { buildSheetHtml, embedWorkbookData } from "@/lib/sheet-html";
import type { WorkbookData } from "@/lib/sheet-html";
import { parseA1 } from "./sheet-helpers";
import type { IWorkbookData } from "@univerjs/core";

export interface SheetPatch {
  sheetName: string;
  range: string;
  values?: Array<Array<string | number | null>>;
  formulas?: Array<{ cell: string; formula: string }>;
}

export interface UpdateSheetInput {
  sheetId: string;
  patches: SheetPatch[];
}

export const updateSheetTool: AgentTool = {
  name: "update_sheet",
  description:
    "Update an existing spreadsheet by applying patches to specific sheets and ranges. " +
    "Each patch targets a named sheet and can set values on a range and/or apply formulas. " +
    "The workbook is recalculated after all patches are applied. Returns updated content and workbook JSON.",
  input_schema: {
    type: "object",
    properties: {
      sheetId: {
        type: "string",
        description: "The ID of the sheet slide to update",
      },
      patches: {
        type: "array",
        description: "Ordered list of patches to apply to the workbook",
        items: {
          type: "object",
          properties: {
            sheetName: {
              type: "string",
              description: "Target tab name (must match an existing sheet name exactly)",
            },
            range: {
              type: "string",
              description: "Target range in A1 notation (e.g. 'B5' for a single cell, 'B5:D10' for a block)",
            },
            values: {
              type: "array",
              description: "2D array of values to write into the range. Dimensions must match the range.",
              items: { type: "array", items: { type: ["string", "number", "null"] } },
            },
            formulas: {
              type: "array",
              description: "Formulas to apply within the target sheet. Each has cell (A1 notation) and formula string.",
              items: {
                type: "object",
                properties: {
                  cell: { type: "string", description: "Cell in A1 notation" },
                  formula: { type: "string", description: "Formula starting with '='" },
                },
                required: ["cell", "formula"],
              },
            },
          },
          required: ["sheetName"],
        },
      },
    },
    required: ["sheetId", "patches"],
  },

  async execute(
    rawInput: unknown,
    _signal?: AbortSignal,
    context?: { userId: string; sessionId?: string; slides?: unknown[] }
  ): Promise<Partial<Slide> & { slideId: string; changeSummary: string }> {
    const input = rawInput as UpdateSheetInput;

    // Find the target slide — passed via context from the loop
    const slides = (context?.slides ?? []) as Slide[];
    const targetSlide = slides.find((s) => s.id === input.sheetId);

    if (!targetSlide?.workbookJson) {
      return {
        slideId: input.sheetId,
        changeSummary: "Cannot update legacy HTML sheet — please ask the AI to recreate the sheet fresh.",
      };
    }

    const engine = new SheetEngine();
    try {
      const workbookData: IWorkbookData = JSON.parse(targetSlide.workbookJson);
      const wb = engine.fromJSON(workbookData);

      const patchSummaries: string[] = [];

      for (const patch of input.patches) {
        const ws = engine.getSheetByName(wb, patch.sheetName);
        if (!ws) {
          patchSummaries.push(`Skipped "${patch.sheetName}" (not found)`);
          continue;
        }

        let cellCount = 0;

        // Apply values
        if (patch.values && patch.range) {
          engine.setRangeValues(ws, patch.range, patch.values as unknown[][]);
          cellCount += patch.values.reduce((sum, row) => sum + row.length, 0);
        }

        // Apply formulas
        if (patch.formulas) {
          for (const f of patch.formulas) {
            const { row, col } = parseA1(f.cell);
            engine.setCellFormula(ws, row, col, f.formula);
            cellCount++;
          }
        }

        if (cellCount > 0) {
          patchSummaries.push(`Updated ${cellCount} cell${cellCount !== 1 ? "s" : ""} in ${patch.sheetName}`);
        }
      }

      // Recalculate
      await engine.evaluate();

      // Serialize updated workbook
      const updatedData = engine.toJSON(wb);
      const workbookJson = JSON.stringify(updatedData);

      // Regenerate HTML preview from the stored workbook data
      // We reconstruct a WorkbookData from the Univer snapshot for the HTML builder
      const htmlWorkbook = univerSnapshotToWorkbookData(updatedData, targetSlide.title);
      const html = buildSheetHtml(htmlWorkbook);
      const content = embedWorkbookData(html, htmlWorkbook);

      const changeSummary = patchSummaries.length > 0
        ? patchSummaries.join(". ") + ". Recalculated all formulas."
        : "No changes applied.";

      return {
        slideId: input.sheetId,
        workbookJson,
        content,
        changeSummary,
      };
    } finally {
      engine.dispose();
    }
  },
};

/**
 * Convert a Univer IWorkbookData snapshot back to the simpler WorkbookData
 * format that sheet-html.ts expects for HTML rendering.
 */
function univerSnapshotToWorkbookData(data: IWorkbookData, title: string): WorkbookData {
  const sheets = (data.sheetOrder ?? []).map((sheetId) => {
    const ws = data.sheets?.[sheetId];
    if (!ws) return { name: sheetId, columns: [], rows: [] };

    // Extract column headers from row 0
    const cellData = ws.cellData ?? {};
    const maxCol = Math.max(ws.columnCount ?? 0, ...Object.keys(cellData[0] ?? {}).map(Number), 0) || 0;
    const maxRow = Math.max(ws.rowCount ?? 0, ...Object.keys(cellData).map(Number), 0) || 0;

    const columns: Array<{ header: string; width?: number }> = [];
    for (let c = 0; c <= maxCol; c++) {
      const cell = cellData[0]?.[c];
      const header = cell?.v != null ? String(cell.v) : "";
      columns.push({ header });
    }

    const rows: Array<Array<string | number | null>> = [];
    for (let r = 1; r <= maxRow; r++) {
      const row: Array<string | number | null> = [];
      for (let c = 0; c <= maxCol; c++) {
        const cell = cellData[r]?.[c];
        if (!cell) { row.push(null); continue; }
        if (cell.f) { row.push(cell.f); continue; }
        if (cell.v != null) { row.push(cell.v as string | number); continue; }
        row.push(null);
      }
      rows.push(row);
    }

    return { name: ws.name ?? sheetId, columns, rows };
  });

  return { title, sheets, activeSheet: 0 };
}
