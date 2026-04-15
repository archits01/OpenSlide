"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Message01Icon,
  PresentationBarChart01Icon,
} from "@hugeicons/core-free-icons";
import { ChatPanel } from "@/components/editor/ChatPanel";
import { SlideCanvas, CodeView, type SlideCanvasHandle } from "@/components/editor/SlideCanvas";
import { CanvasToolbar, type ViewMode } from "@/components/editor/CanvasToolbar";
import { InputToolbar } from "@/components/shared/InputToolbar";
import { SlidesWidget } from "@/components/editor/SlidesWidget";
import type { Slide } from "@/lib/redis";
import type { ThemeName, ThemeColors } from "@/agent/tools/set-theme";
import type { ToolCallEntry, LogoResult } from "@/lib/types";
import type { ChatState } from "@/components/editor/ChatPanel";

export type MobileTab = "chat" | "canvas";

interface MobileEditorShellProps {
  sessionTitle: string;
  sessionType: "slides" | "docs";
  slides: Slide[];
  theme: ThemeName;
  themeColors?: ThemeColors;
  logoResult: LogoResult | null;
  chatState: ChatState;
  toolHistory: ToolCallEntry[];
  canvasRef: React.RefObject<SlideCanvasHandle | null>;
  viewMode: ViewMode;
  isEditMode: boolean;
  buildingSlide: { toolUseId: string; title?: string; partialContent: string } | null;
  canUndo: boolean;
  canRedo: boolean;
  attachedSlideText: string | null;
  onViewModeChange: (mode: ViewMode) => void;
  onSend: (msg: string, opts?: { deepResearch?: boolean; docsMode?: boolean }) => void;
  onStop: () => void;
  onEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onBack: () => void;
  onPresent: () => void;
  onOpenCanvas: () => void;
  onActiveSlideChange: (id: string | null) => void;
  onSlidesEdited: (updates: Array<{ id: string; content: string }>) => void;
  onAddToChat: (text: string) => void;
  onSetAttachedSlideText: (text: string | null) => void;
  sessionId: string;
}

export function MobileEditorShell({
  sessionTitle,
  sessionType,
  slides,
  theme,
  themeColors,
  logoResult,
  chatState,
  toolHistory,
  canvasRef,
  viewMode,
  isEditMode,
  buildingSlide,
  canUndo,
  canRedo,
  attachedSlideText,
  onViewModeChange,
  onSend,
  onStop,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onUndo,
  onRedo,
  onBack,
  onPresent,
  onOpenCanvas,
  onActiveSlideChange,
  onSlidesEdited,
  onAddToChat,
  onSetAttachedSlideText,
  sessionId,
}: MobileEditorShellProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>("chat");
  const hasSlides = slides.length > 0 || !!buildingSlide;

  // Auto-switch to canvas when first slide arrives
  useEffect(() => {
    if (hasSlides && activeTab === "chat") {
      const t = setTimeout(() => setActiveTab("canvas"), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSlides]);

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--app-bg)" }}>
      {/* Top bar */}
      <div
        className="flex items-center flex-shrink-0 px-3 gap-2"
        style={{
          height: 52,
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 32, height: 32, borderRadius: 8, color: "var(--text2)" }}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        </button>

        <span
          className="flex-1 truncate text-[14px] font-medium"
          style={{ color: "var(--text)", letterSpacing: "-0.01em" }}
        >
          {sessionTitle}
        </span>

        {/* Tab toggle — only show when slides exist */}
        {hasSlides && (
          <div
            className="flex items-center gap-1 flex-shrink-0"
            style={{
              padding: 3,
              borderRadius: 10,
              background: "var(--bg2)",
              border: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setActiveTab("chat")}
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 28,
                borderRadius: 7,
                background: activeTab === "chat" ? "var(--bg)" : "transparent",
                color: activeTab === "chat" ? "var(--text)" : "var(--text3)",
                boxShadow: activeTab === "chat" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 150ms",
              }}
            >
              <HugeiconsIcon icon={Message01Icon} size={15} />
            </button>
            <button
              onClick={() => setActiveTab("canvas")}
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 28,
                borderRadius: 7,
                background: activeTab === "canvas" ? "var(--bg)" : "transparent",
                color: activeTab === "canvas" ? "var(--text)" : "var(--text3)",
                boxShadow: activeTab === "canvas" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 150ms",
              }}
            >
              <HugeiconsIcon icon={PresentationBarChart01Icon} size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Chat tab */}
        <div
          className="absolute inset-0 flex flex-col"
          style={{ display: activeTab === "chat" ? "flex" : "none" }}
        >
          <div className="flex-1 relative overflow-hidden">
            <ChatPanel
              messages={chatState.messages}
              toolHistory={toolHistory}
              isStreaming={chatState.isStreaming}
              compact={false}
              sessionType={sessionType}
            />
          </div>

          {/* Slides widget */}
          <AnimatePresence>
            {slides.length > 0 && activeTab === "chat" && (
              <div style={{ padding: "0 12px 8px" }}>
                <SlidesWidget
                  title={sessionTitle}
                  slideCount={slides.length}
                  onOpen={() => { onOpenCanvas(); setActiveTab("canvas"); }}
                />
              </div>
            )}
          </AnimatePresence>

          <div className="w-full pb-4 px-3 pt-2 flex-shrink-0">
            {/* Attached slide chip */}
            <AnimatePresence>
              {attachedSlideText && (
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px", marginBottom: 8,
                    background: "var(--bg2)", borderRadius: 10,
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: 14, color: "var(--text3)" }}>✎</span>
                  <span style={{
                    flex: 1, fontSize: 12.5, color: "var(--text)", fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {attachedSlideText.length > 60 ? attachedSlideText.slice(0, 60) + "…" : attachedSlideText}
                  </span>
                  <button
                    onClick={() => onSetAttachedSlideText(null)}
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
              )}
            </AnimatePresence>
            <InputToolbar
              onSend={(msg, opts) => {
                if (attachedSlideText) {
                  onSend(`Edit this text on my slide: "${attachedSlideText}"\n\n${msg}`, opts);
                  onSetAttachedSlideText(null);
                } else {
                  onSend(msg, opts);
                }
              }}
              isStreaming={chatState.isStreaming}
              onStop={onStop}
              placeholder={attachedSlideText ? "What do you want to change?" : "Ask for changes…"}
              sessionType={sessionType}
            />
          </div>
        </div>

        {/* Canvas tab */}
        <div
          className="absolute inset-0 flex flex-col"
          style={{ display: activeTab === "canvas" ? "flex" : "none" }}
        >
          <CanvasToolbar
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            onClose={undefined}
            onEdit={onEdit}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            isEditMode={isEditMode}
            sessionId={sessionId}
            sessionType={sessionType}
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
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
                onActiveSlideChange={onActiveSlideChange}
                onSlidesEdited={onSlidesEdited}
                onAddToChat={(text) => { onAddToChat(text); setActiveTab("chat"); }}
                buildingSlide={buildingSlide}
              />
            ) : (
              <CodeView slides={slides} sessionType={sessionType} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
