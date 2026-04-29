"use client";

import { useEffect, useRef, useState, RefObject, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

// SVG screen area constants (from iphone-mockup.svg viewBox 427×881)
const SVG_W = 427;
const SVG_H = 881;
const SCREEN_X = 18;
const SCREEN_Y = 18;
const SCREEN_W = 390;
const SCREEN_H = 844;
const SCREEN_RX = 55.75;

// Percentage positions for the iframe overlay
const LEFT_PCT = `${(SCREEN_X / SVG_W) * 100}%`;
const TOP_PCT = `${(SCREEN_Y / SVG_H) * 100}%`;
const WIDTH_PCT = `${(SCREEN_W / SVG_W) * 100}%`;
const HEIGHT_PCT = `${(SCREEN_H / SVG_H) * 100}%`;
// clip-path border radius: horizontal % of element width, vertical % of element height
const BR_H = `${(SCREEN_RX / SCREEN_W) * 100}%`;
const BR_V = `${(SCREEN_RX / SCREEN_H) * 100}%`;

// Expo tunnel URL patterns (for QR code)
const QR_PATTERNS = [
  /exp\+[a-zA-Z0-9._-]+:\/\/expo-development-client[^\s]*/,
  /exp:\/\/[a-zA-Z0-9._:-]+/,
  /https?:\/\/[a-z0-9-]+\.ngrok(?:[-.]io|\.app)[^\s]*/,
  /https?:\/\/[a-z0-9-]+\.exp\.direct[^\s]*/,
];

function parseTunnelUrl(output: string): string | null {
  for (const p of QR_PATTERNS) {
    const m = output.match(p);
    if (m) return m[0].trim();
  }
  return null;
}

interface IPhoneMockupPreviewProps {
  previewUrl: string | null;
  shellOutput: Array<{ stream: "stdout" | "stderr"; data: string; ts: number; cmd?: string }>;
  iframeRef: RefObject<HTMLIFrameElement | null>;
}

export function IPhoneMockupPreview({ previewUrl, shellOutput, iframeRef }: IPhoneMockupPreviewProps) {
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const seenRef = useRef<Set<string>>(new Set());
  const phoneRef = useRef<HTMLDivElement | null>(null);

  // Track phone container size to compute iframe scale
  const phoneRefCallback = useCallback((el: HTMLDivElement | null) => {
    (phoneRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setScale(el.clientWidth / SVG_W);
    });
    ro.observe(el);
    setScale(el.clientWidth / SVG_W);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    for (const chunk of shellOutput) {
      const key = chunk.ts + chunk.data;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);
      const url = parseTunnelUrl(chunk.data);
      if (url) setTunnelUrl(url);
    }
  }, [shellOutput]);

  // previewUrl = WebContainer proxy URL (from server-ready/port events) → iframe
  // tunnelUrl  = exp:// tunnel URL (from shell output) → QR code only
  const qrValue = tunnelUrl ?? previewUrl;

  return (
    <div
      className="flex-1 flex items-center justify-center gap-8 px-6"
      style={{ background: "var(--bg2)", overflow: "hidden" }}
    >
      {/* iPhone frame */}
      <div
        ref={phoneRefCallback}
        style={{
          position: "relative",
          flexShrink: 0,
          height: "min(82vh, 660px)",
          aspectRatio: `${SVG_W} / ${SVG_H}`,
        }}
      >
        {/* iPhone SVG frame — behind the screen content (has solid black background) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/iphone-mockup.svg"
          alt=""
          draggable={false}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 1,
          }}
        />

        {/* Screen content — on top of SVG, clipped to screen shape */}
        <div
          style={{
            position: "absolute",
            left: LEFT_PCT,
            top: TOP_PCT,
            width: WIDTH_PCT,
            height: HEIGHT_PCT,
            borderRadius: `${BR_H} / ${BR_V}`,
            overflow: "hidden",
            background: "#000",
            zIndex: 2,
          }}
        >
          {previewUrl ? (
            <>
              <iframe
                key={previewUrl}
                ref={iframeRef}
                src={previewUrl}
                style={{
                  width: SCREEN_W,
                  height: SCREEN_H,
                  border: "none",
                  background: "#fff",
                  display: "block",
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                onLoad={() => setIframeLoaded(true)}
              />
              {/* Loading overlay while iframe initialises */}
              <AnimatePresence>
                {!iframeLoaded && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      position: "absolute", inset: 0,
                      background: "#fff",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 10,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: "spin 0.75s linear infinite" }}>
                      <circle cx="10" cy="10" r="8" stroke="#4338CA" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="32 16" />
                    </svg>
                    <span style={{ fontSize: 12, color: "#71717A", fontWeight: 500 }}>Loading…</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            /* Pre-preview loading state inside phone */
            <div
              style={{
                width: "100%", height: "100%",
                background: "#0a0a0a",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 12,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ animation: "spin 0.75s linear infinite" }}>
                <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="36 18" />
              </svg>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500, letterSpacing: "-0.01em" }}>
                Starting Expo…
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Right panel — QR + info */}
      <div
        style={{
          display: "flex", flexDirection: "column", gap: 16,
          minWidth: 0, maxWidth: 200,
          flexShrink: 0,
        }}
      >
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>
            Try on your device
          </p>
          <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5, letterSpacing: "-0.01em" }}>
            {tunnelUrl
              ? "Scan with Expo Go to preview on iOS or Android."
              : "Scan to open the web preview on your phone."}
          </p>
        </div>

        {/* QR code — only shown when a tunnel URL is detected in shell output */}
        <AnimatePresence mode="wait">
          {tunnelUrl ? (
            <motion.div
              key="qr"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 14,
                border: "1px solid var(--border)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                display: "inline-block",
                alignSelf: "flex-start",
              }}
            >
              <QRCodeSVG value={tunnelUrl} size={140} level="M" includeMargin={false} />
            </motion.div>
          ) : (
            <motion.div
              key="qr-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "var(--bg)",
                border: "1px solid var(--border)",
              }}
            >
              <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5, margin: 0, letterSpacing: "-0.01em" }}>
                To test on a real device, ask the agent to run{" "}
                <code style={{ fontSize: 11, color: "var(--accent)", background: "var(--accent-soft)", padding: "1px 5px", borderRadius: 4 }}>
                  expo start --tunnel
                </code>{" "}
                and a QR code will appear here.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tunnel URL pill */}
        {tunnelUrl && (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 10px", borderRadius: 999,
              background: "var(--bg)", border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-mono, monospace)" }}>
              {tunnelUrl}
            </span>
          </div>
        )}

        {/* App store links — only once tunnel is active */}
        {tunnelUrl && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <a
              href="https://apps.apple.com/app/expo-go/id982107779"
              target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 12, padding: "6px 12px", borderRadius: 8, textAlign: "center",
                background: "var(--bg)", border: "1px solid var(--border)",
                color: "var(--text2)", textDecoration: "none",
              }}
            >
              Expo Go — App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=host.exp.exponent"
              target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 12, padding: "6px 12px", borderRadius: 8, textAlign: "center",
                background: "var(--bg)", border: "1px solid var(--border)",
                color: "var(--text2)", textDecoration: "none",
              }}
            >
              Expo Go — Google Play
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
