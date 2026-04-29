"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

interface RibbonTooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactNode;
}

export function RibbonTooltip({ content, shortcut, children }: RibbonTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number; flipped: boolean }>({ x: 0, y: 0, flipped: false });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const below = rect.bottom + 6;
      const above = rect.top - 6;
      // Flip if tooltip would overflow bottom (estimate ~40px height)
      const flipped = below + 40 > window.innerHeight;
      setPos({ x: cx, y: flipped ? above : below, flipped });
      setVisible(true);
    }, 500);
  }, []);

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!content) {
    return <>{children}</>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        style={{ display: "inline-flex", alignItems: "stretch" }}
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: pos.x,
              top: pos.flipped ? "auto" : pos.y,
              bottom: pos.flipped ? window.innerHeight - pos.y : "auto",
              transform: "translateX(-50%)",
              background: "#333",
              color: "#fff",
              fontSize: 11,
              padding: "4px 8px",
              borderRadius: 4,
              maxWidth: 240,
              whiteSpace: "normal",
              wordWrap: "break-word",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              zIndex: 10000,
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span>{content}</span>
            {shortcut && (
              <span style={{ color: "#999", fontSize: 10 }}>{shortcut}</span>
            )}
            {/* Arrow */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                ...(pos.flipped
                  ? {
                      bottom: -4,
                      borderLeft: "4px solid transparent",
                      borderRight: "4px solid transparent",
                      borderTop: "4px solid #333",
                    }
                  : {
                      top: -4,
                      borderLeft: "4px solid transparent",
                      borderRight: "4px solid transparent",
                      borderBottom: "4px solid #333",
                    }),
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}
