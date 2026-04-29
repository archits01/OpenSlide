"use client";

/**
 * Brand kit picker — shared between the home prompt bar and the editor topbar.
 *
 * Behavior:
 *  - Fetches the user's kits on mount.
 *  - "Default" option means "use whatever kit is set as default" (server falls
 *    back via resolveBrandKitForSession). null brandKitId.
 *  - "None" means "no brand styling for this session" — opt out explicitly.
 *  - Selecting a specific kit pins it via brandKitId.
 *
 * The component is presentational: parent owns the value + onChange. Use
 * `<KitPicker value={brandKitId} onChange={setBrandKitId} />`.
 */

import { useEffect, useRef, useState } from "react";

interface KitSummary {
  id: string;
  name: string;
  isDefault: boolean;
  status: string;
  brandVars?: {
    colors?: { accent?: string; dark?: string };
  };
}

export interface KitPickerProps {
  /** Current value: kit id, or null for "use default". */
  value: string | null;
  onChange: (next: string | null) => void;
  /** Optional compact / dense styling (used in editor topbar). */
  compact?: boolean;
  /** Disable interactions (e.g. while a request is in flight). */
  disabled?: boolean;
}

export function KitPicker({ value, onChange, compact, disabled }: KitPickerProps) {
  const [kits, setKits] = useState<KitSummary[] | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/brand-kits")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setKits((data.kits as KitSummary[]) ?? []);
      })
      .catch(() => {
        if (!cancelled) setKits([]);
      });
    return () => { cancelled = true; };
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /**
   * Promote (or demote) a kit's default flag from the dropdown. Updates local
   * state immediately so the badge moves without re-fetching, then PATCHes
   * the server. If the user has no default set and clicks "Set default" on a
   * kit, that kit becomes default — the existing PATCH transaction demotes
   * any current default automatically.
   */
  const flipDefault = async (kitId: string, makeDefault: boolean) => {
    setKits((prev) =>
      prev
        ? prev.map((k) =>
            makeDefault
              ? { ...k, isDefault: k.id === kitId }
              : k.id === kitId
                ? { ...k, isDefault: false }
                : k,
          )
        : prev,
    );
    try {
      await fetch(`/api/brand-kits/${kitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: makeDefault }),
      });
    } catch {
      // Best effort — refetch on next mount will reconcile.
    }
  };

  const defaultKit = kits?.find((k) => k.isDefault) ?? null;
  const selectedKit = value === null
    ? defaultKit
    : kits?.find((k) => k.id === value) ?? null;

  const label = selectedKit ? selectedKit.name : "Default";
  const subtle = value === null && defaultKit ? "Default" : null;

  const triggerStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    // Compact = inline chip in the prompt bar's action row, sized to sit
    // alongside the +/connector icons (each 36px tall). Padding tuned to
    // match their visual weight.
    padding: compact ? "6px 10px" : "8px 12px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: compact ? "rgba(255,255,255,0.04)" : "var(--bg)",
    color: "var(--text)",
    fontSize: compact ? 11 : 12,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    whiteSpace: "nowrap",
    maxWidth: compact ? 180 : undefined,
  };

  const swatch = (kit: KitSummary | null) => {
    const c = kit?.brandVars?.colors;
    const dot = compact ? 8 : 10;
    return (
      <span style={{ display: "inline-flex", gap: 2 }}>
        <span style={{ width: dot, height: dot, borderRadius: 999, background: c?.accent ?? "var(--text3)" }} />
        <span style={{ width: dot, height: dot, borderRadius: 999, background: c?.dark ?? "var(--text2)" }} />
      </span>
    );
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        style={triggerStyle}
        title={selectedKit ? `Brand kit: ${selectedKit.name}` : "Brand kit"}
      >
        {swatch(selectedKit)}
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            // The selected kit's name takes priority over the "Default" badge
            // when an explicit kit is chosen; otherwise show "Default".
            maxWidth: compact ? 110 : undefined,
          }}
        >
          {selectedKit ? selectedKit.name : "Default"}
        </span>
        {subtle && !compact && <span style={{ color: "var(--text3)", fontSize: 10 }}>· {subtle}</span>}
        <span style={{ color: "var(--text3)", fontSize: 9, opacity: 0.7 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: 220,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            padding: 4,
            zIndex: 50,
          }}
        >
          <Option
            label="Default"
            sub={defaultKit ? `→ ${defaultKit.name}` : "no default kit set"}
            selected={value === null}
            onClick={() => { onChange(null); setOpen(false); }}
          />
          {kits && kits.length > 0 && (
            <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
          )}
          {kits === null && (
            <div style={{ padding: 12, fontSize: 11, color: "var(--text3)" }}>Loading…</div>
          )}
          {kits && kits.length === 0 && (
            <div style={{ padding: 12, fontSize: 11, color: "var(--text3)" }}>No brand kits yet</div>
          )}
          {kits?.map((k) => (
            <Option
              key={k.id}
              label={k.name}
              swatch={swatch(k)}
              selected={value === k.id}
              onClick={() => { onChange(k.id); setOpen(false); }}
              badge={k.isDefault ? "Default" : null}
              isDefault={k.isDefault}
              onToggleDefault={() => flipDefault(k.id, !k.isDefault)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Option({ label, sub, selected, onClick, swatch, badge, isDefault, onToggleDefault }: {
  label: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
  swatch?: React.ReactNode;
  badge?: string | null;
  isDefault?: boolean;
  /** When provided, shows a row-hover action that flips this kit's default flag. */
  onToggleDefault?: () => void | Promise<void>;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "8px 10px",
        borderRadius: 6,
        background: selected ? "var(--accent-soft)" : hovered ? "var(--bg2)" : "transparent",
        color: "var(--text)",
        fontSize: 12,
        fontWeight: selected ? 600 : 500,
        cursor: "pointer",
        transition: "background 100ms ease",
      }}
      onClick={onClick}
    >
      {swatch}
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
        {sub && <span style={{ color: "var(--text3)", fontSize: 10, marginLeft: 6 }}>{sub}</span>}
      </span>
      {/* Default badge / hover-action. When hovered, badge becomes a clickable
          control that flips the default flag — saves a trip to /brand. */}
      {onToggleDefault ? (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleDefault(); }}
          title={isDefault ? "Click to clear default" : "Click to set as default"}
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            color: isDefault ? "var(--accent-text)" : (hovered ? "var(--text2)" : "var(--text3)"),
            background: isDefault ? "var(--accent-soft)" : (hovered ? "var(--bg)" : "transparent"),
            border: isDefault ? "1px solid rgba(233,30,120,0.25)" : `1px solid ${hovered ? "var(--border)" : "transparent"}`,
            padding: "2px 6px",
            borderRadius: 4,
            cursor: "pointer",
            opacity: isDefault || hovered ? 1 : 0,
            transition: "all 120ms ease",
            whiteSpace: "nowrap",
          }}
        >
          {isDefault ? "✕ Default" : "Set default"}
        </button>
      ) : (
        badge && (
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: 0.8, color: "var(--accent-text)",
            background: "var(--accent-soft)", padding: "2px 6px", borderRadius: 4,
          }}>{badge}</span>
        )
      )}
      {selected && <span style={{ color: "var(--accent-text)", fontSize: 11 }}>✓</span>}
    </div>
  );
}
