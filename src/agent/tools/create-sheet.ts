import type { AgentTool } from "./index";
import type { Slide } from "@/lib/types";
import { SheetEngine } from "@/lib/sheet-engine";
import { buildSheetHtml, embedWorkbookData } from "@/lib/sheet-html";
import type { WorkbookData, SheetData } from "@/lib/sheet-html";
import { parseA1 } from "./sheet-helpers";

let counter = 0;

export interface CreateSheetInput {
  title: string;
  sheets: Array<{
    name: string;
    columns: Array<{ header: string; width?: number; format?: "currency" | "percent" | "number" | "text" | "date" }>;
    rows: Array<Array<string | number | null>>;
    formulas?: Array<{ cell: string; formula: string }>;
    freezeRow?: number;
    freezeCol?: number;
  }>;
}

export const createSheetTool: AgentTool = {
  name: "create_sheet",
  description:
    "Create a spreadsheet workbook with structured tabular data. Use this when the user wants a spreadsheet, " +
    "table with multiple sheets, financial model, budget, data grid, or any structured rows-and-columns content. " +
    "Supports multiple tabs, column formatting (currency, percent, number, date, text), frozen rows/cols, and formula cells (start value with '='). " +
    "You can also provide explicit formulas via the formulas array for cross-sheet references.",
  input_schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Workbook title (shown in the slide header and used as the sheet name in exports)",
      },
      sheets: {
        type: "array",
        description: "Array of sheets/tabs in the workbook. At least one sheet is required.",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Tab name for this sheet (e.g. 'Q1 Revenue', 'Assumptions')",
            },
            columns: {
              type: "array",
              description: "Column definitions — defines headers, optional widths, and format hints",
              items: {
                type: "object",
                properties: {
                  header: { type: "string", description: "Column header label" },
                  width: { type: "number", description: "Column width in pixels (optional, defaults to 100)" },
                  format: { type: "string", enum: ["currency", "percent", "number", "text", "date"], description: "Display format" },
                },
                required: ["header"],
              },
            },
            rows: {
              type: "array",
              description: "Data rows. Each row is an array of cell values. Formulas start with '=' (e.g. '=SUM(B2:B10)').",
              items: { type: "array", items: { type: ["string", "number", "null"] } },
            },
            formulas: {
              type: "array",
              description: "Optional explicit formulas. Each has cell (A1 notation) and formula string. Use for cross-sheet refs.",
              items: {
                type: "object",
                properties: {
                  cell: { type: "string", description: "Cell in A1 notation (e.g. 'B3')" },
                  formula: { type: "string", description: "Formula starting with '='" },
                },
                required: ["cell", "formula"],
              },
            },
            freezeRow: { type: "number", description: "Number of rows to freeze from the top" },
            freezeCol: { type: "number", description: "Number of columns to freeze from the left" },
          },
          required: ["name", "columns", "rows"],
        },
      },
    },
    required: ["title", "sheets"],
  },

  async execute(rawInput: unknown): Promise<Slide> {
    const input = rawInput as CreateSheetInput;
    const id = `sheet_${Date.now()}_${++counter}`;

    // ── Build workbook in Univer ──────────────────────────────────────────
    const engine = new SheetEngine();
    try {
      const wb = engine.createWorkbook();

      // Remove the default sheet — we'll create our own
      const defaultSheet = wb.getActiveSheet();

      for (let i = 0; i < input.sheets.length; i++) {
        const sheetInput = input.sheets[i];
        const ws = engine.insertSheet(wb, sheetInput.name);

        // Write column headers in row 0
        const headers = sheetInput.columns.map((c) => c.header as string | number | null);
        if (headers.length > 0) {
          const endCol = String.fromCharCode(64 + headers.length); // A=1, B=2, etc.
          engine.setRangeValues(ws, `A1:${endCol}1`, [headers]);
        }

        // Write data rows starting at row 1 (row index 1 = Excel row 2)
        for (let r = 0; r < sheetInput.rows.length; r++) {
          const row = sheetInput.rows[r];
          for (let c = 0; c < row.length; c++) {
            const val = row[c];
            if (val === null || val === undefined) continue;
            if (typeof val === "string" && val.startsWith("=")) {
              engine.setCellFormula(ws, r + 1, c, val);
            } else {
              engine.setCellValue(ws, r + 1, c, val);
            }
          }
        }

        // Apply explicit formulas (overrides inline formulas if both exist)
        if (sheetInput.formulas) {
          for (const f of sheetInput.formulas) {
            const { row, col } = parseA1(f.cell);
            engine.setCellFormula(ws, row, col, f.formula);
          }
        }
      }

      // Delete the original default sheet (we created our own sheets above)
      if (defaultSheet && wb.getSheets().length > 1) {
        engine.deleteSheet(wb, defaultSheet);
      }

      // Evaluate all formulas
      await engine.evaluate();

      // Auto-size column widths based on content
      for (const sheetInput of input.sheets) {
        const ws = engine.getSheetByName(wb, sheetInput.name);
        if (!ws) continue;
        for (let c = 0; c < sheetInput.columns.length; c++) {
          const colDef = sheetInput.columns[c];
          if (colDef.width) {
            // Explicit width — use it
            try { ws.setColumnWidth(c, colDef.width); } catch { /* ignore */ }
            continue;
          }
          // Compute content-aware width
          const headerLen = (colDef.header ?? "").length;
          let maxDataLen = 0;
          for (const row of sheetInput.rows) {
            const val = row[c];
            if (val !== null && val !== undefined) {
              maxDataLen = Math.max(maxDataLen, String(val).length);
            }
          }
          const headerWidth = headerLen * 9 + 16;
          const dataWidth = maxDataLen * 8 + 16;
          const width = Math.min(300, Math.max(80, headerWidth, dataWidth));
          try { ws.setColumnWidth(c, width); } catch { /* ignore if API differs */ }
        }
      }

      // Serialize the Univer workbook
      const workbookData = engine.toJSON(wb);
      const workbookJson = JSON.stringify(workbookData);

      // ── Build HTML preview (backward-compatible rendering) ────────────
      const htmlWorkbook: WorkbookData = {
        title: input.title,
        sheets: input.sheets as SheetData[],
        activeSheet: 0,
      };
      const html = buildSheetHtml(htmlWorkbook);
      const content = embedWorkbookData(html, htmlWorkbook);

      const slide: Slide = {
        id,
        index: 0,
        title: input.title,
        content,
        layout: "content",
        type: "table",
        workbookJson,
        workbookSheetCount: input.sheets.length,
      };

      return slide;
    } finally {
      engine.dispose();
    }
  },
};
