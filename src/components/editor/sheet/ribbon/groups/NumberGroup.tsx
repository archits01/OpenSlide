"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  DollarSign, Percent,
} from "lucide-react";
import {
  RibbonGroup, RibbonButton, RibbonSplitButton,
  RibbonDropdown, RibbonSeparator,
} from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetSelection } from "../hooks/useSheetSelection";
import { useSheetFacade } from "../SheetFacadeContext";
import { useRibbonCollapsed } from "../RibbonCollapseContext";

// ─── Custom decimal icons (SVG) ────────────────────────────────────────────

function IncreaseDecimalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <text x="0" y="10" fontSize="7" fill="currentColor" fontFamily="monospace">.0</text>
      <text x="7" y="10" fontSize="6" fill="currentColor" fontFamily="monospace" opacity="0.5">0</text>
      <path d="M11 3 L13 5 L11 7" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DecreaseDecimalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <text x="0" y="10" fontSize="7" fill="currentColor" fontFamily="monospace">.0</text>
      <text x="7" y="10" fontSize="6" fill="currentColor" fontFamily="monospace" opacity="0.3">0</text>
      <path d="M13 3 L11 5 L13 7" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CommaStyleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <text x="1" y="11" fontSize="9" fill="currentColor" fontFamily="monospace">,</text>
    </svg>
  );
}

// ─── Format name ↔ format string mapping ───────────────────────────────────

const FORMAT_OPTIONS: Array<{ label: string; format: string }> = [
  { label: "General", format: "General" },
  { label: "Number", format: "#,##0.00" },
  { label: "Currency", format: "$#,##0.00" },
  { label: "Accounting", format: "$ #,##0.00" },
  { label: "Short Date", format: "m/d/yyyy" },
  { label: "Long Date", format: "dddd, mmmm d, yyyy" },
  { label: "Time", format: "h:mm:ss AM/PM" },
  { label: "Percentage", format: "0.00%" },
  { label: "Fraction", format: "# ?/?" },
  { label: "Scientific", format: "0.00E+00" },
  { label: "Text", format: "@" },
];

/** Reverse-lookup: given a raw format string, return the friendly name */
function formatToLabel(fmt: string): string {
  if (!fmt || fmt === "General") return "General";
  const match = FORMAT_OPTIONS.find((o) => o.format === fmt);
  if (match) return match.label;
  // Heuristic matches for common variants
  if (fmt.includes("%")) return "Percentage";
  if (fmt.includes("$") || fmt.includes("\u20AC") || fmt.includes("\u00A3") || fmt.includes("\u20B9") || fmt.includes("\u00A5")) return "Currency";
  if (fmt.includes("E+") || fmt.includes("E-")) return "Scientific";
  if (fmt.includes("?/?")) return "Fraction";
  if (fmt.includes("m/d") || fmt.includes("d/m") || fmt.includes("yyyy")) return "Date";
  if (fmt.includes("h:mm") || fmt.includes("AM/PM")) return "Time";
  if (fmt.includes("#,##0") || fmt.includes("0.00")) return "Number";
  return "Custom";
}

// ─── Currency split-button ─────────────────────────────────────────────────

const CURRENCY_OPTIONS = [
  { label: "$ US Dollar", value: "USD" as const },
  { label: "\u20AC Euro", value: "EUR" as const },
  { label: "\u00A3 British Pound", value: "GBP" as const },
  { label: "\u20B9 Indian Rupee", value: "INR" as const },
  { label: "\u00A5 Japanese Yen", value: "JPY" as const },
];

function CurrencySplitButton({
  commands,
}: {
  commands: ReturnType<typeof useSheetCommands>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastCurrency, setLastCurrency] = useState<"USD" | "EUR" | "GBP" | "INR" | "JPY">("USD");
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 2, left: rect.left });
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <div ref={anchorRef}>
        <RibbonSplitButton
          icon={<DollarSign size={14} />}
          tooltip={`Currency (${lastCurrency})`}
          onClick={() => commands.setCurrency(lastCurrency)}
          onDropdownClick={() => setMenuOpen((o) => !o)}
          dropdownOpen={menuOpen}
        />
      </div>
      {menuOpen && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            minWidth: 160,
            background: "#FFFFFF",
            border: "1px solid #C8C6C4",
            borderRadius: 4,
            boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
            zIndex: 10000,
            padding: "4px 0",
          }}
        >
          {CURRENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setLastCurrency(opt.value);
                commands.setCurrency(opt.value);
                setMenuOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                height: 28,
                padding: "0 12px",
                border: "none",
                background: lastCurrency === opt.value ? "#EFF6FC" : "transparent",
                cursor: "pointer",
                fontSize: 12,
                color: "#333",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#E5F1FB"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = lastCurrency === opt.value ? "#EFF6FC" : "transparent"; }}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ─── NumberGroup ────────────────────────────────────────────────────────────

export function NumberGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);
  const selection = useSheetSelection(facadeRef);
  const collapsed = useRibbonCollapsed("Number");

  const currentLabel = formatToLabel(selection.numberFormat);

  return (
    <RibbonGroup label="Number" minWidth={160} collapsed={collapsed} collapsedIcon={<DollarSign size={20} />}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "2px 0" }}>
        {/* Row 1: Format dropdown (full width) */}
        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          <RibbonDropdown
            label={currentLabel}
            value={selection.numberFormat}
            tooltip="Number Format"
            options={FORMAT_OPTIONS.map((o) => ({
              value: o.format,
              label: o.label,
            }))}
            onChange={(fmt) => commands.setNumberFormat(fmt)}
            width={130}
          />
        </div>

        {/* Row 2: Currency | Percent | Comma | Inc/Dec Decimal */}
        <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
          <CurrencySplitButton commands={commands} />
          <RibbonButton
            icon={<Percent size={14} />}
            tooltip="Percent Style"
            active={selection.numberFormat.includes("%")}
            onClick={() => commands.setPercent()}
            size="sm"
          />
          <RibbonButton
            icon={<CommaStyleIcon />}
            tooltip="Comma Style"
            onClick={() => commands.setComma()}
            size="sm"
          />
          <RibbonSeparator />
          <RibbonButton
            icon={<IncreaseDecimalIcon />}
            tooltip="Increase Decimal"
            onClick={() => commands.increaseDecimal()}
            size="sm"
          />
          <RibbonButton
            icon={<DecreaseDecimalIcon />}
            tooltip="Decrease Decimal"
            onClick={() => commands.decreaseDecimal()}
            size="sm"
          />
        </div>
      </div>
    </RibbonGroup>
  );
}
