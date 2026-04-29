/**
 * Rasterize a PPTX or PDF into per-page PNGs.
 *
 * Pipeline: PPTX → libreoffice headless → PDF → pdftoppm → PNG.
 * For PDF input, the libreoffice step is skipped.
 *
 * Both binaries (`soffice`, `pdftoppm`) must be on PATH.
 */

import { exec as execCb } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const exec = promisify(execCb);

export interface RasterizeOptions {
  /** Slide width in pixels for output PNGs. Default 1280. */
  widthPx?: number;
  /** Slide height in pixels (used by pdftoppm for max dimension). Default 720. */
  heightPx?: number;
  /** Cap on number of pages to rasterize. Default 30 (cost guard). */
  maxPages?: number;
  /** Working directory. Default a fresh /tmp dir. */
  workDir?: string;
}

export interface RasterizeResult {
  /** Output PNG file paths in page order. */
  pngPaths: string[];
  /** PDF intermediate path (PPTX flow only). */
  pdfPath?: string;
  /** Working directory we used (caller may want to clean up). */
  workDir: string;
}

function freshWorkDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
  return dir;
}

async function pptxToPdf(pptxPath: string, outDir: string): Promise<string> {
  // soffice insists on writing to outdir with the same basename + .pdf
  const cmd = `soffice --headless --convert-to pdf --outdir "${outDir}" "${pptxPath}"`;
  await exec(cmd, { timeout: 120_000 });
  const base = path.basename(pptxPath).replace(/\.pptx$/i, ".pdf");
  const pdfPath = path.join(outDir, base);
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PPTX→PDF conversion produced no file at ${pdfPath}`);
  }
  return pdfPath;
}

async function pdfToPngs(
  pdfPath: string,
  outDir: string,
  widthPx: number,
  heightPx: number,
  maxPages: number,
): Promise<string[]> {
  const prefix = path.join(outDir, "slide");
  // Determine total pages.
  const { stdout } = await exec(`pdfinfo "${pdfPath}"`);
  const m = stdout.match(/^Pages:\s+(\d+)/m);
  const totalPages = m ? Number(m[1]) : 0;
  const lastPage = Math.min(totalPages, maxPages);

  const cmd = [
    `pdftoppm`,
    `-r 150`,
    `-png`,
    `-scale-to-x ${widthPx}`,
    `-scale-to-y ${heightPx}`,
    `-f 1 -l ${lastPage}`,
    `"${pdfPath}"`,
    `"${prefix}"`,
  ].join(" ");
  await exec(cmd, { timeout: 240_000 });

  return fs
    .readdirSync(outDir)
    .filter((f) => f.startsWith("slide-") && f.endsWith(".png"))
    .sort()
    .map((f) => path.join(outDir, f));
}

export async function rasterizePptx(
  pptxPath: string,
  options: RasterizeOptions = {},
): Promise<RasterizeResult> {
  if (!fs.existsSync(pptxPath)) throw new Error(`PPTX not found: ${pptxPath}`);

  const widthPx = options.widthPx ?? 1280;
  const heightPx = options.heightPx ?? 720;
  const maxPages = options.maxPages ?? 30;
  const workDir = options.workDir ?? freshWorkDir("brand-raster-pptx");

  const pdfPath = await pptxToPdf(pptxPath, workDir);
  const pngPaths = await pdfToPngs(pdfPath, workDir, widthPx, heightPx, maxPages);
  return { pngPaths, pdfPath, workDir };
}

export async function rasterizePdf(
  pdfPath: string,
  options: RasterizeOptions = {},
): Promise<RasterizeResult> {
  if (!fs.existsSync(pdfPath)) throw new Error(`PDF not found: ${pdfPath}`);

  const widthPx = options.widthPx ?? 1280;
  const heightPx = options.heightPx ?? 720;
  const maxPages = options.maxPages ?? 30;
  const workDir = options.workDir ?? freshWorkDir("brand-raster-pdf");

  const pngPaths = await pdfToPngs(pdfPath, workDir, widthPx, heightPx, maxPages);
  return { pngPaths, workDir };
}

/** Read a PNG and return its base64 string (no data: prefix). */
export function pngToBase64(pngPath: string): string {
  return fs.readFileSync(pngPath).toString("base64");
}

/**
 * Capture screenshots of a URL + 2 deeper pages by following same-origin links.
 * Requires PDF_SERVER_URL to be set; returns local PNG file paths to feed into
 * the same writer pipeline that PPTX/PDF use.
 */
export async function rasterizeUrl(
  url: string,
  options: RasterizeOptions = {},
): Promise<RasterizeResult> {
  const PDF_SERVER_URL = process.env.PDF_SERVER_URL;
  const PDF_SERVER_SECRET = process.env.PDF_SERVER_SECRET ?? "";
  if (!PDF_SERVER_URL) {
    throw new Error("PDF_SERVER_URL must be set to use URL input. Configure pdf-server first.");
  }

  const widthPx = options.widthPx ?? 1280;
  const heightPx = options.heightPx ?? 800;
  const workDir = options.workDir ?? freshWorkDir("brand-raster-url");

  // For v1: just screenshot the homepage. Discovering inner pages and
  // screenshotting them is a follow-up — vision typically gets the brand's
  // signature from the homepage alone.
  const pngPaths: string[] = [];
  const homepagePath = path.join(workDir, "page-001.png");
  const res = await fetch(`${PDF_SERVER_URL}/screenshot-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(PDF_SERVER_SECRET ? { Authorization: `Bearer ${PDF_SERVER_SECRET}` } : {}),
    },
    body: JSON.stringify({ url, viewport: { width: widthPx, height: heightPx }, fullPage: false }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`pdf-server /screenshot-url ${res.status}: ${text.slice(0, 200)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(homepagePath, buf);
  pngPaths.push(homepagePath);

  return { pngPaths, workDir };
}
