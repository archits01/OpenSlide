"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayCircleIcon, StopCircleIcon } from "@hugeicons/core-free-icons";
import { ChatPanel, type ChatMessage } from "@/components/editor/ChatPanel";
import { SlideCanvas } from "@/components/editor/SlideCanvas";
import { CanvasToolbar, type ViewMode } from "@/components/editor/CanvasToolbar";
import { EditorTopBar } from "@/components/editor/EditorTopBar";
import type { Session, Slide, Message, ContentBlock } from "@/lib/types";
import type { ThemeName } from "@/agent/tools/set-theme";
import type { ToolCallEntry } from "@/lib/types";

// ─── Replay event types ───────────────────────────────────────────────────────

type ReplayEvent =
  | { type: "message"; message: ChatMessage }
  | { type: "slide_created"; slide: Slide }
  | { type: "slide_updated"; slideId: string; changes: Partial<Slide> }
  | { type: "slide_deleted"; slideId: string };

function buildReplayTimeline(messages: Message[], finalSlides: Slide[]): ReplayEvent[] {
  const events: ReplayEvent[] = [];

  for (const msg of messages) {
    // User messages
    if (msg.role === "user") {
      const text = typeof msg.content === "string"
        ? msg.content
        : (msg.content as ContentBlock[]).find((b) => b.type === "text")?.text ?? "";
      if (text && !text.startsWith("[")) { // skip tool_result wrapper strings
        events.push({
          type: "message",
          message: { id: `msg-${events.length}`, role: "user", content: text },
        });
      }
      continue;
    }

    // Assistant messages — extract text + tool_use blocks
    const blocks = typeof msg.content === "string"
      ? [{ type: "text" as const, text: msg.content }]
      : (msg.content as ContentBlock[]);

    // Text block first
    const textBlock = blocks.find((b) => b.type === "text");
    if (textBlock?.text?.trim()) {
      events.push({
        type: "message",
        message: { id: `msg-${events.length}`, role: "assistant", content: textBlock.text },
      });
    }

    // Tool calls
    for (const block of blocks) {
      if (block.type !== "tool_use") continue;
      const input = block.input as Record<string, unknown> | undefined;
      if (!input) continue;

      if (block.name === "create_slide") {
        const slideId = (input.id as string) || `replay-${events.length}`;
        const slide: Slide = {
          id: slideId,
          index: (input.index as number) ?? events.length,
          title: (input.title as string) ?? "",
          content: (input.content as string) ?? "",
          layout: ((input.layout as Slide["layout"]) ?? "content"),
          theme: input.theme as string | undefined,
          notes: input.notes as string | undefined,
        };
        events.push({ type: "slide_created", slide });
      } else if (block.name === "update_slide") {
        events.push({
          type: "slide_updated",
          slideId: input.id as string,
          changes: input as Partial<Slide>,
        });
      } else if (block.name === "delete_slide") {
        events.push({ type: "slide_deleted", slideId: input.id as string });
      }
    }
  }

  // If no slide events were found (tool calls stored differently), fall back
  // to showing all final slides at the end
  const hasSlideEvents = events.some((e) => e.type === "slide_created");
  if (!hasSlideEvents) {
    for (const slide of finalSlides) {
      events.push({ type: "slide_created", slide });
    }
  }

  return events;
}

// ─── useReplay hook ───────────────────────────────────────────────────────────

const REPLAY_INTERVAL_MS = 350; // ~2x speed

function useReplay(events: ReplayEvent[], active: boolean) {
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  const [visibleSlides, setVisibleSlides] = useState<Slide[]>([]);
  const [eventIndex, setEventIndex] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyEvent = useCallback((event: ReplayEvent) => {
    if (event.type === "message") {
      setVisibleMessages((prev) => [...prev, event.message]);
    } else if (event.type === "slide_created") {
      setVisibleSlides((prev) => {
        const existing = prev.findIndex((s) => s.id === event.slide.id);
        if (existing >= 0) return prev;
        return [...prev, event.slide].sort((a, b) => a.index - b.index);
      });
    } else if (event.type === "slide_updated") {
      setVisibleSlides((prev) =>
        prev.map((s) => s.id === event.slideId ? { ...s, ...event.changes } : s)
      );
    } else if (event.type === "slide_deleted") {
      setVisibleSlides((prev) => prev.filter((s) => s.id !== event.slideId));
    }
  }, []);

  useEffect(() => {
    if (!active || done || eventIndex >= events.length) {
      if (eventIndex >= events.length && events.length > 0) setDone(true);
      return;
    }
    timerRef.current = setTimeout(() => {
      applyEvent(events[eventIndex]);
      setEventIndex((i) => i + 1);
    }, REPLAY_INTERVAL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active, done, eventIndex, events, applyEvent]);

  const skipToEnd = useCallback((allSlides: Slide[], allMessages: Message[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Build final messages from raw session messages
    const finalMessages: ChatMessage[] = [];
    for (const msg of allMessages) {
      if (msg.role !== "user" && msg.role !== "assistant") continue;
      const text = typeof msg.content === "string"
        ? msg.content
        : (msg.content as ContentBlock[]).find((b) => b.type === "text")?.text ?? "";
      if (text?.trim() && !text.startsWith("[")) {
        finalMessages.push({ id: `final-${finalMessages.length}`, role: msg.role, content: text });
      }
    }
    setVisibleMessages(finalMessages);
    setVisibleSlides(allSlides);
    setEventIndex(events.length);
    setDone(true);
  }, [events.length]);

  const restart = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisibleMessages([]);
    setVisibleSlides([]);
    setEventIndex(0);
    setDone(false);
  }, []);

  return { visibleMessages, visibleSlides, done, skipToEnd, restart };
}

// ─── Public view page ─────────────────────────────────────────────────────────

export default function PublicViewPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [replayEvents, setReplayEvents] = useState<ReplayEvent[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("slide");

  useEffect(() => {
    fetch(`/api/share/${sessionId}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data: Session | null) => {
        if (!data) return;
        setSession(data);
        if (data.isReplay) {
          setReplayEvents(buildReplayTimeline(data.messages, data.slides));
        }
      });
  }, [sessionId]);

  const { visibleMessages, visibleSlides, done, skipToEnd, restart } = useReplay(
    replayEvents,
    !!session?.isReplay
  );

  if (notFound) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--app-bg)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--text2)", margin: 0 }}>This presentation is private or does not exist.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--app-bg)" }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
      </div>
    );
  }

  const isReplay = session.isReplay;
  const displayMessages: ChatMessage[] = isReplay
    ? visibleMessages
    : session.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m, i) => ({
          id: `static-${i}`,
          role: m.role as "user" | "assistant",
          content: typeof m.content === "string"
            ? m.content
            : (m.content as ContentBlock[]).find((b) => b.type === "text")?.text ?? "",
        }))
        .filter((m) => m.content.trim() && !m.content.startsWith("["));

  const displaySlides = isReplay ? visibleSlides : session.slides;
  const theme = (session.theme as ThemeName) ?? "minimal";
  const toolHistory: ToolCallEntry[] = (session.toolHistory ?? []) as ToolCallEntry[];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--app-bg)", overflow: "hidden" }}>
      <EditorTopBar
        title={session.title}
        isStreaming={false}
        sessionId={sessionId}
        readonly={true}
      />

      {/* Body: chat (left) + canvas (right) — matches editor layout exactly */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: 8, gap: 8 }}>
        {/* Chat panel — read-only */}
        <div style={{ width: "40%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <ChatPanel
              messages={displayMessages}
              toolHistory={toolHistory}
              isStreaming={false}
              compact={true}
            />
          </div>

          {/* Bottom bar: replay controls where InputToolbar would be */}
          {isReplay && (
            <div style={{
              flexShrink: 0,
              padding: "12px 16px",
              borderTop: "1px solid var(--border)",
              background: "var(--bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AnimatePresence mode="wait">
                {!done ? (
                  <motion.button
                    key="skip"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onClick={() => skipToEnd(session.slides, session.messages)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      height: 44, padding: "0 24px", borderRadius: 22,
                      border: "none", background: "#09090B", color: "#fff",
                      fontSize: 14, fontWeight: 500, cursor: "pointer",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    <HugeiconsIcon icon={StopCircleIcon} size={18} />
                    Go to result
                  </motion.button>
                ) : (
                  <motion.button
                    key="replay"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onClick={restart}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      height: 44, padding: "0 24px", borderRadius: 22,
                      border: "none", background: "#09090B", color: "#fff",
                      fontSize: 14, fontWeight: 500, cursor: "pointer",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    <HugeiconsIcon icon={PlayCircleIcon} size={18} />
                    View it again
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Canvas — identical wrapper to editor's motion.div */}
        <div
          className="rounded-[var(--r-xl)] overflow-hidden flex flex-col relative"
          style={{
            flex: 1,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
            minWidth: 0,
          }}
        >
          <CanvasToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sessionId={sessionId}
            readonly={true}
          />
          <div className="flex-1 relative overflow-hidden" style={{ background: "var(--bg2)" }}>
            <SlideCanvas
              slides={displaySlides}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
