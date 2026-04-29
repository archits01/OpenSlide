export function buildDiversityContext(
  slides: Array<{ title: string; type?: string; patternHint?: string }>,
  outline?: { slides: Array<{ index: number; title: string; pattern_name?: string; layout_notes?: string }> } | null
): string | null {
  if (slides.length === 0 && !outline) return null;

  let ctx = "";

  if (slides.length > 0) {
    const entries = slides
      .map((s, i) => {
        const type = s.type || "content";
        const pattern = s.patternHint || "unknown";
        return `  Slide ${i + 1}: "${s.title}" — type: ${type}, pattern: ${pattern}`;
      })
      .join("\n");

    // Count pattern frequencies
    const counts: Record<string, number> = {};
    for (const s of slides) {
      const p = s.patternHint || "unknown";
      counts[p] = (counts[p] || 0) + 1;
    }

    const repeated = Object.entries(counts)
      .filter(([, count]) => count >= 2)
      .map(([pattern, count]) => `${pattern} (${count}x)`)
      .join(", ");

    ctx = `## Slides Built So Far\n${entries}`;
    if (repeated) {
      ctx += `\n\n⚠ Repeated patterns: ${repeated} — choose a DIFFERENT pattern for the next slide.`;
    }
  }

  // Show the next planned slide from the outline
  if (outline?.slides) {
    const nextIndex = slides.length; // 0-based: next slide to build
    const nextSlide = outline.slides.find((s) => s.index === nextIndex);
    if (nextSlide) {
      ctx += `\n\n## Next Slide to Build\n`;
      ctx += `  Slide ${nextIndex + 1}: "${nextSlide.title}"`;
      if (nextSlide.pattern_name) ctx += ` — pattern: ${nextSlide.pattern_name}`;
      if (nextSlide.layout_notes) ctx += `\n  Layout: ${nextSlide.layout_notes}`;
    }
  }

  return ctx || null;
}
