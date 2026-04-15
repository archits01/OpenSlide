"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { InputToolbar, type PendingAttachment } from "@/components/shared/InputToolbar";
import { AuthModal } from "@/components/shared/AuthModal";
import { createClient } from "@/lib/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp02Icon, Settings01Icon, Logout03Icon, Cancel01Icon, ArrowLeft02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { buildSlideHtml } from "@/lib/slide-html";
import type { ThemeName } from "@/agent/tools/set-theme";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SettingsModal } from "@/components/shared/SettingsModal";
import { Footer } from "@/components/layout/Footer";
import { useProfile, clearProfileCache } from "@/lib/hooks/useProfile";

// ─── Seamless Looping Video (Staggered Crossfade) ──────────────────

function SeamlessVideo({ src, className, style }: { src: string; className?: string; style?: React.CSSProperties }) {
  const videoA = useRef<HTMLVideoElement>(null);
  const videoB = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vA = videoA.current;
    const vB = videoB.current;
    if (!vA || !vB) return;

    vA.playbackRate = 0.9;
    vB.playbackRate = 0.9;

    let req: number;
    let bStarted = false;

    // Tightened fade zone so the video plays 100% visible for the beautiful starting sequence
    const FADE_ZONE_SECONDS = 1.8;

    const loopEngine = () => {
      req = requestAnimationFrame(loopEngine);

      if (!vA.duration) return;

      const dur = vA.duration;
      const halfTime = dur / 2;

      // 1. Stagger the startup perfectly
      // We start video B so it is exactly half a loop behind video A
      if (!bStarted && vA.currentTime >= halfTime) {
        bStarted = true;
        // Setting it once while invisible prevents stuttering later
        vB.currentTime = 0; 
        vB.play().catch(() => {});
      }

      if (bStarted) {
        // 2. Compute dynamic opacity
        // We want videoB to be fully visible (opacity 1) whenever videoA hits its start/end loop point.
        // We want videoA to be fully visible (videoB opacity 0) whenever videoB hits its loop point.
        
        // Find how close video A is to either the start or the end of its clip
        const distA = Math.min(vA.currentTime, dur - vA.currentTime);
        
        let targetOp = 0;
        if (distA < FADE_ZONE_SECONDS) {
          // Ramp from 0 to 1 as it gets closer to the cut point
          targetOp = 1 - (distA / FADE_ZONE_SECONDS);
        }

        // Apply smooth opacity. No blurs, no scaling, just raw crystal-clear crossfading.
        vB.style.opacity = targetOp.toFixed(3);
      }
    };

    req = requestAnimationFrame(loopEngine);

    return () => cancelAnimationFrame(req);
  }, []);

  return (
    <div className={className} style={{ ...style, position: "absolute", overflow: "hidden" }}>
      {/* Video A (Main loop) */}
      <video
        ref={videoA}
        suppressHydrationWarning
        autoPlay muted loop playsInline preload="auto"
        poster="/videos/bg-hero-poster.jpg"
        src={src}
        className="absolute inset-0 w-full h-full"
        style={{ 
          objectFit: "inherit", 
          objectPosition: "inherit",
          filter: "contrast(1.12) saturate(1.15) brightness(0.9)",
        }}
      />
      {/* Video B (Hides the loop cut of A, and vice versa) */}
      <video
        ref={videoB}
        suppressHydrationWarning
        muted loop playsInline preload="auto"
        poster="/videos/bg-hero-poster.jpg"
        src={src}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ 
          objectFit: "inherit", 
          objectPosition: "inherit",
          opacity: 0,
          filter: "contrast(1.12) saturate(1.15) brightness(0.9)",
          willChange: "opacity"
        }}
      />
    </div>
  );
}

// ─── Templates ──────────────────────────────────────────────────────────────

interface TemplateSlide {
  id: string;
  index: number;
  title: string;
  content: string;
  theme: string | null;
  layout: string;
}

interface Template {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category: string;
  tags?: string[];
  bg: string;
  prompt: string;
  sessionId?: string | null;
  theme?: string;
  themeColors?: Record<string, string> | null;
  slides: TemplateSlide[];
}

// ─── Slide preview helper ────────────────────────────────────────────────────

function SlidePreview({
  slide,
  theme,
  width,
  height,
  className,
  style,
}: {
  slide: TemplateSlide;
  theme: string;
  width: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const scale = width / 1280;
  const h = height ?? width * (720 / 1280);
  const html = buildSlideHtml(
    { id: slide.id, index: slide.index, title: slide.title, content: slide.content, layout: slide.layout as "content", },
    (slide.theme ?? theme ?? "minimal") as ThemeName,
    null,
    true
  );
  return (
    <div className={className} style={{ width, height: h, overflow: "hidden", position: "relative", ...style }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 1280, height: 720, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <iframe srcDoc={html} sandbox="allow-same-origin" scrolling="no" style={{ display: "block", width: 1280, height: 720, border: "none", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

// ─── Template Detail Modal ───────────────────────────────────────────────────

function TemplateDetailModal({
  template,
  onClose,
  onUse,
}: {
  template: Template;
  onClose: () => void;
  onUse: (t: Template) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const theme = template.theme ?? "minimal";
  const activeSlide = template.slides[activeIndex];

  // Scroll thumbnail strip to keep active in view
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const thumb = strip.children[activeIndex] as HTMLElement | undefined;
    if (thumb) thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeIndex]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && activeIndex > 0) setActiveIndex((i) => i - 1);
      if (e.key === "ArrowRight" && activeIndex < template.slides.length - 1) setActiveIndex((i) => i + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, activeIndex, template.slides.length]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: 9999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex flex-col"
          style={{
            width: "min(90vw, 960px)",
            maxHeight: "min(90vh, 700px)",
            background: "#1a1a1e",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "white", letterSpacing: "-0.01em" }}>Template Details</p>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>
          </div>

          {/* Body: slide preview + info */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left: large slide preview */}
            <div className="flex-1 flex items-center justify-center p-6" style={{ minWidth: 0 }}>
              {activeSlide && (
                <div style={{ width: "100%", maxWidth: 640, aspectRatio: "16/9", borderRadius: 8, overflow: "hidden", background: "#111" }}>
                  <SlidePreview slide={activeSlide} theme={theme} width={640} />
                </div>
              )}
            </div>

            {/* Right: info panel */}
            <div className="flex flex-col gap-4 py-6 pr-6" style={{ width: 280, flexShrink: 0 }}>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "white", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
                  {template.title}
                </p>
                {template.description && (
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginTop: 8 }}>
                    {template.description}
                  </p>
                )}
              </div>

              {/* Tags */}
              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 12,
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.7)",
                        fontWeight: 500,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex-1" />

              {/* Use This Template button */}
              <button
                onClick={() => onUse(template)}
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 10,
                  background: "#4338CA",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 150ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#3730A3"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#4338CA"; }}
              >
                Use This Template
              </button>
            </div>
          </div>

          {/* Bottom: thumbnail strip */}
          {template.slides.length > 1 && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "12px 16px", position: "relative" }}>
              <div className="flex items-center gap-2">
                {/* Left arrow */}
                <button
                  onClick={() => { const el = stripRef.current; if (el) el.scrollBy({ left: -200, behavior: "smooth" }); }}
                  className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
                >
                  <HugeiconsIcon icon={ArrowLeft02Icon} size={14} />
                </button>

                {/* Scrollable strip */}
                <div
                  ref={stripRef}
                  className="flex gap-2 overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: "none", scrollBehavior: "smooth" }}
                >
                  {template.slides.map((slide, i) => (
                    <div
                      key={slide.id}
                      onClick={() => setActiveIndex(i)}
                      className="flex-shrink-0 cursor-pointer rounded-md overflow-hidden"
                      style={{
                        width: 110,
                        height: 62,
                        border: i === activeIndex ? "2px solid #4338CA" : "2px solid transparent",
                        opacity: i === activeIndex ? 1 : 0.6,
                        transition: "border-color 150ms, opacity 150ms",
                      }}
                    >
                      <SlidePreview slide={slide} theme={theme} width={110} height={62} />
                    </div>
                  ))}
                </div>

                {/* Right arrow */}
                <button
                  onClick={() => { const el = stripRef.current; if (el) el.scrollBy({ left: 200, behavior: "smooth" }); }}
                  className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
                >
                  <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ─── Template Card ───────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onUseTemplate,
  onOpenDetail,
}: {
  template: Template;
  onUseTemplate: (t: Template) => void;
  onOpenDetail: (t: Template) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [useHovered, setUseHovered] = useState(false);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [thumbW, setThumbW] = useState(260);
  const theme = template.theme ?? "minimal";
  const firstSlide = template.slides[0];

  useEffect(() => {
    const el = thumbRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setThumbW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className="text-left rounded-[14px] overflow-hidden cursor-pointer"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: hovered
          ? "0 0 12px rgba(194, 24, 91, 0.12), 0 4px 16px rgba(0,0,0,0.20)"
          : "none",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "transform 300ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 300ms cubic-bezier(0.25, 1, 0.5, 1), border-color 300ms",
        borderColor: hovered ? "rgba(194, 24, 91, 0.25)" : "rgba(255,255,255,0.08)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpenDetail(template)}
    >
      {/* Thumbnail — real slide preview */}
      <div
        ref={thumbRef}
        className="w-full relative"
        style={{ aspectRatio: "16/9", overflow: "hidden", background: template.bg }}
      >
        {firstSlide && thumbW > 0 && (
          <SlidePreview slide={firstSlide} theme={theme} width={thumbW} />
        )}

        {/* Hover overlay with "Use style" button */}
        <div
          className="absolute inset-0 flex items-end justify-center pb-3"
          style={{
            background: "rgba(0,0,0,0.32)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 150ms ease",
            pointerEvents: hovered ? "auto" : "none",
          }}
        >
          <div
            onMouseEnter={() => setUseHovered(true)}
            onMouseLeave={() => setUseHovered(false)}
            onClick={(e) => {
              e.stopPropagation();
              onUseTemplate(template);
            }}
            className="flex items-center gap-1.5"
            style={{
              background: useHovered ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.96)",
              borderRadius: 20,
              padding: useHovered ? "7px 16px 7px 12px" : "5px 11px 5px 9px",
              transform: hovered ? "translateY(0)" : "translateY(6px)",
              transition: "all 200ms cubic-bezier(0.25, 1, 0.5, 1)",
              boxShadow: useHovered
                ? "0 4px 16px rgba(0,0,0,0.25)"
                : "0 2px 8px rgba(0,0,0,0.18)",
            }}
          >
            <HugeiconsIcon icon={ArrowUp02Icon} size={useHovered ? 16 : 14} style={{ color: "var(--accent)", transition: "all 150ms" }} />
            <span style={{
              fontSize: useHovered ? 13 : 12,
              fontWeight: 600,
              color: "#111",
              letterSpacing: "-0.01em",
              transition: "all 150ms",
            }}>
              Use style
            </span>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div
        className="px-3.5 py-3"
        style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}
      >
        <p
          className="text-[13.5px] font-semibold truncate leading-tight"
          style={{ color: "var(--text)", letterSpacing: "-0.01em" }}
        >
          {template.title}
        </p>
      </div>
    </div>
  );
}

const PENDING_PROMPT_KEY = "openslide-pending-prompt";

// Isolated so useSearchParams() stays inside a Suspense boundary
function ParamWatcher({ onAuth }: { onAuth: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("auth") === "1") {
      onAuth();
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams, onAuth]);
  return null;
}

export default function ExplorePage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  // Pre-generated sessionId so uploads work before the user hits send
  const [preSessionId, setPreSessionId] = useState(() => crypto.randomUUID());
  const [visibleTemplates, setVisibleTemplates] = useState(8);
  const [detailTemplate, setDetailTemplate] = useState<Template | null>(null);
  const inputToolbarRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const { profile, refresh: refreshProfile } = useProfile();

  // Lazy ref — createClient() only ever called client-side (avoids SSR prerender crash)
  const supabaseRef = useRef<SupabaseClient | null>(null);
  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  // Resolve current auth state and listen for changes
  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN") {
        // User just signed in — bust the stale null cache and fetch real profile
        clearProfileCache();
        refreshProfile();
      } else if (!session?.user) {
        clearProfileCache();
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch templates from Supabase
  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => { if (data.templates) setTemplates(data.templates); })
      .catch(() => {});
  }, []);

  function handleSend(message: string, options?: { deepResearch?: boolean; docsMode?: boolean; attachments?: PendingAttachment[] }) {
    if (!user) {
      sessionStorage.setItem(PENDING_PROMPT_KEY, message);
      if (options?.deepResearch) sessionStorage.setItem("openslide-pending-deep-research", "true");
      if (options?.docsMode) sessionStorage.setItem("openslide-pending-docs-mode", "true");
      // Persist ready attachment metadata so auth → navigate flow can pick them up
      const readyAtts = (options?.attachments ?? []).filter((a) => a.status === "ready");
      if (readyAtts.length) sessionStorage.setItem(`pending-attachments:${preSessionId}`, JSON.stringify(readyAtts));
      setAuthOpen(true);
      return;
    }
    navigateToEditor(message, options?.deepResearch, options?.docsMode, options?.attachments);
  }

  function navigateToEditor(message: string, deepResearch?: boolean, docsMode?: boolean, attachments?: PendingAttachment[]) {
    const id = preSessionId;
    sessionStorage.setItem(`pending-prompt:${id}`, message);
    if (deepResearch) sessionStorage.setItem(`pending-deep-research:${id}`, "true");
    if (docsMode) sessionStorage.setItem(`pending-docs-mode:${id}`, "true");
    // If user picked a template, persist its slug so the editor can skip the LLM classifier
    if (selectedTemplate?.slug) sessionStorage.setItem(`pending-template-slug:${id}`, selectedTemplate.slug);
    const readyAtts = (attachments ?? []).filter((a) => a.status === "ready");
    if (readyAtts.length) sessionStorage.setItem(`pending-attachments:${id}`, JSON.stringify(readyAtts));
    // Rotate preSessionId so next upload on the explore page gets a fresh bucket
    setPreSessionId(crypto.randomUUID());
    router.push(`/editor/${id}`);
  }

  function handleUseTemplate(t: Template) {
    setSelectedTemplate(t);
    setDetailTemplate(null);
    // Scroll up to InputToolbar so the user sees the loaded prompt
    setTimeout(() => {
      inputToolbarRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  function handleAuthSuccess() {
    const pending = sessionStorage.getItem(PENDING_PROMPT_KEY);
    const pendingDeep = sessionStorage.getItem("openslide-pending-deep-research") === "true";
    const pendingDocs = sessionStorage.getItem("openslide-pending-docs-mode") === "true";
    const pendingAttsRaw = sessionStorage.getItem(`pending-attachments:${preSessionId}`);
    const pendingAtts: PendingAttachment[] = pendingAttsRaw ? JSON.parse(pendingAttsRaw) : [];
    sessionStorage.removeItem(PENDING_PROMPT_KEY);
    sessionStorage.removeItem("openslide-pending-deep-research");
    sessionStorage.removeItem("openslide-pending-docs-mode");
    // Don't remove pending-attachments here — navigateToEditor will use it and the editor reads it
    if (pending) {
      navigateToEditor(pending, pendingDeep, pendingDocs, pendingAtts);
    }
  }

  async function handleSignOut() {
    await getSupabase().auth.signOut();
    setUser(null);
  }

  // Close avatar dropdown on outside click (dropdown is portalled, so check both refs)
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!avatarOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        avatarRef.current && !avatarRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [avatarOpen]);


  return (
    <div className="flex h-full overflow-hidden" style={{ background: "var(--app-bg)" }}>
      {/* White floating card */}
      <div
        className="flex-1 rounded-[var(--r-xl)] overflow-hidden flex flex-col relative my-2 mr-2"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* Auth button — top-right */}
        {!authLoading && (
          user ? (
            <div ref={avatarRef} className="absolute" style={{ top: 16, right: 16, zIndex: 50, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setAvatarOpen(o => !o)}
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: profile?.avatarUrl ? "transparent" : "var(--accent-soft)",
                    color: "var(--accent-text)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 600, flexShrink: 0,
                    cursor: "pointer", border: "none", overflow: "hidden",
                    transition: "box-shadow 150ms",
                    boxShadow: avatarOpen ? "0 0 0 2px var(--accent)" : "none",
                  }}
                >
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    (profile?.fullName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()
                  )}
                </button>
              </div>

              {/* Dropdown portalled to body to escape overflow:hidden on card */}
              {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                  {avatarOpen && (
                    <motion.div
                      ref={dropdownRef}
                      initial={{ opacity: 0, scale: 0.97, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97, y: -4 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      style={{
                        position: "fixed",
                        top: avatarRef.current ? avatarRef.current.getBoundingClientRect().bottom + 8 : 60,
                        right: 16,
                        width: 240, background: "var(--bg)",
                        border: "1px solid var(--border)", borderRadius: 14,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                        zIndex: 9999, overflow: "hidden",
                      }}
                    >
                      <div style={{ padding: "14px 16px 12px" }}>
                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.015em", lineHeight: 1.3 }}>
                          {profile?.fullName ?? user.email?.split("@")[0] ?? "User"}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: "var(--text3)", lineHeight: 1.3, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {user.email ?? ""}
                        </p>
                      </div>
                      <div style={{ height: 1, background: "var(--border)" }} />
                      <div style={{ padding: "4px 6px" }}>
                        <button
                          onClick={() => { setAvatarOpen(false); setSettingsOpen(true); }}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                            padding: "9px 10px", borderRadius: 8,
                            border: "none", background: "transparent", color: "var(--text2)",
                            fontSize: 13, fontWeight: 450, cursor: "pointer", textAlign: "left",
                            transition: "background 100ms, color 100ms",
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
                          onClick={() => { setAvatarOpen(false); handleSignOut(); }}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                            padding: "9px 10px", borderRadius: 8,
                            border: "none", background: "transparent", color: "var(--red)",
                            fontSize: 13, fontWeight: 450, cursor: "pointer", textAlign: "left",
                            transition: "background 100ms",
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
                </AnimatePresence>,
                document.body
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="absolute hidden md:flex items-center transition-all duration-150"
              style={{
                top: 16,
                right: 16,
                zIndex: 50,
                height: 34,
                padding: "0 16px",
                borderRadius: 99,
                background: "var(--accent)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                boxShadow: "0 1px 2px rgba(194,24,91,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 6px rgba(194,24,91,0.32), inset 0 1px 0 rgba(255,255,255,0.12)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 2px rgba(194,24,91,0.25), inset 0 1px 0 rgba(255,255,255,0.12)";
              }}
            >
              Log in
            </button>
          )
        )}
        <div className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", background: "var(--app-bg)" }}>

          {/* ── Hero: video background + heading + prompt bar ── */}
          <div className="relative overflow-hidden" style={{ minHeight: "100vh" }}>
            {/* Tree video background — staggered crossfade with rolled timeline for seamless calm loop */}
            <SeamlessVideo
              src="/videos/bg-hero.mp4"
              className="absolute w-full h-full"
              style={{
                top: 0,
                left: 0,
                objectFit: "cover",
                objectPosition: "center 65%",
                filter: "contrast(1.12) saturate(1.15) brightness(0.9)",
                willChange: "transform",
                transform: "translateZ(0)",
              }}
            />
            {/* Minimal gradient overlays for text legibility */}
            <div className="absolute inset-0" style={{
              background: "linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 50%, transparent 70%)",
            }} />
            <div className="absolute inset-0" style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 30%, rgba(0,0,0,0.5) 100%)",
            }} />
            {/* Radial vignette directly behind the center content to guarantee legibility against bright bloom */}
            <div className="absolute inset-0" style={{
              background: "radial-gradient(circle at 50% 38%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 25%, transparent 40%)",
            }} />

            {/* Hero content */}
            <div className="relative z-10 flex flex-col items-center px-4 md:px-8 pt-[20vh] md:pt-[28vh] pb-14">
              <div className="w-full max-w-2xl flex flex-col items-center gap-8 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
                >
                  <h1
                    className="text-[28px] md:text-[42px] font-semibold tracking-[-0.04em] mb-3.5"
                    style={{ color: "white", lineHeight: 1.1, textShadow: "0 4px 28px rgba(0,0,0,0.6), 0 2px 10px rgba(0,0,0,0.4)" }}
                  >
                    Great slides start here
                  </h1>
                  <p className="text-[14px] md:text-[16.5px]" style={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.6, textShadow: "0 2px 14px rgba(0,0,0,0.5)" }}>
                    One prompt is all it takes — OpenSlide builds it for you.
                  </p>
                </motion.div>

                <motion.div
                  className="w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
                  style={{
                    "--surface": "#141012",
                    "--border": "rgba(255,255,255,0.12)",
                    "--text2": "rgba(255,255,255,0.75)",
                    "--text3": "rgba(255,255,255,0.5)",
                  } as React.CSSProperties}
                >
                  <div ref={inputToolbarRef} style={{ borderRadius: 24 }}>
                    <InputToolbar
                      onSend={handleSend}
                      isStreaming={false}
                      placeholder="Describe the presentation you want to create…"
                      sessionId={preSessionId}
                      selectedTemplate={selectedTemplate ? {
                        ...selectedTemplate,
                        prompt: selectedTemplate.prompt,
                        firstSlideHtml: selectedTemplate.slides[0]
                          ? buildSlideHtml(
                              selectedTemplate.slides[0] as import("@/lib/types").Slide,
                              (selectedTemplate.theme ?? "minimal") as ThemeName,
                            )
                          : undefined,
                      } : undefined}
                      onClearTemplate={() => setSelectedTemplate(null)}
                      animatedPlaceholder
                      focusAnimation
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* ── Styles section ── */}
          <div className="pb-16 mx-auto px-4 md:px-8" style={{
            maxWidth: 1100, width: "100%", paddingTop: 12, position: "relative", zIndex: 5,
          }}>
            {/* Header */}
            <motion.div
              className="flex items-center justify-between mb-5"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            >
              <h2
                className="text-[20px] md:text-[26px] font-semibold"
                style={{ color: "white", letterSpacing: "-0.015em" }}
              >
                Styles{" "}
                <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
                  | Created in OpenSlide
                </span>
              </h2>
            </motion.div>

            {/* Styles grid — 4 per row */}
            <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
              {templates.slice(0, visibleTemplates).map((template, i) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i, 3) * 0.06, ease: [0.25, 1, 0.5, 1] }}
                >
                  <TemplateCard
                    template={template}
                    onUseTemplate={handleUseTemplate}
                    onOpenDetail={(t) => setDetailTemplate(t)}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Load More ── */}
          {visibleTemplates < templates.length && (
            <div className="flex justify-center pb-16 pt-4" style={{ position: "relative", zIndex: 5 }}>
              <button
                onClick={() => setVisibleTemplates((v) => Math.min(v + 4, templates.length))}
                className="flex items-center gap-2 h-10 px-7 rounded-full text-[13.5px] font-medium"
                style={{
                  background: "transparent",
                  color: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  cursor: "pointer",
                  transition: "all 150ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                }}
              >
                Load more
              </button>
            </div>
          )}

          {/* ── Footer ── */}
          <div style={{ padding: "16px 40px 16px" }}>
            <Footer />
          </div>

        </div>
      </div>
      {detailTemplate && (
        <TemplateDetailModal
          template={detailTemplate}
          onClose={() => setDetailTemplate(null)}
          onUse={handleUseTemplate}
        />
      )}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {/* Reads ?auth=1 set by middleware when unauthenticated user hits /editor */}
      <Suspense>
        <ParamWatcher onAuth={() => setAuthOpen(true)} />
      </Suspense>
    </div>
  );
}
