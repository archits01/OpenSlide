/**
 * Single source of truth for every visual measurement and color in the sheet UI.
 * Child components consume these via import or via CSS custom properties
 * applied by sheetTokensAsCSSVariables() on the .sheet-canvas root.
 */

export const SHEET_TOKENS = {
  cell: {
    defaultHeight: 26,
    headerHeight: 32,
    defaultWidth: 112,
    minWidth: 40,
    maxWidth: 600,
    fontSize: 13,
    fontFamily: "var(--font-geist-sans)",
    paddingX: 8,
    paddingY: 4,
    textColor: "#1A1A1A",
    mutedTextColor: "#6B6B6B",
    backgroundColor: "#FFFFFF",
    borderColor: "#D6D8DB",
    gridLineColor: "#D6D8DB",
  },
  header: {
    rowHeaderWidth: 40,
    columnHeaderHeight: 32,
    backgroundColor: "#F3F3F3",
    textColor: "#333333",
    fontSize: 11,
    fontWeight: 400,
    activeBackgroundColor: "#E0E0E0",
    activeTextColor: "#1A1A1A",
  },
  selection: {
    activeBorderColor: "#217346",
    activeBorderWidth: 2,
    rangeFillColor: "rgba(33, 115, 70, 0.10)",
    rangeBorderColor: "#217346",
    rangeBorderWidth: 2,
    multiRangeFillOpacity: 0.08,
  },
  editor: {
    backgroundColor: "#FFFFFF",
    borderColor: "#217346",
    borderWidth: 2,
    focusRingColor: "rgba(33, 115, 70, 0.2)",
  },
  chrome: {
    ribbonHeight: 44,
    formulaBarHeight: 32,
    sheetTabsHeight: 36,
    statusBarHeight: 24,
    backgroundColor: "#F3F3F3",
    borderColor: "#D0D0D0",
    dividerColor: "#E0E0E0",
  },
  ribbon: {
    backgroundColor: "#F3F2F1",
    tabStripBg: "#FFFFFF",
    tabActiveUnderline: "#107C41",
    tabActiveText: "#1A1A1A",
    tabInactiveText: "#6B6B6B",
    groupDividerColor: "#E0E0E0",
    groupLabelColor: "#605E5C",
    buttonHoverBg: "#E5F1FB",
    buttonActiveBg: "#C7E0F4",
    buttonToggledBg: "#CCE8FF",
    buttonToggledBorder: "#2B579A",
    dropdownBg: "#FFFFFF",
    dropdownBorder: "#C8C6C4",
    dropdownShadow: "0 4px 8px rgba(0, 0, 0, 0.12)",
    tabStripHeight: 32,
    tabPanelHeight: 110,
    buttonHeight: 28,
    largeButtonHeight: 72,
    fontSize: 13,
    iconSize: 18,
    largeIconSize: 28,
  },
  canvas: {
    backgroundColor: "#FFFFFF",
    scrollbarTrackColor: "#F0F0F0",
    scrollbarThumbColor: "#C0C0C0",
  },
} as const;

export type SheetTokens = typeof SHEET_TOKENS;
export type CellTokens = typeof SHEET_TOKENS.cell;

/** Returns a React style object with CSS custom properties for all sheet tokens. */
export function sheetTokensAsCSSVariables(): React.CSSProperties {
  const t = SHEET_TOKENS;
  return {
    // Cell
    "--sheet-cell-height": `${t.cell.defaultHeight}px`,
    "--sheet-cell-header-height": `${t.cell.headerHeight}px`,
    "--sheet-cell-width": `${t.cell.defaultWidth}px`,
    "--sheet-cell-font-size": `${t.cell.fontSize}px`,
    "--sheet-cell-font-family": t.cell.fontFamily,
    "--sheet-cell-padding-x": `${t.cell.paddingX}px`,
    "--sheet-cell-padding-y": `${t.cell.paddingY}px`,
    "--sheet-cell-text": t.cell.textColor,
    "--sheet-cell-muted-text": t.cell.mutedTextColor,
    "--sheet-cell-bg": t.cell.backgroundColor,
    "--sheet-cell-border": t.cell.borderColor,
    "--sheet-cell-gridline": t.cell.gridLineColor,
    // Header
    "--sheet-header-row-width": `${t.header.rowHeaderWidth}px`,
    "--sheet-header-col-height": `${t.header.columnHeaderHeight}px`,
    "--sheet-header-bg": t.header.backgroundColor,
    "--sheet-header-text": t.header.textColor,
    "--sheet-header-font-size": `${t.header.fontSize}px`,
    "--sheet-header-active-bg": t.header.activeBackgroundColor,
    "--sheet-header-active-text": t.header.activeTextColor,
    // Selection
    "--sheet-selection-border": t.selection.activeBorderColor,
    "--sheet-selection-border-width": `${t.selection.activeBorderWidth}px`,
    "--sheet-selection-fill": t.selection.rangeFillColor,
    // Editor
    "--sheet-editor-bg": t.editor.backgroundColor,
    "--sheet-editor-border": t.editor.borderColor,
    "--sheet-editor-focus-ring": t.editor.focusRingColor,
    // Chrome
    "--sheet-ribbon-height": `${t.chrome.ribbonHeight}px`,
    "--sheet-formula-bar-height": `${t.chrome.formulaBarHeight}px`,
    "--sheet-sheet-tabs-height": `${t.chrome.sheetTabsHeight}px`,
    "--sheet-status-bar-height": `${t.chrome.statusBarHeight}px`,
    "--sheet-chrome-bg": t.chrome.backgroundColor,
    "--sheet-chrome-border": t.chrome.borderColor,
    "--sheet-chrome-divider": t.chrome.dividerColor,
    // Canvas
    "--sheet-canvas-bg": t.canvas.backgroundColor,
    "--sheet-scrollbar-track": t.canvas.scrollbarTrackColor,
    "--sheet-scrollbar-thumb": t.canvas.scrollbarThumbColor,
  } as React.CSSProperties;
}
