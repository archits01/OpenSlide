"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload04Icon,
  Delete02Icon,
  Copy01Icon,
  CopyCheckIcon,
  Image01Icon,
  File01Icon,
  Search01Icon,
  MoreVerticalIcon,
  CheckmarkSquare02Icon,
  Download04Icon,
  Cancel01Icon,
  Edit02Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Footer } from "@/components/layout/Footer";

interface Asset {
  name: string;
  id: string;
  size: number;
  created_at: string;
  url: string;
  type: "image" | "file";
}

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"];
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExt(name: string) {
  return name.split(".").pop()?.toUpperCase() ?? "";
}

function isImage(name: string) {
  return IMAGE_EXTS.includes(name.split(".").pop()?.toLowerCase() ?? "");
}

// ─── Dropdown menu ────────────────────────────────────────────────────────────

function AssetDropdown({
  onSelect,
  onRename,
  onDownload,
  onCopy,
  onDelete,
  onClose,
}: {
  onSelect: () => void;
  onRename: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const items = [
    { icon: CheckmarkSquare02Icon, label: "Select", onClick: onSelect, color: "var(--accent)" },
    { icon: Edit02Icon, label: "Rename", onClick: onRename, color: "var(--text)" },
    { icon: Download04Icon, label: "Download", onClick: onDownload, color: "var(--text)" },
    { icon: Copy01Icon, label: "Copy URL", onClick: onCopy, color: "var(--text)" },
    { icon: Delete02Icon, label: "Delete", onClick: onDelete, color: "var(--red)" },
  ];

  return (
    <motion.div
      ref={ref}
      className="absolute z-50 rounded-[var(--r-xl)] overflow-hidden"
      initial={{ opacity: 0, scale: 0.92, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -4 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      style={{
        top: "calc(100% + 4px)",
        right: 0,
        background: "var(--bg)",
        border: "1px solid var(--border)",
        boxShadow: "0 8px 32px -4px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
        minWidth: 170,
        padding: "4px",
        transformOrigin: "top right",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => (
        <div key={item.label}>
          {i === items.length - 1 && (
            <div style={{ height: 1, background: "var(--border)", margin: "3px 0" }} />
          )}
          <button
            onClick={() => { item.onClick(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--r-md)] text-[13px] transition-colors"
            style={{ color: item.color }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = item.color === "var(--red)" ? "var(--red-soft)" : item.color === "var(--accent)" ? "var(--accent-soft)" : "var(--bg2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <HugeiconsIcon icon={item.icon} size={15} style={{ flexShrink: 0 }} />
            {item.label}
          </button>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Asset card ───────────────────────────────────────────────────────────────

function AssetCard({
  asset,
  selected,
  selectMode,
  renamingId,
  onToggleSelect,
  onStartRename,
  onFinishRename,
  onDownload,
  onCopy,
  onDelete,
  copiedId,
}: {
  asset: Asset;
  selected: boolean;
  selectMode: boolean;
  renamingId: string | null;
  onToggleSelect: () => void;
  onStartRename: () => void;
  onFinishRename: (newName: string) => void;
  onDownload: () => void;
  onCopy: () => void;
  onDelete: () => void;
  copiedId: string | null;
}) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(asset.name);
  const renameRef = useRef<HTMLInputElement>(null);
  const isRenaming = renamingId === asset.id;

  useEffect(() => {
    if (isRenaming) {
      setRenameValue(asset.name);
      setTimeout(() => renameRef.current?.select(), 20);
    }
  }, [isRenaming, asset.name]);

  function submitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== asset.name) onFinishRename(trimmed);
    else onFinishRename(asset.name);
  }

  const showDots = (hovered || menuOpen) && !selectMode && !isRenaming;

  return (
    <div
      className="group flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => selectMode && onToggleSelect()}
      style={{ cursor: selectMode ? "pointer" : "default", position: "relative" }}
    >
      {/* Thumbnail */}
      <div
        className="relative overflow-hidden rounded-[var(--r-xl)]"
        style={{
          aspectRatio: "4/3",
          background: "var(--bg2)",
          border: selected
            ? "2.5px solid var(--accent)"
            : "1.5px solid var(--border)",
          transition: "border-color 0.12s",
          boxShadow: selected ? "0 0 0 3px var(--accent-soft)" : "none",
        }}
      >
        {asset.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.url}
            alt={asset.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HugeiconsIcon icon={File01Icon} size={32} style={{ color: "var(--text3)" }} />
          </div>
        )}

        {/* Select checkmark */}
        {(selectMode || selected) && (
          <div
            className="absolute top-2 left-2 flex items-center justify-center rounded-full"
            style={{
              width: 22,
              height: 22,
              background: selected ? "var(--accent)" : "rgba(255,255,255,0.85)",
              border: selected ? "none" : "1.5px solid var(--border-strong)",
              transition: "background 0.12s",
              backdropFilter: "blur(4px)",
            }}
          >
            {selected && (
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} style={{ color: "#fff" }} />
            )}
          </div>
        )}
      </div>

      {/* Three-dot button — outside overflow-hidden thumbnail so dropdown isn't clipped */}
      {showDots && (
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 20 }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="flex items-center justify-center rounded-[var(--r-md)] transition-colors"
              style={{
                width: 28,
                height: 28,
                background: "rgba(255,255,255,0.88)",
                color: "#333",
                backdropFilter: "blur(4px)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "#fff"}
              onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.88)"}
            >
              <HugeiconsIcon icon={MoreVerticalIcon} size={15} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <AssetDropdown
                  onSelect={() => { onToggleSelect(); }}
                  onRename={onStartRename}
                  onDownload={onDownload}
                  onCopy={onCopy}
                  onDelete={onDelete}
                  onClose={() => setMenuOpen(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Name + meta */}
      <div className="mt-2 px-0.5">
        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") onFinishRename(asset.name);
            }}
            className="w-full text-[13px] font-medium rounded-[var(--r-md)] px-2 py-1 outline-none"
            style={{
              color: "var(--text)",
              border: "1.5px solid var(--accent)",
              background: "var(--bg)",
              boxShadow: "0 0 0 3px var(--accent-soft)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p
            className="text-[13px] font-medium truncate"
            style={{ color: selected ? "var(--accent)" : "var(--text)" }}
            title={asset.name}
          >
            {asset.name}
          </p>
        )}
        <p className="text-[11.5px] mt-0.5" style={{ color: "var(--text3)" }}>
          {formatBytes(asset.size)}
          {asset.size > 0 && " · "}
          {getExt(asset.name)}
          {copiedId === asset.id && (
            <span style={{ color: "var(--green)", marginLeft: 6 }}>
              <HugeiconsIcon icon={CopyCheckIcon} size={11} style={{ display: "inline", verticalAlign: "middle" }} /> Copied
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// ─── Selection bar ────────────────────────────────────────────────────────────

function SelectionBar({
  count,
  total,
  onClear,
  onSelectAll,
  onDownloadSelected,
  onDeleteSelected,
}: {
  count: number;
  total: number;
  onClear: () => void;
  onSelectAll: () => void;
  onDownloadSelected: () => void;
  onDeleteSelected: () => void;
}) {
  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-2.5 rounded-[var(--r-lg)]"
      initial={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto", marginBottom: 20 }}
      exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={onClear}
        className="flex items-center justify-center rounded-[var(--r-sm)] transition-colors"
        style={{ width: 26, height: 26, color: "var(--text3)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text3)"; }}
      >
        <HugeiconsIcon icon={Cancel01Icon} size={14} />
      </button>

      <span className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
        {count} selected
      </span>

      <div style={{ width: 1, height: 16, background: "var(--border)" }} />

      <button
        onClick={onDownloadSelected}
        className="flex items-center justify-center rounded-[var(--r-sm)] transition-colors"
        style={{ width: 28, height: 28, color: "var(--text2)" }}
        title="Download selected"
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text2)"; }}
      >
        <HugeiconsIcon icon={Download04Icon} size={15} />
      </button>

      <button
        onClick={onDeleteSelected}
        className="flex items-center justify-center rounded-[var(--r-sm)] transition-colors"
        style={{ width: 28, height: 28, color: "var(--red)" }}
        title="Delete selected"
        onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "var(--red-soft)"}
        onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
      >
        <HugeiconsIcon icon={Delete02Icon} size={15} />
      </button>

      <div className="flex-1" />

      <button
        onClick={onSelectAll}
        className="text-[12.5px] font-medium transition-colors"
        style={{ color: count === total ? "var(--text3)" : "var(--accent)" }}
      >
        {count === total ? "Deselect all" : "Select all"}
      </button>
    </motion.div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-4">
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{ width: 52, height: 52, background: "var(--accent-soft)" }}
      >
        <HugeiconsIcon icon={Image01Icon} size={22} style={{ color: "var(--accent)" }} />
      </div>
      <div className="text-center">
        <p className="text-[15px] font-semibold" style={{ color: "var(--text)", letterSpacing: "-0.01em" }}>
          No assets yet
        </p>
        <p className="text-[13px] mt-1" style={{ color: "var(--text3)" }}>
          Upload images and files to use across your presentations
        </p>
      </div>
      <button
        onClick={onUpload}
        className="flex items-center gap-2 px-4 h-9 rounded-full text-[13px] font-medium transition-colors"
        style={{ background: "var(--accent)", color: "#fff" }}
        onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)"}
        onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"}
      >
        <HugeiconsIcon icon={Upload04Icon} size={14} />
        Upload files
      </button>
      <p className="text-[12px]" style={{ color: "var(--text3)" }}>or drag and drop anywhere</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssetsPage() {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  function getSupabase(): SupabaseClient {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current!;
  }

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectMode = selectedIds.size > 0;

  async function loadAssets(uid: string) {
    const supabase = getSupabase();
    const { data } = await supabase.storage.from("assets").list(uid, {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (!data) { setLoading(false); return; }
    setAssets(
      data
        .filter((f) => f.name !== ".emptyFolderPlaceholder")
        .map((f) => ({
          name: f.name,
          id: f.id ?? f.name,
          size: f.metadata?.size ?? 0,
          created_at: f.created_at ?? new Date().toISOString(),
          url: `${SUPABASE_URL}/storage/v1/object/public/assets/${uid}/${f.name}`,
          type: isImage(f.name) ? "image" : "file",
        }))
    );
    setLoading(false);
  }

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => {
      if (data.user) { setUserId(data.user.id); loadAssets(data.user.id); }
      else setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadFiles(files: FileList | File[]) {
    if (!userId) return;
    const supabase = getSupabase();
    setUploading(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "";
      const base = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
      await supabase.storage.from("assets").upload(`${userId}/${base}_${Date.now()}.${ext}`, file, { upsert: false });
    }
    await loadAssets(userId);
    setUploading(false);
  }

  async function deleteAsset(asset: Asset) {
    if (!userId) return;
    await getSupabase().storage.from("assets").remove([`${userId}/${asset.name}`]);
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(asset.id); return next; });
  }

  async function deleteSelected() {
    if (!userId) return;
    const toDelete = assets.filter((a) => selectedIds.has(a.id));
    await getSupabase().storage.from("assets").remove(toDelete.map((a) => `${userId}/${a.name}`));
    setAssets((prev) => prev.filter((a) => !selectedIds.has(a.id)));
    setSelectedIds(new Set());
  }

  async function renameAsset(asset: Asset, newName: string) {
    if (!userId || newName === asset.name) { setRenamingId(null); return; }
    const supabase = getSupabase();
    const oldPath = `${userId}/${asset.name}`;
    const newPath = `${userId}/${newName}`;
    const { error } = await supabase.storage.from("assets").move(oldPath, newPath);
    if (!error) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === asset.id
            ? { ...a, name: newName, url: `${SUPABASE_URL}/storage/v1/object/public/assets/${newPath}` }
            : a
        )
      );
    }
    setRenamingId(null);
  }

  function downloadAsset(asset: Asset) {
    const a = document.createElement("a");
    a.href = asset.url;
    a.download = asset.name;
    a.target = "_blank";
    a.click();
  }

  function downloadSelected() {
    assets.filter((a) => selectedIds.has(a.id)).forEach(downloadAsset);
  }

  function copyUrl(asset: Asset) {
    navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((a) => a.id)));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const filtered = assets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: "var(--app-bg)" }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div className="flex" style={{ minHeight: "100%" }}>
        <div
          className="flex-1 rounded-[var(--r-xl)] overflow-hidden flex flex-col m-2"
          style={{
            background: "var(--bg)",
            border: dragOver ? "1.5px dashed var(--accent)" : "1px solid var(--border)",
            transition: "border-color 0.15s",
          }}
        >
        {/* Header */}
        <div
          className="flex flex-col md:flex-row md:items-end justify-between gap-3 px-4 md:px-7 pt-6 pb-5 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h1
              className="text-[20px] font-bold"
              style={{ color: "var(--text)", letterSpacing: "-0.03em" }}
            >
              Asset Library
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--text3)" }}>
              {loading ? "Loading…" : `${assets.length} file${assets.length !== 1 ? "s" : ""} · drag and drop to upload`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 rounded-full"
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                height: 36,
                flex: 1,
                minWidth: 0,
                outline: "none",
              }}
            >
              <HugeiconsIcon icon={Search01Icon} size={14} style={{ color: "var(--text3)", flexShrink: 0 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assets…"
                className="flex-1 bg-transparent text-[13px]"
                style={{ color: "var(--text)", outline: "none", boxShadow: "none" }}
              />
            </div>

            {/* Upload */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 rounded-full text-[13px] font-semibold transition-colors"
              style={{
                height: 36,
                background: "var(--accent)",
                color: "#fff",
                opacity: uploading ? 0.6 : 1,
                letterSpacing: "-0.01em",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
              }}
              onMouseEnter={(e) => !uploading && ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent)")}
            >
              <HugeiconsIcon icon={Upload04Icon} size={15} strokeWidth={2} />
              {uploading ? "Uploading…" : "Upload Asset"}
            </button>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-7 pt-6 pb-8">
          {loading ? (
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="rounded-[var(--r-xl)]" style={{ aspectRatio: "4/3", background: "var(--bg2)" }} />
                  <div style={{ height: 12, width: "60%", borderRadius: 4, background: "var(--bg2)" }} />
                  <div style={{ height: 10, width: "40%", borderRadius: 4, background: "var(--bg2)" }} />
                </div>
              ))}
            </div>
          ) : assets.length === 0 ? (
            <EmptyState onUpload={() => fileRef.current?.click()} />
          ) : (
            <>
              <AnimatePresence>
                {selectMode && (
                  <SelectionBar
                    count={selectedIds.size}
                    total={filtered.length}
                    onClear={() => setSelectedIds(new Set())}
                    onSelectAll={selectAll}
                    onDownloadSelected={downloadSelected}
                    onDeleteSelected={deleteSelected}
                  />
                )}
              </AnimatePresence>

              {filtered.length === 0 ? (
                <p className="text-[13px] text-center py-16" style={{ color: "var(--text3)" }}>
                  No assets match &ldquo;{search}&rdquo;
                </p>
              ) : (
                <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
                  {filtered.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      selected={selectedIds.has(asset.id)}
                      selectMode={selectMode}
                      renamingId={renamingId}
                      onToggleSelect={() => toggleSelect(asset.id)}
                      onStartRename={() => setRenamingId(asset.id)}
                      onFinishRename={(newName) => renameAsset(asset, newName)}
                      onDownload={() => downloadAsset(asset)}
                      onCopy={() => copyUrl(asset)}
                      onDelete={() => deleteAsset(asset)}
                      copiedId={copiedId}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Drag overlay */}
        {dragOver && (
          <div
            className="absolute inset-2 rounded-[var(--r-xl)] flex flex-col items-center justify-center gap-2 pointer-events-none"
            style={{ background: "rgba(67,56,202,0.05)", border: "2px dashed var(--accent)" }}
          >
            <HugeiconsIcon icon={Upload04Icon} size={26} style={{ color: "var(--accent)" }} />
            <p className="text-[14px] font-medium" style={{ color: "var(--accent)" }}>Drop to upload</p>
          </div>
        )}
      </div>
      </div>
      <div style={{ padding: "16px 40px 16px" }}>
        <Footer />
      </div>
    </div>
  );
}
