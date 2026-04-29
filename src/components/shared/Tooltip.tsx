"use client";

import { AnimatePresence, motion } from "framer-motion";

interface TooltipProps {
  show: boolean;
  label: string;
  side?: "top" | "bottom";
}

/**
 * Small styled tooltip that fades in on hover.
 * Anchored via `position: absolute` to the nearest `position: relative` ancestor.
 */
export function Tooltip({ show, label, side = "top" }: TooltipProps) {
  const verticalOffset = side === "top" ? { bottom: "calc(100% + 8px)" } : { top: "calc(100% + 8px)" };
  const initialY = side === "top" ? 4 : -4;

  return (
    <AnimatePresence>
      {show && (
        <motion.span
          role="tooltip"
          aria-live="polite"
          initial={{ opacity: 0, y: initialY }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: initialY }}
          transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            position: "absolute",
            ...verticalOffset,
            left: "50%",
            translateX: "-50%",
            padding: "6px 10px",
            background: "#1F1F22",
            color: "#F0F0F0",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "-0.005em",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 200,
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          }}
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
