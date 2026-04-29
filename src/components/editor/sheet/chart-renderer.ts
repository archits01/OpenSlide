/**
 * Minimal SVG chart renderer. Produces a PNG data URL that can be inserted
 * into a Univer sheet via the drawing plugin's insertImage facade method.
 *
 * Supports: column, bar, line, pie, area, scatter.
 */

export type ChartType = "bar" | "column" | "line" | "pie" | "area" | "scatter";

export interface ChartOptions {
  type: ChartType;
  title?: string;
  categories: string[];        // X-axis labels (or pie slice labels)
  series: Array<{ name: string; data: number[] }>;
  width?: number;              // px
  height?: number;             // px
}

const DEFAULT_WIDTH = 520;
const DEFAULT_HEIGHT = 320;

const PALETTE = [
  "#4F81BD", "#C0504D", "#9BBB59", "#8064A2",
  "#4BACC6", "#F79646", "#2C4D75", "#772C2A",
];

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function niceMax(v: number): number {
  if (v <= 0) return 10;
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const m = v / base;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return nice * base;
}

export function renderChartSvg(opts: ChartOptions): string {
  const width = opts.width ?? DEFAULT_WIDTH;
  const height = opts.height ?? DEFAULT_HEIGHT;
  const title = opts.title ?? "";
  const padding = { top: title ? 32 : 16, right: 16, bottom: 48, left: 48 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const header = title
    ? `<text x="${width / 2}" y="20" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="600" fill="#1f2937">${xmlEscape(title)}</text>`
    : "";

  if (opts.type === "pie") return renderPie(opts, width, height, header);

  // Cartesian charts
  const values = opts.series.flatMap((s) => s.data);
  const rawMax = Math.max(...values, 0);
  const rawMin = Math.min(...values, 0);
  const maxY = niceMax(rawMax);
  const minY = rawMin < 0 ? -niceMax(-rawMin) : 0;
  const range = maxY - minY || 1;

  const categories = opts.categories;
  const catCount = Math.max(1, categories.length);
  const groupWidth = innerW / catCount;

  const gridLines: string[] = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    const y = padding.top + innerH - (i / tickCount) * innerH;
    const val = minY + (i / tickCount) * range;
    gridLines.push(`<line x1="${padding.left}" y1="${y}" x2="${padding.left + innerW}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`);
    gridLines.push(`<text x="${padding.left - 6}" y="${y + 4}" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="10" fill="#6b7280">${formatTick(val)}</text>`);
  }

  const xLabels = categories.map((c, i) => {
    const x = padding.left + groupWidth * (i + 0.5);
    const short = c.length > 10 ? c.slice(0, 9) + "…" : c;
    return `<text x="${x}" y="${padding.top + innerH + 16}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" fill="#374151">${xmlEscape(short)}</text>`;
  }).join("");

  let seriesSvg = "";
  const yScale = (v: number) => padding.top + innerH - ((v - minY) / range) * innerH;

  if (opts.type === "column" || opts.type === "bar") {
    const numSeries = opts.series.length;
    const barWidth = (groupWidth * 0.8) / numSeries;
    opts.series.forEach((s, si) => {
      const color = PALETTE[si % PALETTE.length];
      s.data.forEach((v, i) => {
        const barX = padding.left + groupWidth * i + groupWidth * 0.1 + si * barWidth;
        if (opts.type === "column") {
          const y0 = yScale(Math.max(0, minY));
          const y1 = yScale(v);
          const h = Math.abs(y1 - y0);
          const y = Math.min(y0, y1);
          seriesSvg += `<rect x="${barX}" y="${y}" width="${barWidth - 1}" height="${Math.max(1, h)}" fill="${color}"/>`;
        } else {
          // Horizontal bar — reuse same logic but swap axes
          const barY = padding.top + groupWidth * i + groupWidth * 0.1 + si * barWidth;
          const x0 = padding.left;
          const x1 = padding.left + ((v - minY) / range) * innerW;
          const w = Math.abs(x1 - x0);
          seriesSvg += `<rect x="${x0}" y="${barY}" width="${Math.max(1, w)}" height="${barWidth - 1}" fill="${color}"/>`;
        }
      });
    });
  } else if (opts.type === "line" || opts.type === "area") {
    opts.series.forEach((s, si) => {
      const color = PALETTE[si % PALETTE.length];
      const points = s.data.map((v, i) => {
        const x = padding.left + groupWidth * (i + 0.5);
        const y = yScale(v);
        return `${x},${y}`;
      }).join(" ");
      if (opts.type === "area") {
        const baseY = yScale(Math.max(0, minY));
        const first = padding.left + groupWidth * 0.5;
        const last = padding.left + groupWidth * (s.data.length - 0.5);
        seriesSvg += `<polygon points="${first},${baseY} ${points} ${last},${baseY}" fill="${color}" fill-opacity="0.3" stroke="none"/>`;
      }
      seriesSvg += `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2"/>`;
      s.data.forEach((v, i) => {
        const x = padding.left + groupWidth * (i + 0.5);
        const y = yScale(v);
        seriesSvg += `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`;
      });
    });
  } else if (opts.type === "scatter") {
    opts.series.forEach((s, si) => {
      const color = PALETTE[si % PALETTE.length];
      s.data.forEach((v, i) => {
        const x = padding.left + groupWidth * (i + 0.5);
        const y = yScale(v);
        seriesSvg += `<circle cx="${x}" cy="${y}" r="4" fill="${color}" fill-opacity="0.7"/>`;
      });
    });
  }

  const legend = renderLegend(opts.series, width, height);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#ffffff"/>
    ${header}
    ${gridLines.join("")}
    ${xLabels}
    ${seriesSvg}
    ${legend}
  </svg>`;
}

function renderPie(opts: ChartOptions, width: number, height: number, header: string): string {
  const cx = width / 2;
  const cy = height / 2 + 8;
  const radius = Math.min(width, height) * 0.35;
  const values = opts.series[0]?.data ?? [];
  const labels = opts.categories;
  const total = values.reduce((a, b) => a + Math.max(0, b), 0);
  if (total === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#ffffff"/>${header}<text x="${cx}" y="${cy}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="12" fill="#6b7280">No data</text></svg>`;
  }

  let angle = -Math.PI / 2;
  let paths = "";
  values.forEach((v, i) => {
    if (v <= 0) return;
    const slice = (v / total) * Math.PI * 2;
    const endAngle = angle + slice;
    const largeArc = slice > Math.PI ? 1 : 0;
    const x1 = cx + radius * Math.cos(angle);
    const y1 = cy + radius * Math.sin(angle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    paths += `<path d="M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z" fill="${PALETTE[i % PALETTE.length]}"/>`;
    angle = endAngle;
  });

  const legend = labels.map((l, i) => {
    const color = PALETTE[i % PALETTE.length];
    const pct = total > 0 ? ((Math.max(0, values[i] ?? 0) / total) * 100).toFixed(1) : "0";
    return `<g transform="translate(${width - 120}, ${40 + i * 18})">
      <rect width="10" height="10" fill="${color}"/>
      <text x="16" y="9" font-family="Inter, Arial, sans-serif" font-size="11" fill="#374151">${xmlEscape(l)} (${pct}%)</text>
    </g>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#ffffff"/>
    ${header}${paths}${legend}
  </svg>`;
}

function renderLegend(series: ChartOptions["series"], width: number, height: number): string {
  if (series.length <= 1) return "";
  return series.map((s, i) => {
    const color = PALETTE[i % PALETTE.length];
    return `<g transform="translate(${width - 120}, ${height - 20 - (series.length - 1 - i) * 16})">
      <rect width="10" height="10" fill="${color}"/>
      <text x="16" y="9" font-family="Inter, Arial, sans-serif" font-size="11" fill="#374151">${xmlEscape(s.name)}</text>
    </g>`;
  }).join("");
}

function formatTick(v: number): string {
  if (Math.abs(v) >= 1000000) return (v / 1000000).toFixed(1) + "M";
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + "k";
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1);
}

/** Convert an SVG string to a data URL suitable for insertImage. */
export function svgToDataUrl(svg: string): string {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml,${encoded}`;
}

/** Render a tiny line sparkline (no axes, no legend). */
export function renderSparklineSvg(values: number[], width = 120, height = 28, color = "#2563EB"): string {
  if (values.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#fff"/></svg>`;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / Math.max(1, values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#ffffff"/>
    <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5"/>
  </svg>`;
}

/** Parse a range like "A1:D10" into numeric indices. */
export function parseA1Range(ref: string): { startRow: number; startCol: number; endRow: number; endCol: number } | null {
  const m = ref.trim().match(/^([A-Za-z]+)(\d+)(?::([A-Za-z]+)(\d+))?$/);
  if (!m) return null;
  const colToIdx = (s: string) => {
    let n = 0;
    for (const c of s.toUpperCase()) n = n * 26 + (c.charCodeAt(0) - 64);
    return n - 1;
  };
  const startCol = colToIdx(m[1]);
  const startRow = parseInt(m[2], 10) - 1;
  const endCol = m[3] ? colToIdx(m[3]) : startCol;
  const endRow = m[4] ? parseInt(m[4], 10) - 1 : startRow;
  return {
    startRow: Math.min(startRow, endRow),
    startCol: Math.min(startCol, endCol),
    endRow: Math.max(startRow, endRow),
    endCol: Math.max(startCol, endCol),
  };
}
