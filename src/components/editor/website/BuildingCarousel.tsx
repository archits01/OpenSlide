"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TIPS = [
  {
    title: "Deploy Your Website",
    description: "Make your site publicly available with managed infrastructure.",
    video: "https://app.emergent.sh/DeploymentNewUI.mp4",
  },
  {
    title: "Attach Your Assets",
    description: "Upload images and files your agent can access and integrate into your site.",
    video: "https://assets.emergent.sh/assets/tips&Tricks/Assets.mp4",
  },
  {
    title: "Click to Edit",
    description: "Alt-click any element in the preview to instantly modify it.",
    video: "https://assets.emergent.sh/assets/tips&Tricks/Fork.mp4",
  },
  {
    title: "Build Mobile Apps",
    description: "Create native React Native apps with Expo — scan QR to preview on device.",
    video: "https://assets.emergent.sh/assets/tips&Tricks/Mobile_App.mp4",
  },
  {
    title: "AI Self-Review",
    description: "Agent screenshots its own output and fixes visual issues automatically.",
    video: "https://assets.emergent.sh/assets/tips&Tricks/1M_Claude.mp4",
  },
  {
    title: "Start From a Template",
    description: "Kick off from React, Expo, or a blank canvas — agent adapts to each.",
    video: "https://assets.emergent.sh/assets/tips&Tricks/New_Custom_Agent.mp4",
  },
];

const AUTO_ADVANCE_MS = 5000;

export function BuildingCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((next: number, dir: number) => {
    setDirection(dir);
    setIndex(next);
    setPaused(false);
  }, []);

  const prev = useCallback(() => {
    go((index - 1 + TIPS.length) % TIPS.length, -1);
  }, [index, go]);

  const next = useCallback(() => {
    go((index + 1) % TIPS.length, 1);
  }, [index, go]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % TIPS.length);
    }, AUTO_ADVANCE_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, index]);

  // Play/pause the video element
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) { v.pause(); } else { v.play().catch(() => {}); }
  }, [paused]);

  const tip = TIPS[index];

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 32 : -32 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -32 : 32 }),
  };

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center select-none"
      style={{ background: "var(--bg2)" }}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center"
          style={{ width: "min(520px, calc(100% - 48px))" }}
        >
          {/* Sparkle icon */}
          <div style={{ marginBottom: 12 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                fill="var(--accent)"
                opacity="0.9"
              />
            </svg>
          </div>

          {/* Fixed-height text zone — sized to the tallest tip (2-line description)
              so the video card never shifts position between slides */}
          <div style={{ height: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, width: "100%" }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "var(--text)",
                letterSpacing: "-0.03em",
                textAlign: "center",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              {tip.title}
            </h2>

            <p
              style={{
                fontSize: 13.5,
                color: "var(--text2)",
                textAlign: "center",
                lineHeight: 1.55,
                maxWidth: 380,
                letterSpacing: "-0.01em",
                margin: 0,
              }}
            >
              {tip.description}
            </p>
          </div>

          {/* Spacer between text zone and video */}
          <div style={{ height: 16 }} />

          {/* Video card */}
          <div
            style={{
              width: "100%",
              borderRadius: 14,
              overflow: "hidden",
              position: "relative",
              background: "#111",
              boxShadow: "0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.08)",
              aspectRatio: "16/10",
            }}
          >
            <video
              key={tip.video}
              ref={videoRef}
              src={tip.video}
              autoPlay
              muted
              loop
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: 14 }}
            />
            {/* Pause/play button */}
            <button
              onClick={() => setPaused((v) => !v)}
              style={{
                position: "absolute",
                bottom: 10,
                right: 10,
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(0,0,0,0.55)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                color: "#fff",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.75)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.55)"; }}
            >
              {paused ? (
                // Play triangle
                <svg width="11" height="12" viewBox="0 0 11 12" fill="white">
                  <path d="M1 1L10 6L1 11V1Z" />
                </svg>
              ) : (
                // Pause bars
                <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
                  <rect x="0" y="0" width="3.5" height="12" rx="1" />
                  <rect x="6.5" y="0" width="3.5" height="12" rx="1" />
                </svg>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots + arrows row */}
      <div
        className="flex items-center gap-3"
        style={{ marginTop: 22 }}
      >
        {/* Left arrow */}
        <button
          onClick={prev}
          style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text2)",
            transition: "all 0.12s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text2)"; }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.5 2L3.5 6L7.5 10" />
          </svg>
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-[6px]">
          {TIPS.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i, i > index ? 1 : -1)}
              style={{
                height: 6,
                width: i === index ? 22 : 6,
                borderRadius: 999,
                background: i === index ? "var(--text)" : "var(--border-hover)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.25s cubic-bezier(0.25,0.1,0.25,1), background 0.2s",
                flexShrink: 0,
              }}
            />
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={next}
          style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text2)",
            transition: "all 0.12s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text2)"; }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 2L8.5 6L4.5 10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
