"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Search01Icon,
  Image01Icon,
  File01Icon,
  CheckmarkCircle02Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PendingAttachment } from "./InputToolbar";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"];

interface AssetItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  storagePath: string;
  isImage: boolean;
}

function isImageName(name: string) {
  return IMAGE_EXTS.includes(name.split(".").pop()?.toLowerCase() ?? "");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AssetPickerModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  onAttach: (attachments: PendingAttachment[]) => void;
}

export function AssetPickerModal({ open, onClose, sessionId, onAttach }: AssetPickerModalProps) {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  function getSupabase(): SupabaseClient {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current!;
  }

  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [attaching, setAttaching] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    setUserId(userData.user.id);
    setLoading(true);
    const { data } = await supabase.storage.from("assets").list(userData.user.id, {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });
    setLoading(false);
    if (!data) return;
    setAssets(
      data
        .filter((f) => f.name !== ".emptyFolderPlaceholder")
        .map((f) => {
          const imgFlag = isImageName(f.name);
          const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
          const mimeGuess = imgFlag
            ? `image/${ext === "jpg" ? "jpeg" : ext}`
            : ext === "pdf"
            ? "application/pdf"
            : "application/octet-stream";
          return {
            id: f.id ?? f.name,
            name: f.name,
            size: f.metadata?.size ?? 0,
            mimeType: mimeGuess,
            url: `${SUPABASE_URL}/storage/v1/object/public/assets/${userData.user!.id}/${f.name}`,
            storagePath: `${userData.user!.id}/${f.name}`,
            isImage: imgFlag,
          };
        })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setSearch("");
      load();
    }
  }, [open, load]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleAttach() {
    if (!selectedIds.size || !userId) return;
    const selected = assets.filter((a) => selectedIds.has(a.id));
    setAttaching(true);
    try {
      const res = await fetch("/api/upload/from-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          assets: selected.map((a) => ({ storagePath: a.storagePath, name: a.name, mimeType: a.mimeType, size: a.size })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");

      const chips: PendingAttachment[] = (json.attachments as Array<{
        id: string; name: string; mimeType: string; sizeBytes: number; storagePath: string; contentType: "raw" | "text";
      }>).map((a) => ({
        id: a.id,
        name: a.name,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
        status: "ready" as const,
        storagePath: a.storagePath,
        contentType: a.contentType,
      }));

      onAttach(chips);
      onClose();
    } catch (err) {
      console.error("[AssetPickerModal] attach failed:", err);
    } finally {
      setAttaching(false);
    }
  }

  const filtered = assets.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
  const count = selectedIds.size;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[200]"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed z-[201] flex flex-col"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(640px, calc(100vw - 32px))",
              maxHeight: "min(560px, calc(100vh - 80px))",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-2xl)",
              boxShadow: "0 24px 64px -8px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div>
                <h2 className="text-[16px] font-semibold" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
                  My Assets
                </h2>
                <p className="text-[12.5px] mt-0.5" style={{ color: "var(--text3)" }}>
                  {loading ? "Loading…" : `${assets.length} file${assets.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center rounded-[var(--r-md)] transition-colors"
                style={{ width: 30, height: 30, color: "var(--text3)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg2)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text3)"; }}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              <div
                className="flex items-center gap-2 px-3 rounded-[var(--r-lg)]"
                style={{ height: 36, background: "var(--bg2)", border: "1px solid var(--border)" }}
              >
                <HugeiconsIcon icon={Search01Icon} size={14} style={{ color: "var(--text3)", flexShrink: 0 }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search assets…"
                  className="flex-1 bg-transparent text-[13px]"
                  style={{ color: "var(--text)", outline: "none" }}
                  autoFocus
                />
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="rounded-[var(--r-lg)]" style={{ aspectRatio: "4/3", background: "var(--bg2)" }} />
                      <div style={{ height: 10, width: "70%", borderRadius: 4, background: "var(--bg2)" }} />
                    </div>
                  ))}
                </div>
              ) : assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div
                    className="flex items-center justify-center rounded-2xl"
                    style={{ width: 44, height: 44, background: "var(--accent-soft)" }}
                  >
                    <HugeiconsIcon icon={Upload04Icon} size={20} style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>No assets yet</p>
                    <p className="text-[12.5px] mt-1" style={{ color: "var(--text3)" }}>
                      Upload files on the Assets page to use them here
                    </p>
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-[13px] text-center py-12" style={{ color: "var(--text3)" }}>
                  No assets match &ldquo;{search}&rdquo;
                </p>
              ) : (
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
                  {filtered.map((asset) => {
                    const selected = selectedIds.has(asset.id);
                    return (
                      <button
                        key={asset.id}
                        onClick={() => toggleSelect(asset.id)}
                        className="flex flex-col text-left group"
                        style={{ cursor: "pointer" }}
                      >
                        {/* Thumbnail */}
                        <div
                          className="relative overflow-hidden rounded-[var(--r-lg)] w-full"
                          style={{
                            aspectRatio: "4/3",
                            background: "var(--bg2)",
                            border: selected ? "2px solid var(--accent)" : "1.5px solid var(--border)",
                            boxShadow: selected ? "0 0 0 3px var(--accent-soft)" : "none",
                            transition: "border-color 0.12s, box-shadow 0.12s",
                          }}
                        >
                          {asset.isImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={asset.url}
                              alt={asset.name}
                              className="w-full h-full object-cover"
                              draggable={false}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <HugeiconsIcon icon={File01Icon} size={28} style={{ color: "var(--text3)" }} />
                            </div>
                          )}

                          {/* Checkmark */}
                          <AnimatePresence>
                            {selected && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                                className="absolute top-1.5 left-1.5 flex items-center justify-center rounded-full"
                                style={{ width: 22, height: 22, background: "var(--accent)" }}
                              >
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} style={{ color: "#fff" }} />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Hover overlay */}
                          {!selected && (
                            <div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: "rgba(67,56,202,0.06)" }}
                            />
                          )}
                        </div>

                        {/* Name + size */}
                        <p
                          className="text-[12px] font-medium mt-1.5 truncate w-full"
                          style={{ color: selected ? "var(--accent)" : "var(--text)" }}
                          title={asset.name}
                        >
                          {asset.name}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--text3)" }}>
                          {formatBytes(asset.size)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <span className="text-[13px]" style={{ color: "var(--text3)" }}>
                {count > 0 ? `${count} selected` : "Select files to attach"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 h-9 rounded-full text-[13px] font-medium transition-colors"
                  style={{ color: "var(--text2)", background: "var(--bg2)", border: "1px solid var(--border)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--border)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg2)"; }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAttach}
                  disabled={count === 0 || attaching}
                  className="px-4 h-9 rounded-full text-[13px] font-semibold transition-colors"
                  style={{
                    background: count > 0 ? "var(--accent)" : "var(--bg2)",
                    color: count > 0 ? "#fff" : "var(--text3)",
                    border: count > 0 ? "none" : "1px solid var(--border)",
                    opacity: attaching ? 0.7 : 1,
                    transition: "background 0.15s, color 0.15s",
                    cursor: count > 0 && !attaching ? "pointer" : "default",
                  }}
                  onMouseEnter={(e) => { if (count > 0 && !attaching) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)"; }}
                  onMouseLeave={(e) => { if (count > 0) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; }}
                >
                  {attaching ? "Attaching…" : count > 0 ? `Attach ${count} file${count !== 1 ? "s" : ""}` : "Attach"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
