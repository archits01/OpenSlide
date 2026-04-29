"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "lucide-react";
import { RibbonGroup, RibbonButtonLarge } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";

function HyperlinkPopover({
  open,
  anchorRef,
  onClose,
  onSubmit,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onSubmit: (url: string, text: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [url, setUrl] = useState("https://");
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left });
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const commit = () => {
    if (!url.trim()) return;
    onSubmit(url.trim(), text.trim() || url.trim());
    onClose();
    setUrl("https://");
    setText("");
  };

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        minWidth: 280,
        background: "#FFF",
        border: "1px solid #C8C6C4",
        borderRadius: 6,
        boxShadow: "0 4px 12px rgba(0,0,0,0.14)",
        zIndex: 10_000,
        padding: 12,
        fontFamily: "var(--font-geist-sans, system-ui)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "#111", marginBottom: 10 }}>
        Insert Hyperlink
      </div>
      <label style={{ display: "block", fontSize: 11, color: "#555", marginBottom: 4 }}>URL</label>
      <input
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        style={{ width: "100%", height: 28, padding: "0 8px", border: "1px solid #D0D0D0", borderRadius: 4, fontSize: 12, marginBottom: 8 }}
        placeholder="https://example.com"
      />
      <label style={{ display: "block", fontSize: 11, color: "#555", marginBottom: 4 }}>Display text</label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        style={{ width: "100%", height: 28, padding: "0 8px", border: "1px solid #D0D0D0", borderRadius: 4, fontSize: 12, marginBottom: 12 }}
        placeholder="(optional — defaults to URL)"
      />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          onClick={onClose}
          style={{ height: 26, padding: "0 12px", fontSize: 12, border: "1px solid #D0D0D0", borderRadius: 3, background: "#FFF", color: "#333", cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          onClick={commit}
          style={{ height: 26, padding: "0 12px", fontSize: 12, border: "1px solid #0078D4", borderRadius: 3, background: "#0078D4", color: "#FFF", cursor: "pointer" }}
        >
          Insert
        </button>
      </div>
    </div>,
    document.body,
  );
}

export function InsertLinksGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <RibbonGroup label="Links">
      <div ref={anchorRef} style={{ display: "flex", gap: 2, alignItems: "flex-start", padding: "2px 0" }}>
        <RibbonButtonLarge
          icon={<Link size={20} />}
          label="Link"
          tooltip="Insert Hyperlink"
          onClick={() => setOpen((o) => !o)}
        />
      </div>
      <HyperlinkPopover
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        onSubmit={(url, text) => commands.insertHyperlink(url, text)}
      />
    </RibbonGroup>
  );
}
