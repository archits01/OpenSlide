"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { SheetToastDetail } from "./sheet-toast";

interface Toast extends SheetToastDetail {
  id: number;
}

export function SheetToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<SheetToastDetail>).detail;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, ...detail }]);
      const ttl = detail.durationMs ?? 2500;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, ttl);
    }
    window.addEventListener("sheet-toast", onToast as EventListener);
    return () => window.removeEventListener("sheet-toast", onToast as EventListener);
  }, []);

  if (typeof document === "undefined" || toasts.length === 0) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 10_000,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => {
        const bg =
          t.kind === "error" ? "#FEE2E2" : t.kind === "success" ? "#DCFCE7" : "#1F2937";
        const fg =
          t.kind === "error" ? "#991B1B" : t.kind === "success" ? "#166534" : "#F9FAFB";
        return (
          <div
            key={t.id}
            style={{
              background: bg,
              color: fg,
              padding: "9px 14px",
              borderRadius: 8,
              fontFamily: "var(--font-geist-sans, system-ui)",
              fontSize: 13,
              boxShadow: "0 6px 20px rgba(0,0,0,0.16)",
              pointerEvents: "auto",
              maxWidth: 420,
            }}
          >
            {t.message}
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
