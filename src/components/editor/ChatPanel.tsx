"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import type { AgentEvent } from "@/agent/events";
import type { Outline } from "@/lib/redis";
import type { ToolCallEntry } from "@/lib/types";
import { OutlineCard } from "./OutlineCard";
import { ResearchProgressCard } from "./ResearchProgressCard";
import { ShiningText } from "@/components/shared/ShiningText";
import { ConnectCard } from "@/components/connect-card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Presentation01Icon,
  PencilEdit01Icon,
  Delete01Icon,
  FileViewIcon,
  ColorPickerIcon,
  ArrowUpDownIcon,
  Idea01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  File01Icon,
  Image01Icon,
} from "@hugeicons/core-free-icons";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface SubagentStatus {
  id: string;
  searchCount: number;
  maxSearches: number;
  status: "pending" | "active" | "done" | "error";
}

export interface ResearchStage {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
  subagents?: SubagentStatus[];
}

export interface ResearchProgressData {
  stages: ResearchStage[];
  isComplete: boolean;
  summary?: string;
}

export interface ChatMessageAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  isStreaming?: boolean;
  outline?: Outline;
  researchProgress?: ResearchProgressData;
  thinkingText?: string;
  thinkingStreaming?: boolean;
  timestamp?: number;
  connectCard?: { provider: string; connectUrl: string; message: string };
  attachments?: ChatMessageAttachment[];
}

export interface ToolCallStatus {
  id: string;
  toolName: string;
  status: "running" | "done" | "error";
  input?: Record<string, unknown>;
  result?: string;
}

// ─── Think Block ────────────────────────────────────────────────────────────

function ThinkBlock({ message }: { message: ChatMessage }) {
  const [expanded, setExpanded] = useState(true);
  if (!message.thinkingText && !message.thinkingStreaming) return null;

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
        background: "var(--bg)",
        marginBottom: 10,
      }}
    >
      {/* Header */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <HugeiconsIcon
          icon={Idea01Icon}
          size={14}
          style={{
            color: message.thinkingStreaming ? "var(--accent)" : "var(--text3)",
            flexShrink: 0,
          }}
        />
        {message.thinkingStreaming ? (
          <ShiningText text="OpenSlide is thinking…" />
        ) : (
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Think</span>
        )}
        <div style={{ flex: 1 }} />
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={12}
          style={{
            color: "var(--text3)",
            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 150ms ease",
            flexShrink: 0,
          }}
        />
      </div>

      {/* Body */}
      {expanded && message.thinkingText && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "10px 14px 12px",
            maxHeight: 280,
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
        >
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.65,
              color: "var(--text2)",
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            {message.thinkingText}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Tool Call Card ──────────────────────────────────────────────────────────

function getToolMeta(sessionType?: "slides" | "docs" | "sheets" | "website"): Record<string, { icon: React.ReactNode; label: string }> {
  const isDoc = sessionType === "docs";
  const item = isDoc ? "page" : "slide";
  const Item = isDoc ? "Page" : "Slide";
  const Items = isDoc ? "Pages" : "Slides";
  return {
    web_search: { icon: <HugeiconsIcon icon={Search01Icon} size={14} />, label: "Search" },
    create_slide: { icon: <HugeiconsIcon icon={Presentation01Icon} size={14} />, label: `Create ${item}` },
    update_slide: { icon: <HugeiconsIcon icon={PencilEdit01Icon} size={14} />, label: `Update ${item}` },
    delete_slide: { icon: <HugeiconsIcon icon={Delete01Icon} size={14} />, label: `Delete ${item}` },
    // Doc page tools (same labels, different function names)
    create_page: { icon: <HugeiconsIcon icon={Presentation01Icon} size={14} />, label: "Create page" },
    update_page: { icon: <HugeiconsIcon icon={PencilEdit01Icon} size={14} />, label: "Update page" },
    delete_page: { icon: <HugeiconsIcon icon={Delete01Icon} size={14} />, label: "Delete page" },
    reorder_pages: { icon: <HugeiconsIcon icon={ArrowUpDownIcon} size={14} />, label: "Reorder pages" },
    create_outline: { icon: <HugeiconsIcon icon={FileViewIcon} size={14} />, label: "Plan outline" },
    set_theme: { icon: <HugeiconsIcon icon={ColorPickerIcon} size={14} />, label: "Set theme" },
    reorder_slides: { icon: <HugeiconsIcon icon={ArrowUpDownIcon} size={14} />, label: `Reorder ${Items.toLowerCase()}` },
    // Website mode tools
    create_file: { icon: <HugeiconsIcon icon={File01Icon} size={14} />, label: "Create file" },
    update_file: { icon: <HugeiconsIcon icon={PencilEdit01Icon} size={14} />, label: "Update file" },
    delete_file: { icon: <HugeiconsIcon icon={Delete01Icon} size={14} />, label: "Delete file" },
    run_shell_command: { icon: <HugeiconsIcon icon={Idea01Icon} size={14} />, label: "Run command" },
    list_files: { icon: <HugeiconsIcon icon={FileViewIcon} size={14} />, label: "List files" },
    read_file: { icon: <HugeiconsIcon icon={Search01Icon} size={14} />, label: "Read file" },
  };
}

function getDescription(toolName: string, input?: Record<string, unknown>): string | null {
  if (!input) return null;
  switch (toolName) {
    case "web_search": return (input.query as string) ?? null;
    case "create_slide": case "create_page": return (input.title as string) ?? null;
    case "update_slide": case "update_page": return (input.title as string) ?? null;
    case "create_outline": return ((input.title ?? input.document_title) as string) ?? null;
    case "set_theme": return (input.theme as string) ?? null;
    case "create_file": case "update_file": case "delete_file": case "read_file":
      return (input.path as string) ?? null;
    case "run_shell_command": {
      const cmd = input.cmd as string | undefined;
      const args = Array.isArray(input.args) ? (input.args as string[]).join(" ") : "";
      return cmd ? `${cmd}${args ? ` ${args}` : ""}` : null;
    }
    default: return null;
  }
}

function getSubText(
  toolName: string,
  status: ToolCallStatus["status"],
  input?: Record<string, unknown>,
  sessionType?: "slides" | "docs" | "sheets" | "website"
): string {
  const isDoc = sessionType === "docs";
  const item = isDoc ? "Page" : "Slide";
  const itemLower = isDoc ? "page" : "slide";
  const ctx = isDoc ? "document" : "presentation";
  if (status === "error") return "Something went wrong";
  switch (toolName) {
    case "web_search":
      return status === "done" ? "Results gathered" : "Searching the web…";
    case "create_slide":
    case "create_page":
      return status === "done"
        ? `${item} created`
        : (input?.title as string) ?? `Building ${itemLower}…`;
    case "update_slide":
    case "update_page":
      return status === "done" ? `${item} updated` : "Applying changes…";
    case "delete_slide":
    case "delete_page":
      return status === "done" ? `${item} removed` : `Removing ${itemLower}…`;
    case "create_outline":
      return status === "done" ? "Outline ready" : `Structuring ${ctx}…`;
    case "set_theme":
      return status === "done"
        ? `Theme applied${input?.theme ? ` — ${input.theme}` : ""}`
        : "Applying theme…";
    case "reorder_slides":
    case "reorder_pages":
      return status === "done" ? "Order updated" : "Reordering…";
    case "create_file":
      return status === "done" ? "File created" : "Writing file…";
    case "update_file":
      return status === "done" ? "File updated" : "Editing file…";
    case "delete_file":
      return status === "done" ? "File removed" : "Deleting…";
    case "run_shell_command":
      return status === "done" ? "Ran" : "Running…";
    case "list_files":
      return status === "done" ? "Listed files" : "Listing…";
    case "read_file":
      return status === "done" ? "Read file" : "Reading…";
    default:
      return status === "done" ? "Done" : "Processing…";
  }
}

function ToolCallCard({ toolCall, sessionType }: { toolCall: ToolCallStatus; sessionType?: "slides" | "docs" | "sheets" | "website" }) {
  const [expanded, setExpanded] = useState(false);
  const toolMeta = getToolMeta(sessionType);
  const meta = toolMeta[toolCall.toolName] ?? {
    icon: <HugeiconsIcon icon={FileViewIcon} size={14} />,
    label: toolCall.toolName,
  };
  const description = getDescription(toolCall.toolName, toolCall.input);
  const subText = getSubText(toolCall.toolName, toolCall.status, toolCall.input, sessionType);
  const isDone = toolCall.status === "done";
  const isError = toolCall.status === "error";
  const iconColor = isError ? "var(--red)" : isDone ? "var(--text3)" : "var(--accent)";
  const hasResult = isDone && toolCall.result && toolCall.result !== "Search results received";
  const canExpand = hasResult || (isDone && toolCall.input && Object.keys(toolCall.input).length > 0);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
        background: "var(--bg)",
        width: "100%",
      }}
    >
      {/* Row 1 */}
      <div
        onClick={canExpand ? () => setExpanded((p) => !p) : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px 10px 14px",
          cursor: canExpand ? "pointer" : "default",
        }}
      >
        <div
          style={{
            width: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: iconColor,
          }}
        >
          {meta.icon}
        </div>

        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", flexShrink: 0 }}>
          {meta.label}
        </span>

        {description ? (
          <>
            <span style={{ color: "var(--text3)", flexShrink: 0, fontSize: 12 }}>|</span>
            <span
              style={{
                fontSize: 13,
                color: "var(--text2)",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              {description}
            </span>
          </>
        ) : toolCall.status === "running" ? (
          <>
            <span style={{ color: "var(--text3)", flexShrink: 0, fontSize: 12 }}>|</span>
            <ShiningText text="Processing…" />
            <div style={{ flex: 1 }} />
          </>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        <HugeiconsIcon
          icon={canExpand ? (expanded ? ArrowDown01Icon : ArrowRight01Icon) : ArrowRight01Icon}
          size={12}
          style={{ color: canExpand ? "var(--text2)" : "var(--text3)", flexShrink: 0 }}
        />
      </div>

      {/* Connector line */}
      <div style={{ paddingLeft: 23 }}>
        <div style={{ width: 1, height: 8, background: "var(--border)" }} />
      </div>

      {/* Row 2 */}
      <div
        onClick={canExpand ? () => setExpanded((p) => !p) : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px 10px 14px",
          cursor: canExpand ? "pointer" : "default",
        }}
      >
        <div
          style={{
            width: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: isError ? "var(--red)" : "var(--border-hover)",
            }}
          />
        </div>

        {toolCall.status === "running" ? (
          <ShiningText text={subText} />
        ) : (
          <span
            style={{
              fontSize: 13,
              color: "var(--text2)",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subText}
          </span>
        )}

        <HugeiconsIcon
          icon={canExpand ? (expanded ? ArrowDown01Icon : ArrowRight01Icon) : ArrowRight01Icon}
          size={12}
          style={{ color: canExpand ? "var(--text2)" : "var(--text3)", flexShrink: 0 }}
        />
      </div>

      {/* Expanded result content */}
      {expanded && canExpand && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "10px 14px 12px",
            maxHeight: 240,
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
        >
          {toolCall.toolName === "web_search" && toolCall.result ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {toolCall.result.split("\n").filter(Boolean).map((line, i) => {
                const dashIdx = line.indexOf(" — ");
                if (dashIdx > 0) {
                  const title = line.slice(0, dashIdx);
                  const url = line.slice(dashIdx + 3);
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <span style={{ fontSize: 12.5, color: "var(--text)", fontWeight: 500, lineHeight: 1.4 }}>
                        {title}
                      </span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 11.5,
                          color: "var(--accent)",
                          textDecoration: "none",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                      >
                        {url}
                      </a>
                    </div>
                  );
                }
                return (
                  <span key={i} style={{ fontSize: 12.5, color: "var(--text2)", lineHeight: 1.4 }}>
                    {line}
                  </span>
                );
              })}
            </div>
          ) : toolCall.result ? (
            <pre
              style={{
                fontSize: 12,
                color: "var(--text2)",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
                fontFamily: "var(--font-geist-mono), monospace",
              }}
            >
              {toolCall.result.length > 500 ? toolCall.result.slice(0, 500) + "…" : toolCall.result}
            </pre>
          ) : toolCall.input ? (
            <pre
              style={{
                fontSize: 12,
                color: "var(--text2)",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
                fontFamily: "var(--font-geist-mono), monospace",
              }}
            >
              {JSON.stringify(toolCall.input, null, 2)}
            </pre>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Quick Actions Parser ────────────────────────────────────────────────────

interface QuickAction {
  type: "build" | "chat" | "file";
  message: string;
  label: string;
}

function parseQuickActions(content: string): { cleanContent: string; actions: QuickAction[] } {
  // Complete block present — strip it and extract actions
  const blockMatch = content.match(/<quick-actions>([\s\S]*?)<\/quick-actions>/);
  if (blockMatch) {
    const cleanContent = content.replace(/<quick-actions>[\s\S]*?<\/quick-actions>/, "").trimEnd();
    const actions: QuickAction[] = [];
    const actionRegex = /<action\s+type="(build|chat|file)"\s+(?:message|path)="([^"]*)"[^>]*>([^<]*)<\/action>/g;
    let m: RegExpExecArray | null;
    while ((m = actionRegex.exec(blockMatch[1])) !== null) {
      actions.push({ type: m[1] as "build" | "chat", message: m[2], label: m[3].trim() });
    }
    return { cleanContent, actions };
  }
  // Partial block still streaming — strip it so raw XML never flashes as text
  const partialIdx = content.indexOf("<quick-actions>");
  if (partialIdx !== -1) {
    return { cleanContent: content.slice(0, partialIdx).trimEnd(), actions: [] };
  }
  return { cleanContent: content, actions: [] };
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({ message, onQuickAction, onFileOpen, onRewind, onFork }: { message: ChatMessage; onQuickAction?: (msg: string, isBuild: boolean) => void; onFileOpen?: (path: string) => void; onRewind?: () => void; onFork?: () => void }) {
  const isUser = message.role === "user";

  // Error notice — centered pill, no avatar, no bubble
  if (message.role === "error") {
    return (
      <div className="flex w-full justify-center mt-4">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px]"
          style={{
            background: "var(--red-soft)",
            color: "var(--red)",
            border: "1px solid rgba(220,38,38,0.15)",
          }}
        >
          <span style={{ fontSize: 14 }}>⚠</span>
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full mt-4 ${isUser ? "justify-end" : "justify-start"}`}>
      {isUser ? (
        <div className="max-w-[85%] flex flex-col items-end gap-1.5">
          {/* Attachment chips */}
          {message.attachments?.length ? (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {message.attachments.map((att) => {
                const isImage = att.mimeType.startsWith("image/");
                const ext = att.name.split(".").pop()?.toUpperCase() ?? "FILE";
                const kb = att.sizeBytes < 1024 * 1024
                  ? `${Math.round(att.sizeBytes / 1024)} KB`
                  : `${(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-[var(--r-lg)]"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      maxWidth: 220,
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-md flex-shrink-0"
                      style={{ width: 30, height: 30, background: "var(--accent-soft)" }}
                    >
                      <HugeiconsIcon
                        icon={isImage ? Image01Icon : File01Icon}
                        size={16}
                        color="var(--accent)"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        className="text-[12.5px] font-medium leading-tight truncate"
                        style={{ color: "var(--text)", maxWidth: 140 }}
                        title={att.name}
                      >
                        {att.name}
                      </span>
                      <span className="text-[11px] leading-tight" style={{ color: "var(--text3)" }}>
                        {ext} · {kb}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          {/* Message text bubble */}
          {message.content ? (
            <div
              className="px-4 py-2.5 rounded-[var(--r-2xl)] text-[14px] leading-relaxed shadow-sm"
              style={{
                background: "var(--surface)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderBottomRightRadius: "4px",
              }}
            >
              {message.content}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex items-start w-full">
          <div className="flex-1 min-w-0">
            <ThinkBlock message={message} />

            {message.researchProgress && (
              <ResearchProgressCard progress={message.researchProgress} />
            )}

            {(() => {
              const { cleanContent, actions } = parseQuickActions(message.content ?? "");
              const displayContent = cleanContent;
              return (
                <>
                  {displayContent && !/^\s*(<div[\s>]|style=|<svg[\s>]|\{"\w+":)/.test(displayContent.trim()) && (
                    <div
                      className={`text-[14.5px] leading-[1.6] ${message.isStreaming ? "streaming-cursor" : ""}`}
                      style={{ color: "var(--text)" }}
                    >
                      <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-[var(--text)]">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="my-3 ml-5 list-disc flex flex-col gap-1 text-[var(--text2)]">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="my-3 ml-5 list-decimal flex flex-col gap-1 text-[var(--text2)]">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">
                        <span className="text-[var(--text)]">{children}</span>
                      </li>
                    ),
                    table: ({ children }) => (
                      <div className="my-4 overflow-x-auto rounded-[var(--r-md)] border border-[var(--border)]">
                        <table className="text-[13px] border-collapse w-full">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead>{children}</thead>,
                    th: ({ children }) => (
                      <th
                        className="px-3 py-2 text-left font-medium"
                        style={{
                          borderBottom: "1px solid var(--border)",
                          background: "var(--bg2)",
                          color: "var(--text2)",
                        }}
                      >
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td
                        className="px-3 py-2"
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        {children}
                      </td>
                    ),
                    code: ({ children }) => {
                      const text = String(children).trim();
                      const hexMatch = text.match(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/);
                      if (hexMatch) {
                        // Render hex color with a visual swatch
                        const hex = text;
                        const r = parseInt(hex.slice(1, 3), 16);
                        const g = parseInt(hex.slice(3, 5), 16);
                        const b = parseInt(hex.slice(5, 7), 16);
                        const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 160;
                        return (
                          <code
                            className="px-2 py-0.5 rounded-[4px] text-[12px] font-mono inline-flex items-center gap-1.5"
                            style={{
                              background: hex,
                              color: isLight ? "#111" : "#fff",
                              border: isLight ? "1px solid rgba(0,0,0,0.1)" : "none",
                            }}
                          >
                            {text}
                          </code>
                        );
                      }
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded-[4px] text-[13px]"
                          style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
                        >
                          {children}
                        </code>
                      );
                    },
                    img: ({ src, alt }) => (
                      <img
                        src={src}
                        alt={alt ?? ""}
                        style={{
                          maxHeight: 48,
                          maxWidth: 160,
                          objectFit: "contain",
                          borderRadius: 6,
                          border: "1px solid var(--border)",
                          padding: 6,
                          background: "var(--bg2)",
                          display: "inline-block",
                          verticalAlign: "middle",
                        }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ),
                    h1: ({ children }) => (
                      <h1 className="font-semibold text-[18px] mt-6 mb-3">{children}</h1>
                    ),
                    h3: ({ children }) => (
                      <h3 className="font-medium text-[16px] mt-5 mb-2">{children}</h3>
                    ),
                  }}
                >
                    {displayContent}
                  </ReactMarkdown>
                </div>
              )}

              {/* Quick action pills — shown after streaming completes */}
              {!message.isStreaming && actions.length > 0 && (onQuickAction || onFileOpen) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                  {actions.map((action, i) => {
                    const isFile = action.type === "file";
                    const isBuild = action.type === "build";
                    const bg = isBuild ? "var(--accent-soft)" : isFile ? "var(--bg2)" : "var(--bg2)";
                    const bgHover = isBuild ? "rgba(67,56,202,0.12)" : "var(--bg)";
                    const color = isBuild ? "var(--accent-text)" : "var(--text2)";
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (isFile) onFileOpen?.(action.message);
                          else onQuickAction?.(action.message, isBuild);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          height: 28,
                          padding: "0 11px",
                          borderRadius: 999,
                          border: "1px solid var(--border-strong)",
                          background: bg,
                          color,
                          fontSize: 12.5,
                          fontWeight: 500,
                          cursor: "pointer",
                          letterSpacing: "-0.01em",
                          transition: "background 100ms, border-color 100ms",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = bgHover;
                          e.currentTarget.style.borderColor = "var(--border-hover)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = bg;
                          e.currentTarget.style.borderColor = "var(--border-strong)";
                        }}
                      >
                        {isBuild ? (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M5 1L9 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        ) : isFile ? (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M2 1.5h4l2 2V8.5a.5.5 0 01-.5.5h-5a.5.5 0 01-.5-.5v-6A.5.5 0 012 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                            <path d="M6 1.5V3.5H8" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M5 3.5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <circle cx="5" cy="6.75" r="0.5" fill="currentColor"/>
                          </svg>
                        )}
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

            {/* ConnectCard — rendered when agent requires OAuth connection */}
            {message.connectCard && (
              <div style={{ marginTop: message.content ? 10 : 0 }}>
                <ConnectCard
                  provider={message.connectCard.provider}
                  connectUrl={message.connectCard.connectUrl}
                  message={message.connectCard.message}
                />
              </div>
            )}

            {/* Outline card removed — now rendered inline after the Plan outline tool card */}

            {/* Streaming cursor when content is empty but streaming */}
            {message.isStreaming && !message.content && !message.thinkingStreaming && (
              <div className="flex items-center gap-1.5 mt-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="tool-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            )}

            {/* Rewind / Fork ghost buttons — appear on hover */}
            {(onRewind || onFork) && !message.isStreaming && (
              <div className="rewind-fork-actions" style={{ display: "flex", gap: 4, marginTop: 8, opacity: 0, transition: "opacity 150ms" }}>
                {onFork && (
                  <button
                    onClick={onFork}
                    title="Fork from here — create a new session branching from this point"
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      height: 22, padding: "0 8px", borderRadius: 5,
                      border: "1px solid var(--border)", background: "transparent",
                      color: "var(--text3)", fontSize: 11, cursor: "pointer",
                      transition: "background 80ms, color 80ms",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--text)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                      <path d="M18 9a9 9 0 01-9 9"/>
                    </svg>
                    Fork
                  </button>
                )}
                {onRewind && (
                  <button
                    onClick={onRewind}
                    title="Rewind — restore files and history to before this message"
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      height: 22, padding: "0 8px", borderRadius: 5,
                      border: "1px solid var(--border)", background: "transparent",
                      color: "var(--text3)", fontSize: 11, cursor: "pointer",
                      transition: "background 80ms, color 80ms",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--text)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                    </svg>
                    Rewind
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Theme Preview ──────────────────────────────────────────────────────────

function ThemePreview({ input }: { input?: Record<string, unknown> }) {
  const themeName = (input?.theme as string) ?? "minimal";
  const customColors = input?.custom_colors as Record<string, string> | undefined;

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "10px 14px",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginTop: 4,
      }}
    >
      <HugeiconsIcon icon={ColorPickerIcon} size={14} style={{ color: "var(--text3)", flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: "var(--text2)" }}>
        Theme: <strong style={{ color: "var(--text)" }}>{themeName}</strong>
      </span>
      {customColors && Object.entries(customColors).map(([key, hex]) => (
        <span
          key={key}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            color: "var(--text2)",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: hex,
              border: "1px solid rgba(0,0,0,0.1)",
              flexShrink: 0,
            }}
          />
          {key}
        </span>
      ))}
    </div>
  );
}

// ─── Progressive Blur ────────────────────────────────────────────────────────


// ─── Chat Panel ──────────────────────────────────────────────────────────────

interface TurnSnapshotRef {
  chatMessageCount: number;
  sessionMessageCount: number;
  websiteFiles: Record<string, string>;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  toolHistory: ToolCallEntry[];
  isStreaming: boolean;
  compact?: boolean;
  sessionType?: "slides" | "docs" | "sheets" | "website";
  onQuickAction?: (message: string, isBuild: boolean) => void;
  onFileOpen?: (path: string) => void;
  turnSnapshots?: TurnSnapshotRef[];
  onRewindToTurn?: (snapshotIndex: number) => void;
  onForkFromTurn?: (snapshotIndex: number) => void;
}

export function ChatPanel({ messages, toolHistory, isStreaming, compact, sessionType, onQuickAction, onFileOpen, turnSnapshots, onRewindToTurn, onForkFromTurn }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, toolHistory]);

  // Extract outline from messages (for rendering after Plan outline tool card)
  const outline = messages.find(m => m.outline)?.outline ?? null;

  // Build render list: for each user message, show tool cards that happened
  // between the previous message and the next message, then the message itself.
  // This groups tools with the assistant turn they belong to.

  type RenderItem =
    | { kind: "message"; message: ChatMessage }
    | { kind: "tools"; entries: ToolCallEntry[] };

  const renderItems: RenderItem[] = [];
  let toolIdx = 0;

  for (const msg of messages) {
    // Collect tools that happened BEFORE this message
    const toolsBefore: ToolCallEntry[] = [];
    while (toolIdx < toolHistory.length && (msg.timestamp ?? Infinity) > toolHistory[toolIdx].timestamp) {
      toolsBefore.push(toolHistory[toolIdx]);
      toolIdx++;
    }
    if (toolsBefore.length > 0) {
      renderItems.push({ kind: "tools", entries: toolsBefore });
    }
    renderItems.push({ kind: "message", message: msg });
  }

  // Any remaining tools (current turn — after the last message)
  const remainingTools = toolHistory.slice(toolIdx);

  // Helper to render a tool entry with optional inline content (outline/theme)
  const renderToolEntry = (entry: ToolCallEntry) => (
    <div key={entry.id}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <ToolCallCard
          sessionType={sessionType}
          toolCall={{
            id: entry.id,
            toolName: entry.toolName,
            status: entry.status,
            input: entry.input,
            result: entry.result,
          }}
        />
      </motion.div>
      {/* Show OutlineCard after Plan outline completes */}
      {entry.toolName === "create_outline" && entry.status === "done" && outline && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
          style={{ marginTop: 6 }}
        >
          <OutlineCard outline={outline} sessionType={sessionType} />
        </motion.div>
      )}
      {/* Show theme preview after Set theme completes */}
      {entry.toolName === "set_theme" && entry.status === "done" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
          style={{ marginTop: 4 }}
        >
          <ThemePreview input={entry.input} />
        </motion.div>
      )}
    </div>
  );

  return (
    <div
      className={`flex flex-col h-full overflow-y-auto ${compact ? "px-7" : "px-4"} py-4 no-scrollbar`}
      style={{
        maskImage: "linear-gradient(to bottom, transparent 0%, black 7%, black 93%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 7%, black 93%, transparent 100%)",
      }}
    >
      <AnimatePresence initial={false}>
        {renderItems.map((item, renderIdx) => {
          if (item.kind === "message") {
            // Find the message's index in the messages array
            const msgIdx = messages.indexOf(item.message);
            // For an assistant message: find snapshot whose chatMessageCount === msgIdx + 1
            const forkSnapIdx = (item.message.role === "assistant" && !item.message.isStreaming && turnSnapshots)
              ? turnSnapshots.findIndex((s) => s.chatMessageCount === msgIdx + 1)
              : -1;
            // For a user message: find snapshot before this message (chatMessageCount <= msgIdx)
            const rewindSnapIdx = (item.message.role === "user" && turnSnapshots && turnSnapshots.length > 0)
              ? (() => {
                  // Find the last snapshot whose chatMessageCount <= msgIdx
                  let best = -1;
                  for (let si = 0; si < turnSnapshots.length; si++) {
                    if (turnSnapshots[si].chatMessageCount <= msgIdx) best = si;
                  }
                  return best;
                })()
              : -1;
            return (
              <motion.div
                layout
                key={item.message.id}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 25 }}
              >
                <MessageBubble
                  message={item.message}
                  onQuickAction={onQuickAction}
                  onFileOpen={onFileOpen}
                  onRewind={rewindSnapIdx >= 0 && onRewindToTurn ? () => onRewindToTurn(rewindSnapIdx) : undefined}
                  onFork={forkSnapIdx >= 0 && onForkFromTurn ? () => onForkFromTurn(forkSnapIdx) : undefined}
                />
              </motion.div>
            );
          }
          // Tool group
          return (
            <div key={`tools-${item.entries[0].id}`} style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
              {item.entries.map(renderToolEntry)}
            </div>
          );
        })}
      </AnimatePresence>

      {/* Remaining tools from current turn (after last message) */}
      {remainingTools.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
          {remainingTools.map(renderToolEntry)}
        </div>
      )}

      {/* Streaming indicator */}
      {isStreaming &&
        remainingTools.length === 0 &&
        messages.every((m) => !m.isStreaming && !m.thinkingStreaming) && (
        <div className="flex items-center gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="tool-dot" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

// ─── State & Event Reducer ───────────────────────────────────────────────────

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function applyAgentEvent(
  state: ChatState,
  event: AgentEvent & { type: string }
): ChatState {
  const { messages } = state;

  switch (event.type) {
    case "thinking": {
      const lastMsg = messages[messages.length - 1];
      if (
        lastMsg?.role === "assistant" &&
        (lastMsg.thinkingStreaming || (!lastMsg.content && !lastMsg.isStreaming))
      ) {
        return {
          ...state,
          isStreaming: true,
          messages: [
            ...messages.slice(0, -1),
            {
              ...lastMsg,
              thinkingText: (lastMsg.thinkingText ?? "") + event.text,
              thinkingStreaming: true,
            },
          ],
        };
      }
      return {
        ...state,
        isStreaming: true,
        messages: [
          ...messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            thinkingText: event.text,
            thinkingStreaming: true,
            timestamp: Date.now(),
          },
        ],
      };
    }

    case "text_delta": {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant" && lastMsg.isStreaming) {
        return {
          ...state,
          isStreaming: true,
          messages: [
            ...messages.slice(0, -1),
            { ...lastMsg, content: lastMsg.content + event.text },
          ],
        };
      }
      // Transition from thinking → text (same message)
      if (lastMsg?.role === "assistant" && (lastMsg.thinkingStreaming || lastMsg.thinkingText)) {
        return {
          ...state,
          isStreaming: true,
          messages: [
            ...messages.slice(0, -1),
            { ...lastMsg, thinkingStreaming: false, content: event.text, isStreaming: true },
          ],
        };
      }
      return {
        ...state,
        isStreaming: true,
        messages: [
          ...messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: event.text,
            isStreaming: true,
            timestamp: Date.now(),
          },
        ],
      };
    }

    case "text_done": {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.isStreaming) {
        return {
          ...state,
          messages: [...messages.slice(0, -1), { ...lastMsg, isStreaming: false }],
        };
      }
      return state;
    }

    case "outline_created": {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant") {
        return {
          ...state,
          messages: [...messages.slice(0, -1), { ...lastMsg, outline: event.outline }],
        };
      }
      return {
        ...state,
        messages: [
          ...messages,
          { id: `outline_${event.outline.id}`, role: "assistant" as const, content: "", outline: event.outline },
        ],
      };
    }

    case "research_progress": {
      const re = event as AgentEvent & { type: "research_progress"; stage: string; agentId?: string; detail: string };
      const lastMsg = messages[messages.length - 1];
      const isFinal = re.stage === "citation_done" || re.stage.endsWith("_error");

      // Helper: default 4-stage skeleton
      const makeStages = (): ResearchStage[] => [
        { id: "plan", label: "Planning strategy", status: "pending" },
        { id: "agents", label: "Research agents", status: "pending", subagents: [] },
        { id: "merge", label: "Merging findings", status: "pending" },
        { id: "cite", label: "Processing citations", status: "pending" },
      ];

      // Helper: update a specific stage in an existing progress object
      const update = (prev: ResearchProgressData, fn: (stages: ResearchStage[]) => ResearchStage[]): ResearchProgressData => ({
        ...prev,
        stages: fn(prev.stages.map((s) => ({ ...s, subagents: s.subagents?.map((a) => ({ ...a })) }))),
        isComplete: isFinal,
        summary: isFinal ? re.detail : prev.summary,
      });

      // If no research message exists yet, create one
      if (!lastMsg?.researchProgress) {
        const stages = makeStages();
        if (re.stage === "orchestrator_start") stages[0].status = "active";
        return {
          ...state,
          isStreaming: true,
          messages: [
            ...messages,
            {
              id: crypto.randomUUID(),
              role: "assistant" as const,
              content: "",
              isStreaming: !isFinal,
              researchProgress: { stages, isComplete: false },
              timestamp: Date.now(),
            },
          ],
        };
      }

      // Update existing research message
      const updated = update(lastMsg.researchProgress!, (stages) => {
        switch (re.stage) {
          case "orchestrator_start":
            stages[0].status = "active";
            break;
          case "orchestrator_done":
            stages[0].status = "done";
            break;
          case "orchestrator_error":
            stages[0].status = "error";
            break;
          case "subagent_start":
            stages[1].status = "active";
            if (re.agentId && !stages[1].subagents?.find((a) => a.id === re.agentId)) {
              stages[1].subagents = [...(stages[1].subagents ?? []), { id: re.agentId, searchCount: 0, maxSearches: 5, status: "active" }];
            }
            break;
          case "subagent_search":
            if (re.agentId) {
              const agent = stages[1].subagents?.find((a) => a.id === re.agentId);
              if (agent) agent.searchCount++;
            }
            break;
          case "subagent_done":
            if (re.agentId) {
              const agent = stages[1].subagents?.find((a) => a.id === re.agentId);
              if (agent) agent.status = "done";
            }
            if (stages[1].subagents?.every((a) => a.status === "done" || a.status === "error")) {
              stages[1].status = "done";
            }
            break;
          case "subagent_error":
            if (re.agentId) {
              const agent = stages[1].subagents?.find((a) => a.id === re.agentId);
              if (agent) agent.status = "error";
            }
            break;
          case "synthesizer_start":
            stages[2].status = "active";
            break;
          case "synthesizer_done":
            stages[2].status = "done";
            break;
          case "synthesizer_error":
            stages[2].status = "error";
            break;
          case "citation_start":
            stages[3].status = "active";
            break;
          case "citation_done":
            stages[3].status = "done";
            break;
          case "pipeline_error":
            // Mark first non-done stage as error
            for (const s of stages) { if (s.status !== "done") { s.status = "error"; break; } }
            break;
        }
        return stages;
      });

      return {
        ...state,
        isStreaming: !isFinal,
        messages: [
          ...messages.slice(0, -1),
          { ...lastMsg, researchProgress: updated, isStreaming: !isFinal },
        ],
      };
    }

    case "done": {
      const lastMsg = messages[messages.length - 1];
      return {
        ...state,
        isStreaming: false,
        messages: lastMsg?.isStreaming
          ? [...messages.slice(0, -1), { ...lastMsg, isStreaming: false }]
          : messages,
      };
    }

    case "error": {
      return {
        ...state,
        isStreaming: false,
        messages: [
          ...messages,
          { id: crypto.randomUUID(), role: "error" as const, content: event.message, timestamp: Date.now() },
        ],
      };
    }

    case "connection_required": {
      const cr = event as AgentEvent & { type: "connection_required"; provider: string; connectUrl: string; message: string };
      return {
        ...state,
        isStreaming: false,
        messages: [
          ...messages,
          {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            content: "",
            connectCard: { provider: cr.provider, connectUrl: cr.connectUrl, message: cr.message },
            timestamp: Date.now(),
          },
        ],
      };
    }

    default:
      return state;
  }
}
