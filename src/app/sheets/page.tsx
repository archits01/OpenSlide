"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  LayoutGridIcon,
  ListViewIcon,
  Add01Icon,
  MoreVerticalIcon,
  Delete01Icon,
  SquareArrowUpRightIcon,
  GridTableIcon,
} from "@hugeicons/core-free-icons";
import type { SessionSummary } from "@/lib/redis";
import { Footer } from "@/components/layout/Footer";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
  "linear-gradient(135deg, #292524 0%, #44403c 100%)",
  "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)",
  "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
  "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
  "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
];

function pickGradient(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return FALLBACK_GRADIENTS[Math.abs(h) % FALLBACK_GRADIENTS.length];
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ts));
}

// ─── Sheet thumbnail ────────────────────────────────────────────────────────

function SheetThumb({ session }: { session: SessionSummary }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  if (!session.firstSlide) {
    return (
      <div
        ref={ref}
        style={{
          width: "100%",
          aspectRatio: "16/10",
          background: pickGradient(session.id),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <HugeiconsIcon
          icon={GridTableIcon}
          size={28}
          style={{ color: "rgba(255,255,255,0.3)" }}
        />
      </div>
    );
  }

  const nativeW = 1280;
  const nativeH = 800;
  const scale = width / nativeW;

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        aspectRatio: "16/10",
        overflow: "hidden",
        position: "relative",
        background: pickGradient(session.id),
      }}
    >
      {width > 0 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: nativeW,
            height: nativeH,
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          <iframe
            key={session.id}
            srcDoc={session.firstSlide.content}
            sandbox="allow-same-origin"
            scrolling="no"
            style={{
              display: "block",
              width: nativeW,
              height: nativeH,
              border: "none",
              pointerEvents: "none",
            }}
          />
        </div>
      )}
    </div>
  );
}

function MiniSheetThumb({ session }: { session: SessionSummary }) {
  if (!session.firstSlide) {
    return (
      <div
        style={{
          width: 80,
          height: 50,
          borderRadius: 5,
          background: pickGradient(session.id),
          flexShrink: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <HugeiconsIcon
          icon={GridTableIcon}
          size={16}
          style={{ color: "rgba(255,255,255,0.3)" }}
        />
      </div>
    );
  }

  const nativeW = 1280;
  const nativeH = 800;
  const w = 80;
  const scale = w / nativeW;

  return (
    <div
      style={{
        width: 80,
        height: 50,
        borderRadius: 5,
        overflow: "hidden",
        position: "relative",
        flexShrink: 0,
        background: pickGradient(session.id),
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: nativeW,
          height: nativeH,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        <iframe
          key={session.id}
          srcDoc={session.firstSlide.content}
          sandbox="allow-same-origin"
          scrolling="no"
          style={{
            display: "block",
            width: nativeW,
            height: nativeH,
            border: "none",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

// ─── Card menu ────────────────────────────────────────────────────────────────

function CardMenu({
  onOpen,
  onDelete,
}: {
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-7 h-7 flex items-center justify-center rounded-[var(--r-md)] transition-colors"
        style={{ background: "rgba(255,255,255,0.85)", color: "#333", backdropFilter: "blur(4px)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.85)";
        }}
      >
        <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 rounded-[var(--r-lg)] overflow-hidden"
          style={{
            top: "100%",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 24px -4px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
            zIndex: 50,
            minWidth: 140,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem
            icon={<HugeiconsIcon icon={SquareArrowUpRightIcon} size={15} />}
            label="Open"
            onClick={() => { setOpen(false); onOpen(); }}
          />
          <div style={{ height: 1, background: "var(--border)", margin: "2px 0" }} />
          <MenuItem
            icon={<HugeiconsIcon icon={Delete01Icon} size={15} />}
            label="Delete"
            danger
            onClick={() => { setOpen(false); onDelete(); }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors"
      style={{ color: danger ? "var(--red)" : "var(--text2)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = danger
          ? "var(--red-soft)"
          : "rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLButtonElement).style.color = danger
          ? "var(--red)"
          : "var(--text)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        (e.currentTarget as HTMLButtonElement).style.color = danger
          ? "var(--red)"
          : "var(--text2)";
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ─── Grid card ────────────────────────────────────────────────────────────────

function GridCard({
  session,
  onOpen,
  onDelete,
}: {
  session: SessionSummary;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-[var(--r-lg)] overflow-hidden cursor-pointer"
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        boxShadow: hovered
          ? "0 8px 30px -4px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.04)"
          : "0 1px 3px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "transform 300ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 300ms cubic-bezier(0.25, 1, 0.5, 1)",
      }}
    >
      <div style={{ position: "relative" }}>
        <SheetThumb session={session} />

        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.28)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 150ms ease",
            pointerEvents: hovered ? "auto" : "none",
          }}
        >
          <div
            className="flex items-center gap-1.5"
            style={{
              background: "rgba(255,255,255,0.95)",
              borderRadius: 20,
              padding: "6px 14px",
              transform: hovered ? "translateY(0)" : "translateY(6px)",
              transition: "transform 200ms ease",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            }}
          >
            <HugeiconsIcon icon={SquareArrowUpRightIcon} size={13} style={{ color: "#4F46E5" }} />
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "#111",
                letterSpacing: "-0.01em",
              }}
            >
              Open
            </span>
          </div>
        </div>

        <div
          className="absolute"
          style={{ top: 8, right: 8, opacity: hovered ? 1 : 0, transition: "opacity 150ms ease" }}
          onClick={(e) => e.stopPropagation()}
        >
          <CardMenu onOpen={onOpen} onDelete={onDelete} />
        </div>
      </div>

      <div
        className="px-3.5 py-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <p
          className="text-[13px] font-semibold truncate"
          style={{ color: "var(--text)", letterSpacing: "-0.01em" }}
        >
          {session.title}
        </p>
        <p className="text-[11.5px] mt-0.5" style={{ color: "var(--text3)" }}>
          {session.slideCount > 0
            ? `${session.slideCount} sheet${session.slideCount !== 1 ? "s" : ""} · `
            : ""}
          {formatDate(session.updatedAt)}
        </p>
      </div>
    </div>
  );
}

// ─── List row ─────────────────────────────────────────────────────────────────

function ListRow({
  session,
  onOpen,
  onDelete,
}: {
  session: SessionSummary;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-3.5 px-4 py-3 rounded-[var(--r-md)] cursor-pointer transition-colors"
      style={{ background: hovered ? "rgba(0,0,0,0.03)" : "transparent" }}
    >
      <MiniSheetThumb session={session} />
      <div className="flex-1 min-w-0">
        <p
          className="text-[13.5px] font-medium truncate"
          style={{ color: "var(--text)", letterSpacing: "-0.01em" }}
        >
          {session.title}
        </p>
        <p className="text-[12px] mt-0.5" style={{ color: "var(--text3)" }}>
          {session.slideCount > 0
            ? `${session.slideCount} sheet${session.slideCount !== 1 ? "s" : ""} · `
            : ""}
          {formatDate(session.updatedAt)}
        </p>
      </div>
      <CardMenu onOpen={onOpen} onDelete={onDelete} />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 pb-16">
      {/* Spreadsheet illustration */}
      <div style={{ position: "relative", width: 120, height: 90 }}>
        <div
          style={{
            width: 120,
            height: 90,
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            display: "grid",
            gridTemplateColumns: "24px 1fr 1fr 1fr",
            gridTemplateRows: "20px 1fr 1fr 1fr",
            overflow: "hidden",
          }}
        >
          {/* Header row */}
          <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }} />
          <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 2, borderRadius: 1, background: "var(--border-hover)" }} />
          </div>
          <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 2, borderRadius: 1, background: "var(--border-hover)" }} />
          </div>
          <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 2, borderRadius: 1, background: "var(--border-hover)" }} />
          </div>
          {/* Data rows */}
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ borderRight: i % 4 !== 3 ? "1px solid var(--border)" : undefined, borderBottom: Math.floor(i / 4) < 2 ? "1px solid var(--border)" : undefined, background: i % 4 === 0 ? "var(--bg2)" : "var(--bg)" }} />
          ))}
        </div>
      </div>

      <div className="text-center">
        <p
          className="text-[15px] font-semibold mb-1"
          style={{ color: "var(--text)", letterSpacing: "-0.01em" }}
        >
          No spreadsheets yet
        </p>
        <p className="text-[13px]" style={{ color: "var(--text3)" }}>
          Create your first one with the AI agent
        </p>
      </div>

      <button
        onClick={onNew}
        className="flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-medium transition-all duration-150"
        style={{
          background: "var(--accent)",
          color: "white",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent)")
        }
      >
        <HugeiconsIcon icon={Add01Icon} size={14} />
        New spreadsheet
      </button>
    </div>
  );
}

// ─── Loading skeletons ────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-[var(--r-lg)] overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "16/10",
          background: "var(--bg2)",
        }}
      />
      <div className="px-3.5 py-3">
        <div
          style={{
            height: 13,
            width: "70%",
            borderRadius: 4,
            background: "var(--bg2)",
            marginBottom: 6,
          }}
        />
        <div
          style={{
            height: 11,
            width: "45%",
            borderRadius: 4,
            background: "var(--bg2)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Load More ────────────────────────────────────────────────────────────────

function LoadMoreButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 pt-6 pb-2">
      <div className="flex items-center gap-3 w-full max-w-xs">
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      <button
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-2 px-5 h-9 rounded-full text-[13px] font-medium transition-all duration-150"
        style={{
          background: "var(--bg2)",
          color: "var(--text2)",
          border: "1px solid var(--border)",
          opacity: loading ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (loading) return;
          const b = e.currentTarget as HTMLButtonElement;
          b.style.background = "var(--bg)";
          b.style.color = "var(--text)";
          b.style.borderColor = "var(--border-hover)";
          b.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
        }}
        onMouseLeave={(e) => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.background = "var(--bg2)";
          b.style.color = "var(--text2)";
          b.style.borderColor = "var(--border)";
          b.style.boxShadow = "none";
        }}
      >
        {loading ? "Loading..." : "Load more"}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SheetsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions?type=sheets");
      const data = await res.json();
      setSessions(data.sessions ?? []);
      setNextCursor(data.nextCursor ?? null);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/sessions?type=sheets&cursor=${nextCursor}`);
      const data = await res.json();
      setSessions((prev) => [...prev, ...(data.sessions ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleDelete(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/sessions?id=${id}`, { method: "DELETE" });
  }

  function handleOpen(id: string) {
    fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
    router.push(`/editor/${id}`);
  }

  function handleNew() {
    router.push("/");
  }

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(query.toLowerCase())
  );
  const visible = filtered;
  const hasMore = !!nextCursor;

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: "var(--app-bg)" }}
    >
      <div className="flex" style={{ minHeight: "100%" }}>
        <div
          className="flex-1 rounded-[var(--r-xl)] overflow-hidden flex flex-col m-2"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
        {/* ── Header ── */}
        <div
          className="flex flex-col md:flex-row md:items-center gap-3 px-4 md:px-7 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h1
            className="text-[17px] font-semibold"
            style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
          >
            My Spreadsheets
          </h1>

          <div className="hidden md:block flex-1" />

          <div className="flex items-center gap-2">

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 h-8 rounded-full flex-1 md:flex-none"
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              minWidth: 0,
            }}
          >
            <HugeiconsIcon icon={Search01Icon} size={14} style={{ color: "var(--text3)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent focus:outline-none text-[13px]"
              style={{ color: "var(--text)" }}
            />
          </div>

          {/* View toggle */}
          <div
            className="flex items-center p-0.5 rounded-[var(--r-md)]"
            style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
          >
            {(["grid", "list"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="w-7 h-7 flex items-center justify-center rounded-[5px] transition-colors"
                style={{
                  background: viewMode === mode ? "var(--bg)" : "transparent",
                  color: viewMode === mode ? "var(--text)" : "var(--text3)",
                  boxShadow: viewMode === mode ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {mode === "grid" ? (
                  <HugeiconsIcon icon={LayoutGridIcon} size={16} />
                ) : (
                  <HugeiconsIcon icon={ListViewIcon} size={16} />
                )}
              </button>
            ))}
          </div>

          {/* New button */}
          <button
            onClick={handleNew}
            className="flex items-center gap-1.5 px-3.5 h-8 rounded-full text-[13px] font-medium transition-colors"
            style={{
              background: "var(--accent)",
              color: "white",
              boxShadow: "0 1px 3px rgba(67, 56, 202, 0.20), inset 0 1px 0 rgba(255,255,255,0.10)",
              transition: "all 200ms cubic-bezier(0.25, 1, 0.5, 1)",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent)")
            }
          >
            <HugeiconsIcon icon={Add01Icon} size={13} />
            New
          </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div
          className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 p-4 md:p-7">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            query ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 pb-16">
                <p className="text-[14px] font-medium" style={{ color: "var(--text)" }}>
                  No results for &ldquo;{query}&rdquo;
                </p>
                <p className="text-[13px]" style={{ color: "var(--text3)" }}>
                  Try a different search term
                </p>
              </div>
            ) : (
              <EmptyState onNew={handleNew} />
            )
          ) : viewMode === "grid" ? (
            <div className="p-4 md:p-7">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {visible.map((s) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                  >
                    <GridCard
                      session={s}
                      onOpen={() => handleOpen(s.id)}
                      onDelete={() => handleDelete(s.id)}
                    />
                  </motion.div>
                ))}
              </div>
              {hasMore && <LoadMoreButton onClick={handleLoadMore} loading={loadingMore} />}
            </div>
          ) : (
            <div className="px-5 py-4 flex flex-col">
              {visible.map((s) => (
                <ListRow
                  key={s.id}
                  session={s}
                  onOpen={() => handleOpen(s.id)}
                  onDelete={() => handleDelete(s.id)}
                />
              ))}
              {hasMore && <LoadMoreButton onClick={handleLoadMore} loading={loadingMore} />}
            </div>
          )}
        </div>
      </div>
      </div>
      <div style={{ padding: "16px 40px 16px" }}>
        <Footer />
      </div>
    </div>
  );
}
