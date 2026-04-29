"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface FileNode {
  name: string;
  path: string;
  isDir: true;
  children: TreeNode[];
}
interface LeafNode {
  name: string;
  path: string;
  isDir: false;
}
type TreeNode = FileNode | LeafNode;

function buildTree(paths: string[]): TreeNode[] {
  const root: Record<string, unknown> = {};

  for (const fullPath of paths) {
    const parts = fullPath.split("/").filter(Boolean);
    let cur = root as Record<string, unknown>;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        cur[part] = null; // leaf
      } else {
        if (typeof cur[part] !== "object" || cur[part] === null) {
          cur[part] = {};
        }
        cur = cur[part] as Record<string, unknown>;
      }
    }
  }

  function toNodes(obj: Record<string, unknown>, prefix: string): TreeNode[] {
    const dirs: FileNode[] = [];
    const files: LeafNode[] = [];
    for (const [name, val] of Object.entries(obj)) {
      const path = prefix ? `${prefix}/${name}` : name;
      if (val !== null && typeof val === "object") {
        dirs.push({ name, path, isDir: true, children: toNodes(val as Record<string, unknown>, path) });
      } else {
        files.push({ name, path, isDir: false });
      }
    }
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));
    return [...dirs, ...files];
  }

  return toNodes(root, "");
}

function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "𝑇", tsx: "⚛", js: "𝐽", jsx: "⚛", html: "🌐", css: "🎨", scss: "🎨",
    json: "{}", md: "📝", png: "🖼", jpg: "🖼", jpeg: "🖼", svg: "🖼",
    env: "🔑", gitignore: "🚫",
  };
  if (name === "package.json") return "📦";
  if (name === "vite.config.ts" || name === "vite.config.js") return "⚡";
  if (name === "tailwind.config.ts" || name === "tailwind.config.js") return "🌬";
  if (name === ".env" || name.startsWith(".env.")) return "🔑";
  if (name === ".gitignore") return "🚫";
  return map[ext] ?? "📄";
}

interface FileTreeProps {
  files: Record<string, string>;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  modifiedFiles?: Set<string>;
  newFiles?: Set<string>;
  lockedFiles?: Set<string>;
  changedFiles?: Set<string>;  // files that differ from turn baseline (shows ~ in diff)
}

function TreeNodeRow({
  node, depth, selectedFile, onSelectFile, openDirs, onToggleDir,
  modifiedFiles, newFiles, lockedFiles, changedFiles, onContextMenu,
}: {
  node: TreeNode;
  depth: number;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  openDirs: Set<string>;
  onToggleDir: (path: string) => void;
  modifiedFiles?: Set<string>;
  newFiles?: Set<string>;
  lockedFiles?: Set<string>;
  changedFiles?: Set<string>;
  onContextMenu?: (path: string, x: number, y: number) => void;
}) {
  const isSelected = !node.isDir && node.path === selectedFile;
  const isOpen = node.isDir && openDirs.has(node.path);
  const isModified = !node.isDir && modifiedFiles?.has(node.path);
  const isNew = !node.isDir && newFiles?.has(node.path);
  const isLocked = !node.isDir && lockedFiles?.has(node.path);
  const isChanged = !node.isDir && changedFiles?.has(node.path);

  return (
    <>
      <button
        onClick={() => node.isDir ? onToggleDir(node.path) : onSelectFile(node.path)}
        onContextMenu={(e) => {
          if (node.isDir) return;
          e.preventDefault();
          onContextMenu?.(node.path, e.clientX, e.clientY);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          textAlign: "left",
          padding: `3px 8px 3px ${8 + depth * 12}px`,
          gap: 5,
          border: "none",
          cursor: "pointer",
          background: isSelected ? "var(--accent-soft)" : "transparent",
          borderLeft: isSelected ? "2px solid var(--accent)" : "2px solid transparent",
          color: isSelected ? "var(--accent-text)" : "var(--text)",
          fontSize: 12,
          fontFamily: "var(--font-mono, ui-monospace, monospace)",
          lineHeight: "20px",
          letterSpacing: 0,
          transition: "background 80ms",
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = "var(--bg2)";
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = "transparent";
        }}
      >
        {/* Chevron for dirs */}
        {node.isDir ? (
          <svg
            width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, opacity: 0.5, transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 120ms" }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        ) : (
          <span style={{ flexShrink: 0, fontSize: 10, lineHeight: 1, opacity: 0.6, width: 9 }}>
            {getFileIcon(node.name)}
          </span>
        )}

        {/* Name */}
        <span
          style={{
            flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            opacity: node.isDir ? 0.7 : 1,
          }}
        >
          {node.name}
        </span>

        {/* Lock icon — shown while AI is editing */}
        {isLocked && (
          <span title="Being edited by AI" style={{ flexShrink: 0, display: "flex" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
        )}
        {/* ~ indicator — changed this turn */}
        {isChanged && !isLocked && (
          <span style={{ fontSize: 10, color: "#89b4fa", fontWeight: 700, flexShrink: 0, lineHeight: 1 }} title="Changed this turn">~</span>
        )}
        {/* Status dot */}
        {isNew && !isLocked && !isChanged && (
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} title="New" />
        )}
        {isModified && !isNew && !isLocked && !isChanged && (
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--warn)", flexShrink: 0 }} title="Modified" />
        )}
      </button>

      {node.isDir && isOpen && node.children.map((child) => (
        <TreeNodeRow
          key={child.path}
          node={child}
          depth={depth + 1}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          openDirs={openDirs}
          onToggleDir={onToggleDir}
          modifiedFiles={modifiedFiles}
          newFiles={newFiles}
          lockedFiles={lockedFiles}
          changedFiles={changedFiles}
          onContextMenu={onContextMenu}
        />
      ))}
    </>
  );
}

function FileContextMenu({ path, x, y, onClose }: { path: string; x: number; y: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  // Adjust position so menu stays on screen
  const menuWidth = 200;
  const menuHeight = 80;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 8);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 8);

  const items = [
    { label: "Copy path", action: () => { navigator.clipboard.writeText(`/${path}`).catch(() => {}); onClose(); } },
    { label: "Copy relative path", action: () => { navigator.clipboard.writeText(path).catch(() => {}); onClose(); } },
  ];

  const menu = (
    <div
      ref={ref}
      style={{
        position: "fixed", left: adjustedX, top: adjustedY, zIndex: 99999,
        width: menuWidth, background: "var(--bg)", border: "1px solid var(--border-strong)",
        borderRadius: 8, boxShadow: "0 6px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={item.action}
          style={{
            width: "100%", textAlign: "left", padding: "8px 12px",
            border: "none", background: "transparent", cursor: "pointer",
            fontSize: 12, color: "var(--text)", fontFamily: "var(--font-mono, monospace)",
            borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none",
            transition: "background 80ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(menu, document.body);
}

export function FileTree({
  files, selectedFile, onSelectFile, modifiedFiles, newFiles, lockedFiles, changedFiles,
}: FileTreeProps) {
  const sortedPaths = useMemo(() => Object.keys(files).sort(), [files]);
  const tree = useMemo(() => buildTree(sortedPaths), [sortedPaths]);
  const [contextMenu, setContextMenu] = useState<{ path: string; x: number; y: number } | null>(null);

  // Default: expand top-level dirs
  const [openDirs, setOpenDirs] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const node of buildTree(sortedPaths)) {
      if (node.isDir) initial.add(node.path);
    }
    return initial;
  });

  function toggleDir(path: string) {
    setOpenDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  if (sortedPaths.length === 0) {
    return (
      <div style={{ padding: "12px 8px", fontSize: 12, color: "var(--text3)", fontFamily: "var(--font-mono, monospace)" }}>
        No files yet.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", paddingTop: 4 }}>
      {tree.map((node) => (
        <TreeNodeRow
          key={node.path}
          node={node}
          depth={0}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          openDirs={openDirs}
          onToggleDir={toggleDir}
          modifiedFiles={modifiedFiles}
          newFiles={newFiles}
          lockedFiles={lockedFiles}
          changedFiles={changedFiles}
          onContextMenu={(path, x, y) => setContextMenu({ path, x, y })}
        />
      ))}
      {contextMenu && (
        <FileContextMenu
          path={contextMenu.path}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
