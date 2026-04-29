/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach } from 'vitest';
import { SheetEngine } from '../lib/sheet-engine';

describe('SheetEngine', () => {
  let engine: SheetEngine;

  afterEach(() => {
    engine?.dispose();
  });

  it('creates a workbook and reads/writes cell values', () => {
    engine = new SheetEngine();
    const wb = engine.createWorkbook();
    const ws = wb.getActiveSheet();

    // Set A1 = 10, A2 = 20
    engine.setCellValue(ws, 0, 0, 10);
    engine.setCellValue(ws, 1, 0, 20);

    expect(engine.getCellValue(ws, 0, 0)).toBe(10);
    expect(engine.getCellValue(ws, 1, 0)).toBe(20);
  });

  it('evaluates SUM formula correctly', async () => {
    engine = new SheetEngine();
    const wb = engine.createWorkbook();
    const ws = wb.getActiveSheet();

    // Set A1 = 10, A2 = 20, A3 = SUM(A1:A2)
    engine.setCellValue(ws, 0, 0, 10);
    engine.setCellValue(ws, 1, 0, 20);
    engine.setCellFormula(ws, 2, 0, '=SUM(A1:A2)');

    await engine.evaluate();

    const a3 = engine.getCellValue(ws, 2, 0);
    expect(a3).toBe(30);
  });

  it('re-evaluates formula after upstream cell change', async () => {
    engine = new SheetEngine();
    const wb = engine.createWorkbook();
    const ws = wb.getActiveSheet();

    engine.setCellValue(ws, 0, 0, 10);
    engine.setCellValue(ws, 1, 0, 20);
    engine.setCellFormula(ws, 2, 0, '=SUM(A1:A2)');
    await engine.evaluate();

    // Change A1 from 10 to 100
    engine.setCellValue(ws, 0, 0, 100);
    await engine.evaluate();

    const a3 = engine.getCellValue(ws, 2, 0);
    expect(a3).toBe(120);
  });

  it('serializes and deserializes a workbook with formulas', async () => {
    engine = new SheetEngine();
    const wb = engine.createWorkbook();
    const ws = wb.getActiveSheet();

    engine.setCellValue(ws, 0, 0, 10);
    engine.setCellValue(ws, 1, 0, 20);
    engine.setCellFormula(ws, 2, 0, '=SUM(A1:A2)');
    await engine.evaluate();

    // Serialize
    const json = engine.toJSON(wb);
    engine.dispose();

    // Deserialize in a fresh engine
    engine = new SheetEngine();
    const wb2 = engine.fromJSON(json);
    const ws2 = wb2.getActiveSheet();
    await engine.evaluate();

    const a3 = engine.getCellValue(ws2, 2, 0);
    expect(a3).toBe(30);
  });

  it('manages multiple sheets in a workbook', () => {
    engine = new SheetEngine();
    const wb = engine.createWorkbook();

    const sheet2 = engine.insertSheet(wb, 'Revenue');
    expect(sheet2.getSheetName()).toBe('Revenue');
    expect(wb.getSheets().length).toBe(2);

    engine.renameSheet(sheet2, 'Expenses');
    expect(sheet2.getSheetName()).toBe('Expenses');

    engine.deleteSheet(wb, sheet2);
    expect(wb.getSheets().length).toBe(1);
  });

  it('reads and writes range values', () => {
    engine = new SheetEngine();
    const wb = engine.createWorkbook();
    const ws = wb.getActiveSheet();

    engine.setRangeValues(ws, 'A1:C2', [
      [1, 2, 3],
      [4, 5, 6],
    ]);

    const values = engine.getRangeValues(ws, 'A1:C2');
    expect(values[0][0]).toBe(1);
    expect(values[0][2]).toBe(3);
    expect(values[1][1]).toBe(5);
  });

  it('fires cell change listener on value set', async () => {
    engine = new SheetEngine();
    const wb = engine.createWorkbook();
    const ws = wb.getActiveSheet();

    const changes: Array<{ row: number; col: number }> = [];
    const unsub = engine.onCellChange(ws, (cells) => {
      for (const c of cells) {
        changes.push({ row: c.row, col: c.col });
      }
    });

    engine.setCellValue(ws, 0, 1, 'hello');
    await engine.evaluate(); // flush

    // Listener should have fired
    expect(changes.length).toBeGreaterThan(0);
    expect(changes.some((c) => c.row === 0 && c.col === 1)).toBe(true);

    unsub();
  });

  it('getVisibleSheetData returns correct range', () => {
    engine = new SheetEngine();
    const wb = engine.createWorkbook();
    const ws = wb.getActiveSheet();

    // Populate a 5x5 grid
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        engine.setCellValue(ws, r, c, (r + 1) * 10 + (c + 1));
      }
    }

    // Request rows 1-3, cols 1-3 (0-indexed)
    const data = engine.getVisibleSheetData(ws, { startRow: 1, endRow: 3, startCol: 1, endCol: 3 });
    expect(data.length).toBe(3);
    expect(data[0].length).toBe(3);
    expect(data[0][0].value).toBe(22); // row 1, col 1 = 2*10+2
    expect(data[1][2].value).toBe(34); // row 2, col 3 = 3*10+4
    expect(data[0][0].displayValue).toBe("22");
  });

  it('getSheetDimensions returns populated bounds', () => {
    engine = new SheetEngine();
    const wb = engine.createWorkbook();
    const ws = wb.getActiveSheet();

    engine.setCellValue(ws, 0, 0, "A1");
    engine.setCellValue(ws, 9, 4, "E10");

    const dims = engine.getSheetDimensions(ws);
    // Univer's maxRows/maxColumns may exceed populated bounds — just verify they're >= populated
    expect(dims.rowCount).toBeGreaterThanOrEqual(10);
    expect(dims.colCount).toBeGreaterThanOrEqual(5);
  });

  it('getColumnWidth falls back to default', () => {
    engine = new SheetEngine();
    const wb = engine.createWorkbook();
    const ws = wb.getActiveSheet();

    const width = engine.getColumnWidth(ws, 0, 112);
    expect(width).toBeGreaterThan(0);
  });
});
