"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload04Icon, Image01Icon } from "@hugeicons/core-free-icons";

interface AttachmentPopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  onUpload: () => void;
  onAssets: () => void;
  deepResearch: boolean;
  onToggleDeepResearch: () => void;
}

/** Lucide-style telescope icon — matches the glyph Claude uses for its Deep Research feature. */
export function TelescopeIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      shapeRendering="geometricPrecision"
    >
      <path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44" />
      <path d="m13.56 11.747 4.332-.924" />
      <path d="m16 21-3.105-6.21" />
      <path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z" />
      <path d="m6.158 8.633 1.114 4.456" />
      <path d="m8 21 3.105-6.21" />
      <circle cx="12" cy="13" r="2" />
    </svg>
  );
}

interface MenuItem {
  renderIcon: (color: string) => ReactNode;
  label: string;
  sub?: string;
  onClick: () => void;
  active: boolean;
}

export function AttachmentPopover({
  open, onClose, anchorRef, onUpload, onAssets, deepResearch, onToggleDeepResearch,
}: AttachmentPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, anchorRef]);

  const items: MenuItem[] = [
    {
      renderIcon: (color) => (
        <HugeiconsIcon icon={Image01Icon} size={18} color={color} strokeWidth={1.75} />
      ),
      label: "My Assets",
      sub: "Pick from your library",
      onClick: () => { onClose(); onAssets(); },
      active: false,
    },
    {
      renderIcon: (color) => (
        <HugeiconsIcon icon={Upload04Icon} size={18} color={color} strokeWidth={1.75} />
      ),
      label: "Upload from computer",
      sub: "PDF, images, DOCX, XLSX…",
      onClick: () => { onClose(); onUpload(); },
      active: false,
    },
    {
      renderIcon: (color) => <TelescopeIcon color={color} size={18} />,
      label: "Deep research",
      onClick: () => { onClose(); onToggleDeepResearch(); },
      active: deepResearch,
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.95, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={{ duration: 0.14, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: 260,
            background: "var(--bg2)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--r-xl)",
            boxShadow: "0 8px 32px -4px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
            zIndex: 100,
            overflow: "hidden",
            padding: "4px",
          }}
        >
          {items.map((item, i) => {
            const iconColor = item.active ? "var(--bg)" : "var(--accent)";
            return (
              <div key={item.label}>
                {i > 0 && (
                  <div style={{ height: 1, background: "var(--border)", margin: "3px 0" }} />
                )}
                <button
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--r-lg)] transition-colors text-left"
                  style={{
                    cursor: "pointer",
                    background: item.active ? "var(--accent-soft)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!item.active) (e.currentTarget as HTMLButtonElement).style.background = "var(--bg2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = item.active ? "var(--accent-soft)" : "transparent";
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-[var(--r-md)] flex-shrink-0"
                    style={{
                      width: 32,
                      height: 32,
                      background: item.active ? "var(--accent)" : "var(--accent-soft)",
                    }}
                  >
                    {item.renderIcon(iconColor)}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                      {item.label}
                    </span>
                    {item.sub && (
                      <span className="text-[11.5px]" style={{ color: "var(--text3)" }}>
                        {item.sub}
                      </span>
                    )}
                  </div>
                  {item.active && (
                    <span
                      className="flex-shrink-0"
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "var(--accent)",
                        background: "var(--accent-soft)",
                        padding: "2px 7px",
                        borderRadius: 999,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      On
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
