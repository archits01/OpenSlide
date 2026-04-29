"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWebContainer } from "@/lib/webcontainer/useWebContainer";
import { EnvVarsPanel } from "./EnvVarsPanel";
import { IPhoneMockupPreview } from "./IPhoneMockupPreview";
import { BuildingCarousel } from "./BuildingCarousel";
import { FileTree } from "./FileTree";
import { CodeEditor } from "./CodeEditor";
import { TerminalPanel } from "./TerminalPanel";
import { DiffPanel } from "./DiffPanel";
import { VersionHistoryPanel, type FileVersion } from "./VersionHistoryPanel";
import type { DeviceWidth } from "@/components/editor/WebsiteToolbar";
import { debugLogger } from "@/lib/webcontainer/debugLogger";

export interface WebsiteCanvasHandle {
  applyFileEvent(e: { type: string; path: string; content?: string }): void;
  runCommand(cmd: string, args: string[], toolUseId?: string, sync?: boolean): void;
  captureAndUploadScreenshot(): Promise<void>;
  openEnvVarsPanel(): void;
  reboot(): void;
  selectFile(path: string): void;
  restoreFiles(files: Record<string, string>): void;
}

interface WebsiteCanvasProps {
  sessionId: string;
  files: Record<string, string>;
  previewScreenshotUrl: string | null;
  snapshotUrl: string | null;
  envVarsDecrypted: Record<string, string>;
  envVarNames: string[];
  viewMode: "preview" | "code";
  onEnvVarsUpdated?: (names: string[]) => void;
  isMobile?: boolean;
  bootEnabled?: boolean;
  onElementClicked?: (payload: { selector: string; text: string; tag: string }) => void;
  templateName?: string | null;
  selectedFilePath?: string | null;
  onSelectedFileChange?: (path: string) => void;
  publishedUrl?: string | null;
  /** Controlled device preview width — driven by toolbar's cycling icon. */
  deviceWidth?: DeviceWidth;
  /** Files currently being written by the AI — shown as locked in file tree + editor. */
  lockedFiles?: Set<string>;
  /** Per-file version history — captured before each agent write. */
  fileVersions?: Record<string, FileVersion[]>;
  /** File contents at the start of the current agent turn — used for diff baseline. */
  fileOriginals?: Record<string, string>;
  /** Called when user restores a version so parent can update websiteFiles. */
  onRestoreVersion?: (path: string, content: string) => void;
  /** Called when the user clicks "Ask AI to fix" on the build error strip. */
  onAskAIToFix?: (message: string) => void;
}

const MIN_MS_BETWEEN_SCREENSHOTS = 30_000;

export const WebsiteCanvas = forwardRef<WebsiteCanvasHandle, WebsiteCanvasProps>(
  function WebsiteCanvas(
    {
      sessionId,
      files,
      previewScreenshotUrl,
      snapshotUrl,
      envVarsDecrypted,
      envVarNames,
      viewMode,
      onEnvVarsUpdated,
      isMobile = false,
      bootEnabled = true,
      onElementClicked,
      templateName,
      selectedFilePath,
      onSelectedFileChange,
      publishedUrl,
      deviceWidth = null,
      lockedFiles,
      fileVersions,
      fileOriginals,
      onRestoreVersion,
      onAskAIToFix,
    },
    ref,
  ) {
    const { state, previewUrl, previewPorts, shellOutput, unsupportedReason, errorOverlay, writeFile, removeFile, runCommand, captureScreenshot, iframeRef, reboot, spawnTerminal } =
      useWebContainer(
        isMobile ? "__disabled__" : sessionId,
        files,
        snapshotUrl,
        envVarsDecrypted,
        bootEnabled && !isMobile,
        templateName ?? undefined,
      );

    const [envPanelOpen, setEnvPanelOpen] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [shellPanelOpen, setShellPanelOpen] = useState(false);
    const [activePort, setActivePort] = useState<number | null>(null);
    const [errorDismissed, setErrorDismissed] = useState(false);
    const [terminalOpen, setTerminalOpen] = useState(false);
    // Multi-terminal tabs
    const [terminals, setTerminals] = useState<{ id: string }[]>([]);
    const [activeTermId, setActiveTermId] = useState<string | null>(null);
    // Code view tab: "code" shows CodeMirror editor, "diff" shows DiffPanel vs turn baseline
    const [codeTab, setCodeTab] = useState<"code" | "diff">("code");
    const [versionPanelOpen, setVersionPanelOpen] = useState(false);
    // Resizable sidebar
    const [sidebarWidth, setSidebarWidth] = useState(220);
    // Drag-to-resize device preview
    const [dragPreviewWidth, setDragPreviewWidth] = useState<number | null>(null);
    const dragPreviewRef = useRef<{ startX: number; startWidth: number } | null>(null);
    const lastScreenshotAtRef = useRef(0);
    const [selectedFileInternal, setSelectedFileInternal] = useState<string | null>(null);
    const selectedFile = selectedFilePath !== undefined ? selectedFilePath : selectedFileInternal;
    const setSelectedFile = (path: string) => {
      setSelectedFileInternal(path);
      onSelectedFileChange?.(path);
    };

    // Track which files were newly added or modified (for file tree indicators)
    const initialFilePathsRef = useRef<Set<string>>(new Set(Object.keys(files)));
    const [newFiles, setNewFiles] = useState<Set<string>>(new Set());
    const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());

    const iframeRetriesRef = useRef<{ url: string | null; count: number }>({ url: null, count: 0 });
    const readOnly = isMobile || !!unsupportedReason;

    // Start debug logger once per mount (website mode only)
    useEffect(() => { if (!isMobile) debugLogger.start(); }, [isMobile]);

    // Forward new shell output chunks to the debug logger.
    // Track by array reference + last-seen item so the cap (500 items) doesn't stop forwarding.
    const prevShellRef = useRef<typeof shellOutput>([]);
    useEffect(() => {
      const prev = prevShellRef.current;
      prevShellRef.current = shellOutput;
      if (shellOutput === prev || shellOutput.length === 0) return;
      if (shellOutput.length > prev.length) {
        // Array grew — new items are at the end
        for (let i = prev.length; i < shellOutput.length; i++) {
          debugLogger.logShell(shellOutput[i].stream, shellOutput[i].data, shellOutput[i].cmd);
        }
      } else {
        // Cap hit — array shifted; last item is the only new one
        const last = shellOutput[shellOutput.length - 1];
        if (last !== prev[prev.length - 1]) {
          debugLogger.logShell(last.stream, last.data, last.cmd);
        }
      }
    }, [shellOutput]);

    // Reset drag width when toolbar cycles device width
    useEffect(() => { setDragPreviewWidth(null); }, [deviceWidth]);

    // Auto-select first port when ports become available
    useEffect(() => {
      if (activePort === null && previewPorts.size > 0) {
        setActivePort(previewPorts.keys().next().value ?? null);
      }
      // If active port was closed, fall back to first remaining
      if (activePort !== null && !previewPorts.has(activePort) && previewPorts.size > 0) {
        setActivePort(previewPorts.keys().next().value ?? null);
      }
    }, [previewPorts, activePort]);

    // Clear error dismiss when a new error appears
    useEffect(() => { setErrorDismissed(false); }, [errorOverlay]);

    // ─── Track new/modified files ─────────────────────────────────────────
    useEffect(() => {
      const currentPaths = Object.keys(files);
      setNewFiles((prev) => {
        const next = new Set(prev);
        for (const p of currentPaths) {
          if (!initialFilePathsRef.current.has(p)) next.add(p);
        }
        return next;
      });
    }, [files]);

    // ─── Imperative handle ───────────────────────────────────────────────
    const captureAndUploadScreenshot = useCallback(async () => {
      if (readOnly) return;
      const now = Date.now();
      if (now - lastScreenshotAtRef.current < MIN_MS_BETWEEN_SCREENSHOTS) return;
      lastScreenshotAtRef.current = now;
      const blob = await captureScreenshot();
      if (!blob) return;
      try {
        const form = new FormData();
        form.append("file", blob, "preview.png");
        form.append("sessionId", sessionId);
        await fetch("/api/website-screenshot", { method: "POST", body: form });
      } catch (err) {
        console.warn("[WebsiteCanvas] screenshot upload failed:", err);
      }
    }, [captureScreenshot, sessionId, readOnly]);

    useImperativeHandle(
      ref,
      () => ({
        applyFileEvent(e) {
          if (readOnly) return;
          if (e.type === "website_file_created" || e.type === "website_file_updated") {
            if (e.content !== undefined) {
              void writeFile(e.path, e.content);
              if (e.type === "website_file_updated") {
                setModifiedFiles((prev) => {
                  const next = new Set(prev);
                  next.add(e.path);
                  return next;
                });
              }
            }
          } else if (e.type === "website_file_deleted") {
            void removeFile(e.path);
          }
        },
        async runCommand(cmd, args, toolUseId, sync) {
          if (readOnly) return;
          const res = await runCommand(cmd, args);
          void fetch("/api/website-shell-result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              cmd,
              args,
              exitCode: res.exitCode,
              stderrTail: res.stderrTail,
              // For sync commands, send full output + toolUseId so the loop
              // can unblock and inject the result directly into the tool_result.
              ...(sync && toolUseId ? { toolUseId, output: res.output } : {}),
            }),
          }).catch(() => { /* fire-and-forget */ });
        },
        captureAndUploadScreenshot,
        openEnvVarsPanel() { setEnvPanelOpen(true); },
        reboot,
        selectFile(path: string) { setSelectedFile(path); },
        restoreFiles(newFiles) {
          if (readOnly) return;
          const current = Object.keys(files);
          for (const p of current) { if (newFiles[p] === undefined) void removeFile(p); }
          for (const [p, c] of Object.entries(newFiles)) { if (files[p] !== c) void writeFile(p, c); }
        },
      }),
      [writeFile, removeFile, runCommand, captureAndUploadScreenshot, sessionId, readOnly, setSelectedFile, files],
    );

    // ─── Auto-capture screenshot once iframe loads + is running ───────────
    useEffect(() => {
      if (state !== "running" || !iframeLoaded) return;
      const t = setTimeout(() => { void captureAndUploadScreenshot(); }, 1500);
      return () => clearTimeout(t);
    }, [state, iframeLoaded, captureAndUploadScreenshot]);

    // ─── Refresh button ──────────────────────────────────────────────────
    useEffect(() => {
      function onRefresh() {
        const iframe = iframeRef.current;
        if (!iframe) return;
        iframe.src = iframe.src;
      }
      window.addEventListener("openslides:refresh-preview", onRefresh);
      return () => window.removeEventListener("openslides:refresh-preview", onRefresh);
    }, [iframeRef]);

    // ─── Report build errors ──────────────────────────────────────────────
    useEffect(() => {
      if (!errorOverlay) return;
      void fetch("/api/website-build-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: errorOverlay }),
      }).catch(() => { /* ignore */ });
    }, [errorOverlay, sessionId]);

    // ─── Click-to-edit ────────────────────────────────────────────────────
    useEffect(() => {
      if (!onElementClicked) return;
      const cb = onElementClicked;
      function onMsg(ev: MessageEvent) {
        const d = ev.data;
        if (!d || typeof d !== "object") return;
        if (d.source !== "opensl-edit") return;
        if (d.kind !== "element-click") return;
        if (typeof d.selector !== "string" || typeof d.text !== "string" || typeof d.tag !== "string") return;
        cb({ selector: d.selector, text: d.text, tag: d.tag });
      }
      window.addEventListener("message", onMsg);
      return () => window.removeEventListener("message", onMsg);
    }, [onElementClicked]);

    // ─── Terminal helpers ─────────────────────────────────────────────────
    function toggleTerminal() {
      if (!terminalOpen) {
        if (terminals.length === 0) {
          const id = `term-${Date.now()}`;
          setTerminals([{ id }]);
          setActiveTermId(id);
        }
        setTerminalOpen(true);
      } else {
        setTerminalOpen(false);
      }
    }

    function addTerminal() {
      const id = `term-${Date.now()}`;
      setTerminals((prev) => [...prev, { id }]);
      setActiveTermId(id);
    }

    function closeTerminalTab(id: string) {
      setTerminals((prev) => {
        const remaining = prev.filter((t) => t.id !== id);
        if (remaining.length === 0) setTerminalOpen(false);
        else if (activeTermId === id) setActiveTermId(remaining[remaining.length - 1].id);
        return remaining;
      });
    }

    // ─── Sidebar resize handler ───────────────────────────────────────────
    function startSidebarResize(e: React.MouseEvent) {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = sidebarWidth;
      const handleMove = (ev: MouseEvent) => {
        const newWidth = Math.max(140, Math.min(420, startWidth + (ev.clientX - startX)));
        setSidebarWidth(newWidth);
      };
      const handleUp = () => {
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    }

    // ─── Preview drag-resize handlers ─────────────────────────────────────
    function startPreviewDrag(e: React.MouseEvent, side: "left" | "right") {
      e.preventDefault();
      const containerEl = (e.currentTarget as HTMLElement).closest("[data-preview-container]") as HTMLElement | null;
      const containerWidth = containerEl?.clientWidth ?? window.innerWidth;
      const currentEffectiveWidth = dragPreviewWidth ?? (deviceWidth ?? containerWidth);
      dragPreviewRef.current = { startX: e.clientX, startWidth: currentEffectiveWidth };
      const handleMove = (ev: MouseEvent) => {
        if (!dragPreviewRef.current) return;
        const delta = ev.clientX - dragPreviewRef.current.startX;
        // Left handle: drag left = wider; right handle: drag right = wider
        const change = side === "right" ? delta : -delta;
        const newWidth = Math.max(320, Math.min(containerWidth - 16, dragPreviewRef.current.startWidth + change));
        setDragPreviewWidth(newWidth);
      };
      const handleUp = () => {
        dragPreviewRef.current = null;
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    }

    const effectivePreviewWidth = dragPreviewWidth ?? deviceWidth;
    // Active preview URL — respects port selector; falls back to previewUrl for backwards compat
    const activePreviewUrl = (activePort !== null ? previewPorts.get(activePort) : null) ?? previewUrl;

    // ─── Status pill ──────────────────────────────────────────────────────
    const recentStderr = shellOutput
      .filter((c) => c.stream === "stderr" || /error|failed|cannot find|enoent/i.test(c.data))
      .slice(-3).map((c) => c.data).join(" ").trim();

    const statusPillText = (() => {
      if (readOnly) return null;
      switch (state) {
        case "idle": return recentStderr ? "Dev server didn't start." : "Initializing agent.";
        case "booting": return "Initializing agent.";
        case "mounting": return "Mounting files…";
        case "installing": return "Installing dependencies…";
        case "running": return null;
        case "error": return "Preview error.";
        case "crashed": return "Dev server stopped.";
      }
    })();

    // ─── File data for code view ──────────────────────────────────────────
    const sortedFilePaths = useMemo(() => Object.keys(files).sort(), [files]);
    const activeFilePath = selectedFile && files[selectedFile] !== undefined ? selectedFile : sortedFilePaths[0] ?? null;
    const activeContent = activeFilePath ? (files[activeFilePath] ?? "") : "";

    // Files that differ from the turn baseline (shown with ~ in file tree)
    const changedFiles = useMemo(() => {
      if (!fileOriginals) return new Set<string>();
      const changed = new Set<string>();
      for (const path of Object.keys(files)) {
        const orig = fileOriginals[path];
        if (orig === undefined || orig !== files[path]) changed.add(path);
      }
      return changed;
    }, [files, fileOriginals]);

    // Diff baseline for the active file
    const activeOriginal = activeFilePath ? (fileOriginals?.[activeFilePath] ?? "") : "";
    // Versions for the active file
    const activeVersions = activeFilePath ? (fileVersions?.[activeFilePath] ?? []) : [];

    // ─── Inline file edit (from CodeEditor onChange) ──────────────────────
    const handleFileEdit = useCallback(async (path: string, newContent: string) => {
      if (readOnly) return;
      await writeFile(path, newContent);
      setModifiedFiles((prev) => { const n = new Set(prev); n.add(path); return n; });
    }, [writeFile, readOnly]);

    return (
      <div className="flex flex-col h-full relative" style={{ background: "var(--bg2)" }}>

        {readOnly ? (
          <ReadOnlyFallback
            files={files}
            selectedFile={activeFilePath}
            onSelectFile={setSelectedFile}
            activeContent={activeContent}
            previewScreenshotUrl={previewScreenshotUrl}
            unsupportedReason={unsupportedReason}
            isMobile={isMobile}
            viewMode={viewMode}
            sortedFilePaths={sortedFilePaths}
          />
        ) : (
          <div className="flex-1 relative overflow-hidden flex flex-col">
            {templateName === "expo" && viewMode === "preview" ? (
              <IPhoneMockupPreview previewUrl={previewUrl} shellOutput={shellOutput} iframeRef={iframeRef} />
            ) : viewMode === "preview" ? (
              /* ── Preview mode ── */
              <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Preview area + optional terminal split */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Preview */}
                  <div
                    className="relative overflow-hidden"
                    style={{ flex: terminalOpen ? "0 0 55%" : 1, display: "flex", justifyContent: "center", alignItems: "stretch", background: "var(--bg2)" }}
                  >
                    {/* Floating terminal toggle */}
                    <button
                      onClick={toggleTerminal}
                      title={terminalOpen ? "Hide terminal" : "Open terminal"}
                      style={{
                        position: "absolute", bottom: 12, right: 12, zIndex: 10,
                        display: "flex", alignItems: "center", gap: 5,
                        height: 28, padding: "0 10px", borderRadius: 8,
                        border: "1px solid var(--border-strong)",
                        background: terminalOpen ? "var(--accent-soft)" : "var(--bg)",
                        color: terminalOpen ? "var(--accent)" : "var(--text2)",
                        fontSize: 11.5, fontWeight: 500, cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                        transition: "background 100ms, color 100ms",
                      }}
                    >
                      <TerminalIcon />
                      Terminal
                    </button>
                    {/* Device frame wrapper with drag-to-resize handles */}
                    <div
                      data-preview-container=""
                      style={{ width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "stretch", justifyContent: "center" }}
                    >
                    <div
                      style={{
                        width: effectivePreviewWidth ? `${effectivePreviewWidth}px` : "100%",
                        maxWidth: "100%",
                        height: "100%",
                        position: "relative",
                        transition: dragPreviewRef.current ? "none" : "width 200ms ease",
                        overflow: "hidden",
                        boxShadow: effectivePreviewWidth ? "0 0 0 1px var(--border), 0 4px 24px rgba(0,0,0,0.12)" : "none",
                        borderRadius: effectivePreviewWidth ? 4 : 0,
                      }}
                    >
                      {/* Left drag handle */}
                      {effectivePreviewWidth && (
                        <div
                          onMouseDown={(e) => startPreviewDrag(e, "left")}
                          style={{
                            position: "absolute", left: -5, top: 0, width: 10, height: "100%",
                            cursor: "ew-resize", zIndex: 5,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <div style={{ width: 3, height: 40, borderRadius: 2, background: "var(--border-strong)", opacity: 0.6 }} />
                        </div>
                      )}
                      {/* Right drag handle */}
                      {effectivePreviewWidth && (
                        <div
                          onMouseDown={(e) => startPreviewDrag(e, "right")}
                          style={{
                            position: "absolute", right: -5, top: 0, width: 10, height: "100%",
                            cursor: "ew-resize", zIndex: 5,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <div style={{ width: 3, height: 40, borderRadius: 2, background: "var(--border-strong)", opacity: 0.6 }} />
                        </div>
                      )}
                      {/* Published URL fallback */}
                      <AnimatePresence>
                        {publishedUrl && !(state === "running" && activePreviewUrl) && (
                          <motion.iframe
                            key={`published-iframe:${publishedUrl}`}
                            src={publishedUrl}
                            className="absolute inset-0 w-full h-full"
                            style={{ border: "none", background: "white" }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </AnimatePresence>
                      {!publishedUrl && !previewScreenshotUrl && !(state === "running" && activePreviewUrl) && (
                        <BuildingCarousel />
                      )}
                      {!publishedUrl && previewScreenshotUrl && !(state === "running" && activePreviewUrl) && (
                        <img src={previewScreenshotUrl} alt="Last preview" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "blur(0.5px)" }} />
                      )}
                      <AnimatePresence>
                        {state === "running" && activePreviewUrl && (
                          <motion.iframe
                            key={`live-iframe:${activePreviewUrl}`}
                            ref={iframeRef}
                            src={activePreviewUrl}
                            className="absolute inset-0 w-full h-full"
                            style={{ border: "none", background: "white" }}
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                            onLoad={() => {
                              setIframeLoaded(true);
                              iframeRetriesRef.current = { url: activePreviewUrl, count: 0 };
                            }}
                            onError={() => {
                              if (iframeRetriesRef.current.url !== activePreviewUrl) {
                                iframeRetriesRef.current = { url: activePreviewUrl, count: 0 };
                              }
                              const attempt = iframeRetriesRef.current.count;
                              if (attempt < 2) {
                                iframeRetriesRef.current.count = attempt + 1;
                                setTimeout(() => {
                                  const el = iframeRef.current;
                                  if (!el) return;
                                  el.src = activePreviewUrl!;
                                }, attempt === 0 ? 1000 : 2000);
                                return;
                              }
                              reboot();
                            }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </AnimatePresence>
                      {/* Port selector — shown when multiple ports are open */}
                      {previewPorts.size > 1 && state === "running" && (
                        <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 15 }}>
                          <PortSelector ports={previewPorts} activePort={activePort} onSelect={setActivePort} />
                        </div>
                      )}
                    </div>
                    </div>{/* /data-preview-container */}
                  </div>

                  {/* Terminal panel — tabbed */}
                  {terminalOpen && (
                    <div style={{ flex: "0 0 45%", borderTop: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                      {/* Tab bar */}
                      <div style={{ height: 32, display: "flex", alignItems: "center", background: "#1a1a2e", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingLeft: 4, gap: 2, flexShrink: 0 }}>
                        {terminals.map((term, i) => (
                          <div
                            key={term.id}
                            onClick={() => setActiveTermId(term.id)}
                            style={{
                              display: "flex", alignItems: "center", gap: 6,
                              height: 26, padding: "0 8px 0 10px", borderRadius: 5,
                              background: activeTermId === term.id ? "rgba(255,255,255,0.08)" : "transparent",
                              color: activeTermId === term.id ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)",
                              fontSize: 11.5, cursor: "pointer", flexShrink: 0,
                              transition: "background 100ms, color 100ms",
                            }}
                          >
                            <TerminalIcon />
                            <span>Terminal {i + 1}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); closeTerminalTab(term.id); }}
                              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit", lineHeight: 1, fontSize: 13, opacity: 0.6, display: "flex", alignItems: "center" }}
                              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={addTerminal}
                          title="New terminal"
                          style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 5, border: "none", background: "transparent", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 16, flexShrink: 0, transition: "background 100ms, color 100ms" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
                        >
                          +
                        </button>
                      </div>
                      {/* Terminal panels — keep mounted, hide inactive */}
                      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                        {terminals.map((term) => (
                          <div key={term.id} style={{ position: "absolute", inset: 0, display: activeTermId === term.id ? "flex" : "none", flexDirection: "column" }}>
                            <TerminalPanel spawnTerminal={spawnTerminal} isReady={state === "running" || state === "installing" || state === "idle"} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── Code view with editor + file tree ── */
              <div className="flex-1 flex overflow-hidden flex-col" style={{ position: "relative" }}>
                <div className="flex-1 flex overflow-hidden">
                  {/* Sidebar: file tree */}
                  <div
                    style={{
                      width: sidebarWidth, flexShrink: 0, display: "flex", flexDirection: "column",
                      background: "var(--bg)", overflow: "hidden",
                    }}
                  >
                    {/* Header */}
                    <div style={{ height: 34, display: "flex", alignItems: "center", paddingLeft: 10, paddingRight: 6, borderBottom: "1px solid var(--border)", flexShrink: 0, gap: 4 }}>
                      <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "var(--text3)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                        Explorer
                      </span>
                      <span style={{ fontSize: 10, color: "var(--text3)", display: "flex", gap: 5, alignItems: "center" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />new
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <span style={{ fontSize: 9, color: "#89b4fa", fontWeight: 700 }}>~</span>changed
                        </span>
                      </span>
                    </div>
                    {/* Tree */}
                    <div style={{ flex: 1, overflowY: "auto" }}>
                      <FileTree
                        files={files}
                        selectedFile={activeFilePath}
                        onSelectFile={setSelectedFile}
                        modifiedFiles={modifiedFiles}
                        newFiles={newFiles}
                        lockedFiles={lockedFiles}
                        changedFiles={changedFiles}
                      />
                    </div>
                  </div>

                  {/* Sidebar resize handle */}
                  <div
                    onMouseDown={startSidebarResize}
                    style={{
                      width: 4, flexShrink: 0, cursor: "ew-resize", position: "relative",
                      background: "var(--border)",
                      transition: "background 100ms",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--border)"; }}
                  />

                  {/* Editor / diff / no-file */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
                    {/* Tab bar */}
                    {activeFilePath && (
                      <div style={{
                        height: 34, display: "flex", alignItems: "center",
                        paddingLeft: 8, paddingRight: 8, borderBottom: "1px solid var(--border)",
                        background: "var(--bg)", flexShrink: 0, gap: 4,
                      }}>
                        {/* Code / Diff toggle */}
                        <div style={{ display: "flex", background: "var(--bg2)", borderRadius: 6, padding: "2px 2px", gap: 1, flexShrink: 0 }}>
                          {(["code", "diff"] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setCodeTab(tab)}
                              style={{
                                height: 22, padding: "0 8px", borderRadius: 4, border: "none",
                                background: codeTab === tab ? "var(--bg)" : "transparent",
                                color: codeTab === tab ? "var(--text)" : "var(--text3)",
                                fontSize: 11, fontWeight: 500, cursor: "pointer",
                                boxShadow: codeTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                                transition: "background 100ms",
                              }}
                            >
                              {tab === "code" ? "Code" : "Diff"}
                              {tab === "diff" && changedFiles.has(activeFilePath) && (
                                <span style={{ marginLeft: 4, fontSize: 9, color: "#89b4fa", fontWeight: 700 }}>~</span>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* File name */}
                        <span style={{
                          flex: 1, fontSize: 11, fontFamily: "var(--font-mono, monospace)",
                          color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {activeFilePath}
                        </span>

                        {/* Lock indicator */}
                        {lockedFiles?.has(activeFilePath) && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--warn)", flexShrink: 0 }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            AI editing
                          </span>
                        )}

                        {/* Version history button */}
                        <button
                          title="Version history"
                          onClick={() => setVersionPanelOpen((v) => !v)}
                          style={{
                            width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                            border: "none", borderRadius: 5, flexShrink: 0, cursor: "pointer",
                            background: versionPanelOpen ? "var(--accent-soft)" : "transparent",
                            color: versionPanelOpen ? "var(--accent)" : "var(--text3)",
                          }}
                          onMouseEnter={(e) => { if (!versionPanelOpen) { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--text)"; } }}
                          onMouseLeave={(e) => { if (!versionPanelOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; } }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Lock banner */}
                    {activeFilePath && lockedFiles?.has(activeFilePath) && (
                      <div style={{
                        height: 28, display: "flex", alignItems: "center", gap: 6, paddingLeft: 12,
                        background: "var(--warn-soft)", borderBottom: "1px solid var(--border)", flexShrink: 0,
                        fontSize: 11, color: "var(--warn)",
                      }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Being edited by AI — edits paused
                      </div>
                    )}

                    {/* Main content area */}
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      {!activeFilePath ? (
                        <div style={{ padding: "20px 16px", fontSize: 13, color: "var(--text3)" }}>Select a file to edit.</div>
                      ) : codeTab === "diff" ? (
                        <DiffPanel
                          path={activeFilePath}
                          before={activeOriginal}
                          after={activeContent}
                        />
                      ) : (
                        <CodeEditor
                          key={activeFilePath}
                          path={activeFilePath}
                          content={activeContent}
                          onChange={handleFileEdit}
                          readOnly={!!(lockedFiles?.has(activeFilePath))}
                        />
                      )}
                    </div>

                    {/* Version history panel — slides in from right */}
                    {versionPanelOpen && activeFilePath && (
                      <VersionHistoryPanel
                        path={activeFilePath}
                        versions={activeVersions}
                        currentContent={activeContent}
                        onRestore={(content) => {
                          onRestoreVersion?.(activeFilePath, content);
                          void handleFileEdit(activeFilePath, content);
                        }}
                        onClose={() => setVersionPanelOpen(false)}
                      />
                    )}
                  </div>
                </div>

                {/* Terminal in code view — collapsible, tabbed */}
                <div
                  style={{
                    height: terminalOpen ? 220 : 34, flexShrink: 0,
                    display: "flex", flexDirection: "column",
                    borderTop: "1px solid var(--border)", overflow: "hidden",
                    transition: "height 200ms ease",
                  }}
                >
                  {/* Header row: toggle + tabs + add */}
                  <div style={{ height: 34, display: "flex", alignItems: "center", background: "var(--bg)", flexShrink: 0, borderBottom: terminalOpen ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                    <button
                      onClick={toggleTerminal}
                      style={{
                        height: 34, display: "flex", alignItems: "center", gap: 6,
                        paddingLeft: 12, paddingRight: 8, border: "none",
                        background: "transparent", cursor: "pointer", flexShrink: 0,
                        color: "var(--text2)", fontSize: 12, fontWeight: 500,
                      }}
                    >
                      <TerminalIcon />
                      <svg
                        width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: terminalOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 200ms" }}
                      >
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </button>

                    {/* Tabs */}
                    {terminalOpen && terminals.map((term, i) => (
                      <div
                        key={term.id}
                        onClick={() => setActiveTermId(term.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          height: 28, padding: "0 6px 0 10px", borderRadius: 5,
                          background: activeTermId === term.id ? "var(--bg2)" : "transparent",
                          color: activeTermId === term.id ? "var(--text)" : "var(--text3)",
                          fontSize: 11.5, cursor: "pointer", flexShrink: 0,
                          transition: "background 100ms, color 100ms",
                        }}
                      >
                        <span>Terminal {i + 1}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); closeTerminalTab(term.id); }}
                          style={{ background: "none", border: "none", padding: "0 1px", cursor: "pointer", color: "inherit", lineHeight: 1, fontSize: 13, opacity: 0.5, display: "flex", alignItems: "center" }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {terminalOpen && (
                      <button
                        onClick={addTerminal}
                        title="New terminal"
                        style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 5, border: "none", background: "transparent", color: "var(--text3)", cursor: "pointer", fontSize: 16, flexShrink: 0, transition: "background 100ms, color 100ms" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--text)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; }}
                      >
                        +
                      </button>
                    )}
                  </div>

                  {/* Terminal panels — keep mounted, hide inactive */}
                  {terminalOpen && (
                    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                      {terminals.map((term) => (
                        <div key={term.id} style={{ position: "absolute", inset: 0, display: activeTermId === term.id ? "flex" : "none", flexDirection: "column" }}>
                          <TerminalPanel spawnTerminal={spawnTerminal} isReady={state === "running" || state === "installing" || state === "idle"} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Build error strip */}
            {errorOverlay && !errorDismissed && (
              <div
                className="absolute bottom-0 left-0 right-0 px-4 py-2 text-xs flex items-center gap-3"
                style={{ background: "var(--red-soft)", color: "var(--red)", borderTop: "1px solid var(--red)", zIndex: 20 }}
              >
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <strong>Build error</strong> — {errorOverlay.slice(0, 120)}{errorOverlay.length > 120 ? "…" : ""}
                </span>
                {onAskAIToFix && (
                  <button
                    onClick={() => {
                      debugLogger.logAction("ask_ai_to_fix_build_error", { errorPreview: errorOverlay?.slice(0, 120) });
                      onAskAIToFix(`Fix this build error:\n\`\`\`\n${errorOverlay}\n\`\`\``);
                    }}
                    style={{ background: "var(--red)", color: "white", border: "none", borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontSize: 11, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}
                  >
                    Ask AI to fix
                  </button>
                )}
                <button
                  onClick={() => setShellPanelOpen(true)}
                  style={{ background: "transparent", border: "none", color: "var(--red)", cursor: "pointer", textDecoration: "underline", flexShrink: 0 }}
                >
                  Details
                </button>
                <button
                  onClick={() => setErrorDismissed(true)}
                  style={{ background: "transparent", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 14, lineHeight: 1, flexShrink: 0 }}
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
            )}

            {/* Shell output panel */}
            {shellPanelOpen && (
              <div
                className="absolute bottom-0 left-0 right-0 max-h-[40%] overflow-auto px-4 py-3 text-xs font-mono"
                style={{ background: "var(--bg)", borderTop: "1px solid var(--border)", zIndex: 30 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-sans" style={{ color: "var(--text2)" }}>Shell output</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      onClick={() => debugLogger.download()}
                      style={{ background: "transparent", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 11, textDecoration: "underline" }}
                    >
                      Download logs
                    </button>
                    <button onClick={() => setShellPanelOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer" }}>Close</button>
                  </div>
                </div>
                {shellOutput.length === 0 ? (
                  <div style={{ color: "var(--text3)" }}>No output yet.</div>
                ) : (
                  shellOutput.map((o, i) => (
                    <div key={i} style={{ color: o.stream === "stderr" ? "var(--red)" : "var(--text)" }}>
                      {o.cmd && <span style={{ color: "var(--text3)" }}>$ {o.cmd}</span>} {o.data}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Status pill */}
            {!(state === "running" && activePreviewUrl) && statusPillText && (
              <div
                className="absolute bottom-5 left-1/2 flex items-center gap-2 px-4 py-2"
                style={{
                  transform: "translateX(-50%)",
                  borderRadius: 999,
                  background: state === "error" || state === "crashed" ? "var(--red-soft)" : "rgba(67,56,202,0.08)",
                  border: `1px solid ${state === "error" || state === "crashed" ? "var(--red)" : "rgba(67,56,202,0.18)"}`,
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  whiteSpace: "nowrap",
                  zIndex: 10,
                }}
              >
                {state === "error" || state === "crashed" ? (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: "var(--red)" }} />
                ) : (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, animation: "spin 0.75s linear infinite" }}>
                    <circle cx="6.5" cy="6.5" r="5" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeDasharray="20 12" />
                  </svg>
                )}
                <span style={{ fontSize: 12.5, fontWeight: 500, color: state === "error" || state === "crashed" ? "var(--red)" : "var(--accent-text)", letterSpacing: "-0.01em" }}>
                  {statusPillText}
                </span>
                {(state === "error" || state === "crashed") && (
                  <button
                    onClick={() => setShellPanelOpen(true)}
                    style={{ fontSize: 12, color: "var(--red)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                  >
                    View output
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Env vars drawer */}
        {envPanelOpen && (
          <EnvVarsPanel
            sessionId={sessionId}
            initialNames={envVarNames}
            onClose={() => setEnvPanelOpen(false)}
            onSaved={(names) => { onEnvVarsUpdated?.(names); }}
          />
        )}
      </div>
    );
  },
);

// ─── Port selector ────────────────────────────────────────────────────────────
function PortSelector({ ports, activePort, onSelect }: { ports: Map<number, string>; activePort: number | null; onSelect: (p: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) { if (!ref.current?.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 5, height: 26, padding: "0 10px",
          borderRadius: 8, border: "1px solid var(--border-strong)",
          background: "var(--bg)", color: "var(--text)", fontSize: 11.5, fontWeight: 500,
          cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
        :{activePort ?? [...ports.keys()][0]}
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 140,
          background: "var(--bg)", border: "1px solid var(--border-strong)", borderRadius: 8,
          boxShadow: "0 6px 24px rgba(0,0,0,0.15)", overflow: "hidden", zIndex: 50,
        }}>
          {[...ports.entries()].map(([port]) => (
            <button
              key={port}
              onClick={() => { onSelect(port); setOpen(false); }}
              style={{
                width: "100%", textAlign: "left", padding: "7px 12px",
                border: "none", background: "transparent", cursor: "pointer",
                fontSize: 12, color: "var(--text)", display: "flex", alignItems: "center", gap: 8,
                transition: "background 80ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {port === activePort && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
              {port !== activePort && <span style={{ width: 9 }} />}
              :{port}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Terminal icon ─────────────────────────────────────────────────────────────
function TerminalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

// ─── Read-only fallback ────────────────────────────────────────────────────────
function ReadOnlyFallback({
  files, selectedFile, onSelectFile, activeContent,
  previewScreenshotUrl, unsupportedReason, isMobile, viewMode, sortedFilePaths,
}: {
  files: Record<string, string>;
  selectedFile: string | null;
  onSelectFile: (p: string) => void;
  activeContent: string;
  previewScreenshotUrl: string | null;
  unsupportedReason: string | null;
  isMobile: boolean;
  viewMode: "preview" | "code";
  sortedFilePaths: string[];
}) {
  const banner = isMobile
    ? "Viewing in read-only mode. Open on desktop to see the live preview."
    : "Live preview requires a Chromium-based desktop browser (Chrome, Edge, Arc, or Firefox). Chat still works normally.";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-2 text-xs" style={{ background: "var(--warn-soft)", color: "var(--warn)", borderBottom: "1px solid var(--border)" }}>
        {banner}
        {unsupportedReason && <div className="mt-1 opacity-70" style={{ fontSize: 11 }}>({unsupportedReason})</div>}
      </div>

      {viewMode === "preview" ? (
        <div className="flex-1 relative overflow-hidden flex items-center justify-center" style={{ background: "var(--bg)" }}>
          {previewScreenshotUrl ? (
            <img src={previewScreenshotUrl} alt="Last preview" className="max-w-full max-h-full object-contain" />
          ) : (
            <div style={{ color: "var(--text3)", fontSize: 14 }}>No preview captured yet. Open this session on desktop to build your website.</div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* File tree sidebar */}
          <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--bg)", overflowY: "auto" }}>
            <FileTree
              files={files}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
            />
          </div>
          {/* Read-only code view */}
          <div className="flex-1 overflow-auto" style={{ background: "#282c34" }}>
            <pre style={{
              padding: "12px 16px", fontSize: 12, margin: 0,
              fontFamily: "var(--font-mono, ui-monospace, monospace)",
              color: "#abb2bf", whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {activeContent || <span style={{ color: "rgba(255,255,255,0.2)" }}>(select a file)</span>}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
