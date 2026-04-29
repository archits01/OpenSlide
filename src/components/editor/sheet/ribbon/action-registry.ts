/**
 * Flat registry of every ribbon action for the "Tell Me" search.
 * Each entry maps to a command that can be executed from the search box.
 */

export interface RibbonAction {
  id: string;
  label: string;
  keywords: string[];
  tab: string;
  group: string;
  shortcut?: string;
}

/**
 * Static registry — maintained manually.
 * When a new group is added, add its actions here.
 */
export const RIBBON_ACTIONS: RibbonAction[] = [
  // ─── Clipboard ────────────────────────────────
  { id: "paste", label: "Paste", keywords: ["paste", "clipboard"], tab: "Home", group: "Clipboard", shortcut: "Ctrl+V" },
  { id: "cut", label: "Cut", keywords: ["cut", "clipboard"], tab: "Home", group: "Clipboard", shortcut: "Ctrl+X" },
  { id: "copy", label: "Copy", keywords: ["copy", "clipboard"], tab: "Home", group: "Clipboard", shortcut: "Ctrl+C" },
  { id: "formatPainter", label: "Format Painter", keywords: ["format", "painter", "copy formatting"], tab: "Home", group: "Clipboard" },

  // ─── Font ─────────────────────────────────────
  { id: "bold", label: "Bold", keywords: ["bold", "weight", "strong"], tab: "Home", group: "Font", shortcut: "Ctrl+B" },
  { id: "italic", label: "Italic", keywords: ["italic", "slant"], tab: "Home", group: "Font", shortcut: "Ctrl+I" },
  { id: "underline", label: "Underline", keywords: ["underline"], tab: "Home", group: "Font", shortcut: "Ctrl+U" },
  { id: "strikethrough", label: "Strikethrough", keywords: ["strikethrough", "strike", "cross out"], tab: "Home", group: "Font" },
  { id: "fontSize", label: "Font Size", keywords: ["font", "size", "text size"], tab: "Home", group: "Font" },
  { id: "fontFamily", label: "Font Family", keywords: ["font", "family", "typeface"], tab: "Home", group: "Font" },
  { id: "fontColor", label: "Font Color", keywords: ["font", "color", "text color"], tab: "Home", group: "Font" },
  { id: "fillColor", label: "Fill Color", keywords: ["fill", "background", "highlight", "cell color"], tab: "Home", group: "Font" },
  { id: "borders", label: "Borders", keywords: ["border", "cell border", "outline"], tab: "Home", group: "Font" },
  { id: "clearFormatting", label: "Clear Formatting", keywords: ["clear", "formatting", "reset"], tab: "Home", group: "Font" },

  // ─── Alignment ────────────────────────────────
  { id: "alignLeft", label: "Align Left", keywords: ["align", "left"], tab: "Home", group: "Alignment" },
  { id: "alignCenter", label: "Center", keywords: ["align", "center", "middle"], tab: "Home", group: "Alignment" },
  { id: "alignRight", label: "Align Right", keywords: ["align", "right"], tab: "Home", group: "Alignment" },
  { id: "topAlign", label: "Top Align", keywords: ["align", "top", "vertical"], tab: "Home", group: "Alignment" },
  { id: "middleAlign", label: "Middle Align", keywords: ["align", "middle", "vertical", "center"], tab: "Home", group: "Alignment" },
  { id: "bottomAlign", label: "Bottom Align", keywords: ["align", "bottom", "vertical"], tab: "Home", group: "Alignment" },
  { id: "wrapText", label: "Wrap Text", keywords: ["wrap", "text", "overflow"], tab: "Home", group: "Alignment" },
  { id: "mergeCells", label: "Merge & Center", keywords: ["merge", "center", "combine"], tab: "Home", group: "Alignment" },
  { id: "increaseIndent", label: "Increase Indent", keywords: ["indent", "increase", "tab"], tab: "Home", group: "Alignment" },
  { id: "decreaseIndent", label: "Decrease Indent", keywords: ["indent", "decrease", "outdent"], tab: "Home", group: "Alignment" },

  // ─── Number ───────────────────────────────────
  { id: "numberFormat", label: "Number Format", keywords: ["format", "number", "general", "currency"], tab: "Home", group: "Number" },
  { id: "currency", label: "Currency Format", keywords: ["currency", "dollar", "euro", "rupee", "money"], tab: "Home", group: "Number" },
  { id: "percent", label: "Percent Style", keywords: ["percent", "percentage"], tab: "Home", group: "Number" },
  { id: "comma", label: "Comma Style", keywords: ["comma", "thousands", "separator"], tab: "Home", group: "Number" },
  { id: "increaseDecimal", label: "Increase Decimal", keywords: ["decimal", "increase", "precision"], tab: "Home", group: "Number" },
  { id: "decreaseDecimal", label: "Decrease Decimal", keywords: ["decimal", "decrease", "precision"], tab: "Home", group: "Number" },

  // ─── Styles ───────────────────────────────────
  { id: "conditionalFormatting", label: "Conditional Formatting", keywords: ["conditional", "formatting", "highlight", "rules"], tab: "Home", group: "Styles" },
  { id: "formatAsTable", label: "Format as Table", keywords: ["table", "format", "style"], tab: "Home", group: "Styles" },

  // ─── Cells ────────────────────────────────────
  { id: "insertRow", label: "Insert Row", keywords: ["insert", "row", "add row"], tab: "Home", group: "Cells" },
  { id: "insertColumn", label: "Insert Column", keywords: ["insert", "column", "add column"], tab: "Home", group: "Cells" },
  { id: "deleteRow", label: "Delete Row", keywords: ["delete", "row", "remove row"], tab: "Home", group: "Cells" },
  { id: "deleteColumn", label: "Delete Column", keywords: ["delete", "column", "remove column"], tab: "Home", group: "Cells" },
  { id: "rowHeight", label: "Row Height", keywords: ["row", "height", "resize"], tab: "Home", group: "Cells" },
  { id: "columnWidth", label: "Column Width", keywords: ["column", "width", "resize"], tab: "Home", group: "Cells" },
  { id: "autofitColumn", label: "AutoFit Column Width", keywords: ["autofit", "column", "width", "auto"], tab: "Home", group: "Cells" },
  { id: "autofitRow", label: "AutoFit Row Height", keywords: ["autofit", "row", "height", "auto"], tab: "Home", group: "Cells" },
  { id: "hideRow", label: "Hide Rows", keywords: ["hide", "row"], tab: "Home", group: "Cells" },
  { id: "hideColumn", label: "Hide Columns", keywords: ["hide", "column"], tab: "Home", group: "Cells" },
  { id: "unhideRow", label: "Unhide Rows", keywords: ["unhide", "show", "row"], tab: "Home", group: "Cells" },
  { id: "unhideColumn", label: "Unhide Columns", keywords: ["unhide", "show", "column"], tab: "Home", group: "Cells" },

  // ─── Editing ──────────────────────────────────
  { id: "autoSum", label: "AutoSum", keywords: ["sum", "autosum", "total", "add"], tab: "Home", group: "Editing" },
  { id: "fillDown", label: "Fill Down", keywords: ["fill", "down", "copy down"], tab: "Home", group: "Editing", shortcut: "Ctrl+D" },
  { id: "fillRight", label: "Fill Right", keywords: ["fill", "right", "copy right"], tab: "Home", group: "Editing", shortcut: "Ctrl+R" },
  { id: "clearAll", label: "Clear All", keywords: ["clear", "all", "erase"], tab: "Home", group: "Editing" },
  { id: "clearFormats", label: "Clear Formats", keywords: ["clear", "format", "remove formatting"], tab: "Home", group: "Editing" },
  { id: "clearContents", label: "Clear Contents", keywords: ["clear", "contents", "values"], tab: "Home", group: "Editing" },
  { id: "sortAsc", label: "Sort A to Z", keywords: ["sort", "ascending", "a to z"], tab: "Home", group: "Editing" },
  { id: "sortDesc", label: "Sort Z to A", keywords: ["sort", "descending", "z to a"], tab: "Home", group: "Editing" },
  { id: "filter", label: "Filter", keywords: ["filter", "auto filter"], tab: "Home", group: "Editing" },
  { id: "find", label: "Find", keywords: ["find", "search"], tab: "Home", group: "Editing", shortcut: "Ctrl+F" },
  { id: "replace", label: "Replace", keywords: ["replace", "find and replace"], tab: "Home", group: "Editing", shortcut: "Ctrl+H" },

  // ─── General ──────────────────────────────────
  { id: "undo", label: "Undo", keywords: ["undo", "revert"], tab: "Home", group: "General", shortcut: "Ctrl+Z" },
  { id: "redo", label: "Redo", keywords: ["redo", "repeat"], tab: "Home", group: "General", shortcut: "Ctrl+Y" },
];

/** Search actions by query — matches on label and keywords */
export function searchActions(query: string): RibbonAction[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return RIBBON_ACTIONS.filter((a) =>
    a.label.toLowerCase().includes(q) ||
    a.keywords.some((k) => k.includes(q))
  ).slice(0, 8);
}
