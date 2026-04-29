"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatPanel, applyAgentEvent, type ChatState } from "@/components/editor/ChatPanel";
import type { ToolCallEntry } from "@/lib/types";
import { SlideCanvas, CodeView, type SlideCanvasHandle } from "@/components/editor/SlideCanvas";
import { SheetCanvas } from "@/components/editor/SheetCanvas";
import { WebsiteCanvas, type WebsiteCanvasHandle } from "@/components/editor/website/WebsiteCanvas";
import { EditorTopBar } from "@/components/editor/EditorTopBar";
import { CanvasToolbar, type ViewMode } from "@/components/editor/CanvasToolbar";
import { DocsToolbar } from "@/components/editor/DocsToolbar";
import { SheetsToolbar } from "@/components/editor/SheetsToolbar";
import { WebsiteToolbar, type DeviceWidth } from "@/components/editor/WebsiteToolbar";
import type { FileVersion } from "@/components/editor/website/VersionHistoryPanel";
import { PresentationView } from "@/components/editor/PresentationView";
import { SlidesWidget } from "@/components/editor/SlidesWidget";
import { InputToolbar } from "@/components/shared/InputToolbar";
import { AgentQuestionCard } from "@/components/shared/AgentQuestionCard";
import type { PreflightQuestion } from "@/app/api/website-preflight/route";
import type { Session, Slide } from "@/lib/redis";
import type { ThemeName, ThemeColors } from "@/agent/tools/set-theme";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MobileEditorShell } from "@/components/editor/mobile/MobileEditorShell";

export default function EditorPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [sessionTitle, setSessionTitle] = useState("Untitled Presentation");
  const [sessionType, setSessionType] = useState<"slides" | "docs" | "sheets" | "website">("slides");
  const [websiteFiles, setWebsiteFiles] = useState<Record<string, string>>({});
  const [websitePreviewScreenshotUrl, setWebsitePreviewScreenshotUrl] = useState<string | null>(null);
  const [websiteSnapshotUrl, setWebsiteSnapshotUrl] = useState<string | null>(null);
  // Click-to-edit prefill: bumped whenever the user alt-clicks an element in
  // the preview iframe. nonce makes identical-text repeat prefills re-trigger.
  const [inputPrefill, setInputPrefill] = useState<{ text: string; nonce: number } | null>(null);
  const [websiteEnvVarNames, setWebsiteEnvVarNames] = useState<string[]>([]);
  const [websiteTemplateName, setWebsiteTemplateName] = useState<string | null>(null);
  const [websitePublishedUrl, setWebsitePublishedUrl] = useState<string | null>(null);
  // Gate for WebContainer boot: true once we know whether this is a fresh session
  // (no GET needed — pending prompt from home page) or an existing one (GET completed).
  // Prevents the hook from booting with empty initialFiles before the fetch fills them in.
  const [sessionBootReady, setSessionBootReady] = useState(false);
  const [sandboxState, setSandboxState] = useState<"idle" | "booting" | "mounting" | "installing" | "running" | "error" | "crashed" | "reconnecting">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const websiteCanvasRef = useRef<{
    applyFileEvent: (e: { type: string; path: string; content?: string }) => void;
    runCommand: (cmd: string, args: string[], toolUseId?: string, sync?: boolean) => void;
    captureAndUploadScreenshot: () => Promise<void>;
    openEnvVarsPanel: () => void;
    reboot: () => void;
    selectFile: (path: string) => void;
    restoreFiles: (files: Record<string, string>) => void;
  } | null>(null);
  const [websiteSelectedFile, setWebsiteSelectedFile] = useState<string | null>(null);
  const [websiteDeviceWidth, setWebsiteDeviceWidth] = useState<DeviceWidth>(null);
  // Version history: per-file array of snapshots, max 10 each
  const [fileVersions, setFileVersions] = useState<Record<string, FileVersion[]>>({});
  // Turn baseline: snapshot of file contents at the start of each agent turn
  const fileOriginalsRef = useRef<Record<string, string>>({});
  const [fileOriginals, setFileOriginals] = useState<Record<string, string>>({});
  // Files currently being written by AI
  const [lockedFiles, setLockedFiles] = useState<Set<string>>(new Set());
  // Per-turn snapshots for rewind/fork — stores state at end of each completed turn
  interface TurnSnapshot {
    chatMessageCount: number;
    sessionMessageCount: number;
    websiteFiles: Record<string, string>;
  }
  const [turnSnapshots, setTurnSnapshots] = useState<TurnSnapshot[]>([]);
  // Pending snapshot data — set when `done` SSE fires, consumed once isStreaming flips false
  const pendingSnapshotRef = useRef<{ sessionMessageCount: number; websiteFiles: Record<string, string> } | null>(null);
  const wasStreamingRef = useRef(false);
  // Ref to latest websiteFiles for snapshot capture (React state lags in SSE loop)
  const websiteFilesRef = useRef<Record<string, string>>({});
  // Keep websiteFilesRef in sync with state
  useEffect(() => { websiteFilesRef.current = websiteFiles; }, [websiteFiles]);
  const [slides, setSlidesRaw] = useState<Slide[]>([]);
  const slidesRef = useRef<Slide[]>([]);
  // Wrapper that keeps ref in sync — use this everywhere instead of setSlidesRaw.
  // Computes next state eagerly from slidesRef.current so the ref is updated
  // synchronously before the next call — fixes stale-ref bug when multiple slide
  // events fire during a single SSE stream before React commits any renders.
  const setSlides = useCallback((update: Slide[] | ((prev: Slide[]) => Slide[])) => {
    const next = typeof update === "function" ? update(slidesRef.current) : update;
    slidesRef.current = next;
    setSlidesRaw(next);
  }, []);
  const [theme, setTheme] = useState<ThemeName>("minimal");
  const [themeColors, setThemeColors] = useState<ThemeColors | undefined>();
  const [logoResult, setLogoResult] = useState<import("@/lib/types").LogoResult | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [isReplay, setIsReplay] = useState(false);
  const [brandKitId, setBrandKitId] = useState<string | null>(null);
  const [buildingSlide, setBuildingSlide] = useState<{
    toolUseId: string;
    title?: string;
    partialContent: string;
  } | null>(null);

  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isStreaming: false,
  });

  // When isStreaming flips false → React has flushed all chatState updates → safe to read messages.length
  useEffect(() => {
    if (!chatState.isStreaming && wasStreamingRef.current && pendingSnapshotRef.current) {
      const { sessionMessageCount, websiteFiles: snapFiles } = pendingSnapshotRef.current;
      pendingSnapshotRef.current = null;
      setTurnSnapshots((snaps) => [
        ...snaps,
        { chatMessageCount: chatState.messages.length, sessionMessageCount, websiteFiles: snapFiles },
      ]);
    }
    wasStreamingRef.current = chatState.isStreaming;
  }, [chatState.isStreaming, chatState.messages.length]);

  const [toolHistory, setToolHistory] = useState<ToolCallEntry[]>([]);

  // Canvas state
  const [canvasOpen, setCanvasOpen] = useState(false);
  // chatExpanded lags behind canvasOpen — only flips to true after canvas fully exits
  const [chatExpanded, setChatExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("slide");
  const [isPresentMode, setIsPresentMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [attachedSlideText, setAttachedSlideText] = useState<string | null>(null);
  const [attachedSlide, setAttachedSlide] = useState<{ id: string; index: number; title: string } | null>(null);
  const canvasRef = useRef<SlideCanvasHandle | null>(null);

  const hasShownNudgeRef = useRef(false);

  // Undo/redo for AI-generated slide changes (state-based, keyboard only)
  const { pushSnapshot, undo, redo } = useUndoRedo<Slide[]>();

  // Undo/redo availability inside edit mode (driven by iframe bridge histstate events)
  const [editCanUndo, setEditCanUndo] = useState(false);
  const [editCanRedo, setEditCanRedo] = useState(false);

  const handleUndo = useCallback(() => {
    if (isEditMode) {
      canvasRef.current?.undoInEdit();
      return;
    }
    const prev = undo(slidesRef.current);
    if (prev) setSlides(prev);
  }, [undo, setSlides, isEditMode]);

  const handleRedo = useCallback(() => {
    if (isEditMode) {
      canvasRef.current?.redoInEdit();
      return;
    }
    const next = redo(slidesRef.current);
    if (next) setSlides(next);
  }, [redo, setSlides, isEditMode]);

  // Keyboard shortcuts: Cmd+Z / Cmd+Shift+Z — skip when edit mode (SlideCanvas handles it)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isEditMode) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, isEditMode]);

  // Website preflight questions (shown before first send)
  const [pendingQuestions, setPendingQuestions] = useState<PreflightQuestion[] | null>(null);
  const pendingPromptRef = useRef<{ message: string; opts: Parameters<typeof handleSend>[1] } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const initialSentRef = useRef(false);
  // Track whether canvas was ever manually closed — prevents auto-reopen on slide updates
  const canvasManuallyClosedRef = useRef(false);

  // Load existing session on mount — skip if pending prompt exists (brand new session, doesn't exist yet)
  // Also skip if initialSentRef is already true (React Strict Mode re-runs effects after
  // the pending-prompt key was already consumed and cleared by the send effect)
  useEffect(() => {
    if (sessionStorage.getItem(`pending-prompt:${sessionId}`) || initialSentRef.current) {
      setIsLoading(false);
      // Fresh session — no file tree to hydrate from server; WebContainer can boot immediately.
      setSessionBootReady(true);
      return;
    }
    fetch(`/api/chat?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then(({ session }: { session: Session | null }) => {
        if (!session) return;
        setSessionTitle(session.title);
        setSessionType(session.type ?? "slides");
        setSlides(session.slides ?? []);
        setLogoResult(session.logoUrl ? { url: session.logoUrl, source: "logo.dev", colors: [] } : null);
        if (session.theme) setTheme(session.theme as import("@/lib/slide-html").ThemeName);
        if (session.themeColors) setThemeColors(session.themeColors as unknown as import("@/agent/tools/set-theme").ThemeColors);
        setIsPublic(session.isPublic ?? false);
        setIsReplay(session.isReplay ?? false);
        setBrandKitId(session.brandKitId ?? null);

        // Website mode: hydrate files + screenshot + snapshot
        if (session.type === "website") {
          setWebsiteFiles((session.websiteFilesJson as Record<string, string>) ?? {});
          setWebsitePreviewScreenshotUrl(session.previewScreenshotUrl ?? null);
          setWebsiteSnapshotUrl(session.webcontainerSnapshotUrl ?? null);
          setWebsiteTemplateName((session as any).websiteTemplateName ?? null);
          setWebsitePublishedUrl((session as any).websitePublishedUrl ?? null);
          // Fetch env var NAMES (not values)
          fetch(`/api/website-env-vars?sessionId=${sessionId}`)
            .then((r) => r.ok ? r.json() : { names: [] })
            .then((d: { names?: string[] }) => setWebsiteEnvVarNames(d.names ?? []))
            .catch(() => { /* ignore */ });
        }

        // If session has slides OR website files, open canvas immediately
        if ((session.slides ?? []).length > 0 || (session.type === "website" && session.websiteFilesJson)) {
          setCanvasOpen(true);
          setChatExpanded(false);
        }

        const msgs = (session.messages ?? [])
          .filter((m: { role: string; content: unknown }) => {
            if (m.role === "user") {
              if (typeof m.content === "string") return m.content.length > 0;
              if (Array.isArray(m.content)) return m.content.some((b: { type: string }) => b.type !== "tool_result");
              return false;
            }
            if (typeof m.content === "string") return m.content.length > 0;
            if (Array.isArray(m.content)) return m.content.some((b: { type: string; text?: string }) =>
              b.type === "text" && Boolean(b.text)
            );
            return false;
          })
          .map((m: { role: string; content: unknown }, i: number) => {
            const text = typeof m.content === "string"
              ? m.content
              : (m.content as Array<{ type: string; text?: string }>)
                  .filter((b) => b.type === "text")
                  .map((b) => b.text)
                  .join("");
            return {
              id: `loaded_${i}`,
              role: m.role as "user" | "assistant",
              content: text,
              timestamp: 0,
            };
          });

        setChatState(prev => prev.messages.length > 0 ? prev : { messages: msgs, isStreaming: false });
        const fixedHistory = (session.toolHistory ?? []).map(t =>
          t.status === "running" ? { ...t, status: "done" as const } : t
        );
        setToolHistory(fixedHistory);
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
        // Whether fetch succeeded, returned null (fresh session), or errored — we've now
        // done our best to hydrate file state. Safe to let the WebContainer boot.
        setSessionBootReady(true);
      });
  }, [sessionId]);

  // Auto-open canvas on first slide (or first building preview) — unless user manually closed it
  // For website sessions: open as soon as the session type is known, so the WebContainer hook
  // mounts and boot starts in parallel with the model thinking. Otherwise tool calls arrive
  // before the hook exists and everything gets silently dropped.
  useEffect(() => {
    const shouldOpen =
      slides.length > 0 ||
      buildingSlide ||
      sessionType === "website";
    if (shouldOpen && !canvasOpen && !canvasManuallyClosedRef.current) {
      setCanvasOpen(true);
      setChatExpanded(false);
    }
  }, [slides.length, buildingSlide, canvasOpen, sessionType]);

  // Drift reconciliation — handles SSE drops from backgrounded tabs, network blips,
  // and mobile Safari memory kills. Works as a backup channel alongside the primary
  // SSE stream. When the tab is visible AND we think the server is still streaming,
  // poll the session every 5s and merge any slides the server has that we don't.
  // Cheap: per-iteration saveSession keeps Redis fresh, so a GET is a ~5ms cache hit.
  // Browsers throttle setInterval when the tab is hidden, so backgrounded tabs cost
  // nothing extra here.
  useEffect(() => {
    if (!chatState.isStreaming || !sessionId) return;

    const reconcile = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/chat?sessionId=${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        const serverSlides = data?.session?.slides;
        if (Array.isArray(serverSlides) && serverSlides.length > slidesRef.current.length) {
          setSlides(serverSlides);
        }
      } catch {
        // Silent — SSE is the primary channel. Polling is a best-effort backup.
      }
    };

    const intervalId = setInterval(reconcile, 5000);
    return () => clearInterval(intervalId);
  }, [chatState.isStreaming, sessionId, setSlides]);

  // Fire initial message from sessionStorage (set by home page before navigating)
  useEffect(() => {
    const key = `pending-prompt:${sessionId}`;
    const deepKey = `pending-deep-research:${sessionId}`;
    const docsKey = `pending-docs-mode:${sessionId}`;
    const sheetsKey = `pending-sheets-mode:${sessionId}`;
    const websiteKey = `pending-website-mode:${sessionId}`;
    const attsKey = `pending-attachments:${sessionId}`;
    const templateKey = `pending-template-slug:${sessionId}`;
    const brandKey = `pending-brand-kit:${sessionId}`;
    const q = sessionStorage.getItem(key);
    if (!q || initialSentRef.current) return;
    initialSentRef.current = true;
    const isDeep = sessionStorage.getItem(deepKey) === "true";
    const isDocs = sessionStorage.getItem(docsKey) === "true";
    const isSheets = sessionStorage.getItem(sheetsKey) === "true";
    const isWebsite = sessionStorage.getItem(websiteKey) === "true";
    const attsRaw = sessionStorage.getItem(attsKey);
    const pendingAtts: import("@/components/shared/InputToolbar").PendingAttachment[] = attsRaw ? JSON.parse(attsRaw) : [];
    const templateSlug = sessionStorage.getItem(templateKey) ?? undefined;
    const pendingBrandKitId = sessionStorage.getItem(brandKey);
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(deepKey);
    sessionStorage.removeItem(docsKey);
    sessionStorage.removeItem(sheetsKey);
    sessionStorage.removeItem(websiteKey);
    sessionStorage.removeItem(attsKey);
    sessionStorage.removeItem(templateKey);
    sessionStorage.removeItem(brandKey);

    // If the home picker chose a non-default kit, pin it to the session via
    // PATCH before the first message goes out. This way the very first chat
    // turn already runs under the chosen kit (auto-stamp logic on the chat
    // route would otherwise pick the user's default).
    if (pendingBrandKitId) {
      void fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandKitId: pendingBrandKitId }),
      }).catch(() => { /* non-fatal — falls back to default */ });
    }
    const opts: { deepResearch?: boolean; docsMode?: boolean; sheetsMode?: boolean; websiteMode?: boolean; attachments?: import("@/components/shared/InputToolbar").PendingAttachment[]; templateSlug?: string } = {};
    if (isDeep) opts.deepResearch = true;
    if (isDocs) { opts.docsMode = true; setSessionType("docs"); setSessionTitle("Untitled Document"); }
    if (isSheets) { opts.sheetsMode = true; setSessionType("sheets"); setSessionTitle("Untitled Spreadsheet"); }
    if (isWebsite) { opts.websiteMode = true; setSessionType("website"); setSessionTitle("Untitled Website"); }
    if (pendingAtts.length) opts.attachments = pendingAtts;
    if (templateSlug) opts.templateSlug = templateSlug;

    // For fresh website sessions, run preflight to show clarifying questions
    if (isWebsite) {
      const finalOpts = Object.keys(opts).length ? opts : undefined;
      pendingPromptRef.current = { message: q, opts: finalOpts };
      fetch("/api/website-preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      })
        .then((r) => r.json())
        .then((data: { questions?: PreflightQuestion[] }) => {
          const qs = data.questions ?? [];
          if (qs.length > 0) {
            setPendingQuestions(qs);
          } else {
            // No questions — send immediately
            const p = pendingPromptRef.current;
            pendingPromptRef.current = null;
            if (p) handleSend(p.message, p.opts);
          }
        })
        .catch(() => {
          // Preflight failed — proceed without questions
          const p = pendingPromptRef.current;
          pendingPromptRef.current = null;
          if (p) handleSend(p.message, p.opts);
        });
      return;
    }

    handleSend(q, Object.keys(opts).length ? opts : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleSend = useCallback(
    async (message: string, options?: { deepResearch?: boolean; docsMode?: boolean; sheetsMode?: boolean; websiteMode?: boolean; discussMode?: boolean; attachments?: import("@/components/shared/InputToolbar").PendingAttachment[]; templateSlug?: string }) => {
      if (chatState.isStreaming) return;

      // Snapshot current website files as the diff baseline for this turn
      if (sessionType === "website") {
        // Read current files synchronously via the ref pattern isn't available here,
        // so we update via setState callback to capture latest value
        setWebsiteFiles((prev) => {
          fileOriginalsRef.current = { ...prev };
          setFileOriginals({ ...prev });
          return prev;
        });
      }

      const readyAttachments = (options?.attachments ?? []).filter((a) => a.status === "ready" && a.storagePath);

      setChatState((prev) => ({
        ...prev,
        isStreaming: true,
        messages: [
          ...prev.messages,
          {
            id: crypto.randomUUID(),
            role: "user",
            content: message,
            timestamp: Date.now(),
            attachments: readyAttachments.length
              ? readyAttachments.map(({ id, name, mimeType, sizeBytes }) => ({ id, name, mimeType, sizeBytes }))
              : undefined,
          },
        ],
      }));

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      // Local accumulator for website files — tracks changes within this turn
      // without relying on React state (which lags in the SSE event loop).
      let turnFiles: Record<string, string> = { ...websiteFilesRef.current };

      try {
        // Convert PendingAttachment → SessionAttachment shape (metadata only, no content)
        const attachmentsForApi = readyAttachments.map(({ id, name, mimeType, sizeBytes, storagePath, contentType }) => ({
          id, name, mimeType, sizeBytes,
          storagePath: storagePath!,
          contentType: contentType!,
          addedAt: Date.now(),
        }));
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, sessionId, deepResearch: options?.deepResearch ?? false, docsMode: options?.docsMode ?? false, sheetsMode: options?.sheetsMode ?? false, websiteMode: options?.websiteMode ?? false, discussMode: options?.discussMode ?? false, attachments: attachmentsForApi.length ? attachmentsForApi : undefined, templateSlug: options?.templateSlug }),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "session_id") continue;

              if (event.type === "tool_call") {
                setToolHistory(prev => [...prev, {
                  id: event.toolUseId,
                  toolName: event.toolName,
                  status: "running" as const,
                  timestamp: Date.now(),
                }]);
              } else if (event.type === "tool_input_ready") {
                setToolHistory(prev => prev.map(t =>
                  t.id === event.toolUseId ? { ...t, input: event.input as Record<string, unknown> } : t
                ));
              } else if (event.type === "tool_result") {
                const resultStr = typeof event.result === "string"
                  ? event.result
                  : JSON.stringify(event.result);
                setToolHistory(prev => prev.map(t =>
                  t.id === event.toolUseId
                    ? { ...t, status: event.isError ? "error" as const : "done" as const, result: resultStr }
                    : t
                ));
              }

              if (event.type === "slide_building") {
                setBuildingSlide({
                  toolUseId: event.toolUseId,
                  title: event.title,
                  partialContent: event.partialContent,
                });
              } else if (event.type === "slide_created") {
                setBuildingSlide(null);
                pushSnapshot(slidesRef.current);
                setSlides((prev) => {
                  if (prev.find((s) => s.id === event.slide.id)) return prev;
                  return [...prev, event.slide].sort((a, b) => a.index - b.index);
                });

              } else if (event.type === "slide_updated") {
                pushSnapshot(slidesRef.current);
                setSlides((prev) => prev.map((s) => s.id === event.slideId ? { ...s, ...event.changes } : s));

              } else if (event.type === "slide_deleted") {
                pushSnapshot(slidesRef.current);
                setSlides((prev) => prev.filter((s) => s.id !== event.slideId));

              } else if (event.type === "slides_reordered") {
                pushSnapshot(slidesRef.current);
                setSlides((prev) => {
                  const byId = new Map(prev.map((s) => [s.id, s]));
                  return (event.order as string[]).map((id, i) => {
                    const s = byId.get(id);
                    return s ? { ...s, index: i } : null;
                  }).filter((s): s is Slide => s !== null);
                });

              } else if (event.type === "theme_changed") {
                setTheme(event.theme as ThemeName);
                if (event.colors) {
                  setThemeColors(event.colors as ThemeColors);
                } else {
                  setThemeColors(undefined);
                }
              } else if (event.type === "logo_fetched") {
                setLogoResult({ url: event.logoUrl, source: "logo.dev", colors: event.colors ?? [], name: event.name });
              } else if (event.type === "title_updated") {
                setSessionTitle(event.title);
              } else if (event.type === "website_file_created" || event.type === "website_file_updated") {
                // Track in local accumulator for turn snapshot
                turnFiles = { ...turnFiles, [event.path]: event.content };
                // Capture version snapshot before overwriting
                if (event.type === "website_file_updated") {
                  setWebsiteFiles((prev) => {
                    const oldContent = prev[event.path];
                    if (oldContent !== undefined && oldContent !== event.content) {
                      setFileVersions((vPrev) => {
                        const existing = vPrev[event.path] ?? [];
                        const updated = [...existing, { timestamp: Date.now(), content: oldContent }].slice(-10);
                        return { ...vPrev, [event.path]: updated };
                      });
                    }
                    return { ...prev, [event.path]: event.content };
                  });
                } else {
                  setWebsiteFiles((prev) => ({ ...prev, [event.path]: event.content }));
                }
                // Lock the file while streaming
                setLockedFiles((prev) => { const n = new Set(prev); n.add(event.path); return n; });
                websiteCanvasRef.current?.applyFileEvent(event);
              } else if (event.type === "website_file_deleted") {
                // Track in local accumulator for turn snapshot
                const { [event.path]: _rm, ...rest } = turnFiles; turnFiles = rest;
                setWebsiteFiles((prev) => {
                  const next = { ...prev };
                  delete next[event.path];
                  return next;
                });
                websiteCanvasRef.current?.applyFileEvent(event);
              } else if (event.type === "website_shell_command") {
                websiteCanvasRef.current?.runCommand(event.cmd, event.args, event.toolUseId, event.sync);
              } else if (event.type === "website_sandbox_state") {
                setSandboxState(event.state);
              } else if (event.type === "website_preview_ready") {
                setPreviewUrl(event.url);
              } else if (event.type === "website_build_error") {
                setBuildError(event.message);
              } else if (event.type === "website_template_set") {
                setWebsiteTemplateName(event.templateName);
              } else if (event.type === "done" && event.sessionMessageCount !== undefined) {
                // Store snapshot data — consumed by useEffect once isStreaming flips false
                pendingSnapshotRef.current = { sessionMessageCount: event.sessionMessageCount, websiteFiles: { ...turnFiles } };
              }

              setChatState((prev) => applyAgentEvent(prev, event));
            } catch {
              // Malformed JSON line
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setChatState((prev) => applyAgentEvent(prev, { type: "error", message: String(err) }));
        }
      } finally {
        // Unlock all files now that streaming is done
        setLockedFiles(new Set());
        // Defensive cleanup: mark any still-running tool cards as done
        setToolHistory(prev => prev.map(t =>
          t.status === "running" ? { ...t, status: "done" as const } : t
        ));
      }
    },
    [sessionId, chatState.isStreaming]
  );

  const handleRewind = useCallback(async (snapshotIndex: number) => {
    const snap = turnSnapshots[snapshotIndex];
    if (!snap) return;
    // Trim UI messages
    setChatState((prev) => ({ ...prev, messages: prev.messages.slice(0, snap.chatMessageCount) }));
    // Trim server-side session messages
    await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sessionId, truncateMessagesTo: snap.sessionMessageCount }),
    }).catch(() => {});
    // Restore website files
    if (sessionType === "website") {
      setWebsiteFiles(snap.websiteFiles);
      websiteCanvasRef.current?.restoreFiles(snap.websiteFiles);
    }
    // Trim snapshots to this point
    setTurnSnapshots((prev) => prev.slice(0, snapshotIndex));
  }, [sessionId, sessionType, turnSnapshots]);

  const handleFork = useCallback(async (snapshotIndex: number) => {
    const snap = turnSnapshots[snapshotIndex];
    if (!snap) return;
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        forkFromSessionId: sessionId,
        forkMessageCount: snap.sessionMessageCount,
        forkWebsiteFiles: snap.websiteFiles,
        title: sessionTitle + " (fork)",
      }),
    }).catch(() => null);
    if (!res?.ok) return;
    const { id: newId } = await res.json().catch(() => ({}));
    if (newId) window.location.assign(`/editor/${newId}`);
  }, [sessionId, sessionTitle, turnSnapshots]);

  const handleQuestionSubmit = useCallback((answers: Record<string, string>) => {
    const p = pendingPromptRef.current;
    pendingPromptRef.current = null;
    setPendingQuestions(null);
    if (!p) return;

    // Build human-readable preferences string and append to message
    const lines = Object.entries(answers).map(([, v]) => `- ${v}`);
    const enrichedMessage = lines.length > 0
      ? `${p.message}\n\n[Design preferences]\n${lines.join("\n")}`
      : p.message;

    handleSend(enrichedMessage, p.opts);
  }, [handleSend]);

  const handleQuestionSkip = useCallback(() => {
    const p = pendingPromptRef.current;
    pendingPromptRef.current = null;
    setPendingQuestions(null);
    if (p) handleSend(p.message, p.opts);
  }, [handleSend]);

  const handleRegenerateSlide = useCallback(async (slide: import("@/lib/redis").Slide, reasonCode: string, freeText?: string) => {
    // OSS build: feedback telemetry stripped. Just regenerate the slide.

    // Build a descriptive prompt for the agent
    const reasonLabels: Record<string, string> = {
      overflow: "the content was overflowing",
      too_basic: "the design was too basic",
      too_much_text: "there was too much text",
      wrong_content: "it didn't match my request",
      poor_layout: "the layout was poor",
      needs_visuals: "it needed more visuals",
      other: freeText || "it wasn't quite right",
    };
    const reason = reasonLabels[reasonCode] ?? reasonCode;
    const prompt = freeText && reasonCode === "other"
      ? `Please regenerate slide ${slide.index + 1} ("${slide.title}"). Issue: ${freeText}`
      : `Please regenerate slide ${slide.index + 1} ("${slide.title}") — ${reason}. Make it significantly better.`;

    handleSend(prompt);
  }, [sessionId, theme, handleSend]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setChatState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  const handleCloseCanvas = useCallback(() => {
    canvasManuallyClosedRef.current = true;
    setIsEditMode(false);
    setEditCanUndo(false);
    setEditCanRedo(false);
    setCanvasOpen(false);
  }, []);

  const handleOpenCanvas = useCallback(() => {
    canvasManuallyClosedRef.current = false;
    setChatExpanded(false);
    setCanvasOpen(true);
  }, []);

  const handleEdit = useCallback(() => {
    if (slidesRef.current.length > 0) {
      pushSnapshot(slidesRef.current);
      setIsEditMode(true);
    }
  }, [pushSnapshot]);

  const handleSaveEdit = useCallback(() => {
    canvasRef.current?.saveAll();
  }, []);

  const handleSlidesEdited = useCallback((updates: Array<{ id: string; content: string }>) => {
    if (updates.length === 0) {
      setIsEditMode(false);
      return;
    }
    setSlides(prev => prev.map(s => {
      const u = updates.find(u => u.id === s.id);
      return u ? { ...s, content: u.content } : s;
    }));
    setIsEditMode(false);
    // Persist each updated slide
    for (const { id, content } of updates) {
      fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideId: id, content }),
      }).catch(console.error);
    }
  }, [sessionId, setSlides]);

  const isMobile = useIsMobile();

  // Mobile layout
  if (isMobile) {
    return (
      <>
        <MobileEditorShell
          sessionTitle={sessionTitle}
          sessionType={sessionType}
          slides={slides}
          theme={theme}
          themeColors={themeColors}
          logoResult={logoResult}
          chatState={chatState}
          toolHistory={toolHistory}
          canvasRef={canvasRef}
          viewMode={viewMode}
          isEditMode={isEditMode}
          buildingSlide={buildingSlide}
          canUndo={isEditMode ? editCanUndo : false}
          canRedo={isEditMode ? editCanRedo : false}
          attachedSlideText={attachedSlideText}
          onViewModeChange={setViewMode}
          onSend={handleSend}
          onStop={handleStop}
          onEdit={handleEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setIsEditMode(false)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onBack={() => router.push("/")}
          onPresent={() => setIsPresentMode(true)}
          onOpenCanvas={handleOpenCanvas}
          onActiveSlideChange={setActiveSlideId}
          onSlidesEdited={handleSlidesEdited}
          onAddToChat={(text) => setAttachedSlideText(text)}
          onSetAttachedSlideText={setAttachedSlideText}
          sessionId={sessionId}
          websiteFiles={websiteFiles}
          websitePreviewScreenshotUrl={websitePreviewScreenshotUrl}
          websiteEnvVarNames={websiteEnvVarNames}
        />
        <AnimatePresence>
          {isPresentMode && slides.length > 0 && (
            <PresentationView
              slides={slides}
              theme={theme}
              logoResult={logoResult}
              themeColors={themeColors}
              onClose={() => setIsPresentMode(false)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop layout
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--app-bg)" }}>
      <div className="flex-1 flex flex-col overflow-hidden">

        <EditorTopBar
          title={sessionTitle}
          sessionType={sessionType}
          isStreaming={chatState.isStreaming}
          onBack={() => router.push("/")}
          sessionId={sessionId}
          isPublic={isPublic}
          isReplay={isReplay}
          onShareChange={(pub, rep) => { setIsPublic(pub); setIsReplay(rep); }}
          brandKitId={brandKitId}
          onBrandKitChange={(next) => {
            const prev = brandKitId;
            setBrandKitId(next);
            void fetch(`/api/sessions/${sessionId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ brandKitId: next }),
            }).then((r) => {
              if (!r.ok) {
                // Revert on failure
                setBrandKitId(prev);
              }
            }).catch(() => setBrandKitId(prev));
          }}
          onRestyleWithKit={() => {
            // Prefill the chat with a canned regenerate prompt. The user
            // confirms by hitting send, which uses the brand kit currently
            // pinned to this session — so they can swap kits first if they
            // want a different style.
            setInputPrefill({
              text: "Re-render every slide using the current brand kit's design system and layout patterns. Update each slide in place: preserve the content but refresh the styling, structure, colors, and typography to match the kit. Use set_theme({ theme: 'from_brand_kit' }) before rebuilding.",
              nonce: Date.now(),
            });
          }}
        />

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex-1 flex overflow-hidden">
            {/* Chat skeleton */}
            <div className="flex flex-col h-full flex-shrink-0" style={{ width: "40%", paddingLeft: 20, paddingTop: 16 }}>
              <div className="flex-1 flex flex-col gap-4 px-4 pt-2">
                {[80, 55, 90, 65].map((w, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: i % 2 === 0 ? "row" : "row-reverse", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 999, background: "var(--border-hover)", flexShrink: 0 }} />
                    <div style={{ width: `${w}%`, height: 52, borderRadius: "var(--r-lg)", background: "var(--border)", opacity: 0.5 }} />
                  </div>
                ))}
              </div>
              <div style={{ padding: "8px 16px 16px" }}>
                <div style={{ height: 52, borderRadius: "var(--r-xl)", background: "var(--border)", opacity: 0.4 }} />
              </div>
            </div>
            {/* Canvas skeleton */}
            <div
              className="rounded-[var(--r-xl)] flex flex-col m-2"
              style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", overflow: "hidden" }}
            >
              <div style={{ height: 64, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
                <div style={{ width: 72, height: 28, borderRadius: "var(--r-md)", background: "var(--border)", opacity: 0.5 }} />
                <div style={{ flex: 1 }} />
                {[40, 40, 40, 60, 32].map((w, i) => (
                  <div key={i} style={{ width: w, height: 28, borderRadius: "var(--r-md)", background: "var(--border)", opacity: 0.4 }} />
                ))}
              </div>
              <div style={{ flex: 1, background: "var(--bg2)", display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: 180, borderRadius: "var(--r-lg)", background: "var(--border)", opacity: 0.3 }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content row */}
        {!isLoading && (
        <div
          className="flex-1 flex overflow-hidden"
          style={{ justifyContent: chatExpanded ? "center" : "flex-start" }}
        >
          {/* Chat panel — chatExpanded only flips after canvas fully exits, so width+centering animate together */}
          <motion.div
            layout
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            className="flex flex-col h-full overflow-hidden flex-shrink-0"
            style={{ width: chatExpanded ? "min(800px, 100%)" : "40%", paddingLeft: 20 }}
          >
            <div className="flex-1 relative overflow-hidden w-full">
              <ChatPanel
                messages={chatState.messages}
                toolHistory={toolHistory}
                isStreaming={chatState.isStreaming}
                compact={!chatExpanded}
                sessionType={sessionType}
                onQuickAction={(msg, isBuild) => handleSend(msg, { websiteMode: true, discussMode: !isBuild })}
                onFileOpen={(path) => { setViewMode("code"); websiteCanvasRef.current?.selectFile(path); }}
                turnSnapshots={turnSnapshots}
                onRewindToTurn={handleRewind}
                onForkFromTurn={handleFork}
              />
            </div>

            {/* Slides widget — shown when slides exist but canvas is closed */}
            <AnimatePresence>
              {slides.length > 0 && !canvasOpen && (
                <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 8 }}>
                  <SlidesWidget
                    title={sessionTitle}
                    slideCount={slides.length}
                    onOpen={handleOpenCanvas}
                  />
                </div>
              )}
            </AnimatePresence>

            <div className="w-full pb-4 px-4 pt-2 flex-shrink-0">
              {/* Preflight question card — replaces input area for fresh website sessions */}
              <AnimatePresence mode="wait">
                {pendingQuestions ? (
                  <AgentQuestionCard
                    key="questions"
                    questions={pendingQuestions}
                    onSubmit={handleQuestionSubmit}
                    onSkip={handleQuestionSkip}
                  />
                ) : (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Attached slide text chip */}
                    <AnimatePresence>
                      {attachedSlideText && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                          animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 12px",
                              background: "var(--bg2)",
                              borderRadius: 10,
                              border: "1px solid var(--border)",
                            }}
                          >
                            <span style={{ fontSize: 14, color: "var(--text3)" }}>✎</span>
                            <span
                              style={{
                                flex: 1,
                                fontSize: 12.5,
                                color: "var(--text)",
                                fontWeight: 500,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                letterSpacing: "-0.01em",
                              }}
                            >
                              {attachedSlideText.length > 80 ? attachedSlideText.slice(0, 80) + "…" : attachedSlideText}
                            </span>
                            <button
                              onClick={() => setAttachedSlideText(null)}
                              style={{
                                width: 20, height: 20, borderRadius: "50%",
                                background: "rgba(0,0,0,0.06)", border: "none",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", color: "var(--text3)", fontSize: 11, flexShrink: 0,
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Attached slide chip */}
                    <AnimatePresence>
                      {attachedSlide && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                          animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 10px 6px 8px",
                              background: "var(--accent-soft)",
                              borderRadius: 10,
                              border: "1px solid var(--accent)",
                            }}
                          >
                            <div style={{
                              width: 22, height: 22, borderRadius: 6,
                              background: "var(--accent)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                            }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                                {attachedSlide.index + 1}
                              </span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>
                              <span style={{
                                fontSize: 12, fontWeight: 600,
                                color: "var(--accent-text)",
                                letterSpacing: "-0.01em",
                                lineHeight: 1.2,
                              }}>
                                Selected slide
                              </span>
                              <span style={{
                                fontSize: 11, color: "var(--text3)",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                maxWidth: 180, lineHeight: 1.2,
                              }}>
                                {attachedSlide.title}
                              </span>
                            </div>
                            <button
                              onClick={() => setAttachedSlide(null)}
                              style={{
                                width: 18, height: 18, borderRadius: "50%",
                                background: "rgba(0,0,0,0.08)", border: "none",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", color: "var(--text3)", fontSize: 10, flexShrink: 0,
                                marginLeft: 2,
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <InputToolbar
                      onSend={(msg, opts) => {
                        if (attachedSlide) {
                          handleSend(`[Regarding Slide ${attachedSlide.index + 1}: "${attachedSlide.title}"]\n\n${msg}`, opts);
                          setAttachedSlide(null);
                        } else if (attachedSlideText) {
                          handleSend(`Edit this text on my slide: "${attachedSlideText}"\n\n${msg}`, opts);
                          setAttachedSlideText(null);
                        } else {
                          handleSend(msg, opts);
                        }
                      }}
                      isStreaming={chatState.isStreaming}
                      onStop={handleStop}
                      placeholder={attachedSlide ? `What do you want to change on slide ${attachedSlide.index + 1}?` : attachedSlideText ? "What do you want to change?" : "Ask for changes…"}
                      sessionType={sessionType}
                      sessionId={sessionId}
                      prefill={inputPrefill}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Slide canvas — animates in/out */}
          <AnimatePresence onExitComplete={() => setChatExpanded(true)}>
            {canvasOpen && (
              <motion.div
                key="canvas"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto", flex: 1 }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                /* For sheets: no overflow:hidden so Univer's absolutely-positioned
                   cell edit overlay isn't clipped when it extends slightly past the
                   cell bounds. Slides/docs still get the rounded-clip treatment. */
                className={`rounded-[var(--r-xl)] flex flex-col relative mx-2 mb-4 ${sessionType === "sheets" ? "" : "overflow-hidden"}`}
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
                  minWidth: 0,
                }}
              >
                {sessionType === "sheets" ? (
                  <SheetsToolbar
                    onClose={handleCloseCanvas}
                    sessionId={sessionId}
                  />
                ) : sessionType === "website" ? (
                  <WebsiteToolbar
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onClose={handleCloseCanvas}
                    onReboot={() => websiteCanvasRef.current?.reboot()}
                    sessionId={sessionId}
                    sessionTitle={sessionTitle}
                    files={websiteFiles}
                    previewUrl={previewUrl}
                    publishedUrl={websitePublishedUrl}
                    onPublished={(url) => setWebsitePublishedUrl(url)}
                    onNeedsConnect={() => {
                      handleSend("Connect my GitHub account", { websiteMode: true });
                    }}
                    onImported={(importedFiles) => {
                      setWebsiteFiles((prev) => ({ ...prev, ...importedFiles }));
                      Object.entries(importedFiles).forEach(([path, content]) => {
                        websiteCanvasRef.current?.applyFileEvent({ type: "website_file_created", path, content });
                      });
                    }}
                    deviceWidth={websiteDeviceWidth}
                    onDeviceWidthChange={setWebsiteDeviceWidth}
                    fileOriginals={fileOriginals}
                  />
                ) : sessionType === "docs" ? (
                  <DocsToolbar
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onClose={isEditMode ? undefined : handleCloseCanvas}
                    onEdit={handleEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setIsEditMode(false)}
                    isEditMode={isEditMode}
                    sessionId={sessionId}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={isEditMode ? editCanUndo : false}
                    canRedo={isEditMode ? editCanRedo : false}
                  />
                ) : (
                  <CanvasToolbar
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onClose={isEditMode ? undefined : handleCloseCanvas}
                    onEdit={handleEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setIsEditMode(false)}
                    isEditMode={isEditMode}
                    sessionId={sessionId}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={isEditMode ? editCanUndo : false}
                    canRedo={isEditMode ? editCanRedo : false}
                    onPresent={() => setIsPresentMode(true)}
                    slidesCount={slides.length}
                  />
                )}
                <div className={`flex-1 relative ${sessionType === "sheets" || sessionType === "website" ? "" : "overflow-hidden"}`} style={{ background: sessionType === "sheets" ? "var(--sheet-canvas-bg, #FBF8F3)" : "var(--bg2)" }}>
                  {sessionType === "website" ? (
                    <WebsiteCanvas
                      ref={websiteCanvasRef as unknown as React.Ref<WebsiteCanvasHandle>}
                      sessionId={sessionId}
                      files={websiteFiles}
                      previewScreenshotUrl={websitePreviewScreenshotUrl}
                      snapshotUrl={websiteSnapshotUrl}
                      envVarsDecrypted={{}}
                      envVarNames={websiteEnvVarNames}
                      viewMode={viewMode === "code" ? "code" : "preview"}
                      onEnvVarsUpdated={setWebsiteEnvVarNames}
                      bootEnabled={sessionBootReady}
                      templateName={websiteTemplateName}
                      publishedUrl={websitePublishedUrl}
                      selectedFilePath={websiteSelectedFile}
                      onSelectedFileChange={setWebsiteSelectedFile}
                      deviceWidth={websiteDeviceWidth}
                      lockedFiles={lockedFiles}
                      fileVersions={fileVersions}
                      fileOriginals={fileOriginals}
                      onRestoreVersion={(path, content) => {
                        setWebsiteFiles((prev) => ({ ...prev, [path]: content }));
                      }}
                      onElementClicked={(payload) => {
                        // Translate element info into a ready-to-send prompt.
                        // Keep the text short so it doesn't dominate; user
                        // types the actual change they want after the em dash.
                        const shortText = (payload.text || "").slice(0, 60);
                        const subject = shortText
                          ? `the ${payload.tag} "${shortText}"`
                          : `this ${payload.tag}`;
                        const seed = `Change ${subject} — `;
                        setInputPrefill({ text: seed, nonce: Date.now() });
                      }}
                      onAskAIToFix={(msg) => setInputPrefill({ text: msg, nonce: Date.now() })}
                    />
                  ) : sessionType === "sheets" ? (
                    <SheetCanvas
                      slides={slides}
                      activeSheetId={activeSlideId ?? undefined}
                      onActiveSheetChange={setActiveSlideId}
                      onSheetsEdited={(slideId, workbookJson) => {
                        setSlides((prev) => prev.map((s) => s.id === slideId ? { ...s, workbookJson } : s));
                        // Persist to server so edits survive Redis cache expiry / reload
                        fetch(`/api/sessions/${sessionId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ slideId, workbookJson }),
                        }).catch((err) => console.warn("[editor] sheet save failed:", err));
                      }}
                    />
                  ) : viewMode === "slide" ? (
                    <SlideCanvas
                      ref={canvasRef}
                      slides={slides}
                      theme={theme}
                      logoResult={logoResult}
                      themeColors={themeColors}
                      sessionType={sessionType}
                      isEditMode={isEditMode}
                      onActiveSlideChange={setActiveSlideId}
                      onSlidesEdited={handleSlidesEdited}
                      onAddToChat={(text) => setAttachedSlideText(text)}
                      onAttachSlide={(s) => { setAttachedSlide({ id: s.id, index: s.index, title: s.title || `Slide ${s.index + 1}` }); setAttachedSlideText(null); }}
                      buildingSlide={buildingSlide}
                      onEditHistChange={(u, r) => { setEditCanUndo(u); setEditCanRedo(r); }}
                      onRegenerate={handleRegenerateSlide}
                    />
                  ) : (
                    <CodeView slides={slides} sessionType={sessionType} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}
      </div>

      {/* Fullscreen presentation overlay */}
      <AnimatePresence>
        {isPresentMode && slides.length > 0 && (
          <PresentationView
            slides={slides}
            theme={theme}
            logoResult={logoResult}
            themeColors={themeColors}
            onClose={() => setIsPresentMode(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
