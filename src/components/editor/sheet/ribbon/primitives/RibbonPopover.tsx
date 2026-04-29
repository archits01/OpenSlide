"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

interface RibbonPopoverProps {
  open: boolean;
  onClose: () => void;
  /** Ref to the trigger element — popup positions below it */
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  /** Minimum width of the popup */
  minWidth?: number;
  /** Max height with scroll */
  maxHeight?: number;
  /** Additional style overrides */
  style?: React.CSSProperties;
}

/**
 * Portalled popup that renders at document.body level, escaping any
 * overflow:hidden parent (like RibbonTabPanel). Positioned via
 * fixed coordinates from the anchor element's bounding rect.
 */
export function RibbonPopover({
  open,
  onClose,
  anchorRef,
  children,
  minWidth = 200,
  maxHeight,
  style: extraStyle,
}: RibbonPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Position the popup below the anchor
  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 2,
      left: rect.left,
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        minWidth,
        maxHeight,
        overflowY: maxHeight ? "auto" : undefined,
        background: "#FFFFFF",
        border: "1px solid #C8C6C4",
        borderRadius: 4,
        boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
        zIndex: 10000,
        padding: "4px 0",
        ...extraStyle,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
