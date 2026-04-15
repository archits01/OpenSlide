"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BrandAssets {
  colors: {
    primary: string | null;
    secondary: string | null;
    by_frequency: Array<{ hex: string; count: number }>;
  };
  fonts: {
    primary: string;
    secondary: string | null;
  };
  logo_candidates: Array<{
    filename: string;
    data_uri: string;
    confidence: string;
  }>;
  header_footer: {
    header: { has_content: boolean };
    footer: {
      has_content: boolean;
      builtin: {
        footer_placeholder: { text: string } | null;
        slide_number_placeholder: unknown | null;
      };
    };
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BrandConfirmation({
  brand,
  onConfirm,
  onSkip,
}: {
  brand: BrandAssets;
  onConfirm: (selectedLogoIndex: number) => void;
  onSkip: () => void;
}) {
  const [selectedLogo, setSelectedLogo] = useState(0);
  const hasLogo = brand.logo_candidates.length > 0;
  const colors = brand.colors.by_frequency.slice(0, 5);
  const hasHeader = brand.header_footer.header.has_content;
  const hasFooter = brand.header_footer.footer.has_content;
  const hasSlideNum = !!brand.header_footer.footer.builtin.slide_number_placeholder;
  const footerText = brand.header_footer.footer.builtin.footer_placeholder?.text;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.60)", backdropFilter: "blur(8px)" }}
      onClick={onSkip}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="w-full max-w-md overflow-hidden"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          boxShadow: "0 24px 64px rgba(0,0,0,0.30)",
          margin: "0 16px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "24px 24px 16px" }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>Brand detected</h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--text3)", margin: 0 }}>
            Your slides will match this brand automatically.
          </p>
        </div>

        {/* Brand Preview */}
        <div style={{ padding: "0 24px 20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Logo */}
            {hasLogo && (
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 12, color: "var(--text3)", width: 56, flexShrink: 0 }}>Logo</span>
                <div className="flex gap-2">
                  {brand.logo_candidates.map((logo, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedLogo(i)}
                      style={{
                        padding: 8, borderRadius: 10, cursor: "pointer",
                        border: selectedLogo === i ? "2px solid var(--accent)" : "2px solid var(--border)",
                        background: selectedLogo === i ? "var(--accent-soft)" : "var(--bg2)",
                        transition: "all 0.15s",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logo.data_uri}
                        alt={`Logo ${i + 1}`}
                        style={{ height: 32, width: "auto", maxWidth: 100, objectFit: "contain" }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 12, color: "var(--text3)", width: 56, flexShrink: 0 }}>Colors</span>
                <div className="flex gap-1.5">
                  {colors.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: c.hex, border: "2px solid var(--border)",
                      }}
                      title={c.hex}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Font */}
            {brand.fonts.primary && (
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 12, color: "var(--text3)", width: 56, flexShrink: 0 }}>Font</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{brand.fonts.primary}</span>
                {brand.fonts.secondary && brand.fonts.secondary !== brand.fonts.primary && (
                  <span style={{ fontSize: 13, color: "var(--text3)" }}>+ {brand.fonts.secondary}</span>
                )}
              </div>
            )}

            {/* Chrome (header/footer/slide#) */}
            {(hasHeader || hasFooter) && (
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 12, color: "var(--text3)", width: 56, flexShrink: 0 }}>Chrome</span>
                <div className="flex gap-2 flex-wrap">
                  {hasHeader && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                      background: "var(--green-soft)", color: "var(--green)",
                    }}>Header</span>
                  )}
                  {hasFooter && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                      background: "var(--green-soft)", color: "var(--green)",
                    }}>Footer</span>
                  )}
                  {hasSlideNum && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                      background: "var(--green-soft)", color: "var(--green)",
                    }}>Slide #</span>
                  )}
                </div>
              </div>
            )}

            {/* Footer text */}
            {footerText && (
              <div className="flex items-start gap-3">
                <span style={{ fontSize: 12, color: "var(--text3)", width: 56, flexShrink: 0, paddingTop: 2 }}>Footer</span>
                <span style={{ fontSize: 12, color: "var(--text2)", fontStyle: "italic" }}>
                  &ldquo;{footerText}&rdquo;
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <button
            onClick={onSkip}
            style={{
              fontSize: 13, color: "var(--text3)", background: "none", border: "none",
              cursor: "pointer", padding: "8px 4px", transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text3)"; }}
          >
            Skip
          </button>
          <button
            onClick={() => onConfirm(selectedLogo)}
            style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: "var(--accent)", color: "white",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
          >
            Use this brand
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
