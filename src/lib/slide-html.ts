/**
 * Pure functions for building slide HTML — usable in both client (SlideCanvas)
 * and server (API export routes). No "use client" directive here.
 */

import type { Slide, LogoResult } from "./types";
import { resolveThemeColors } from "@/agent/tools/set-theme";
import type { ThemeName, ThemeColors } from "@/agent/tools/set-theme";
import { getMonogram } from "@/agent/tools/fetch-logo";

export type { LogoResult };

export type { ThemeName, ThemeColors };

function buildThemeVars(theme: ThemeName, themeColors?: ThemeColors): string {
  const t = themeColors ?? resolveThemeColors(theme);
  return `:root{--slide-bg:${t.bg};--slide-text:${t.text};--slide-accent:${t.accent};--slide-secondary:${t.secondary};--slide-dark:${t.dark};--slide-accent-light:${t.accentLight};--slide-border:${t.border}}`;
}

function buildSlideStyles(theme: ThemeName, themeColors?: ThemeColors, isDoc = false): string {
  const t = themeColors ?? resolveThemeColors(theme);
  if (isDoc) {
    return `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');${buildThemeVars(theme, themeColors)}html,body{margin:0;padding:0;width:816px;height:1056px;overflow:hidden;background:#FFFFFF;color:#1a1a1a;font-family:'Inter',system-ui,-apple-system,sans-serif}`;
  }
  return `${buildThemeVars(theme, themeColors)}html,body{margin:0;padding:0;width:1280px;height:720px;overflow:hidden;background:${t.bg};color:${t.text};font-family:system-ui,-apple-system,sans-serif}.slide-root{width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden}.slide-headline{font-size:48px;font-weight:600;letter-spacing:-0.03em;line-height:1.1;margin:0}.slide-heading{font-size:34px;font-weight:500;letter-spacing:-0.02em;line-height:1.2;margin:0}.slide-subtitle{font-size:20px;font-weight:400;color:${t.secondary};margin:0}.slide-bullets{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}.slide-bullets li{font-size:20px;line-height:1.5;padding-left:20px;position:relative}.slide-bullets li::before{content:"–";position:absolute;left:0;color:${t.accent}}.stat-number{font-size:72px;font-weight:700;letter-spacing:-0.04em;color:${t.accent};line-height:1}.stat-label{font-size:18px;color:${t.secondary}}`;
}

function buildLogoHtml(logoResult: LogoResult | null, company?: string): string {
  const monogram = getMonogram(company);
  const monogramStyle = "display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:5px;background:#e2e8f0;color:#475569;font-weight:700;font-size:13px;";

  if (!logoResult) {
    // No logo found — skip the logo element entirely (no "?" fallback)
    return "";
  }

  // Server-side validation guarantees the URL returns 200.
  // No JS onerror handler — scripts are disabled in sandboxed iframes.
  return `<div style="position:absolute;top:24px;left:36px;z-index:1000;pointer-events:none;display:flex;align-items:center;">
  <img src="${logoResult.url}" alt=""
       style="height:32px;max-width:110px;object-fit:contain;display:block;background:transparent;" />
</div>`;
}

const BUILDING_ANIMATION_CSS = `.slide-root>*{animation:slideComponentIn .25s ease-out both}@keyframes slideComponentIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`;

/**
 * Component-only CSS for div-based building preview (no html/body reset, no :root vars).
 * Theme CSS vars are set as inline styles on the container div instead.
 */
function buildComponentCSS(theme: ThemeName, themeColors?: ThemeColors): string {
  const t = themeColors ?? resolveThemeColors(theme);
  // NOTE: Do NOT include BUILDING_ANIMATION_CSS here — it starts at opacity:0 and
  // re-triggers on every innerHTML update, causing all elements to flash invisible→visible.
  // The div-based BuildingSlideFrame uses direct innerHTML mutation, which is naturally smooth
  // without CSS animations (browser paints new content in a single frame).
  return `.slide-root{width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden}.slide-headline{font-size:48px;font-weight:600;letter-spacing:-0.03em;line-height:1.1;margin:0}.slide-heading{font-size:34px;font-weight:500;letter-spacing:-0.02em;line-height:1.2;margin:0}.slide-subtitle{font-size:20px;font-weight:400;color:${t.secondary};margin:0}.slide-bullets{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}.slide-bullets li{font-size:20px;line-height:1.5;padding-left:20px;position:relative}.slide-bullets li::before{content:"–";position:absolute;left:0;color:${t.accent}}.stat-number{font-size:72px;font-weight:700;letter-spacing:-0.04em;color:${t.accent};line-height:1}.stat-label{font-size:18px;color:${t.secondary}}`;
}

/** Returns the theme colors as a CSS custom properties object for inline styles */
function getThemeColorVars(theme: ThemeName, themeColors?: ThemeColors): Record<string, string> {
  const t = themeColors ?? resolveThemeColors(theme);
  return {
    "--slide-bg": t.bg,
    "--slide-text": t.text,
    "--slide-accent": t.accent,
    "--slide-secondary": t.secondary,
    "--slide-dark": t.dark,
    "--slide-accent-light": t.accentLight,
    "--slide-border": t.border,
  };
}

export function buildSlideHtml(
  slide: Slide,
  theme: ThemeName,
  logoResult?: LogoResult | null,
  isFirstSlide?: boolean,
  themeColors?: ThemeColors,
  company?: string,
  isBuilding?: boolean,
  isDoc?: boolean,
): string {
  // No logos in docs mode
  const logo = (isFirstSlide && !isDoc) ? buildLogoHtml(logoResult ?? null, company ?? logoResult?.name) : "";
  const trimmed = slide.content.trimStart();

  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    const themeVars = `<style>${buildThemeVars(theme, themeColors)}${isBuilding ? BUILDING_ANIMATION_CSS : ""}</style>`;
    const headIdx = trimmed.toLowerCase().indexOf("<head");
    if (headIdx !== -1) {
      const headCloseIdx = trimmed.indexOf(">", headIdx);
      if (headCloseIdx !== -1) {
        let result = trimmed.slice(0, headCloseIdx + 1) + themeVars + trimmed.slice(headCloseIdx + 1);
        if (logo) {
          const bodyIdx = result.toLowerCase().indexOf("<body");
          if (bodyIdx !== -1) {
            const bodyCloseIdx = result.indexOf(">", bodyIdx);
            if (bodyCloseIdx !== -1) {
              result = result.slice(0, bodyCloseIdx + 1) + logo + result.slice(bodyCloseIdx + 1);
            }
          }
        }
        return result;
      }
    }
    const htmlIdx = trimmed.toLowerCase().indexOf("<html");
    if (htmlIdx !== -1) {
      const htmlCloseIdx = trimmed.indexOf(">", htmlIdx);
      if (htmlCloseIdx !== -1) {
        return (
          trimmed.slice(0, htmlCloseIdx + 1) +
          `<head>${themeVars}</head><body>${logo}` +
          trimmed.slice(htmlCloseIdx + 1)
        );
      }
    }
    return slide.content;
  }

  const styles = buildSlideStyles(theme, themeColors, isDoc);
  const buildingCss = isBuilding ? BUILDING_ANIMATION_CSS : "";
  const rootClass = isDoc ? "" : ' class="slide-root"';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${styles}${buildingCss}</style></head><body>${logo}<div${rootClass}>${slide.content}</div></body></html>`;
}

