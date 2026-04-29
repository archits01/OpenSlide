/**
 * SheetEngine — headless Univer wrapper for OpenSlides.
 *
 * Provides an OpenSlides-friendly interface around Univer's Facade API.
 * No UI plugins registered. No rendering engine. Pure data + formula evaluation.
 *
 * Usage:
 *   const engine = new SheetEngine();
 *   const wb = engine.createWorkbook();
 *   const ws = wb.getActiveSheet();
 *   ws.getRange(0, 0).setValue(42);
 */

import { Univer, LocaleType, merge } from "@univerjs/core";
import { UniverSheetsPlugin } from "@univerjs/sheets";
import { UniverFormulaEnginePlugin } from "@univerjs/engine-formula";
import { UniverSheetsFormulaPlugin } from "@univerjs/sheets-formula";

// Locale bundles — required by Univer's permission/command system
import SheetsEnUS from "@univerjs/sheets/locale/en-US";
import SheetsFormulaEnUS from "@univerjs/sheets-formula/locale/en-US";

// Facade API — imported from each package's /facade subpath.
// These side-effect imports extend FUniver with sheet/formula methods via mixins.
import { FUniver } from "@univerjs/core/facade";
import "@univerjs/sheets/facade";
import "@univerjs/sheets-formula/facade";

import type { FWorkbook, FWorksheet } from "@univerjs/sheets/facade";
import type { IWorkbookData, CellValue, ICellData, Nullable, IDisposable } from "@univerjs/core";

// ─── Grid-friendly types ────────────────────────────────────────────────────

export interface CellData {
  value: unknown;
  displayValue: string;
  formula?: string;
  format?: CellFormat;
}

export interface CellFormat {
  numberFormat?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  backgroundColor?: string;
  textColor?: string;
}

export interface CellChangeEvent {
  workbookId: string;
  sheetId: string;
  row: number;
  col: number;
  oldValue: CellValue | null;
  newValue: CellValue | null;
}

export class SheetEngine {
  private univer: Univer;
  private facade: FUniver;

  constructor() {
    this.univer = new Univer({
      locale: LocaleType.EN_US,
      locales: { [LocaleType.EN_US]: merge({}, SheetsEnUS, SheetsFormulaEnUS) },
    });

    // Register headless plugins — NO UI, NO render engine
    this.univer.registerPlugin(UniverSheetsPlugin);
    this.univer.registerPlugin(UniverFormulaEnginePlugin);
    this.univer.registerPlugin(UniverSheetsFormulaPlugin);

    this.facade = FUniver.newAPI(this.univer);
  }

  /** Get the raw Facade API for advanced operations. */
  getFacade(): FUniver {
    return this.facade;
  }

  // ─── Workbook operations ──────────────────────────────────────────────────

  /** Create a new workbook, optionally with initial data. Returns the FWorkbook wrapper. */
  createWorkbook(data?: Partial<IWorkbookData>): FWorkbook {
    return this.facade.createWorkbook(data ?? {}) as FWorkbook;
  }

  /** Get the currently active workbook. */
  getActiveWorkbook(): FWorkbook | null {
    return this.facade.getActiveWorkbook() as FWorkbook | null;
  }

  // ─── Sheet operations ─────────────────────────────────────────────────────

  /** Insert a new sheet into a workbook. Returns the FWorksheet wrapper. */
  insertSheet(workbook: FWorkbook, name?: string): FWorksheet {
    return workbook.insertSheet(name);
  }

  /** Delete a sheet from a workbook. */
  deleteSheet(workbook: FWorkbook, sheet: FWorksheet): boolean {
    return workbook.deleteSheet(sheet);
  }

  /** Rename a sheet. */
  renameSheet(sheet: FWorksheet, newName: string): void {
    sheet.setName(newName);
  }

  /** Find a sheet by name. Returns null if not found. */
  getSheetByName(workbook: FWorkbook, name: string): FWorksheet | null {
    return workbook.getSheetByName(name);
  }

  // ─── Cell operations ──────────────────────────────────────────────────────

  /** Get a cell's computed value. For formula cells, returns the calculated result. */
  getCellValue(sheet: FWorksheet, row: number, col: number): CellValue | null {
    const range = sheet.getRange(row, col);
    // getValue() returns the raw value (for formulas, may return null before evaluation).
    // getCellData() gives us the full cell data including calculated values.
    const cellData = range.getCellData();
    if (cellData?.v !== undefined && cellData.v !== null) return cellData.v as CellValue;
    return range.getValue() ?? null;
  }

  /** Set a cell's value (string, number, boolean). */
  setCellValue(sheet: FWorksheet, row: number, col: number, value: CellValue): void {
    sheet.getRange(row, col).setValue(value);
  }

  /** Set a formula on a cell. Formula string should start with '='. */
  setCellFormula(sheet: FWorksheet, row: number, col: number, formula: string): void {
    // Use ICellData format for explicit formula setting
    sheet.getRange(row, col).setValue({ f: formula } as unknown as CellValue);
  }

  // ─── Range operations ─────────────────────────────────────────────────────

  /** Get values from an A1-notation range (e.g., "A1:C3"). */
  getRangeValues(sheet: FWorksheet, a1: string): Nullable<CellValue>[][] {
    return sheet.getRange(a1).getValues();
  }

  /** Set values on an A1-notation range. */
  setRangeValues(sheet: FWorksheet, a1: string, values: unknown[][]): void {
    sheet.getRange(a1).setValues(values as CellValue[][]);
  }

  // ─── Formula evaluation ───────────────────────────────────────────────────

  /**
   * Trigger formula recalculation. In Univer's headless mode, formulas
   * are evaluated synchronously when values change. This method yields
   * to ensure all pending command callbacks and formula evaluation complete.
   */
  async evaluate(): Promise<void> {
    // Univer evaluates formulas synchronously in headless mode.
    // A microtask yield ensures any queued command callbacks have flushed.
    // Formula engine runs async in a macrotask queue. Multiple yields with
    // increasing delays ensure the dependency graph is fully resolved.
    for (let i = 0; i < 5; i++) {
      await new Promise<void>((r) => setTimeout(r, 100));
    }
  }

  // ─── Serialization ────────────────────────────────────────────────────────

  /** Serialize a workbook to JSON for persistence. */
  toJSON(workbook: FWorkbook): IWorkbookData {
    return workbook.getSnapshot();
  }

  /** Load a workbook from a JSON snapshot. Returns the FWorkbook wrapper. */
  fromJSON(json: IWorkbookData): FWorkbook {
    return this.facade.createWorkbook(json) as FWorkbook;
  }

  // ─── Events ───────────────────────────────────────────────────────────────

  /**
   * Subscribe to cell data changes on a worksheet.
   * Returns an unsubscribe function.
   */
  onCellChange(
    sheet: FWorksheet,
    callback: (cells: { row: number; col: number; value: Nullable<ICellData> }[]) => void
  ): () => void {
    const disposable: IDisposable = sheet.onCellDataChange((matrix) => {
      const changes: { row: number; col: number; value: Nullable<ICellData> }[] = [];
      // ObjectMatrix iteration — matrix.forValue is the Univer pattern
      if (matrix && typeof matrix.forValue === "function") {
        matrix.forValue((row: number, col: number, value: Nullable<ICellData>) => {
          changes.push({ row, col, value });
        });
      }
      if (changes.length > 0) {
        callback(changes);
      }
    });
    return () => disposable.dispose();
  }

  // ─── Grid read methods ────────────────────────────────────────────────────

  /** Get cell data for a rectangular range. Returns a 2D array [row][col]. */
  getVisibleSheetData(
    sheet: FWorksheet,
    range: { startRow: number; endRow: number; startCol: number; endCol: number }
  ): CellData[][] {
    const { startRow, endRow, startCol, endCol } = range;
    const result: CellData[][] = [];

    for (let r = startRow; r <= endRow; r++) {
      const row: CellData[] = [];
      for (let c = startCol; c <= endCol; c++) {
        const fRange = sheet.getRange(r, c);
        const cellData = fRange.getCellData();
        const rawValue = cellData?.v ?? null;
        const formula = cellData?.f ?? undefined;

        // Build display value
        let displayValue = "";
        if (rawValue !== null && rawValue !== undefined) {
          displayValue = String(rawValue);
        } else if (formula) {
          displayValue = ""; // formula not yet evaluated
        }

        // Extract format info from style
        let format: CellFormat | undefined;
        const styleData = fRange.getCellStyleData();
        if (styleData) {
          format = {};
          if (styleData.bl) format.fontWeight = "bold";
          if (styleData.it) format.fontStyle = "italic";
          if (styleData.ht !== undefined) {
            // HorizontalAlign: 0=default, 1=left, 2=center, 3=right
            if (styleData.ht === 1) format.textAlign = "left";
            else if (styleData.ht === 2) format.textAlign = "center";
            else if (styleData.ht === 3) format.textAlign = "right";
          }
          if (styleData.bg?.rgb) format.backgroundColor = styleData.bg.rgb;
          if (styleData.cl?.rgb) format.textColor = styleData.cl.rgb;
        }

        row.push({
          value: rawValue,
          displayValue,
          ...(formula ? { formula } : {}),
          ...(format && Object.keys(format).length > 0 ? { format } : {}),
        });
      }
      result.push(row);
    }
    return result;
  }

  /** Get the number of populated rows and columns. */
  getSheetDimensions(sheet: FWorksheet): { rowCount: number; colCount: number } {
    return {
      rowCount: sheet.getMaxRows(),
      colCount: sheet.getMaxColumns(),
    };
  }

  /** Get column width in pixels. Falls back to defaultWidth. */
  getColumnWidth(sheet: FWorksheet, col: number, defaultWidth = 112): number {
    try {
      // Univer stores column widths internally — try to read via worksheet model
      const ws = sheet.getSheet();
      const colData = ws.getColumnWidth(col);
      return colData > 0 ? colData : defaultWidth;
    } catch {
      return defaultWidth;
    }
  }

  /** Get row height in pixels. Falls back to defaultHeight. */
  getRowHeight(sheet: FWorksheet, row: number, defaultHeight = 26): number {
    try {
      return sheet.getRowHeight(row) || defaultHeight;
    } catch {
      return defaultHeight;
    }
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  /** Dispose the Univer instance and release all resources. */
  dispose(): void {
    this.univer.dispose();
  }
}
