export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { requireAuth, isResponse, requireOwnership } from "@/lib/api-helpers";
import { getSession } from "@/lib/redis";

/**
 * GET /api/export/xlsx?sessionId=... — convert all sheets in a session's slides
 * into a single .xlsx workbook. Each slide contributes one or more worksheets
 * from its workbookJson (Univer snapshot format).
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return Response.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const session = await getSession(sessionId);
  const denied = requireOwnership(session, user.id);
  if (denied) return denied;

  if (session!.type !== "sheets") {
    return Response.json({ error: "Session is not a sheets session" }, { status: 400 });
  }

  try {
    const wb = XLSX.utils.book_new();
    let appended = 0;

    for (const slide of session!.slides) {
      if (!slide.workbookJson) continue;

      let snapshot: UniverSnapshot;
      try {
        snapshot = JSON.parse(slide.workbookJson) as UniverSnapshot;
      } catch {
        continue;
      }

      const sheetOrder = Array.isArray(snapshot.sheetOrder) ? snapshot.sheetOrder : Object.keys(snapshot.sheets ?? {});
      for (const sheetId of sheetOrder) {
        const sheet = snapshot.sheets?.[sheetId];
        if (!sheet) continue;

        const ws = univerSheetToXlsxSheet(sheet);
        const name = dedupeSheetName(wb, sheet.name || slide.title || `Sheet${appended + 1}`);
        XLSX.utils.book_append_sheet(wb, ws, name);
        appended++;
      }
    }

    if (appended === 0) {
      return Response.json({ error: "No sheets to export" }, { status: 400 });
    }

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const fileName = `${sanitizeFilename(session!.title || "spreadsheet")}.xlsx`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[xlsx export] failed:", err);
    return Response.json({ error: "Export failed" }, { status: 500 });
  }
}

// ─── Conversion helpers ────────────────────────────────────────────────────

interface UniverCell {
  v?: string | number | boolean | null;
  f?: string;
}
interface UniverSheet {
  name?: string;
  rowCount?: number;
  columnCount?: number;
  cellData?: Record<string, Record<string, UniverCell>>;
}
interface UniverSnapshot {
  sheetOrder?: string[];
  sheets?: Record<string, UniverSheet>;
}

/** Convert a Univer sheet's sparse cellData into a XLSX worksheet. */
function univerSheetToXlsxSheet(sheet: UniverSheet): XLSX.WorkSheet {
  const data: Array<Array<string | number | boolean | null>> = [];
  const cellData = sheet.cellData ?? {};

  let maxRow = 0;
  let maxCol = 0;

  for (const rowKey of Object.keys(cellData)) {
    const r = parseInt(rowKey, 10);
    if (isNaN(r)) continue;
    const row = cellData[rowKey];
    for (const colKey of Object.keys(row)) {
      const c = parseInt(colKey, 10);
      if (isNaN(c)) continue;
      if (r > maxRow) maxRow = r;
      if (c > maxCol) maxCol = c;
    }
  }

  for (let r = 0; r <= maxRow; r++) {
    const row: Array<string | number | boolean | null> = [];
    for (let c = 0; c <= maxCol; c++) {
      const cell = cellData[r]?.[c];
      row.push(cell?.v ?? null);
    }
    data.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Re-apply formulas (aoa_to_sheet loses them — only writes values).
  for (const rowKey of Object.keys(cellData)) {
    const r = parseInt(rowKey, 10);
    if (isNaN(r)) continue;
    const row = cellData[rowKey];
    for (const colKey of Object.keys(row)) {
      const c = parseInt(colKey, 10);
      if (isNaN(c)) continue;
      const cell = row[colKey];
      if (cell?.f) {
        const ref = XLSX.utils.encode_cell({ r, c });
        const formula = cell.f.startsWith("=") ? cell.f.slice(1) : cell.f;
        ws[ref] = { t: typeof cell.v === "number" ? "n" : "s", v: cell.v ?? "", f: formula };
      }
    }
  }

  return ws;
}

function dedupeSheetName(wb: XLSX.WorkBook, name: string): string {
  const base = name.slice(0, 31).replace(/[\\/?*[\]:]/g, "_");
  if (!wb.SheetNames.includes(base)) return base;
  let i = 2;
  while (wb.SheetNames.includes(`${base.slice(0, 28)} ${i}`)) i++;
  return `${base.slice(0, 28)} ${i}`;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 100) || "spreadsheet";
}
