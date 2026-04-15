"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Presentation01Icon } from "@hugeicons/core-free-icons";

interface SlidesWidgetProps {
  title: string;
  slideCount: number;
  onOpen: () => void;
}

export function SlidesWidget({ title, slideCount, onOpen }: SlidesWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      onClick={onOpen}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 12,
        background: "var(--bg)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        transition: "border-color 150ms, box-shadow 150ms",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hover)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: "var(--accent-soft)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <HugeiconsIcon icon={Presentation01Icon} size={16} style={{ color: "var(--accent-text)" }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 500, color: "var(--text)",
          letterSpacing: "-0.01em", margin: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {title}
        </p>
        <p style={{ fontSize: 11.5, color: "var(--text3)", margin: 0 }}>
          {slideCount} {slideCount === 1 ? "slide" : "slides"}
        </p>
      </div>

      {/* Open arrow */}
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: "var(--bg2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text2)",
      }}>
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
      </div>
    </motion.div>
  );
}
