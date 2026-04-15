"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload04Icon, Image01Icon } from "@hugeicons/core-free-icons";

interface AttachmentPopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  onUpload: () => void;
  onAssets: () => void;
}

export function AttachmentPopover({ open, onClose, anchorRef, onUpload, onAssets }: AttachmentPopoverProps) {
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

  const items = [
    {
      icon: Image01Icon,
      label: "My Assets",
      sub: "Pick from your library",
      onClick: () => { onClose(); onAssets(); },
    },
    {
      icon: Upload04Icon,
      label: "Upload from computer",
      sub: "PDF, images, DOCX, XLSX…",
      onClick: () => { onClose(); onUpload(); },
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
            bottom: "calc(100% + 8px)",
            left: 0,
            width: 240,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-xl)",
            boxShadow: "0 8px 32px -4px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            zIndex: 100,
            overflow: "hidden",
            padding: "4px",
          }}
        >
          {items.map((item, i) => (
            <div key={item.label}>
              {i > 0 && (
                <div style={{ height: 1, background: "var(--border)", margin: "3px 0" }} />
              )}
              <button
                onClick={item.onClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--r-lg)] transition-colors text-left"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <div
                  className="flex items-center justify-center rounded-[var(--r-md)] flex-shrink-0"
                  style={{ width: 30, height: 30, background: "var(--accent-soft)" }}
                >
                  <HugeiconsIcon icon={item.icon} size={15} color="var(--accent)" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                    {item.label}
                  </span>
                  <span className="text-[11.5px]" style={{ color: "var(--text3)" }}>
                    {item.sub}
                  </span>
                </div>
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
