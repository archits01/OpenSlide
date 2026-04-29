"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { SHEET_TOKENS } from "../../sheet-tokens";

const t = SHEET_TOKENS.ribbon;

interface RibbonGroupProps {
  label: string;
  children: React.ReactNode;
  minWidth?: number;
  /** When true, renders as a single icon button that opens a popover */
  collapsed?: boolean;
  /** Icon shown in collapsed mode */
  collapsedIcon?: React.ReactNode;
}

export function RibbonGroup({ label, children, minWidth, collapsed, collapsedIcon }: RibbonGroupProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popoverOpen) return;
    function onDown(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setPopoverOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPopoverOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [popoverOpen]);

  if (collapsed) {
    return (
      <div
        ref={popoverRef}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          borderRight: `1px solid ${t.groupDividerColor}`,
          padding: "4px 4px 0",
          minWidth: 44,
        }}
      >
        <button
          title={label}
          onClick={() => setPopoverOpen((o) => !o)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            flex: 1,
            padding: "2px 6px",
            background: popoverOpen ? t.buttonActiveBg : "transparent",
            border: "none",
            borderRadius: 3,
            cursor: "pointer",
            color: "#333",
            width: "100%",
          }}
          onMouseEnter={(e) => { if (!popoverOpen) e.currentTarget.style.background = t.buttonHoverBg; }}
          onMouseLeave={(e) => { if (!popoverOpen) e.currentTarget.style.background = "transparent"; }}
        >
          {collapsedIcon && <span style={{ display: "flex", width: 20, height: 20 }}>{collapsedIcon}</span>}
          <ChevronDown size={10} style={{ color: "#999" }} />
        </button>
        <div
          style={{
            textAlign: "center",
            fontSize: 10,
            color: t.groupLabelColor,
            height: 16,
            lineHeight: "16px",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>

        {popoverOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 2,
              background: t.dropdownBg,
              border: `1px solid ${t.dropdownBorder}`,
              borderRadius: 6,
              boxShadow: t.dropdownShadow,
              zIndex: 1100,
              padding: "6px 6px 2px",
              minWidth: minWidth ?? 200,
            }}
          >
            {/* Render full group children inside popover */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              {children}
            </div>
            <div
              style={{
                textAlign: "center",
                fontSize: 10,
                color: t.groupLabelColor,
                marginTop: 4,
                paddingBottom: 2,
              }}
            >
              {label}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        borderRight: `1px solid ${t.groupDividerColor}`,
        padding: "4px 6px 0",
        minWidth: minWidth ?? "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flex: 1,
          flexWrap: "wrap",
          alignContent: "center",
        }}
      >
        {children}
      </div>
      <div
        style={{
          textAlign: "center",
          fontSize: 11,
          color: t.groupLabelColor,
          height: 16,
          lineHeight: "16px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </div>
    </div>
  );
}
