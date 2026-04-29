"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface ExpoPreviewProps {
  shellOutput: Array<{ stream: "stdout" | "stderr"; data: string; ts: number; cmd?: string }>;
}

// Patterns Expo prints when the tunnel/QR is ready
const QR_PATTERNS = [
  /exp\+[a-zA-Z0-9._-]+:\/\/expo-development-client[^\s]*/,
  /exp:\/\/[a-zA-Z0-9._:-]+/,
  /https?:\/\/[a-z0-9-]+\.ngrok(?:[-.]io|\.app)[^\s]*/,
  /https?:\/\/[a-z0-9-]+\.exp\.direct[^\s]*/,
];

function parseExpoUrl(output: string): string | null {
  for (const pattern of QR_PATTERNS) {
    const match = output.match(pattern);
    if (match) return match[0].trim();
  }
  return null;
}

export function ExpoPreview({ shellOutput }: ExpoPreviewProps) {
  const [expoUrl, setExpoUrl] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const chunk of shellOutput) {
      if (seenRef.current.has(chunk.ts + chunk.data)) continue;
      seenRef.current.add(chunk.ts + chunk.data);
      const url = parseExpoUrl(chunk.data);
      if (url) {
        setExpoUrl(url);
        setIsStarting(false);
      }
      // Expo started but maybe no tunnel URL yet
      if (chunk.data.includes("Metro waiting on") || chunk.data.includes("Starting Metro")) {
        setIsStarting(false);
      }
    }
  }, [shellOutput]);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-6 px-6"
      style={{ background: "var(--bg2)" }}
    >
      {expoUrl ? (
        <>
          {/* QR code */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            <QRCodeSVG value={expoUrl} size={220} level="M" includeMargin={false} />
          </div>

          {/* Instructions */}
          <div className="flex flex-col items-center gap-1 text-center max-w-xs">
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Scan with Expo Go
            </p>
            <p className="text-xs" style={{ color: "var(--text2)" }}>
              Open the <strong>Expo Go</strong> app on your iOS or Android device, then tap <strong>Scan QR code</strong>.
            </p>
          </div>

          {/* URL pill */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text2)", maxWidth: "100%", overflow: "hidden" }}
          >
            <span
              style={{ height: 6, width: 6, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }}
            />
            <span className="truncate">{expoUrl}</span>
          </div>
        </>
      ) : (
        <>
          {/* Loading state */}
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center"
            style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)" }}
          >
            <div
              className="h-4 w-4 rounded-full"
              style={{ background: "var(--accent)", animation: "pulse-fade 1.6s infinite ease-in-out" }}
            />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              {isStarting ? "Starting Expo…" : "Waiting for tunnel URL…"}
            </p>
            <p className="text-xs" style={{ color: "var(--text2)" }}>
              {isStarting
                ? "Running npm install and starting Metro bundler"
                : "Metro is running — waiting for the tunnel QR code"}
            </p>
          </div>
        </>
      )}

      {/* Expo Go download badges */}
      {expoUrl && (
        <div className="flex items-center gap-3 mt-2">
          <a
            href="https://apps.apple.com/app/expo-go/id982107779"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text2)" }}
          >
            App Store
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=host.exp.exponent"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text2)" }}
          >
            Google Play
          </a>
        </div>
      )}
    </div>
  );
}
