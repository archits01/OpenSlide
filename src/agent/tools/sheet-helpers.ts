/**
 * Parse an A1-notation cell reference (e.g., "B5") into 0-based row/col indices.
 * Supports multi-letter columns (AA, AB, etc.).
 */
export function parseA1(cell: string): { row: number; col: number } {
  const match = cell.match(/^([A-Z]+)(\d+)$/i);
  if (!match) throw new Error(`Invalid A1 reference: "${cell}"`);

  const letters = match[1].toUpperCase();
  const rowNum = parseInt(match[2], 10);

  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  col -= 1; // 0-based

  return { row: rowNum - 1, col };
}

/** Convert 0-based column index to A1-notation column letter(s). */
export function colToLetter(col: number): string {
  let result = "";
  let n = col;
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
}
