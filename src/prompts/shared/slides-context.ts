/**
 * Builds the dynamic slides/pages context block — changes each iteration as content is added.
 * Kept separate so the static system prompt can be prompt-cached.
 */
export function buildSlidesContext(
  slides: Array<{ id: string; index: number; title: string }>,
  docsMode?: boolean,
  sheetsMode?: boolean,
): string {
  if (!slides.length) return "";
  const itemLabel = sheetsMode ? "Sheet" : docsMode ? "Page" : "Slide";
  const heading = sheetsMode ? "Current Workbook State" : docsMode ? "Current Document State" : "Current Presentation State";
  const countLabel = sheetsMode ? "sheets" : docsMode ? "pages" : "slides";
  return (
    `\n## ${heading}\n\nExisting ${countLabel} (${slides.length}):\n` +
    slides.map((s) => `- [${s.id}] ${itemLabel} ${s.index + 1}: "${s.title}"`).join("\n") +
    "\n"
  );
}
