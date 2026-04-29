"use client";

import { useState } from "react";

export interface FileVersion {
  timestamp: number;
  content: string;
}

interface VersionHistoryPanelProps {
  path: string;
  versions: FileVersion[];
  currentContent: string;
  onRestore: (content: string) => void;
  onClose: () => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return "Just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function VersionHistoryPanel({
  path, versions, currentContent, onRestore, onClose,
}: VersionHistoryPanelProps) {
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  // Build display list: current (unsaved label) + saved versions newest-first
  const allVersions = [
    { timestamp: Date.now(), content: currentContent, label: "Current" },
    ...[...versions].reverse().map((v, i) => ({
      timestamp: v.timestamp,
      content: v.content,
      label: i === versions.length - 1 ? "Original" : undefined,
    })),
  ];

  const previewing = previewIdx !== null ? allVersions[previewIdx] : null;

  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 0, width: 320,
      background: "var(--bg)", borderLeft: "1px solid var(--border)",
      display: "flex", flexDirection: "column", zIndex: 40,
      boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
    }}>
      {/* Header */}
      <div style={{
        height: 44, display: "flex", alignItems: "center", gap: 8,
        padding: "0 12px", borderBottom: "1px solid var(--border)", flexShrink: 0,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>Version History</div>
          <div style={{ fontSize: 10, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-mono, monospace)" }}>
            {path}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", cursor: "pointer", color: "var(--text3)", borderRadius: 5 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--text)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Version list */}
      <div style={{ flex: previewing ? "0 0 auto" : 1, overflowY: "auto", maxHeight: previewing ? 180 : undefined }}>
        {allVersions.length <= 1 ? (
          <div style={{ padding: "20px 12px", fontSize: 12, color: "var(--text3)" }}>
            No saved versions yet. Versions are captured each time the AI edits this file.
          </div>
        ) : (
          allVersions.map((v, i) => {
            const isSelected = previewIdx === i;
            const isCurrent = i === 0;
            return (
              <button
                key={i}
                onClick={() => setPreviewIdx(isSelected ? null : i)}
                style={{
                  width: "100%", textAlign: "left", padding: "9px 12px",
                  display: "flex", alignItems: "center", gap: 10,
                  border: "none", borderBottom: "1px solid var(--border)",
                  background: isSelected ? "var(--accent-soft)" : "transparent",
                  cursor: "pointer", transition: "background 80ms",
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--bg2)"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                {/* Timeline dot */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: isSelected ? "var(--accent)" : isCurrent ? "var(--green)" : "var(--border-strong)",
                    border: `2px solid ${isSelected ? "var(--accent)" : isCurrent ? "var(--green)" : "var(--border)"}`,
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: isSelected ? "var(--accent-text)" : "var(--text)", fontWeight: isCurrent ? 600 : 400 }}>
                      {isCurrent ? "Current" : formatTime(v.timestamp)}
                    </span>
                    {v.label && v.label !== "Current" && (
                      <span style={{
                        fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 4,
                        background: "var(--bg2)", color: "var(--text3)", letterSpacing: "0.04em", textTransform: "uppercase",
                      }}>
                        {v.label}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>
                    {v.content.split("\n").length} lines · {(v.content.length / 1024).toFixed(1)}KB
                  </div>
                </div>
                {/* Restore button */}
                {!isCurrent && isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore(v.content);
                      onClose();
                    }}
                    style={{
                      flexShrink: 0, fontSize: 11, fontWeight: 500,
                      padding: "3px 8px", borderRadius: 5,
                      background: "var(--accent)", color: "white",
                      border: "none", cursor: "pointer",
                    }}
                  >
                    Restore
                  </button>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Preview pane */}
      {previewing && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderTop: "1px solid var(--border)" }}>
          <div style={{ height: 28, display: "flex", alignItems: "center", paddingLeft: 12, borderBottom: "1px solid var(--border)", flexShrink: 0, gap: 6 }}>
            <span style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Preview</span>
            <span style={{ fontSize: 10, color: "var(--text3)" }}>—</span>
            <span style={{ fontSize: 10, color: "var(--text2)", fontFamily: "var(--font-mono, monospace)" }}>
              {previewIdx === 0 ? "Current" : formatTime(previewing.timestamp)}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", background: "#282c34" }}>
            <pre style={{
              padding: "8px 12px", margin: 0, fontSize: 11,
              fontFamily: "var(--font-mono, monospace)",
              color: "#abb2bf", whiteSpace: "pre-wrap", wordBreak: "break-word",
              lineHeight: 1.5,
            }}>
              {previewing.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
