"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatPanel, applyAgentEvent, type ChatState } from "@/components/editor/ChatPanel";
import type { ToolCallEntry } from "@/lib/types";
import { SlideCanvas, CodeView, type SlideCanvasHandle } from "@/components/editor/SlideCanvas";
import { EditorTopBar } from "@/components/editor/EditorTopBar";
import { CanvasToolbar, type ViewMode } from "@/components/editor/CanvasToolbar";
import { PresentationView } from "@/components/editor/PresentationView";
import { SlidesWidget } from "@/components/editor/SlidesWidget";
import { InputToolbar } from "@/components/shared/InputToolbar";
import { SessionFeedbackModal, FeedbackButton, PostGenNudge } from "@/components/editor/SessionFeedbackModal";
import type { Session, Slide } from "@/lib/redis";
import type { ThemeName, ThemeColors } from "@/agent/tools/set-theme";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MobileEditorShell } from "@/components/editor/mobile/MobileEditorShell";

export default function EditorPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [sessionTitle, setSessionTitle] = useState("Untitled Presentation");
  const [sessionType, setSessionType] = useState<"slides" | "docs">("slides");
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
  const [buildingSlide, setBuildingSlide] = useState<{
    toolUseId: string;
    title?: string;
    partialContent: string;
  } | null>(null);

  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isStreaming: false,
  });
  const [toolHistory, setToolHistory] = useState<ToolCallEntry[]>([]);

  // Canvas state
  const [canvasOpen, setCanvasOpen] = useState(false);
  // chatExpanded lags behind canvasOpen — only flips to true after canvas fully exits
  const [chatExpanded, setChatExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("slide");
  const [isPresentMode, setIsPresentMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setActiveSlideId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [attachedSlideText, setAttachedSlideText] = useState<string | null>(null);
  const [attachedSlide, setAttachedSlide] = useState<{ id: string; index: number; title: string } | null>(null);
  const canvasRef = useRef<SlideCanvasHandle | null>(null);

  // Feedback state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const nudgeDismissedRef = useRef(false);
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

        // If session has slides, open canvas immediately
        if ((session.slides ?? []).length > 0) {
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
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  // Auto-open canvas on first slide (or first building preview) — unless user manually closed it
  useEffect(() => {
    if ((slides.length > 0 || buildingSlide) && !canvasOpen && !canvasManuallyClosedRef.current) {
      setCanvasOpen(true);
      setChatExpanded(false);
    }
  }, [slides.length, buildingSlide, canvasOpen]);

  // Fire initial message from sessionStorage (set by home page before navigating)
  useEffect(() => {
    const key = `pending-prompt:${sessionId}`;
    const deepKey = `pending-deep-research:${sessionId}`;
    const docsKey = `pending-docs-mode:${sessionId}`;
    const attsKey = `pending-attachments:${sessionId}`;
    const templateKey = `pending-template-slug:${sessionId}`;
    const q = sessionStorage.getItem(key);
    if (!q || initialSentRef.current) return;
    initialSentRef.current = true;
    const isDeep = sessionStorage.getItem(deepKey) === "true";
    const isDocs = sessionStorage.getItem(docsKey) === "true";
    const attsRaw = sessionStorage.getItem(attsKey);
    const pendingAtts: import("@/components/shared/InputToolbar").PendingAttachment[] = attsRaw ? JSON.parse(attsRaw) : [];
    const templateSlug = sessionStorage.getItem(templateKey) ?? undefined;
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(deepKey);
    sessionStorage.removeItem(docsKey);
    sessionStorage.removeItem(attsKey);
    sessionStorage.removeItem(templateKey);
    const opts: { deepResearch?: boolean; docsMode?: boolean; attachments?: import("@/components/shared/InputToolbar").PendingAttachment[]; templateSlug?: string } = {};
    if (isDeep) opts.deepResearch = true;
    if (isDocs) { opts.docsMode = true; setSessionType("docs"); setSessionTitle("Untitled Document"); }
    if (pendingAtts.length) opts.attachments = pendingAtts;
    if (templateSlug) opts.templateSlug = templateSlug;
    handleSend(q, Object.keys(opts).length ? opts : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleSend = useCallback(
    async (message: string, options?: { deepResearch?: boolean; docsMode?: boolean; attachments?: import("@/components/shared/InputToolbar").PendingAttachment[]; templateSlug?: string }) => {
      if (chatState.isStreaming) return;

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
          body: JSON.stringify({ message, sessionId, deepResearch: options?.deepResearch ?? false, docsMode: options?.docsMode ?? false, attachments: attachmentsForApi.length ? attachmentsForApi : undefined, templateSlug: options?.templateSlug }),
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
        // Defensive cleanup: mark any still-running tool cards as done
        setToolHistory(prev => prev.map(t =>
          t.status === "running" ? { ...t, status: "done" as const } : t
        ));
        // Show nudge after first successful generation (with slides)
        if (!hasShownNudgeRef.current && !nudgeDismissedRef.current && slidesRef.current.length > 0) {
          hasShownNudgeRef.current = true;
          setTimeout(() => {
            if (!nudgeDismissedRef.current) setNudgeVisible(true);
          }, 1200);
        }
      }
    },
    [sessionId, chatState.isStreaming]
  );

  const handleRegenerateSlide = useCallback(async (slide: import("@/lib/redis").Slide, reasonCode: string, freeText?: string) => {
    // Fire-and-forget feedback save
    fetch("/api/feedback/slide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        slideId: slide.id,
        slideIndex: slide.index,
        slideTitle: slide.title,
        reasonCode,
        freeText: freeText ?? null,
        contentSnapshot: slide.content,
        theme,
      }),
    }).catch(() => {});

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
          onPresent={() => setIsPresentMode(true)}
          slidesCount={slides.length}
          sessionId={sessionId}
          isPublic={isPublic}
          isReplay={isReplay}
          onShareChange={(pub, rep) => { setIsPublic(pub); setIsReplay(rep); }}
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
              {/* Post-generation nudge */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: nudgeVisible ? 8 : 0 }}>
                <PostGenNudge
                  visible={nudgeVisible}
                  onOpen={() => { setNudgeVisible(false); setFeedbackModalOpen(true); }}
                  onDismiss={() => { nudgeDismissedRef.current = true; setNudgeVisible(false); }}
                />
              </div>

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
              />
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
                className="rounded-[var(--r-xl)] overflow-hidden flex flex-col relative m-2"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
                  minWidth: 0,
                }}
              >
                <CanvasToolbar
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onClose={isEditMode ? undefined : handleCloseCanvas}
                  onEdit={handleEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={() => setIsEditMode(false)}
                  isEditMode={isEditMode}
                  sessionId={sessionId}
                  sessionType={sessionType}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  canUndo={isEditMode ? editCanUndo : false}
                  canRedo={isEditMode ? editCanRedo : false}
                />
                <div className="flex-1 relative overflow-hidden" style={{ background: "var(--bg2)" }}>
                  {viewMode === "slide" ? (
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

      {/* Floating feedback button — only when canvas has slides */}
      {canvasOpen && slides.length > 0 && !isEditMode && (
        <FeedbackButton onClick={() => { setNudgeVisible(false); setFeedbackModalOpen(true); }} />
      )}

      <SessionFeedbackModal
        open={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        sessionId={sessionId}
        slideCount={slides.length}
        sessionType={sessionType}
        theme={theme}
        triggerSource="manual"
      />
    </div>
  );
}
