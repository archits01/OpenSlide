"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { RibbonGroup, RibbonButtonLarge } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";
import {
  EXCEL_FUNCTIONS,
  FUNCTION_CATEGORIES,
  getFunctionsByCategory,
  type FunctionCategory,
} from "../data/excel-functions";

// ─── ƒx Icon ────────────────────────────────────────────────────────────────

function FxIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <text x="1" y="14" fontSize="13" fill="currentColor" fontFamily="serif" fontStyle="italic" fontWeight="bold">ƒx</text>
    </svg>
  );
}

// ─── Insert Function Dialog ─────────────────────────────────────────────────

function InsertFunctionDialog({ commands, open, onClose, anchorRef }: {
  commands: ReturnType<typeof useSheetCommands>;
  open: boolean; onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | FunctionCategory>("All");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.left });
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node) && anchorRef.current && !anchorRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open, onClose, anchorRef]);

  const filtered = useMemo(() => {
    let fns = selectedCategory === "All" ? EXCEL_FUNCTIONS : getFunctionsByCategory(selectedCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      fns = fns.filter((f) => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
    }
    return fns;
  }, [selectedCategory, search]);

  useEffect(() => { setSelectedIndex(0); }, [filtered]);

  if (!open) return null;
  const selected = filtered[selectedIndex] ?? null;

  return createPortal(
    <div ref={dialogRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, width: 420, maxHeight: 500, background: "#FFF", border: "1px solid #C8C6C4", borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.16)", zIndex: 10000, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "12px 12px 8px", borderBottom: "1px solid #E8E8E8" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 8 }}>Insert Function</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #C8C6C4", borderRadius: 4, padding: "0 8px", height: 28 }}>
          <Search size={12} color="#999" />
          <input type="text" placeholder="Search for a function..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, border: "none", outline: "none", fontSize: 12, color: "#333", background: "transparent" }} />
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ width: 120, borderRight: "1px solid #E8E8E8", overflowY: "auto", padding: "4px 0" }}>
          {(["All", ...FUNCTION_CATEGORIES] as const).map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ display: "block", width: "100%", padding: "4px 10px", border: "none", background: selectedCategory === cat ? "#E5F1FB" : "transparent", cursor: "pointer", fontSize: 11, color: selectedCategory === cat ? "#1A6DC2" : "#555", fontWeight: selectedCategory === cat ? 600 : 400, textAlign: "left" }}
              onMouseEnter={(e) => { if (selectedCategory !== cat) e.currentTarget.style.background = "#F3F3F3"; }}
              onMouseLeave={(e) => { if (selectedCategory !== cat) e.currentTarget.style.background = "transparent"; }}
            >{cat}</button>
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 12, fontSize: 12, color: "#999", textAlign: "center" }}>No functions found</div>
            ) : filtered.map((fn, i) => (
              <button key={fn.name} onClick={() => setSelectedIndex(i)} onDoubleClick={() => { commands.insertFunction(fn.name); onClose(); }}
                style={{ display: "block", width: "100%", padding: "3px 10px", border: "none", background: selectedIndex === i ? "#CCE4F7" : "transparent", cursor: "pointer", fontSize: 12, color: "#333", textAlign: "left", fontFamily: "monospace" }}
                onMouseEnter={(e) => { if (selectedIndex !== i) e.currentTarget.style.background = "#F3F3F3"; }}
                onMouseLeave={(e) => { if (selectedIndex !== i) e.currentTarget.style.background = "transparent"; }}
              >{fn.name}</button>
            ))}
          </div>
          {selected && (
            <div style={{ borderTop: "1px solid #E8E8E8", padding: "8px 10px", background: "#FAFAFA" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#333", fontFamily: "monospace" }}>{selected.signature}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4, lineHeight: 1.4 }}>{selected.description}</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "8px 12px", borderTop: "1px solid #E8E8E8" }}>
        <button onClick={onClose} style={{ padding: "4px 16px", border: "1px solid #C8C6C4", borderRadius: 4, background: "#FFF", cursor: "pointer", fontSize: 12 }}>Cancel</button>
        <button onClick={() => { if (selected) { commands.insertFunction(selected.name); onClose(); } }} disabled={!selected}
          style={{ padding: "4px 16px", border: "1px solid #1A6DC2", borderRadius: 4, background: "#1A6DC2", cursor: selected ? "pointer" : "default", fontSize: 12, color: "#FFF", opacity: selected ? 1 : 0.5 }}>Insert</button>
      </div>
    </div>,
    document.body
  );
}

// ─── FormulaFunctionsGroup (just the fx button) ─────────────────────────────

export function FormulaFunctionsGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const [insertOpen, setInsertOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <RibbonGroup label="Functions">
      <div style={{ display: "flex", gap: 2, alignItems: "flex-start", padding: "2px 0" }}>
        <div ref={anchorRef}>
          <RibbonButtonLarge
            icon={<FxIcon size={22} />}
            label="Insert Function"
            tooltip="Insert Function (Shift+F3)"
            onClick={() => setInsertOpen((o) => !o)}
          />
        </div>
        <InsertFunctionDialog commands={commands} open={insertOpen} onClose={() => setInsertOpen(false)} anchorRef={anchorRef} />
      </div>
    </RibbonGroup>
  );
}
