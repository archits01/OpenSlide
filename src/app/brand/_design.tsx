"use client";

/**
 * Shared design-system primitives for the brand-kit pages.
 *
 * Adapted from the V7-Stacks / V4-Workbench design exploration. The dark theme,
 * Geist + JetBrains Mono + Instrument Serif type stack, and accent palette are
 * scoped to `/brand/*` only — they don't override global tokens.
 *
 * The wrapper sets local CSS variables (--brand-*) so child components can
 * reference them without leaking into the rest of the app. We intentionally
 * don't mutate the existing globals (--bg, --text, etc.).
 */

import { Inter, JetBrains_Mono, Instrument_Serif } from "next/font/google";

// Inter → Geist substitute (we don't have Geist via Google Fonts, but Inter
// is a sensible Geist-adjacent fallback that's already used elsewhere). Geist
// itself is available via the `geist` npm package and the existing layout
// imports it; we use that here too via the CSS variable Next sets up.
export const fontInter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--brand-font-sans-fallback",
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--brand-font-mono",
});

export const fontSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic", "normal"],
  variable: "--brand-font-serif",
});

/**
 * Wraps the brand pages in the dark theme + scoped tokens.
 * Place inside the layout slot — it owns the full viewport.
 */
export function BrandThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${fontInter.variable} ${fontMono.variable} ${fontSerif.variable}`}
      style={{
        // Dark theme tokens scoped to this subtree.
        // Override of the app-level --bg / --text / etc.
        ["--bg" as string]: "#0F0F0F",
        ["--app-bg" as string]: "#0A0A0A",
        ["--bg2" as string]: "#1A1A1A",
        ["--bg3" as string]: "#232325",
        ["--surface" as string]: "#141012",
        ["--border" as string]: "rgba(255,255,255,0.08)",
        ["--border-hover" as string]: "rgba(255,255,255,0.14)",
        ["--border-strong" as string]: "rgba(255,255,255,0.22)",
        ["--text" as string]: "#F0F0F0",
        ["--text2" as string]: "#A0A0A8",
        ["--text3" as string]: "#6B6B75",
        ["--text4" as string]: "#4A4A52",
        ["--accent" as string]: "#C2185B",
        ["--accent-hover" as string]: "#AD1457",
        ["--accent-soft" as string]: "rgba(194,24,91,0.12)",
        ["--accent-text" as string]: "#E91E78",
        ["--green" as string]: "#22C55E",
        ["--red" as string]: "#EF4444",
        ["--warn" as string]: "#F59E0B",
        ["--blue" as string]: "#3B82F6",
        ["--ease" as string]: "cubic-bezier(0.25, 1, 0.5, 1)",
        // Font stack — prefer Geist (already in the app root layout), fall through to Inter.
        fontFamily:
          "var(--font-geist-sans, var(--brand-font-sans-fallback, system-ui)), system-ui, -apple-system, sans-serif",
        background: "#0A0A0A",
        color: "#F0F0F0",
        letterSpacing: "-0.011em",
        WebkitFontSmoothing: "antialiased",
        // AppShell wraps every route in a <main> with flex-1 + overflow-hidden,
        // so the route itself must own its scroll container. Fill the parent's
        // available height and scroll vertically when content overflows.
        height: "100%",
        width: "100%",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {children}
    </div>
  );
}

// ─── Reusable primitives ────────────────────────────────────────────────────

export const sansFamily = "var(--font-geist-sans, var(--brand-font-sans-fallback, system-ui)), system-ui, -apple-system, sans-serif";
export const monoFamily = "var(--brand-font-mono), ui-monospace, SFMono-Regular, monospace";
export const serifFamily = "var(--brand-font-serif), Georgia, serif";

/** Mono uppercase label — reused everywhere. */
export function Uplabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: monoFamily,
        fontSize: 10,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        color: "var(--text3)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Tag / pill — variants: default, accent, ready (success), warn. */
export function Tag({
  children,
  variant = "default",
  withDot,
  style,
}: {
  children: React.ReactNode;
  variant?: "default" | "accent" | "ready" | "warn";
  withDot?: boolean;
  style?: React.CSSProperties;
}) {
  const variants: Record<string, React.CSSProperties> = {
    default: {
      background: "var(--bg2)",
      color: "var(--text2)",
      border: "1px solid var(--border)",
    },
    accent: {
      background: "var(--accent-soft)",
      color: "var(--accent-text)",
      border: "1px solid rgba(233, 30, 120, 0.25)",
    },
    ready: {
      background: "rgba(34, 197, 94, 0.10)",
      color: "var(--green)",
      border: "1px solid rgba(34, 197, 94, 0.20)",
    },
    warn: {
      background: "rgba(245, 158, 11, 0.10)",
      color: "var(--warn)",
      border: "1px solid rgba(245, 158, 11, 0.25)",
    },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 8px",
        borderRadius: 999,
        fontFamily: monoFamily,
        fontSize: 10,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        ...variants[variant],
        ...style,
      }}
    >
      {withDot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "currentColor",
          }}
        />
      )}
      {children}
    </span>
  );
}

/** Primary / ghost button. */
export function Btn({
  children,
  variant = "ghost",
  onClick,
  disabled,
  style,
  type,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  type?: "button" | "submit";
}) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 14px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s var(--ease)",
    fontFamily: "inherit",
    opacity: disabled ? 0.5 : 1,
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--accent)",
      color: "white",
      borderColor: "var(--accent)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text)",
      borderColor: "var(--border)",
    },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

/**
 * Skeleton placeholder. Subtle 1.4s shimmer that reads as "loading" against
 * the dark canvas without screaming for attention. Used by /brand and
 * /brand/[id] while data is in flight.
 */
export function Skel({
  width = "100%",
  height = 14,
  radius = 6,
  style,
  delay = 0,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: React.CSSProperties;
  delay?: number;
}) {
  return (
    <span
      style={{
        display: "block",
        width,
        height,
        borderRadius: radius,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)",
        backgroundSize: "200% 100%",
        animation: `brandSkelShimmer 1.4s ease-in-out ${delay}ms infinite`,
        ...style,
      }}
    />
  );
}

/** Inject the shimmer keyframes once per page mount. */
export function SkelKeyframes() {
  return (
    <style>{`
      @keyframes brandSkelShimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  );
}

/**
 * Mini slide preview — pure CSS replica of how a slide built from this kit
 * looks. Used in stack cards and the live-preview rail.
 */
export interface MiniSlideKit {
  brandVars: {
    headerLeft?: string;
    headerRight?: string;
    colors: {
      bg: string;
      text: string;
      textSecondary: string;
      accent: string;
      [k: string]: string | undefined;
    };
  };
}

export function MiniSlide({
  kit,
  size = "md",
}: {
  kit: MiniSlideKit;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const c = kit.brandVars.colors;
  const dimensions = {
    sm: { w: 140, h: 79 },
    md: { w: 240, h: 135 },
    lg: { w: 360, h: 202 },
    xl: { w: 480, h: 270 },
  }[size];

  return (
    <div
      style={{
        width: dimensions.w,
        height: dimensions.h,
        background: c.bg,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        borderRadius: 4,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: `${dimensions.h * 0.05}px ${dimensions.w * 0.05}px`,
          display: "flex",
          justifyContent: "space-between",
          fontSize: dimensions.w * 0.022,
          fontWeight: 600,
          color: c.text,
          fontFamily: monoFamily,
          letterSpacing: "0.12em",
        }}
      >
        <span>{kit.brandVars.headerLeft ?? "BRAND"}</span>
        <span style={{ color: c.textSecondary }}>{kit.brandVars.headerRight ?? "Confidential"}</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: `${dimensions.w * 0.05}px`,
          top: `${dimensions.h * 0.30}px`,
          fontSize: dimensions.w * 0.075,
          fontWeight: 700,
          lineHeight: 1.05,
          color: c.text,
          letterSpacing: "-0.025em",
          maxWidth: dimensions.w * 0.7,
        }}
      >
        Outperformed
        <br />
        the index by{" "}
        <span style={{ color: c.accent }}>14%</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: `${dimensions.w * 0.05}px`,
          bottom: `${dimensions.h * 0.18}px`,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <div style={{ width: dimensions.w * 0.3, height: 2, background: c.textSecondary, opacity: 0.5 }} />
        <div style={{ width: dimensions.w * 0.4, height: 2, background: c.textSecondary, opacity: 0.5 }} />
        <div style={{ width: dimensions.w * 0.25, height: 2, background: c.textSecondary, opacity: 0.5 }} />
      </div>
      <div
        style={{
          position: "absolute",
          right: `${dimensions.w * 0.05}px`,
          bottom: `${dimensions.h * 0.05}px`,
          width: dimensions.w * 0.18,
          height: dimensions.h * 0.18,
          background: c.accent,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${dimensions.w * 0.05}px`,
          bottom: `${dimensions.h * 0.06}px`,
          fontFamily: monoFamily,
          fontSize: dimensions.w * 0.022,
          color: c.textSecondary,
        }}
      >
        04 / 24
      </div>
    </div>
  );
}
