/**
 * Pure functions for building sheet HTML — usable in both client (canvas)
 * and server (API export routes). No "use client" directive here.
 */

export interface SheetData {
  name: string;
  columns: Array<{ header: string; width?: number; format?: string }>;
  rows: Array<Array<string | number | null>>;
  freezeRow?: number;
  freezeCol?: number;
}

export interface WorkbookData {
  title: string;
  sheets: SheetData[];
  activeSheet?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert 0-based column index to spreadsheet letter(s): 0→A, 25→Z, 26→AA */
function colLetter(index: number): string {
  let result = "";
  let n = index;
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
}

/** Escape HTML entities in a string */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Format a cell value for display based on column format hint */
function formatCell(value: string | number | null, format?: string): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    // Formula cell — rendering is handled at call site
    return escapeHtml(value);
  }
  if (typeof value === "number") {
    switch (format) {
      case "currency":
        return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      case "percent":
        return value.toFixed(1) + "%";
      case "number":
        return value.toLocaleString("en-US");
      default:
        // Auto-detect: integers without comma, floats with up to 4 decimals
        return Number.isInteger(value)
          ? value.toLocaleString("en-US")
          : value.toLocaleString("en-US", { maximumFractionDigits: 4 });
    }
  }
  return escapeHtml(String(value));
}

// ── Sheet HTML builder ────────────────────────────────────────────────────────

function buildSheetTableHtml(sheet: SheetData, sheetIndex: number, isActive: boolean): string {
  const cols = sheet.columns;
  const rows = sheet.rows;

  // Determine column count from columns definition or from widest row
  const colCount = Math.max(cols.length, ...rows.map((r) => r.length), 1);

  // ── Column header row (A, B, C …) ──
  let headerCells = `<th style="background:#f3f4f6;border-right:1px solid #f0f0f0;border-bottom:2px solid #d1d5db;width:40px;min-width:40px;position:sticky;top:0;left:0;z-index:3;"></th>`;
  for (let c = 0; c < colCount; c++) {
    const colDef = cols[c];
    const widthStyle = colDef?.width ? `width:${colDef.width}px;min-width:${colDef.width}px;` : "width:100px;min-width:80px;";
    headerCells += `<th style="${widthStyle}background:#f3f4f6;color:#374151;font-weight:600;font-size:11px;text-align:center;padding:5px 8px;border-right:1px solid #f0f0f0;border-bottom:2px solid #d1d5db;position:sticky;top:0;z-index:2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${colLetter(c)}</th>`;
  }

  // ── Column label row (user headers) ──
  let labelCells = `<th style="background:#f3f4f6;border-right:1px solid #f0f0f0;border-bottom:1px solid #d1d5db;width:40px;min-width:40px;position:sticky;top:26px;left:0;z-index:3;"></th>`;
  for (let c = 0; c < colCount; c++) {
    const colDef = cols[c];
    const header = colDef?.header ?? "";
    const widthStyle = colDef?.width ? `width:${colDef.width}px;min-width:${colDef.width}px;` : "width:100px;min-width:80px;";
    labelCells += `<th style="${widthStyle}background:#f3f4f6;color:#374151;font-weight:600;font-size:11px;text-align:left;padding:5px 8px;border-right:1px solid #f0f0f0;border-bottom:1px solid #d1d5db;position:sticky;top:26px;z-index:2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(header)}">${escapeHtml(header)}</th>`;
  }

  // ── Data rows ──
  let dataRows = "";
  for (let r = 0; r < rows.length; r++) {
    const rowBg = r % 2 === 0 ? "#ffffff" : "#f9fafb";
    let cells = `<td style="background:#f3f4f6;color:#9ca3af;font-size:10px;text-align:center;padding:4px 6px;border-right:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;position:sticky;left:0;z-index:1;">${r + 1}</td>`;
    for (let c = 0; c < colCount; c++) {
      const raw = rows[r]?.[c] ?? null;
      const colDef = cols[c];
      const format = colDef?.format;
      const isNumber = typeof raw === "number";
      const isFormula = typeof raw === "string" && raw.startsWith("=");
      const align = isNumber ? "right" : "left";

      let cellContent: string;
      if (isFormula) {
        const formulaEsc = escapeHtml(raw);
        cellContent = `<span title="${formulaEsc}" style="color:#2563eb;font-style:italic;font-size:10px;margin-right:3px;">fx</span><span title="${formulaEsc}" style="color:#374151;">${formulaEsc}</span>`;
      } else {
        cellContent = formatCell(raw, format);
      }

      cells += `<td style="background:${rowBg};font-size:12px;padding:5px 8px;border-right:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;text-align:${align};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;">${cellContent}</td>`;
    }
    dataRows += `<tr>${cells}</tr>`;
  }

  const displayStyle = isActive ? "block" : "none";
  return `<div id="sheet-${sheetIndex}" style="display:${displayStyle};position:absolute;inset:0 0 32px 0;overflow:auto;">
  <table style="border-collapse:collapse;table-layout:fixed;font-family:Inter,system-ui,-apple-system,sans-serif;">
    <thead>
      <tr>${headerCells}</tr>
      <tr>${labelCells}</tr>
    </thead>
    <tbody>${dataRows}</tbody>
  </table>
</div>`;
}

const TAB_BASE = "padding:4px 14px;font-size:12px;font-family:Inter,system-ui,-apple-system,sans-serif;display:inline-flex;align-items:center;height:32px;box-sizing:border-box;border-radius:3px 3px 0 0;cursor:pointer;";
const TAB_ACTIVE = TAB_BASE + "background:#fff;font-weight:600;color:#1a1a1a;border:1px solid #d1d5db;border-bottom-color:#fff;margin-bottom:-1px;z-index:1;";
const TAB_INACTIVE = TAB_BASE + "background:transparent;font-weight:400;color:#6b7280;border:none;margin-bottom:0;z-index:0;";

function buildTabBar(sheets: SheetData[], activeSheet: number): string {
  const tabs = sheets
    .map((s, i) => {
      const style = i === activeSheet ? TAB_ACTIVE : TAB_INACTIVE;
      return `<div class="sheet-tab" onclick="switchSheet(${i})" style="${style}">${escapeHtml(s.name)}</div>`;
    })
    .join("");

  return `<div style="position:absolute;bottom:0;left:0;right:0;height:32px;background:#e5e7eb;border-top:1px solid #d1d5db;display:flex;align-items:flex-end;padding:0 8px;overflow-x:auto;white-space:nowrap;">${tabs}</div>`;
}

/**
 * Returns a complete HTML document that renders a spreadsheet workbook preview.
 * Dimensions: 1280×800px.
 */
export function buildSheetHtml(workbook: WorkbookData): string {
  const activeSheet = workbook.activeSheet ?? 0;
  const sheets = workbook.sheets;

  const sheetTables = sheets
    .map((sheet, i) => buildSheetTableHtml(sheet, i, i === activeSheet))
    .join("\n");

  const tabBar = sheets.length > 1 ? buildTabBar(sheets, activeSheet) : "";

  const switchScript =
    sheets.length > 1
      ? `<script>
var TAB_ON='${TAB_ACTIVE}';
var TAB_OFF='${TAB_INACTIVE}';
function switchSheet(idx){
  var total=${sheets.length};
  for(var i=0;i<total;i++){
    var el=document.getElementById('sheet-'+i);
    if(el) el.style.display=(i===idx?'block':'none');
  }
  var tabs=document.querySelectorAll('.sheet-tab');
  tabs.forEach(function(t,i){
    t.style.cssText=(i===idx?TAB_ON:TAB_OFF);
  });
}
</script>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
html,body{margin:0;padding:0;width:1280px;height:800px;overflow:hidden;background:#fff;font-family:Inter,system-ui,-apple-system,sans-serif;}
*{box-sizing:border-box;}
</style>
</head>
<body>
<div style="position:relative;width:1280px;height:800px;overflow:hidden;">
${sheetTables}
${tabBar}
</div>
${switchScript}
</body>
</html>`;
}

/**
 * Embeds the workbook JSON as a base64-encoded `data-workbook` attribute on the
 * `<body>` tag. This allows later extraction for xlsx export.
 */
export function embedWorkbookData(html: string, workbook: WorkbookData): string {
  const encoded = Buffer.from(JSON.stringify(workbook), "utf-8").toString("base64");
  return html.replace(/<body([^>]*)>/, `<body$1 data-workbook="${encoded}">`);
}
