"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import type { Slide } from "@/lib/redis";
import type { ThemeName, ThemeColors } from "@/agent/tools/set-theme";
import type { LogoResult } from "@/lib/slide-html";
import { buildSlideHtml } from "./SlideCanvas";

const SLIDE_W = 1280;
const SLIDE_H = 720;

interface PresentationViewProps {
  slides: Slide[];
  theme: ThemeName;
  logoResult?: LogoResult | null;
  themeColors?: ThemeColors;
  onClose: () => void;
}

export function PresentationView({ slides, theme, logoResult, themeColors, onClose }: PresentationViewProps) {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(slides.length - 1, i + 1)), [slides.length]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [resetTimer]);

  // ResizeObserver on the inner slide container div
  useEffect(() => {
    const el = slideContainerRef.current;
    if (!el) return;
    function recalc() {
      if (!el) return;
      const scaleX = el.offsetWidth / SLIDE_W;
      const scaleY = el.offsetHeight / SLIDE_H;
      setScale(Math.min(scaleX, scaleY));
    }
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    recalc();
    return () => ro.disconnect();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); prev(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, next, prev]);

  // Touch swipe navigation
  const touchStartX = useRef(0);
  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      touchStartX.current = e.touches[0].clientX;
    }
    function onTouchEnd(e: TouchEvent) {
      const delta = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(delta) > 50) {
        if (delta < 0) next();
        else prev();
      }
    }
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [next, prev]);

  const slide = slides[index];
  if (!slide || typeof document === "undefined") return null;

  const html = buildSlideHtml(slide, theme, logoResult, index === 0, themeColors);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseMove={handleMouseMove}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#0a0a0a",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Main slide area — position: relative so absolute buttons anchor here's <main> */}
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>

        {/* Prev button — rendered BEFORE slide content, z-30 */}
        {index > 0 && (
          <button
            onClick={prev}
            style={{
              position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)",
              width: 40, height: 40, borderRadius: "50%", zIndex: 30,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", cursor: "pointer",
              opacity: showControls ? 1 : 0,
              pointerEvents: showControls ? "auto" : "none",
              transition: "opacity 300ms, background 150ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          </button>
        )}

        {/* Next button — rendered BEFORE slide content, z-30 */}
        {index < slides.length - 1 && (
          <button
            onClick={next}
            style={{
              position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)",
              width: 40, height: 40, borderRadius: "50%", zIndex: 30,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", cursor: "pointer",
              opacity: showControls ? 1 : 0,
              pointerEvents: showControls ? "auto" : "none",
              transition: "opacity 300ms, background 150ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </button>
        )}

        {/* Slide content — rendered AFTER buttons */}
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <div
            ref={slideContainerRef}
            style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}
          >
            <div
              style={{
                width: SLIDE_W,
                height: SLIDE_H,
                transform: `scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              {/* Only the iframe gets pointerEvents: none — wrapper divs are untouched */}
              <iframe
                key={`${slide.id}-present`}
                srcDoc={html}
                title={slide.title}
                sandbox="allow-scripts allow-same-origin"
                scrolling="no"
                style={{
                  display: "block",
                  width: SLIDE_W,
                  height: SLIDE_H,
                  border: "none",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Close button — top right, z-50 */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 16, right: 16, zIndex: 50,
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", cursor: "pointer",
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? "auto" : "none",
          transition: "opacity 300ms, background 150ms",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
      >
        <HugeiconsIcon icon={Cancel01Icon} size={15} />
      </button>

      {/* Footer — progress dots, z-50's footer */}
      <div
        style={{
          flexShrink: 0, height: 48,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50,
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? "auto" : "none",
          transition: "opacity 300ms",
        }}
      >
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setIndex(i)}
            style={{
              height: 5,
              width: i === index ? 24 : 5,
              borderRadius: 999, border: "none", padding: 0,
              background: i === index ? "white" : "rgba(255,255,255,0.3)",
              cursor: "pointer",
              transition: "width 250ms ease, background 150ms",
            }}
          />
        ))}
      </div>
    </motion.div>,
    document.body
  );
}
