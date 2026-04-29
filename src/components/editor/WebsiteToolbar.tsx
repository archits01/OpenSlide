"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { BrowserIcon, SourceCodeIcon, Cancel01Icon, Refresh01Icon, Download01Icon, LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { GitHubDeployModal } from "./website/GitHubDeployModal";
import { GitHubImportModal } from "./website/GitHubImportModal";
import { VercelDeployModal } from "./website/VercelDeployModal";
import { AnimatePresence, motion } from "framer-motion";

async function downloadProjectZip(files: Record<string, string>, projectName: string) {
  const { zipSync, strToU8 } = await import("fflate");
  const zipFiles: Record<string, Uint8Array> = {};
  for (const [path, content] of Object.entries(files)) {
    const p = path.startsWith("/") ? path.slice(1) : path;
    if (!p) continue;
    zipFiles[p] = strToU8(content);
  }
  const zipped = zipSync(zipFiles);
  const blob = new Blob([zipped.buffer as ArrayBuffer], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName.toLowerCase().replace(/\s+/g, "-") || "project"}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

export type ViewMode = "slide" | "code";

// null = full-width desktop, number = constrained px
export type DeviceWidth = null | 390 | 768;

const DEVICE_CYCLE: DeviceWidth[] = [null, 768, 390];

interface WebsiteToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onClose?: () => void;
  onReboot?: () => void;
  readonly?: boolean;
  sessionId: string;
  sessionTitle: string;
  files: Record<string, string>;
  previewUrl?: string | null;
  publishedUrl?: string | null;
  onPublished?: (url: string) => void;
  onNeedsConnect?: () => void;
  onImported?: (files: Record<string, string>, repoName: string) => void;
  deviceWidth?: DeviceWidth;
  onDeviceWidthChange?: (w: DeviceWidth) => void;
  /** File contents at start of current agent turn — used for diff stats badge. */
  fileOriginals?: Record<string, string>;
}

function ToolbarIconButton({ children, title, onClick, active }: { children: React.ReactNode; title?: string; onClick?: () => void; active?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 7, border: "none",
        background: active ? "rgba(0,0,0,0.06)" : "transparent",
        color: active ? "var(--text)" : "var(--text3)",
        cursor: "pointer", transition: "background 100ms, color 100ms", flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.05)"; e.currentTarget.style.color = "var(--text)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = active ? "rgba(0,0,0,0.06)" : "transparent"; e.currentTarget.style.color = active ? "var(--text)" : "var(--text3)"; }}
    >
      {children}
    </button>
  );
}

// ─── Diff stats helper ────────────────────────────────────────────────────────
function diffStats(before: string, after: string): { added: number; removed: number } {
  const bLines = before.split('\n');
  const aLines = after.split('\n');
  const bSet = new Set(bLines);
  const aSet = new Set(aLines);
  let added = 0, removed = 0;
  for (const l of aLines) { if (l.trim() && !bSet.has(l)) added++; }
  for (const l of bLines) { if (l.trim() && !aSet.has(l)) removed++; }
  return { added, removed };
}

// ─── Modified files dropdown ──────────────────────────────────────────────────
function ModifiedFilesDropdown({
  open,
  onClose,
  changedFiles,
  files,
  fileOriginals,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  changedFiles: Set<string>;
  files: Record<string, string>;
  fileOriginals: Record<string, string>;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const dropRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onClose, anchorRef]);

  if (typeof document === "undefined") return null;

  const paths = Array.from(changedFiles).sort();

  return (
    <AnimatePresence>
      {open && pos && (
        <motion.div
          ref={dropRef}
          initial={{ opacity: 0, scale: 0.97, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -4 }}
          transition={{ duration: 0.12 }}
          style={{
            position: "fixed",
            top: pos.top,
            right: pos.right,
            zIndex: 9999,
            width: 280,
            background: "var(--bg)",
            border: "1px solid var(--border-strong)",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {paths.length} file{paths.length !== 1 ? "s" : ""} changed this turn
            </span>
          </div>
          {paths.map((path, i) => {
            const orig = fileOriginals[path] ?? "";
            const curr = files[path] ?? "";
            const stats = diffStats(orig, curr);
            return (
              <div
                key={path}
                style={{
                  padding: "7px 12px",
                  display: "flex", alignItems: "center", gap: 8,
                  borderBottom: i < paths.length - 1 ? "1px solid var(--border)" : "none",
                  background: "transparent",
                }}
              >
                <span style={{ flex: 1, fontSize: 12, fontFamily: "var(--font-mono, monospace)", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {path}
                </span>
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", whiteSpace: "nowrap", flexShrink: 0, color: "var(--text3)" }}>
                  {stats.added > 0 && <span style={{ color: "var(--green)" }}>+{stats.added}</span>}
                  {stats.added > 0 && stats.removed > 0 && <span> </span>}
                  {stats.removed > 0 && <span style={{ color: "var(--red)" }}>-{stats.removed}</span>}
                  {stats.added === 0 && stats.removed === 0 && <span style={{ color: "#89b4fa" }}>~</span>}
                </span>
              </div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── GitHub dropdown ──────────────────────────────────────────────────────────
function GitHubDropdown({
  open,
  onClose,
  onPush,
  onImport,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  onPush: () => void;
  onImport: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const dropRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onClose, anchorRef]);

  if (typeof document === "undefined") return null;

  const items = [
    {
      label: "Push to GitHub",
      description: "Create or update a repo with your project",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
      onClick: () => { onClose(); onPush(); },
    },
    {
      label: "Import from GitHub",
      description: "Pull files from a public repo into this project",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      onClick: () => { onClose(); onImport(); },
    },
  ];

  return (
    <AnimatePresence>
      {open && pos && (
        <motion.div
          ref={dropRef}
          initial={{ opacity: 0, scale: 0.97, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -4 }}
          transition={{ duration: 0.12 }}
          style={{
            position: "fixed",
            top: pos.top,
            right: pos.right,
            zIndex: 9999,
            width: 240,
            background: "var(--bg)",
            border: "1px solid var(--border-strong)",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              style={{
                width: "100%", textAlign: "left", padding: "10px 12px",
                border: "none", background: "transparent", cursor: "pointer",
                borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none",
                display: "flex", alignItems: "flex-start", gap: 10,
                transition: "background 80ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ color: "var(--text2)", marginTop: 1 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>{item.label}</div>
                <div style={{ fontSize: 11.5, color: "var(--text3)", marginTop: 1, lineHeight: 1.4 }}>{item.description}</div>
              </div>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main toolbar ─────────────────────────────────────────────────────────────
export function WebsiteToolbar({
  viewMode, onViewModeChange, onClose, onReboot,
  readonly = false, sessionId, sessionTitle, files,
  previewUrl, publishedUrl, onPublished,
  onNeedsConnect, onImported,
  deviceWidth: deviceWidthProp, onDeviceWidthChange,
  fileOriginals,
}: WebsiteToolbarProps) {
  const [deployOpen, setDeployOpen] = useState(false);
  const [vercelOpen, setVercelOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [githubDropOpen, setGithubDropOpen] = useState(false);
  const [modDropOpen, setModDropOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // Internal state if uncontrolled
  const [deviceWidthInternal, setDeviceWidthInternal] = useState<DeviceWidth>(null);
  const githubBtnRef = useRef<HTMLButtonElement>(null);
  const modBtnRef = useRef<HTMLButtonElement>(null);

  const changedFiles = useMemo(() => {
    if (!fileOriginals) return new Set<string>();
    const changed = new Set<string>();
    for (const [path, content] of Object.entries(files)) {
      const orig = fileOriginals[path];
      if (orig !== undefined && orig !== content) changed.add(path);
    }
    return changed;
  }, [files, fileOriginals]);

  const deviceWidth = deviceWidthProp !== undefined ? deviceWidthProp : deviceWidthInternal;
  function cycleDevice() {
    const idx = DEVICE_CYCLE.indexOf(deviceWidth);
    const next = DEVICE_CYCLE[(idx + 1) % DEVICE_CYCLE.length];
    setDeviceWidthInternal(next);
    onDeviceWidthChange?.(next);
  }

  // What to show in the URL bar:
  // - published URL if deployed
  // - local preview URL if running
  // - "/" as fallback
  const urlBarHref = publishedUrl ?? previewUrl ?? null;
  const urlBarLabel = publishedUrl
    ? publishedUrl.replace(/^https?:\/\//, "")
    : previewUrl
      ? new URL(previewUrl).pathname || "/"
      : "/";
  const isLocal = !publishedUrl;

  async function handleDownload() {
    if (downloading || Object.keys(files).length === 0) return;
    setDownloading(true);
    try { await downloadProjectZip(files, sessionTitle); }
    finally { setDownloading(false); }
  }

  return (
    <>
      <div className="flex-shrink-0 flex flex-col" style={{ height: 52, background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex-1 flex items-center justify-between" style={{ padding: "0 10px 0 12px", gap: 6 }}>

          {/* Left: Preview / Code toggle */}
          <div style={{ display: "flex", alignItems: "center", background: "var(--bg2)", borderRadius: 8, padding: "2px 3px", gap: 2, flexShrink: 0 }}>
            {(["slide", "code"] as ViewMode[]).map((mode) => {
              const active = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => onViewModeChange(mode)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    height: 26, padding: "0 9px", borderRadius: 6, border: "none",
                    cursor: "pointer", fontSize: 12, fontWeight: 500, letterSpacing: "-0.01em",
                    transition: "background 120ms, color 120ms, box-shadow 120ms",
                    background: active ? "var(--bg)" : "transparent",
                    color: active ? "var(--text)" : "var(--text3)",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
                    flexShrink: 0,
                  }}
                >
                  <HugeiconsIcon icon={mode === "slide" ? BrowserIcon : SourceCodeIcon} size={13} />
                  {mode === "slide" ? "Preview" : "Code"}
                </button>
              );
            })}
          </div>

          {/* Center: URL bar */}
          <div style={{
            flex: 1, minWidth: 0, maxWidth: 360,
            display: "flex", alignItems: "center", gap: 6,
            height: 30, padding: "0 8px 0 4px",
            background: "var(--bg2)", borderRadius: 7,
            border: "1px solid var(--border)",
          }}>
            {/* Cycling device icon — only show in preview mode */}
            {viewMode === "slide" ? (
              <button
                onClick={cycleDevice}
                title={deviceWidth === null ? "Desktop — click for Tablet" : deviceWidth === 768 ? "Tablet — click for Mobile" : "Mobile — click for Desktop"}
                style={{
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  width: 26, height: 26, borderRadius: 6, border: "none",
                  background: deviceWidth !== null ? "var(--accent-soft)" : "transparent",
                  color: deviceWidth !== null ? "var(--accent)" : "var(--text3)",
                  cursor: "pointer", transition: "background 120ms, color 120ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = deviceWidth !== null ? "var(--accent-soft)" : "var(--bg)"; e.currentTarget.style.color = deviceWidth !== null ? "var(--accent)" : "var(--text2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = deviceWidth !== null ? "var(--accent-soft)" : "transparent"; e.currentTarget.style.color = deviceWidth !== null ? "var(--accent)" : "var(--text3)"; }}
              >
                <DeviceIcon deviceWidth={deviceWidth} />
              </button>
            ) : (
              /* In code view, show deployed indicator instead */
              <span style={{ flexShrink: 0, display: "flex", alignItems: "center", paddingLeft: 2 }}>
                {isLocal ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                )}
              </span>
            )}
            <span style={{
              flex: 1, fontSize: 12, color: isLocal ? "var(--text3)" : "var(--text)",
              fontFamily: "var(--font-mono, ui-monospace, monospace)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              letterSpacing: 0,
            }}>
              {urlBarLabel}
            </span>
            {urlBarHref && (
              <a href={urlBarHref} target="_blank" rel="noopener noreferrer" title="Open in new tab" style={{ flexShrink: 0, color: "var(--text3)", display: "flex", lineHeight: 1 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text3)"; }}
              >
                <HugeiconsIcon icon={LinkSquare01Icon} size={12} />
              </a>
            )}
            <button
              title="Refresh preview"
              onClick={() => {
                // Tell canvas iframe to reload
                window.dispatchEvent(new CustomEvent("openslides:refresh-preview"));
              }}
              style={{ flexShrink: 0, background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text3)", display: "flex", lineHeight: 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text3)"; }}
            >
              <HugeiconsIcon icon={Refresh01Icon} size={12} />
            </button>
          </div>

          {/* Right: actions */}
          {!readonly && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>

              {/* Publish (Vercel) */}
              <button
                onClick={() => setVercelOpen(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  height: 28, padding: "0 11px", borderRadius: 7,
                  border: "none", background: "#000", color: "white",
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  letterSpacing: "-0.01em", flexShrink: 0,
                  transition: "opacity 100ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                <svg width="10" height="9" viewBox="0 0 76 65" fill="white">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
                {publishedUrl ? "Redeploy" : "Publish"}
              </button>

              <div style={{ width: 1, height: 14, background: "var(--border)", flexShrink: 0 }} />

              {/* GitHub icon → dropdown */}
              <button
                ref={githubBtnRef}
                onClick={() => setGithubDropOpen((v) => !v)}
                title="GitHub"
                style={{
                  width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 7, border: "none",
                  background: githubDropOpen ? "var(--bg2)" : "transparent",
                  color: githubDropOpen ? "var(--text)" : "var(--text3)",
                  cursor: "pointer", transition: "background 100ms, color 100ms", flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--text)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = githubDropOpen ? "var(--bg2)" : "transparent"; e.currentTarget.style.color = githubDropOpen ? "var(--text)" : "var(--text3)"; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              </button>

              {changedFiles.size > 0 && (
                <>
                  <button
                    ref={modBtnRef}
                    onClick={() => setModDropOpen((v) => !v)}
                    title="Files changed this turn"
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      height: 26, padding: "0 8px", borderRadius: 6,
                      border: "1px solid rgba(137,180,250,0.3)",
                      background: modDropOpen ? "rgba(137,180,250,0.1)" : "rgba(137,180,250,0.06)",
                      color: "#89b4fa", fontSize: 11.5, fontWeight: 600,
                      cursor: "pointer", transition: "background 100ms", flexShrink: 0,
                      fontFamily: "var(--font-mono, monospace)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(137,180,250,0.12)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = modDropOpen ? "rgba(137,180,250,0.1)" : "rgba(137,180,250,0.06)"; }}
                  >
                    ~{changedFiles.size}
                  </button>
                  <div style={{ width: 1, height: 14, background: "var(--border)", flexShrink: 0 }} />
                </>
              )}

              <div style={{ width: 1, height: 14, background: "var(--border)", flexShrink: 0 }} />

              <ToolbarIconButton title="Download ZIP" onClick={handleDownload}>
                <HugeiconsIcon icon={Download01Icon} size={15} style={{ opacity: downloading ? 0.4 : 1 }} />
              </ToolbarIconButton>
              <ToolbarIconButton title="Reboot sandbox" onClick={onReboot}>
                <HugeiconsIcon icon={Refresh01Icon} size={15} />
              </ToolbarIconButton>
              <ToolbarIconButton title="Close" onClick={onClose}>
                <HugeiconsIcon icon={Cancel01Icon} size={15} />
              </ToolbarIconButton>
            </div>
          )}
        </div>
      </div>

      <GitHubDropdown
        open={githubDropOpen}
        onClose={() => setGithubDropOpen(false)}
        onPush={() => setDeployOpen(true)}
        onImport={() => setImportOpen(true)}
        anchorRef={githubBtnRef}
      />

      {fileOriginals && changedFiles.size > 0 && (
        <ModifiedFilesDropdown
          open={modDropOpen}
          onClose={() => setModDropOpen(false)}
          changedFiles={changedFiles}
          files={files}
          fileOriginals={fileOriginals}
          anchorRef={modBtnRef}
        />
      )}

      <VercelDeployModal
        open={vercelOpen}
        onClose={() => setVercelOpen(false)}
        sessionTitle={sessionTitle}
        sessionId={sessionId}
        files={files}
        initialPublishedUrl={publishedUrl ?? null}
        onPublished={(url: string) => onPublished?.(url)}
      />

      <GitHubDeployModal
        open={deployOpen}
        onClose={() => setDeployOpen(false)}
        sessionTitle={sessionTitle}
        sessionId={sessionId}
        files={files}
        onNeedsConnect={() => { onNeedsConnect?.(); }}
      />

      <GitHubImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(importedFiles, repoName) => {
          onImported?.(importedFiles, repoName);
          setImportOpen(false);
        }}
      />
    </>
  );
}

// ─── Device icon — changes shape based on current width ──────────────────────
function DeviceIcon({ deviceWidth }: { deviceWidth: DeviceWidth }) {
  if (deviceWidth === 390) {
    // Mobile / phone
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    );
  }
  if (deviceWidth === 768) {
    // Tablet
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    );
  }
  // Desktop / laptop
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
