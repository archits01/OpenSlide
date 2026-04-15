export interface CoverPanel {
  type: "stats" | "quote" | "highlights";
  content: string;
}

export interface CoverSlideData {
  brand_name: string;
  headline: string;
  accent_phrase?: string;
  subtitle?: string;
  tagline?: string;
  hero_image_url?: string;
  prepared_for?: string;
  cover_panel?: CoverPanel;
}

// ── Parsers ─────────────────────────────────────────────────────────────────

function parseStats(content: string): Array<{ value: string; label: string }> {
  return content.split("|").map((segment) => {
    const trimmed = segment.trim();
    // Try to split on first space after a number/symbol-heavy prefix
    // e.g. "$124.3B Revenue" → value: "$124.3B", label: "Revenue"
    // e.g. "↑12% YoY Growth" → value: "↑12%", label: "YoY Growth"
    const match = trimmed.match(/^([^\s]*\d[^\s]*)\s+(.+)$/);
    if (match) return { value: match[1], label: match[2] };
    // Fallback: treat entire string as value
    return { value: trimmed, label: "" };
  }).slice(0, 3);
}

function parseQuote(content: string): { text: string; attribution?: string } {
  // Split on " — " (space-em-dash-space) or " – " (space-en-dash-space)
  const parts = content.split(/\s[—–]\s/);
  return {
    text: parts[0]?.trim() ?? content,
    attribution: parts[1]?.trim(),
  };
}

function parseHighlights(content: string): string[] {
  return content.split("/").map((s) => s.trim()).filter(Boolean).slice(0, 5);
}

// ── Panel renderers ─────────────────────────────────────────────────────────

function renderStatsPanel(content: string): string {
  const stats = parseStats(content);
  if (!stats.length) return "";
  return `<div style="display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:28px;padding:0 48px;height:100%;position:relative;z-index:2;">
    ${stats.map((s, i) => {
      const divider = i < stats.length - 1
        ? `<div style="width:100%;height:1px;background:rgba(255,255,255,0.15);margin-top:28px;"></div>`
        : "";
      return `<div style="width:100%;">
        <p style="font-size:38px;font-weight:800;color:#FFFFFF;margin:0;line-height:1.1;letter-spacing:-0.5px;">${escapeHtml(s.value)}</p>
        ${s.label ? `<p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.7);margin:6px 0 0;">${escapeHtml(s.label)}</p>` : ""}
        ${divider}
      </div>`;
    }).join("")}
  </div>`;
}

function renderQuotePanel(content: string): string {
  const { text, attribution } = parseQuote(content);
  const attrHtml = attribution
    ? `<p style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.6);margin:20px 0 0;">— ${escapeHtml(attribution)}</p>`
    : "";
  return `<div style="display:flex;flex-direction:column;justify-content:center;padding:0 48px;height:100%;position:relative;z-index:2;">
    <div style="width:40px;height:3px;background:rgba(255,255,255,0.4);border-radius:2px;margin-bottom:20px;"></div>
    <p style="font-size:24px;font-weight:500;font-style:italic;color:#FFFFFF;margin:0;line-height:1.45;letter-spacing:-0.2px;">${escapeHtml(text)}</p>
    ${attrHtml}
  </div>`;
}

function renderHighlightsPanel(content: string): string {
  const points = parseHighlights(content);
  if (!points.length) return "";
  return `<div style="display:flex;flex-direction:column;justify-content:center;gap:24px;padding:0 48px;height:100%;position:relative;z-index:2;">
    ${points.map((p) =>
      `<div style="display:flex;align-items:center;gap:14px;">
        <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.5);flex-shrink:0;"></div>
        <p style="font-size:19px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;letter-spacing:-0.2px;">${escapeHtml(p)}</p>
      </div>`
    ).join("")}
  </div>`;
}

function renderPanelContent(panel: CoverPanel): string {
  switch (panel.type) {
    case "stats": return renderStatsPanel(panel.content);
    case "quote": return renderQuotePanel(panel.content);
    case "highlights": return renderHighlightsPanel(panel.content);
    default: return "";
  }
}

// ── Main renderer ───────────────────────────────────────────────────────────

export function renderCoverSlide(data: CoverSlideData): string {
  const {
    brand_name,
    headline,
    accent_phrase,
    tagline,
    hero_image_url,
    prepared_for,
    cover_panel,
  } = data;

  // Wrap accent_phrase in the headline with accent color span
  let headlineHtml = escapeHtml(headline).replace(/\n/g, "<br>");
  if (accent_phrase) {
    const escaped = escapeHtml(accent_phrase);
    headlineHtml = headlineHtml.replace(
      escaped,
      `<span style="color:var(--slide-accent);">${escaped}</span>`
    );
  }

  // Tagline block
  const taglineHtml = tagline
    ? `<p style="font-size:16px;font-weight:500;color:#64748B;margin:0;line-height:1.5;max-width:400px;">${escapeHtml(tagline)}</p>`
    : "";

  // Attribution block
  const attributionHtml = prepared_for
    ? `<div style="border-top:1px solid var(--slide-border);padding-top:16px;">
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--slide-secondary);margin:0 0 4px;">Prepared for</p>
      <p style="font-size:14px;font-weight:500;color:var(--slide-secondary);margin:0;">${escapeHtml(prepared_for)}</p>
    </div>`
    : `<div></div>`;

  // Panel content (if any)
  const panelHtml = cover_panel ? renderPanelContent(cover_panel) : "";
  const hasPanel = panelHtml.length > 0;

  // Right panel: panel content on accent/image, image only, or plain accent
  let rightPanelHtml: string;
  const dotGrid = `<div style="position:absolute;inset:0;opacity:0.08;background-image:radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0);background-size:24px 24px;"></div>`;

  if (hero_image_url && hasPanel) {
    // Image + dark overlay + panel content
    rightPanelHtml = `<div style="width:45%;height:100%;position:relative;overflow:hidden;">
    <img src="${escapeAttr(hero_image_url)}" style="width:100%;height:100%;object-fit:cover;" alt=""/>
    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.6);"></div>
    ${panelHtml}
  </div>`;
  } else if (hero_image_url) {
    // Image only — original behavior
    rightPanelHtml = `<div style="width:45%;height:100%;position:relative;overflow:hidden;">
    <img src="${escapeAttr(hero_image_url)}" style="width:100%;height:100%;object-fit:cover;" alt=""/>
    <div style="position:absolute;top:0;left:0;bottom:0;width:80px;background:linear-gradient(to right,#FFFFFF,transparent);"></div>
  </div>`;
  } else if (hasPanel) {
    // Panel content on accent background
    rightPanelHtml = `<div style="width:45%;height:100%;position:relative;overflow:hidden;background:var(--slide-accent);">
    ${dotGrid}
    ${panelHtml}
  </div>`;
  } else {
    // Plain accent panel — original behavior
    rightPanelHtml = `<div style="width:45%;height:100%;position:relative;overflow:hidden;background:var(--slide-accent);">
    ${dotGrid}
  </div>`;
  }

  return `<div style="width:1280px;height:720px;overflow:hidden;display:flex;background:#FFFFFF;font-family:'Plus Jakarta Sans','DM Sans',sans-serif;color:var(--slide-text);position:relative;">
  <div style="width:55%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:48px 56px;">
    <span style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--slide-secondary);">${escapeHtml(brand_name).toUpperCase()}</span>
    <div>
      <h1 style="font-size:48px;font-weight:800;letter-spacing:-1px;line-height:1.1;margin:0 0 16px;">${headlineHtml}</h1>
      <div style="width:56px;height:4px;background:var(--slide-accent);border-radius:2px;margin-bottom:16px;"></div>
      ${taglineHtml}
    </div>
    ${attributionHtml}
  </div>
  ${rightPanelHtml}
</div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
