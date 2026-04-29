"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrandThemeWrapper,
  Uplabel,
  Btn,
  MiniSlide,
  Skel,
  SkelKeyframes,
  monoFamily,
  serifFamily,
} from "./_design";

interface KitSummary {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  status: "draft" | "extracting" | "ready" | "failed";
  version: number;
  brandVars: {
    brandName?: string;
    headerLeft?: string;
    headerRight?: string;
    colors?: {
      bg?: string;
      surface?: string;
      text?: string;
      textSecondary?: string;
      border?: string;
      accent?: string;
      accentLight?: string;
      dark?: string;
    };
    fonts?: {
      headingFamily?: string;
      bodyFamily?: string;
    };
  };
  updatedAt: string;
}

export default function BrandKitsPage() {
  const router = useRouter();
  const [kits, setKits] = useState<KitSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/brand-kits")
      .then((r) => r.json())
      .then((data) => setKits(data.kits ?? []))
      .catch(() => setKits([]))
      .finally(() => setLoading(false));
  }, []);

  const openKit = openId ? kits?.find((k) => k.id === openId) ?? null : null;

  async function setDefault(kitId: string) {
    await fetch(`/api/brand-kits/${kitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    setKits((prev) =>
      prev?.map((k) => ({ ...k, isDefault: k.id === kitId })) ?? null,
    );
  }

  async function clearDefault(kitId: string) {
    await fetch(`/api/brand-kits/${kitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: false }),
    });
    setKits((prev) =>
      prev?.map((k) => (k.id === kitId ? { ...k, isDefault: false } : k)) ?? null,
    );
  }

  async function deleteKit(kitId: string) {
    let sessionCount = 0;
    try {
      const r = await fetch(`/api/brand-kits/${kitId}?check=true`, { method: "DELETE" });
      const data = await r.json();
      sessionCount = data.sessionCount ?? 0;
    } catch { /* fall through */ }
    const msg = sessionCount > 0
      ? `${sessionCount} session${sessionCount === 1 ? "" : "s"} reference this kit. They'll lose their styling and fall back to your default kit. Continue?`
      : "Delete this brand kit? This cannot be undone.";
    if (!confirm(msg)) return;
    await fetch(`/api/brand-kits/${kitId}`, { method: "DELETE" });
    setKits((prev) => prev?.filter((k) => k.id !== kitId) ?? null);
    setOpenId(null);
  }

  return (
    <BrandThemeWrapper>
      <div style={{ width: "100%", minHeight: "100%", position: "relative", overflow: "auto" }}>
        {/* Header — title block + primary CTA. The CTA is vertically centered
            on the title so it doesn't sink to the baseline (which read as
            misaligned against the 48px display type). */}
        <div
          style={{
            padding: "40px 40px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <Uplabel>Brand kits · Collection</Uplabel>
            <h1
              style={{
                fontSize: 48,
                fontWeight: 500,
                margin: "8px 0 0",
                letterSpacing: "-0.025em",
                color: "var(--text)",
                lineHeight: 1.05,
              }}
            >
              <span style={{ fontFamily: serifFamily, fontStyle: "italic", fontWeight: 400 }}>
                Brand
              </span>{" "}
              Kits
            </h1>
          </div>
          <Btn
            variant="primary"
            onClick={() => router.push("/brand/new")}
            style={{ padding: "10px 18px", flexShrink: 0, alignSelf: "center" }}
          >
            + New brand kit
          </Btn>
        </div>

        <SkelKeyframes />

        {/* Stacks grid */}
        {loading ? (
          <div
            style={{
              padding: "60px 40px 80px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 60,
              alignItems: "start",
            }}
          >
            {[0, 1, 2].map((i) => (
              <StackSkeleton key={i} delay={i * 100} />
            ))}
          </div>
        ) : !kits || kits.length === 0 ? (
          <div style={{ padding: "120px 40px", textAlign: "center" }}>
            <div
              style={{
                fontFamily: serifFamily,
                fontStyle: "italic",
                fontSize: 32,
                fontWeight: 400,
                color: "var(--text2)",
                marginBottom: 8,
              }}
            >
              No stacks yet.
            </div>
            <div style={{ color: "var(--text3)", fontSize: 13, marginBottom: 24 }}>
              Brand kits are layouts + colors + fonts extracted from your own deck.
              <br />
              Upload one to get started.
            </div>
            <Btn variant="primary" onClick={() => router.push("/brand/new")}>
              Create your first kit
            </Btn>
          </div>
        ) : (
          <div
            style={{
              padding: "60px 40px 80px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 60,
              alignItems: "start",
            }}
          >
            {kits.map((kit, i) => (
              <Stack
                key={kit.id}
                kit={kit}
                idx={i}
                isOpen={openId === kit.id}
                anyOpen={openId !== null}
                onToggle={() => setOpenId(openId === kit.id ? null : kit.id)}
              />
            ))}
          </div>
        )}

        {/* Detail overlay */}
        <AnimatePresence>
          {openKit && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpenId(null)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.55)",
                  zIndex: 50,
                  cursor: "zoom-out",
                }}
              />
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                style={{
                  position: "fixed",
                  top: 120,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "min(720px, calc(100% - 80px))",
                  zIndex: 51,
                  maxHeight: "calc(100vh - 160px)",
                  overflow: "auto",
                }}
              >
                <DetailPanel
                  kit={openKit}
                  onClose={() => setOpenId(null)}
                  onOpenKit={() => router.push(`/brand/${openKit.id}`)}
                  onSetDefault={() => setDefault(openKit.id)}
                  onClearDefault={() => clearDefault(openKit.id)}
                  onDelete={() => deleteKit(openKit.id)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </BrandThemeWrapper>
  );
}

// ─── Loading skeletons ──────────────────────────────────────────────────────

function StackSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      style={{
        position: "relative",
        height: 380,
      }}
    >
      {/* Faint back-card hints to suggest the "stack" shape */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          height: 380,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 14,
          transform: "translate(8px, 10px) rotate(1.2deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          height: 380,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 14,
          transform: "translate(4px, 5px) rotate(0.6deg)",
        }}
      />
      {/* Front card scaffold */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          height: 380,
          background: "var(--bg2)",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 20px 50px rgba(0,0,0,0.55), 0 0 0 1px var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflow: "hidden",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingBottom: 14,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Skel width={50} height={10} delay={delay} />
          <Skel width={90} height={10} delay={delay} />
        </div>
        <Skel width="70%" height={26} delay={delay} />
        <Skel width="92%" height={12} delay={delay + 50} />
        <Skel width="60%" height={12} delay={delay + 50} />
        <div style={{ flex: 1 }} />
        <Skel height={120} radius={8} delay={delay + 100} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            background: "var(--border)",
            padding: "1px 0",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ background: "var(--bg2)", padding: "10px 8px", textAlign: "center" }}
            >
              <Skel width="40%" height={16} delay={delay + 150 + i * 30} style={{ margin: "0 auto 4px" }} />
              <Skel width="60%" height={8} delay={delay + 150 + i * 30} style={{ margin: "0 auto" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stack card ─────────────────────────────────────────────────────────────

function Stack({
  kit,
  idx,
  isOpen,
  anyOpen,
  onToggle,
}: {
  kit: KitSummary;
  idx: number;
  isOpen: boolean;
  anyOpen: boolean;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const c = kit.brandVars?.colors ?? {};
  const tilt = ((idx % 3) - 1) * 1.5;
  const palette = [c.dark, c.accent, c.surface, c.text].filter(Boolean) as string[];

  // Front-card visual fallbacks (kit might be mid-extraction with empty brandVars).
  const frontBg = c.bg ?? "#1A1A1A";
  const frontText = c.text ?? "#F0F0F0";
  const frontTextSecondary = c.textSecondary ?? "#A0A0A8";
  const frontBorder = c.border ?? "rgba(255,255,255,0.08)";

  return (
    <div
      style={{
        position: "relative",
        height: 380,
        perspective: 1200,
        zIndex: isOpen ? 5 : 1,
        opacity: anyOpen && !isOpen ? 0.35 : 1,
        filter: anyOpen && !isOpen ? "blur(1px)" : "none",
        transition: "opacity 0.3s var(--ease), filter 0.3s var(--ease)",
      }}
    >
      {/* Back palette layers */}
      {palette.slice(0, 3).map((hex, i) => {
        const closedX = (2 - i) * 5;
        const closedY = (2 - i) * 6;
        const closedRot = tilt + (2 - i) * 0.6;
        const openRot = -10 + i * 8;
        const openX = -28 + i * 28;
        const openY = -10 + i * 4;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 380,
              background: hex,
              borderRadius: 14,
              boxShadow: isOpen
                ? "0 18px 40px rgba(0,0,0,0.55)"
                : "0 10px 30px rgba(0,0,0,0.45)",
              transform: isOpen
                ? `translate(${openX}px, ${openY}px) rotate(${openRot}deg) scale(0.92)`
                : `translate(${closedX}px, ${closedY}px) rotate(${closedRot}deg)`,
              transformOrigin: "center center",
              transition: "transform 0.5s var(--ease), box-shadow 0.4s var(--ease)",
              zIndex: i,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-end",
              padding: 14,
              color: "rgba(255,255,255,0.85)",
              fontFamily: monoFamily,
              fontSize: 9.5,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {isOpen && <div style={{ opacity: 0.85 }}>{hex.toUpperCase()}</div>}
          </div>
        );
      })}

      {/* Front card */}
      <div
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 380,
          background: frontBg,
          color: frontText,
          borderRadius: 14,
          padding: 24,
          transform: isOpen
            ? "rotate(0deg) translateY(-6px) scale(1.01)"
            : hovered
              ? `rotate(0deg) translateY(-8px)`
              : `rotate(${tilt}deg)`,
          boxShadow: isOpen
            ? "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px var(--border)"
            : "0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px var(--border)",
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          transition: "transform 0.45s var(--ease), box-shadow 0.4s var(--ease)",
          overflow: "hidden",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingBottom: 14,
            borderBottom: `1px solid ${frontBorder}`,
            fontFamily: monoFamily,
            fontSize: 10,
            color: frontTextSecondary,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          <span>№ {String(idx + 1).padStart(3, "0")}</span>
          <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {kit.brandVars?.fonts?.headingFamily ?? "—"}
          </span>
        </div>

        {/* Title — single-line ellipsis with explicit reservation of vertical
            space so capital ascenders can never collide with the parent
            card's overflow:hidden boundary. */}
        <div
          title={kit.name}
          style={{
            marginTop: 22,
            // Explicit minHeight = lineHeight × fontSize × safety, plus the
            // padding below — guarantees the box is taller than any glyph the
            // browser can produce, no matter the font fallback.
            minHeight: 38,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.3,
            color: frontText,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            paddingTop: 4,
            paddingBottom: 2,
            // Reserve room below for descenders on rare names that have them.
            display: "block",
          }}
        >
          {kit.name}
        </div>
        <div
          style={{
            fontSize: 13,
            color: frontTextSecondary,
            marginTop: 6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {kit.description ?? "—"}
        </div>

        <div style={{ flex: 1 }} />

        {/* Mini slide preview — only render if we have enough vars to make it look right */}
        {c.bg && c.text && c.accent && (
          <div style={{ margin: "20px 0", display: "flex", justifyContent: "center" }}>
            <MiniSlide
              kit={{
                brandVars: {
                  headerLeft: kit.brandVars?.headerLeft,
                  headerRight: kit.brandVars?.headerRight,
                  colors: {
                    bg: c.bg!,
                    text: c.text!,
                    textSecondary: c.textSecondary ?? "#888",
                    accent: c.accent!,
                  },
                },
              }}
              size="md"
            />
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            background: frontBorder,
            padding: "1px 0",
            marginTop: "auto",
          }}
        >
          {[
            { v: `v${kit.version}`, l: "Version" },
            { v: kit.status === "ready" ? "✓" : kit.status === "extracting" ? "…" : "—", l: "Status" },
            { v: kit.isDefault ? "★" : "—", l: "Default" },
          ].map((s, i) => (
            <div key={i} style={{ background: frontBg, padding: "10px 8px", textAlign: "center" }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: frontText,
                  letterSpacing: "-0.01em",
                  fontFamily: serifFamily,
                }}
              >
                {s.v}
              </div>
              <div
                style={{
                  fontFamily: monoFamily,
                  fontSize: 9,
                  color: frontTextSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  marginTop: 2,
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Detail overlay ─────────────────────────────────────────────────────────

function DetailPanel({
  kit,
  onClose,
  onOpenKit,
  onSetDefault,
  onClearDefault,
  onDelete,
}: {
  kit: KitSummary;
  onClose: () => void;
  onOpenKit: () => void;
  onSetDefault: () => void;
  onClearDefault: () => void;
  onDelete: () => void;
}) {
  const c = kit.brandVars?.colors ?? {};
  const f = kit.brandVars?.fonts ?? {};
  const panelBg = c.bg ?? "#1A1A1A";
  const panelText = c.text ?? "#F0F0F0";
  const panelTextSecondary = c.textSecondary ?? "#A0A0A8";
  const panelBorder = c.border ?? "rgba(255,255,255,0.08)";

  return (
    <div
      style={{
        background: panelBg,
        color: panelText,
        borderRadius: 14,
        padding: 28,
        boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: 14,
          borderBottom: `1px solid ${panelBorder}`,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontFamily: monoFamily,
            fontSize: 9.5,
            color: panelTextSecondary,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
          }}
        >
          Card details · {kit.id.slice(0, 8).toUpperCase()}
          {kit.isDefault && (
            <span style={{ marginLeft: 8, color: panelText, opacity: 0.7 }}>· DEFAULT</span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            background: "transparent",
            color: panelTextSecondary,
            border: `1px solid ${panelBorder}`,
            padding: "5px 12px",
            borderRadius: 999,
            fontFamily: monoFamily,
            fontSize: 9.5,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            cursor: "pointer",
          }}
        >
          Close ✕
        </button>
      </div>

      {/* Type specimen — kit name in its own heading font */}
      <div
        style={{
          fontFamily: f.headingFamily ? `'${f.headingFamily}', ${serifFamily}` : serifFamily,
          fontSize: 64,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          color: panelText,
          margin: "8px 0",
          paddingTop: 4,
          overflowWrap: "break-word",
        }}
      >
        {kit.name}
      </div>
      <div
        style={{
          fontFamily: f.bodyFamily ? `'${f.bodyFamily}', ${serifFamily}` : "inherit",
          fontSize: 14,
          color: panelTextSecondary,
          lineHeight: 1.5,
          maxWidth: 540,
          marginBottom: 24,
        }}
      >
        {kit.description ?? "No description"} · v{kit.version} · {kit.status}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        {/* Color tokens */}
        <div>
          <div
            style={{
              fontFamily: monoFamily,
              fontSize: 9.5,
              color: panelTextSecondary,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              marginBottom: 12,
            }}
          >
            Color tokens
          </div>
          {Object.entries(c).slice(0, 6).map(([name, hex]) => (
            <div
              key={name}
              style={{
                display: "grid",
                gridTemplateColumns: "18px 1fr auto",
                gap: 10,
                alignItems: "center",
                padding: "7px 0",
                borderBottom: `1px solid ${panelBorder}`,
                fontSize: 12,
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 3, background: hex, border: `1px solid ${panelBorder}` }} />
              <span style={{ color: panelText }}>{name}</span>
              <span style={{ fontFamily: monoFamily, fontSize: 10.5, color: panelTextSecondary }}>{hex}</span>
            </div>
          ))}
        </div>

        {/* Type & metadata */}
        <div>
          <div
            style={{
              fontFamily: monoFamily,
              fontSize: 9.5,
              color: panelTextSecondary,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              marginBottom: 12,
            }}
          >
            Type & metadata
          </div>
          {[
            ["Heading", f.headingFamily ?? "—", true],
            ["Body", f.bodyFamily ?? "—", true],
            ["Version", `v${kit.version}`, false],
            ["Status", kit.status, false],
            ["Default", kit.isDefault ? "Yes" : "No", false],
            ["Updated", new Date(kit.updatedAt).toLocaleDateString(), false],
          ].map(([k, v, useFamily], i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "70px 1fr",
                gap: 10,
                alignItems: "center",
                padding: "7px 0",
                borderBottom: `1px solid ${panelBorder}`,
                fontSize: 12,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontFamily: monoFamily,
                  fontSize: 10,
                  color: panelTextSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                }}
              >
                {k as string}
              </span>
              <span
                style={{
                  color: panelText,
                  fontFamily: useFamily ? `'${v}'` : "inherit",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {v as string}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action row */}
      <div
        style={{
          marginTop: 22,
          paddingTop: 18,
          borderTop: `1px solid ${panelBorder}`,
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onOpenKit(); }}
          style={{
            background: c.accent ?? "var(--accent)",
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Open kit →
        </button>
        {/* Default toggle — same physical slot, label flips based on current
            state so users can both promote and demote without leaving the
            overlay. Demote leaves zero defaults — vanilla LLM behavior. */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            kit.isDefault ? onClearDefault() : onSetDefault();
          }}
          style={{
            background: "transparent",
            color: kit.isDefault ? "var(--accent-text)" : panelText,
            border: `1px solid ${kit.isDefault ? "rgba(233,30,120,0.35)" : panelBorder}`,
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {kit.isDefault ? "✕  Remove default" : "Set as default"}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            background: "transparent",
            color: panelTextSecondary,
            border: `1px solid ${panelBorder}`,
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 12,
            cursor: "pointer",
            marginLeft: "auto",
            whiteSpace: "nowrap",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
