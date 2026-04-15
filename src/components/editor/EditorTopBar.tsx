"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Share03Icon,
  PlayIcon,
  Copy01Icon,
  CopyCheckIcon,
  Cancel01Icon,
  Link01Icon,
  LinkSquare01Icon,
  Settings01Icon,
  Logout03Icon,
} from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import { SettingsModal } from "@/components/shared/SettingsModal";
import { useProfile, clearProfileCache } from "@/lib/hooks/useProfile";
import { ConnectorPopover } from "@/components/shared/ConnectorPopover";
import { ConnectorModal } from "@/components/shared/ConnectorModal";

interface EditorTopBarProps {
  title: string;
  sessionType?: "slides" | "docs";
  isStreaming: boolean;
  onBack?: () => void;
  onPresent?: () => void;
  slidesCount?: number;
  sessionId: string;
  readonly?: boolean;
  isPublic?: boolean;
  isReplay?: boolean;
  onShareChange?: (isPublic: boolean, isReplay: boolean) => void;
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10, border: "none",
        background: checked ? "#4338CA" : "rgba(0,0,0,0.12)",
        position: "relative", cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 150ms", flexShrink: 0,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span style={{
        position: "absolute", top: 2,
        left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transition: "left 150ms",
        display: "block",
      }} />
    </button>
  );
}

// ── Share popover ─────────────────────────────────────────────────────────────
function SharePopover({
  sessionId,
  onClose,
  initialIsPublic,
  initialIsReplay,
  onShareChange,
  sessionType = "slides",
}: {
  sessionId: string;
  onClose: () => void;
  initialIsPublic: boolean;
  initialIsReplay: boolean;
  onShareChange?: (isPublic: boolean, isReplay: boolean) => void;
  sessionType?: "slides" | "docs";
}) {
  const isDocsMode = sessionType === "docs";
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isReplay, setIsReplay] = useState(initialIsReplay);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function patch(update: { isPublic?: boolean; isReplay?: boolean }) {
    const next = { isPublic, isReplay, ...update };
    setIsPublic(next.isPublic);
    setIsReplay(next.isReplay);
    onShareChange?.(next.isPublic, next.isReplay);
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
  }

  function copyLink() {
    const url = `${window.location.origin}/view/${sessionId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/view/${sessionId}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -6 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        position: "absolute", top: "calc(100% + 8px)", right: 0,
        width: 320,
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 10px",
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>
          Share
        </span>
        <button
          onClick={onClose}
          style={{
            width: 24, height: 24, borderRadius: 6, border: "none",
            background: "transparent", color: "var(--text3)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--text)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; }}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={13} />
        </button>
      </div>

      <div style={{ padding: "8px 0 12px" }}>
          {/* Anyone with the link */}
          <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>
                Anyone with the link
              </p>
              <p style={{ margin: 0, fontSize: 11.5, color: "var(--text3)", marginTop: 2, lineHeight: 1.4 }}>
                {isPublic ? "Public — anyone can view" : "Private — only you can access"}
              </p>
            </div>
            <Toggle checked={isPublic} onChange={(v) => patch({ isPublic: v })} />
          </div>

          {/* Replay mode */}
          <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>
                Replay mode
              </p>
              <p style={{ margin: 0, fontSize: 11.5, color: "var(--text3)", marginTop: 2, lineHeight: 1.4 }}>
                Show how the AI built this {isDocsMode ? "document" : "presentation"}
              </p>
            </div>
            <Toggle checked={isReplay} onChange={(v) => patch({ isReplay: v })} disabled={!isPublic} />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />

          {/* Link row */}
          <div style={{ padding: "4px 16px 4px" }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: "var(--text3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Share to
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {/* X / Twitter */}
              <a
                href={`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(isDocsMode ? "Check out this AI-generated document" : "Check out this AI-generated presentation")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  height: 34, borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg)", color: "var(--text2)",
                  fontSize: 12.5, fontWeight: 500, cursor: "pointer",
                  textDecoration: "none", letterSpacing: "-0.01em",
                  transition: "border-color 120ms, color 120ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text2)"; }}
              >
                {/* X logo inline SVG */}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Post
              </a>

              {/* Copy link */}
              <button
                onClick={copyLink}
                disabled={!isPublic}
                style={{
                  flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  height: 34, borderRadius: 8,
                  border: "none",
                  background: copied ? "rgba(22,163,74,0.08)" : "var(--accent)",
                  color: copied ? "#16A34A" : "white",
                  fontSize: 12.5, fontWeight: 500, cursor: isPublic ? "pointer" : "not-allowed",
                  letterSpacing: "-0.01em",
                  transition: "background 150ms, color 150ms",
                  opacity: isPublic ? 1 : 0.4,
                }}
              >
                <HugeiconsIcon icon={copied ? CopyCheckIcon : isPublic ? Copy01Icon : Link01Icon} size={14} />
                {copied ? "Copied!" : isPublic ? "Copy link" : "Enable link first"}
              </button>
            </div>
          </div>
        </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function EditorTopBar({ title, sessionType = "slides", isStreaming, onBack, onPresent, slidesCount = 0, sessionId, readonly = false, isPublic: initialIsPublic = false, isReplay: initialIsReplay = false, onShareChange }: EditorTopBarProps) {
  const isDocsMode = sessionType === "docs";
  const [user, setUser] = useState<User | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [connectorModalOpen, setConnectorModalOpen] = useState(false);
  const connectorBtnRef = useRef<HTMLButtonElement>(null);
  const { profile, refresh: refreshProfile } = useProfile();
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN") {
        clearProfileCache();
        refreshProfile();
      } else if (!session?.user) {
        clearProfileCache();
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!shareOpen && !avatarOpen) return;
    function handleClick(e: MouseEvent) {
      if (shareOpen && shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
      if (avatarOpen && avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [shareOpen, avatarOpen]);

  const avatarInitial = user
    ? (profile?.fullName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()
    : null;

  return (
    <div
      className="flex-shrink-0 flex items-center justify-between"
      style={{
        height: 60,
        padding: "0 16px 0 18px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Left: ← · title · [Generating] */}
      <div className="flex items-center gap-3 min-w-0">
        {!readonly && onBack && (
          <button
            onClick={onBack}
            title="Back to home"
            style={{
              width: 34, height: 34,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 7, border: "none", background: "transparent",
              color: "var(--text3)", cursor: "pointer",
              transition: "background 100ms, color 100ms", flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.05)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text3)";
            }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={17} />
          </button>
        )}

        <span
          style={{
            fontSize: 15, fontWeight: 600, color: "var(--text)",
            letterSpacing: "-0.025em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            maxWidth: 320,
          }}
        >
          {title}
        </span>

        <AnimatePresence>
          {isStreaming && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                fontSize: 11, fontWeight: 600,
                padding: "3px 10px", borderRadius: 999,
                background: "var(--green-soft)", color: "var(--green)",
                flexShrink: 0, letterSpacing: "0.04em", textTransform: "uppercase",
              }}
            >
              Generating
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Present + Share + avatar (editor) OR branding (readonly) */}
      {readonly ? (
        <Link
          href="/"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            textDecoration: "none", flexShrink: 0,
            opacity: 1, transition: "opacity 120ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.75"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
        >
          <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text3)", letterSpacing: "-0.01em" }}>
            Made with
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", letterSpacing: "-0.02em" }}>
            OpenSlide
          </span>
          <HugeiconsIcon icon={LinkSquare01Icon} size={13} style={{ color: "var(--accent)", marginTop: 1 }} />
        </Link>
      ) : null}
      <div className="flex items-center gap-2.5" style={{ display: readonly ? "none" : undefined }}>

        {onPresent && slidesCount > 0 && !isDocsMode && (
          <button
            onClick={onPresent}
            title="Present"
            style={{
              display: "flex", alignItems: "center", gap: 7,
              height: 34, padding: "0 16px",
              borderRadius: 8, border: "none",
              background: "var(--accent)", color: "white",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              letterSpacing: "-0.01em", flexShrink: 0,
              transition: "background 100ms, opacity 100ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
          >
            <HugeiconsIcon icon={PlayIcon} size={13} />
            Present
          </button>
        )}

        {/* Connectors button + popover */}
        <div style={{ position: "relative" }}>
          <button
            ref={connectorBtnRef}
            onClick={() => setConnectorsOpen((o) => !o)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 12px", fontSize: "13px", color: "var(--text2)",
              background: connectorsOpen ? "var(--bg2)" : "transparent",
              border: "1px solid var(--border)", borderRadius: "var(--r-md)",
              cursor: "pointer",
            }}
          >
            Connectors
          </button>
          <ConnectorPopover
            open={connectorsOpen}
            onClose={() => setConnectorsOpen(false)}
            onOpenModal={() => setConnectorModalOpen(true)}
            anchorRef={connectorBtnRef}
          />
        </div>
        <ConnectorModal
          open={connectorModalOpen}
          onClose={() => setConnectorModalOpen(false)}
        />

        {/* Share button + popover */}
        <div ref={shareRef} style={{ position: "relative" }}>
          <button
            title="Share"
            onClick={() => setShareOpen((o) => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 34, padding: "0 14px",
              borderRadius: 8,
              border: shareOpen ? "1px solid var(--border-strong)" : "1px solid var(--border)",
              background: shareOpen ? "var(--bg2)" : "var(--bg)",
              color: shareOpen ? "var(--text)" : "var(--text2)",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "border-color 100ms, color 100ms, background 100ms",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!shareOpen) {
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.color = "var(--text)";
              }
            }}
            onMouseLeave={(e) => {
              if (!shareOpen) {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text2)";
              }
            }}
          >
            <HugeiconsIcon icon={Share03Icon} size={15} />
            Share
          </button>

          <AnimatePresence>
            {shareOpen && (
              <SharePopover
                sessionId={sessionId}
                onClose={() => setShareOpen(false)}
                initialIsPublic={initialIsPublic}
                initialIsReplay={initialIsReplay}
                onShareChange={onShareChange}
                sessionType={sessionType}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Avatar + dropdown */}
        {avatarInitial && (
          <div ref={avatarRef} style={{ position: "relative" }}>
            <button
              onClick={() => setAvatarOpen(o => !o)}
              style={{
                width: 34, height: 34, borderRadius: "50%",
                background: profile?.avatarUrl ? "transparent" : "var(--accent-soft)",
                color: "var(--accent-text)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 600, flexShrink: 0,
                cursor: "pointer", border: "none",
                overflow: "hidden",
                transition: "box-shadow 150ms",
                boxShadow: avatarOpen ? "0 0 0 2px var(--accent)" : "none",
              }}
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                avatarInitial
              )}
            </button>

            <AnimatePresence>
              {avatarOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    width: 240,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                    zIndex: 100,
                    overflow: "hidden",
                  }}
                >
                  {/* User info header */}
                  <div style={{ padding: "14px 16px 12px" }}>
                    <p style={{
                      margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--text)",
                      letterSpacing: "-0.015em", lineHeight: 1.3,
                    }}>
                      {profile?.fullName ?? user?.email?.split("@")[0] ?? "User"}
                    </p>
                    <p style={{
                      margin: 0, fontSize: 12, color: "var(--text3)",
                      lineHeight: 1.3, marginTop: 2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {user?.email ?? ""}
                    </p>
                  </div>

                  <div style={{ height: 1, background: "var(--border)" }} />

                  {/* Menu items */}
                  <div style={{ padding: "4px 6px" }}>
                    <button
                      onClick={() => { setAvatarOpen(false); setSettingsOpen(true); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 10px", borderRadius: 8,
                        border: "none", background: "transparent", color: "var(--text2)",
                        fontSize: 13, fontWeight: 450, cursor: "pointer",
                        textAlign: "left", transition: "background 100ms, color 100ms",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--text)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text2)"; }}
                    >
                      <HugeiconsIcon icon={Settings01Icon} size={16} />
                      Settings
                    </button>
                  </div>

                  <div style={{ height: 1, background: "var(--border)", margin: "0 6px" }} />

                  <div style={{ padding: "4px 6px 6px" }}>
                    <button
                      onClick={async () => {
                        setAvatarOpen(false);
                        const supabase = getSupabase();
                        await supabase.auth.signOut();
                        window.location.href = "/";
                      }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 10px", borderRadius: 8,
                        border: "none", background: "transparent", color: "var(--red)",
                        fontSize: 13, fontWeight: 450, cursor: "pointer",
                        textAlign: "left", transition: "background 100ms",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red-soft)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <HugeiconsIcon icon={Logout03Icon} size={16} />
                      Log out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Settings modal */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
