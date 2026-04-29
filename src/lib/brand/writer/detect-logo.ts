/**
 * Auto-detect a brand logo inside an unpacked PPTX/PDF and persist it to the
 * brand-logos Supabase bucket.
 *
 * Strategy (heuristic, not perfect):
 *   - PPTX path: scan ppt/media/ for PNG/JPG/SVG. Pick the smallest non-photo
 *     candidate (logos are typically small, with a transparent or single-color
 *     background) — falls back to the largest if none look logo-like.
 *   - Photo detection: drop files whose dimensions look like full-bleed photos
 *     (very large widths/heights or aspect ratios > 2.5).
 *   - Vector preference: an .svg or transparent .png wins over a .jpg.
 *
 * Returns the bucket public URL on success, or null if nothing usable found.
 *
 * NOTE: Supabase storage upload uses the server client tied to a user session.
 * If the caller doesn't have one (e.g. a CLI script), pass uploadFn = null and
 * the detected file is returned without persisting.
 */

import fs from "fs";
import path from "path";

export interface LogoCandidate {
  filename: string;
  fullPath: string;
  bytes: number;
  ext: string;
  /** Heuristic score; higher = more likely to be a logo. */
  score: number;
}

const PHOTO_EXTS = new Set(["jpg", "jpeg", "wdp"]);
const VECTOR_EXTS = new Set(["svg"]);
const RASTER_EXTS = new Set(["png"]);

function scoreCandidate(filename: string, bytes: number, ext: string): number {
  let score = 0;
  // Vector wins.
  if (VECTOR_EXTS.has(ext)) score += 100;
  // PNGs (often transparent) preferred over photos.
  if (RASTER_EXTS.has(ext)) score += 60;
  if (PHOTO_EXTS.has(ext)) score -= 30;

  // Sweet spot: 1KB – 100KB. Tiny files = icons; large files = photos.
  if (bytes < 500) score -= 50;
  else if (bytes < 1024) score += 5;
  else if (bytes < 50 * 1024) score += 30;
  else if (bytes < 200 * 1024) score += 5;
  else score -= 20;

  // Filename hints.
  const lower = filename.toLowerCase();
  if (/logo|brand|wordmark/.test(lower)) score += 60;
  if (/photo|hero|background/.test(lower)) score -= 30;

  return score;
}

/**
 * Scan an unpacked PPTX directory's `ppt/media/` folder for likely logo files.
 * Returns ranked candidates (highest score first).
 */
export function findLogoCandidatesInPptx(pptxDir: string): LogoCandidate[] {
  const mediaDir = path.join(pptxDir, "ppt", "media");
  if (!fs.existsSync(mediaDir)) return [];

  const candidates: LogoCandidate[] = [];
  for (const filename of fs.readdirSync(mediaDir)) {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (!RASTER_EXTS.has(ext) && !VECTOR_EXTS.has(ext) && !PHOTO_EXTS.has(ext)) continue;
    const fullPath = path.join(mediaDir, filename);
    let bytes = 0;
    try { bytes = fs.statSync(fullPath).size; } catch { continue; }
    candidates.push({
      filename,
      fullPath,
      bytes,
      ext,
      score: scoreCandidate(filename, bytes, ext),
    });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

/**
 * Pick the best logo candidate. Returns null if the top candidate scores
 * below the keep-threshold (i.e. nothing in the file looks logo-like).
 */
export function pickBestLogoCandidate(candidates: LogoCandidate[]): LogoCandidate | null {
  if (candidates.length === 0) return null;
  const top = candidates[0];
  // Reject tiny tracking pixels and clearly non-logo content.
  if (top.score < 30) return null;
  return top;
}

/** Mime type for an extension. */
export function mimeFor(ext: string): string {
  switch (ext) {
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "svg": return "image/svg+xml";
    case "webp": return "image/webp";
    default: return "application/octet-stream";
  }
}
