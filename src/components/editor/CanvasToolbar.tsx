"use client";

import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import type { ExternalToast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BrowserIcon,
  SourceCodeIcon,
  Cards01Icon,
  Download01Icon,
  Edit04Icon,
  Cancel01Icon,
  Pdf01Icon,
  Ppt01Icon,
  Doc01Icon,
  CheckmarkCircle01Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons";

function ExportToastContent({
  status,
  format,
  message,
  toastId,
}: {
  status: "loading" | "done" | "error";
  format?: string;
  message?: string;
  toastId: string | number;
}) {
  const isLoading = status === "loading";
  const isDone = status === "done";
  const isError = status === "error";

  const label = isLoading
    ? `Preparing your ${format!.toUpperCase()}…`
    : isDone
    ? `Your ${format!.toUpperCase()} is downloading`
    : message ?? "Export failed";

  const sub = isLoading
    ? "This may take a few seconds. You can keep working."
    : isDone
    ? "Check your downloads folder."
    : "Something went wrong. Please try again.";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px 10px 12px",
      borderRadius: 12,
      background: isError ? "#FEF2F2" : "#fff",
      border: `1px solid ${isError ? "rgba(220,38,38,0.2)" : "rgba(0,0,0,0.08)"}`,
      boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
      minWidth: 320, maxWidth: 460,
    }}>
      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isError ? "rgba(220,38,38,0.08)" : isDone ? "rgba(22,163,74,0.08)" : "rgba(67,56,202,0.06)",
      }}>
        {isLoading && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#4338CA" strokeWidth="2" strokeOpacity="0.25" />
            <path d="M8 2a6 6 0 0 1 6 6" stroke="#4338CA" strokeWidth="2" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="0.8s" repeatCount="indefinite" />
            </path>
          </svg>
        )}
        {isDone && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: "#16A34A" }} />}
        {isError && <HugeiconsIcon icon={Alert01Icon} size={16} style={{ color: "#DC2626" }} />}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 500,
          color: isError ? "#DC2626" : "#09090B",
          letterSpacing: "-0.01em", lineHeight: 1.3,
        }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: 11.5, color: "#A1A1AA", lineHeight: 1.4, marginTop: 2 }}>
          {sub}
        </p>
      </div>

      {/* Dismiss */}
      {!isLoading && (
        <button
          onClick={() => toast.dismiss(toastId)}
          style={{
            width: 24, height: 24, borderRadius: 6, flexShrink: 0,
            border: "none", background: "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#A1A1AA", cursor: "pointer",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F4F4F5"; e.currentTarget.style.color = "#09090B"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#A1A1AA"; }}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={13} />
        </button>
      )}
    </div>
  );
}

export type ViewMode = "slide" | "code";

interface CanvasToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onClose?: () => void;
  onEdit?: () => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  isEditMode?: boolean;
  sessionId: string;
  readonly?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onPresent?: () => void;
  slidesCount?: number;
}

function CanvasIconButton({
  children,
  title,
  onClick,
  active,
}: {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 34,
        height: 34,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 7,
        border: "none",
        background: active ? "rgba(0,0,0,0.06)" : "transparent",
        color: active ? "var(--text)" : "var(--text3)",
        cursor: "pointer",
        transition: "background 100ms, color 100ms",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(0,0,0,0.05)";
        e.currentTarget.style.color = "var(--text)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active ? "rgba(0,0,0,0.06)" : "transparent";
        e.currentTarget.style.color = active ? "var(--text)" : "var(--text3)";
      }}
    >
      {children}
    </button>
  );
}

const SLIDE_EXPORT_FORMATS = [
  {
    id: "pdf",
    label: "PDF Document",
    description: "Best for printing & sharing",
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
    icon: Pdf01Icon,
  },
  {
    id: "pptx",
    label: "PowerPoint",
    description: "Download as .pptx",
    iconBg: "#FFEDD5",
    iconColor: "#EA580C",
    icon: Ppt01Icon,
  },
];

const DOC_EXPORT_FORMATS = [
  {
    id: "pdf",
    label: "PDF Document",
    description: "Best for printing & sharing",
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
    icon: Pdf01Icon,
  },
  {
    id: "docx",
    label: "Word Document",
    description: "Download as .docx",
    iconBg: "#DBEAFE",
    iconColor: "#2563EB",
    icon: Doc01Icon,
  },
];

const SHEET_EXPORT_FORMATS = [
  {
    id: "xlsx",
    label: "Excel Workbook",
    description: "Download as .xlsx",
    iconBg: "#DCFCE7",
    iconColor: "#16A34A",
    icon: Doc01Icon,
  },
];

function DownloadDropdown({ onClose, onExport, sessionType = "slides" }: { onClose: () => void; onExport: (format: string) => void; sessionType?: "slides" | "docs" | "sheets" | "website" }) {
  const formats =
    sessionType === "docs" ? DOC_EXPORT_FORMATS :
    sessionType === "sheets" ? SHEET_EXPORT_FORMATS :
    SLIDE_EXPORT_FORMATS;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -6 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: 260,
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div style={{ padding: "12px 14px 8px" }}>
        <span style={{
          fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em",
          textTransform: "uppercase", color: "var(--text3)",
        }}>
          Export Format
        </span>
      </div>

      {/* Options */}
      <div style={{ padding: "0 6px 6px" }}>
        {formats.map((fmt) => (
          <button
            key={fmt.id}
            onClick={() => { onExport(fmt.id); onClose(); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "10px 10px", borderRadius: 10,
              border: "none", background: "transparent", cursor: "pointer",
              textAlign: "left", transition: "background 120ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            {/* Format icon */}
            <div style={{
              width: 38, height: 38, borderRadius: 9, flexShrink: 0,
              background: fmt.iconBg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <HugeiconsIcon icon={fmt.icon} size={20} style={{ color: fmt.iconColor }} />
            </div>
            {/* Text */}
            <div>
              <p style={{
                margin: 0, fontSize: 13.5, fontWeight: 500,
                color: "var(--text)", letterSpacing: "-0.01em", lineHeight: 1.3,
              }}>
                {fmt.label}
              </p>
              <p style={{
                margin: 0, fontSize: 12, color: "var(--text3)", lineHeight: 1.4, marginTop: 1,
              }}>
                {fmt.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function CanvasToolbar({ viewMode, onViewModeChange, onClose, onEdit, onSaveEdit, onCancelEdit, isEditMode = false, sessionId, readonly = false, onUndo, onRedo, canUndo = false, canRedo = false, onPresent, slidesCount = 0 }: CanvasToolbarProps) {
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!downloadOpen) return;
    function handleClick(e: MouseEvent) {
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) {
        setDownloadOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [downloadOpen]);

  async function handleExport(format: string) {
    if (format !== "pptx" && format !== "pdf" && format !== "docx" && format !== "xlsx") return;
    setExporting(true);
    const toastId = toast.custom(
      (id) => <ExportToastContent status="loading" format={format} toastId={id} />,
      { duration: Infinity } as ExternalToast,
    );
    try {
      const res = await fetch(`/api/export/${format}?sessionId=${sessionId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Export failed: ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format;
      const defaultName = `presentation.${ext}`;
      a.download = res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? defaultName;
      a.click();
      URL.revokeObjectURL(url);
      toast.custom(
        (id) => <ExportToastContent status="done" format={format} toastId={id} />,
        { id: toastId, duration: 4000 } as ExternalToast,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      toast.custom(
        (id) => <ExportToastContent status="error" message={msg} toastId={id} />,
        { id: toastId, duration: 6000 } as ExternalToast,
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div
      className="flex-shrink-0 flex flex-col"
      style={{ height: 64, background: "var(--bg)" }}
    >
      <div
        className="flex-1 flex items-center justify-between"
        style={{ padding: "0 12px 0 16px" }}
      >
        {/* Left: Slide / Code toggle + Undo / Redo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "flex", alignItems: "center",
              background: "var(--bg2)", borderRadius: 9, padding: 3, gap: 2,
            }}
          >
            {(["slide", "code"] as ViewMode[]).map((mode) => {
              const active = viewMode === mode;
              const icon = mode === "slide" ? BrowserIcon : SourceCodeIcon;
              const label = mode === "slide" ? "Slide" : "Code";
              return (
                <button
                  key={mode}
                  onClick={() => onViewModeChange(mode)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    height: 28, padding: "0 10px", borderRadius: 6, border: "none",
                    cursor: "pointer", fontSize: 12.5, fontWeight: 500,
                    letterSpacing: "-0.01em",
                    transition: "background 120ms, color 120ms, box-shadow 120ms",
                    background: active ? "var(--bg)" : "transparent",
                    color: active ? "var(--text)" : "var(--text3)",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
                    flexShrink: 0,
                  }}
                >
                  <HugeiconsIcon icon={icon} size={14} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Undo / Redo — only visible in edit mode */}
          {isEditMode && (
            <>
              <div style={{ width: 1, height: 18, background: "var(--border)", flexShrink: 0 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <button
                  title="Undo (⌘Z)"
                  onClick={canUndo ? onUndo : undefined}
                  style={{
                    width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 7, border: "none", background: "transparent",
                    color: canUndo ? "var(--text)" : "var(--text3)",
                    cursor: canUndo ? "pointer" : "default",
                    opacity: canUndo ? 1 : 0.35,
                    transition: "opacity 150ms, color 150ms, background 150ms",
                  }}
                  onMouseEnter={(e) => { if (canUndo) e.currentTarget.style.background = "rgba(0,0,0,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H16" />
                  </svg>
                </button>
                <button
                  title="Redo (⌘⇧Z)"
                  onClick={canRedo ? onRedo : undefined}
                  style={{
                    width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 7, border: "none", background: "transparent",
                    color: canRedo ? "var(--text)" : "var(--text3)",
                    cursor: canRedo ? "pointer" : "default",
                    opacity: canRedo ? 1 : 0.35,
                    transition: "opacity 150ms, color 150ms, background 150ms",
                  }}
                  onMouseEnter={(e) => { if (canRedo) e.currentTarget.style.background = "rgba(0,0,0,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 14l5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H8" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right: action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {!readonly && (
            <CanvasIconButton title="Save as Template">
              <HugeiconsIcon icon={Cards01Icon} size={18} />
            </CanvasIconButton>
          )}

          {/* Download — PDF / PPTX */}
          <div ref={downloadRef} style={{ position: "relative" }}>
            <CanvasIconButton
              title={exporting ? "Exporting…" : "Download"}
              active={downloadOpen}
              onClick={() => !exporting && setDownloadOpen((o) => !o)}
            >
              <HugeiconsIcon icon={Download01Icon} size={18} style={{ opacity: exporting ? 0.4 : 1 }} />
            </CanvasIconButton>
            <AnimatePresence>
              {downloadOpen && (
                <DownloadDropdown onClose={() => setDownloadOpen(false)} onExport={handleExport} sessionType="slides" />
              )}
            </AnimatePresence>
          </div>

          {/* Present */}
          {!readonly && onPresent && slidesCount > 0 && !isEditMode && (
            <>
              <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px", flexShrink: 0 }} />
              <button
                onClick={onPresent}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  height: 34, padding: "0 14px", borderRadius: 9,
                  border: "none",
                  background: "var(--accent)", color: "white",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  letterSpacing: "-0.01em", flexShrink: 0,
                  transition: "background 100ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Present
              </button>
            </>
          )}

          {/* Edit + Close */}
          {!readonly && !isEditMode && (
            <>
              <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px", flexShrink: 0 }} />
              <button
                title="Edit"
                onClick={onEdit}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  height: 34, padding: "0 13px", borderRadius: 9,
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg)", color: "var(--text2)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  letterSpacing: "-0.01em",
                  transition: "border-color 120ms, color 120ms, background 120ms",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--accent-text)";
                  e.currentTarget.style.background = "var(--accent-soft)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-strong)";
                  e.currentTarget.style.color = "var(--text2)";
                  e.currentTarget.style.background = "var(--bg)";
                }}
              >
                <HugeiconsIcon icon={Edit04Icon} size={14} />
                Edit
              </button>
              <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px", flexShrink: 0 }} />
              <CanvasIconButton title="Close" onClick={onClose}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </CanvasIconButton>
            </>
          )}

          {/* Edit mode: Cancel + Save */}
          {!readonly && isEditMode && (
            <>
              <button
                onClick={onCancelEdit}
                style={{
                  height: 34, padding: "0 14px", borderRadius: 9,
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg)", color: "var(--text2)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  letterSpacing: "-0.01em", flexShrink: 0,
                  transition: "border-color 120ms, color 120ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text2)"; }}
              >
                Cancel
              </button>
              <button
                onClick={onSaveEdit}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  height: 34, padding: "0 16px", borderRadius: 9,
                  border: "none",
                  background: "#4338CA", color: "#fff",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  letterSpacing: "-0.01em", flexShrink: 0,
                  transition: "background 120ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#3730A3"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#4338CA"; }}
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
