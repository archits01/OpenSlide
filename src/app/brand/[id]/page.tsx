"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { BrandVars } from "@/lib/brand/types";
import { BrandThemeWrapper, MiniSlide, Tag, Btn, Uplabel, Skel, SkelKeyframes, monoFamily, serifFamily } from "../_design";

interface KitDetail {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  status: string;
  version: number;
  brandVars: BrandVars;
  skillMd: string | null;
  designSystemMd: string | null;
  layoutLibraryMd: string | null;
  userEditedFiles: string[];
  updatedAt: string;
  domain: string | null;
  layoutCap: number;
  extractionLog?: Array<{
    step: string;
    status: "started" | "succeeded" | "failed";
    message?: string;
    error?: string;
    ts: string;
    durationMs?: number;
  }>;
  sourceFiles?: Array<{ kind: string; storageUrl: string; originalName: string; uploadedAt: string }>;
}

type Tab = "variables" | "design" | "layouts" | "skill" | "extraction" | "sources" | "history";

export default function BrandKitDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [kit, setKit] = useState<KitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("variables");
  const [vars, setVars] = useState<BrandVars | null>(null);
  const [savingVars, setSavingVars] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [savingFile, setSavingFile] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: NodeJS.Timeout | null = null;

    const load = async () => {
      try {
        const r = await fetch(`/api/brand-kits/${id}`);
        const data = await r.json();
        if (cancelled) return;
        if (data.kit) {
          const k = data.kit as KitDetail;
          setKit(k);
          setVars((prev) => prev ?? k.brandVars);
          // Keep polling while extraction is in flight.
          if (k.status === "extracting") {
            pollTimer = setTimeout(load, 1500);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [id]);

  async function saveVars() {
    if (!vars) return;
    setSavingVars(true);
    const res = await fetch(`/api/brand-kits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandVars: vars }),
    });
    if (res.ok) {
      const data = await res.json();
      setKit({ ...(kit as KitDetail), brandVars: data.kit.brandVars });
      setSavedAt(new Date().toLocaleTimeString());
    }
    setSavingVars(false);
  }

  async function saveMd(file: "skillMd" | "designSystemMd" | "layoutLibraryMd", value: string) {
    setSavingFile(file);
    await fetch(`/api/brand-kits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [file]: value }),
    });
    setSavingFile(null);
    setSavedAt(new Date().toLocaleTimeString());
    setKit((prev) => prev ? { ...prev, [file]: value, userEditedFiles: Array.from(new Set([...prev.userEditedFiles, file])) } : prev);
  }

  async function toggleLock(file: "skillMd" | "designSystemMd" | "layoutLibraryMd", locked: boolean) {
    if (!kit) return;
    // Server-side: userEditedFiles is the source of truth for the lock state.
    // We send the full new array so the server can replace it directly.
    const next = new Set(kit.userEditedFiles);
    if (locked) next.add(file); else next.delete(file);
    const arr = Array.from(next);
    await fetch(`/api/brand-kits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEditedFiles: arr }),
    });
    setKit({ ...kit, userEditedFiles: arr });
    setSavedAt(new Date().toLocaleTimeString());
  }

  if (loading) {
    return (
      <BrandThemeWrapper>
        <SkelKeyframes />
        <DetailSkeleton />
      </BrandThemeWrapper>
    );
  }
  if (!kit || !vars) {
    return (
      <BrandThemeWrapper>
        <div style={{ padding: 64, textAlign: "center" }}>
          <p style={{ color: "var(--text2)" }}>Kit not found.</p>
          <Link href="/brand" style={{ color: "var(--accent)" }}>← Back to brand kits</Link>
        </div>
      </BrandThemeWrapper>
    );
  }

  // Tab counts surfaced inline in the strip (V4-Workbench treatment).
  const tabCounts: Record<Tab, number | null> = {
    variables: null,
    design: kit.designSystemMd ? 1 : 0,
    layouts: kit.layoutLibraryMd ? (kit.layoutLibraryMd.match(/## Pattern \d+:/g) ?? []).length : 0,
    skill: kit.skillMd ? 1 : 0,
    sources: kit.sourceFiles?.length ?? 0,
    extraction: kit.extractionLog?.length ?? 0,
    history: null,
  };

  return (
    <BrandThemeWrapper>
      <div style={{ width: "100%", minHeight: "100%", overflow: "auto" }}>
        {/* Breadcrumb + title + actions header */}
        <div style={{ padding: "20px 40px 0", borderBottom: "1px solid var(--border)" }}>
          <div
            style={{
              fontFamily: monoFamily,
              fontSize: 11,
              color: "var(--text3)",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Link
              href="/brand"
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text2)",
                fontSize: 10,
                padding: "3px 8px",
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: monoFamily,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginRight: 4,
                textDecoration: "none",
              }}
            >
              ← Brand kits
            </Link>
            <span style={{ color: "var(--text2)" }}>brand</span>
            <span>/</span>
            <span style={{ color: "var(--text2)" }}>kits</span>
            <span>/</span>
            <span style={{ color: "var(--text)" }}>{kit.name.toLowerCase().replace(/\s+/g, "-")}</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              paddingBottom: 18,
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                <h1
                  style={{
                    fontSize: 36,
                    fontWeight: 500,
                    margin: 0,
                    letterSpacing: "-0.025em",
                    color: "var(--text)",
                  }}
                >
                  {kit.name}
                </h1>
                {kit.isDefault && (
                  <DefaultChip
                    onClear={async () => {
                      const res = await fetch(`/api/brand-kits/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isDefault: false }),
                      });
                      if (res.ok) {
                        setKit({ ...kit, isDefault: false });
                        setSavedAt(new Date().toLocaleTimeString());
                      }
                    }}
                  />
                )}
                <Tag
                  variant={kit.status === "ready" ? "ready" : kit.status === "failed" ? "warn" : "default"}
                  withDot
                >
                  {kit.status === "extracting" ? "Extracting" : kit.status === "ready" ? "Ready" : kit.status}
                  {" · v"}{kit.version}
                </Tag>
              </div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>
                {kit.description ?? "—"}
                <span style={{ fontFamily: monoFamily, color: "var(--text4)", marginLeft: 12, fontSize: 11 }}>
                  · {kit.userEditedFiles?.length ?? 0} locked file{(kit.userEditedFiles?.length ?? 0) === 1 ? "" : "s"}
                </span>
                <span style={{ fontFamily: monoFamily, color: "var(--text4)", marginLeft: 8, fontSize: 11 }}>
                  · updated {new Date(kit.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {savedAt && (
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--text3)" }}>Saved at {savedAt}</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {!kit.isDefault && (
                <Btn
                  variant="ghost"
                  onClick={async () => {
                    const res = await fetch(`/api/brand-kits/${id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ isDefault: true }),
                    });
                    if (res.ok) {
                      setKit({ ...kit, isDefault: true });
                      setSavedAt(new Date().toLocaleTimeString());
                    }
                  }}
                  style={{ padding: "8px 12px", fontSize: 12 }}
                >
                  Set default
                </Btn>
              )}
              <Btn
                variant="primary"
                onClick={() => router.push("/")}
                style={{ padding: "8px 14px", fontSize: 12 }}
              >
                Test on a new deck →
              </Btn>
            </div>
          </div>

          {/* Inline tab strip with counts. Only horizontal overflow allowed —
              `overflow: auto` was previously causing a phantom vertical
              scrollbar inside the strip on some scrollbar-style settings. */}
          <div
            style={{
              display: "flex",
              gap: 0,
              overflowX: "auto",
              overflowY: "hidden",
            }}
          >
            {(["variables", "design", "layouts", "skill", "sources", "extraction", "history"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                  color: tab === t ? "var(--text)" : "var(--text2)",
                  fontSize: 13,
                  fontWeight: tab === t ? 600 : 500,
                  cursor: "pointer",
                  marginBottom: -1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                  textTransform: "capitalize",
                }}
              >
                {t === "design" ? "Design system" : t === "skill" ? "Skill" : t}
                {tabCounts[t] != null && (
                  <span
                    style={{
                      fontFamily: monoFamily,
                      fontSize: 10,
                      color: "var(--text3)",
                      background: "var(--bg2)",
                      padding: "1px 6px",
                      borderRadius: 999,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {tabCounts[t]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body — split: tab content + sticky preview rail */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 32,
            padding: 32,
          }}
        >
          <div style={{ minWidth: 0 }}>

          {/* Variables tab */}
          {tab === "variables" && (
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
              <Section title="Identity">
                <Row label="Brand name">
                  <input style={input} value={vars.brandName} onChange={(e) => setVars({ ...vars, brandName: e.target.value })} />
                </Row>
                <Row label="Header (left)">
                  <input style={input} value={vars.headerLeft ?? ""} onChange={(e) => setVars({ ...vars, headerLeft: e.target.value })} />
                </Row>
                <Row label="Header (right)">
                  <input style={input} value={vars.headerRight ?? ""} onChange={(e) => setVars({ ...vars, headerRight: e.target.value })} />
                </Row>
                <Row label="Footer text">
                  <input style={input} value={vars.footerText ?? ""} onChange={(e) => setVars({ ...vars, footerText: e.target.value })} />
                </Row>
                <Row label="Domain (optional)">
                  <input
                    style={input}
                    placeholder="e.g. mckinsey.com — used to block fetch_logo for this kit's brand"
                    defaultValue={kit.domain ?? ""}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      void fetch(`/api/brand-kits/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ domain: v || null }),
                      }).then(() => setKit(kit ? { ...kit, domain: v || null } : kit));
                    }}
                  />
                </Row>
                <Row label="Layout cap">
                  <input
                    type="number"
                    min={4}
                    max={20}
                    style={input}
                    defaultValue={kit.layoutCap}
                    onBlur={(e) => {
                      const n = Math.max(4, Math.min(20, Number(e.target.value) || 12));
                      void fetch(`/api/brand-kits/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ layoutCap: n }),
                      }).then(() => setKit(kit ? { ...kit, layoutCap: n } : kit));
                    }}
                  />
                </Row>
              </Section>

              <Section title="Colors">
                {(Object.keys(vars.colors) as Array<keyof typeof vars.colors>).map((key) => (
                  <Row key={key} label={key}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="color"
                        value={(vars.colors[key] as string) ?? "#000000"}
                        onChange={(e) => setVars({ ...vars, colors: { ...vars.colors, [key]: e.target.value } })}
                        style={{ width: 40, height: 32, border: "1px solid var(--border)", borderRadius: 6, padding: 0 }}
                      />
                      <input
                        style={{ ...input, fontFamily: "monospace", flex: 1 }}
                        value={(vars.colors[key] as string) ?? ""}
                        onChange={(e) => setVars({ ...vars, colors: { ...vars.colors, [key]: e.target.value } })}
                      />
                    </div>
                  </Row>
                ))}
              </Section>

              <Section title="Fonts">
                <Row label="Heading family">
                  <input style={input} value={vars.fonts.headingFamily} onChange={(e) => setVars({ ...vars, fonts: { ...vars.fonts, headingFamily: e.target.value } })} />
                </Row>
                <Row label="Heading import URL">
                  <input style={input} value={vars.fonts.headingImportUrl} onChange={(e) => setVars({ ...vars, fonts: { ...vars.fonts, headingImportUrl: e.target.value } })} />
                </Row>
                <Row label="Body family">
                  <input style={input} value={vars.fonts.bodyFamily} onChange={(e) => setVars({ ...vars, fonts: { ...vars.fonts, bodyFamily: e.target.value } })} />
                </Row>
                <Row label="Body import URL">
                  <input style={input} value={vars.fonts.bodyImportUrl} onChange={(e) => setVars({ ...vars, fonts: { ...vars.fonts, bodyImportUrl: e.target.value } })} />
                </Row>
              </Section>

              <Section title="Logo">
                <Row label="Image">
                  <LogoUploader
                    kitId={id}
                    currentUrl={vars.logo.url}
                    onUpdated={(newUrl) => setVars({ ...vars, logo: { ...vars.logo, url: newUrl } })}
                  />
                </Row>
                <Row label="URL">
                  <input style={input} value={vars.logo.url} onChange={(e) => setVars({ ...vars, logo: { ...vars.logo, url: e.target.value } })} />
                </Row>
                <Row label="Placement">
                  <select style={input} value={vars.logo.placement} onChange={(e) => setVars({ ...vars, logo: { ...vars.logo, placement: e.target.value as BrandVars["logo"]["placement"] } })}>
                    <option value="top-left">top-left</option>
                    <option value="top-right">top-right</option>
                    <option value="bottom-left">bottom-left</option>
                    <option value="bottom-right">bottom-right</option>
                    <option value="header-inline">header-inline</option>
                  </select>
                </Row>
                <Row label="Size (px)">
                  <input type="number" style={input} value={vars.logo.sizePx} onChange={(e) => setVars({ ...vars, logo: { ...vars.logo, sizePx: Number(e.target.value) } })} />
                </Row>
              </Section>

              <button
                onClick={saveVars}
                disabled={savingVars}
                style={{ marginTop: 8, padding: "10px 18px", borderRadius: 10, border: "none", background: "var(--accent)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                {savingVars ? "Saving…" : "Save variables"}
              </button>
            </div>
          )}

          {/* Layouts: thumbnail grid above the markdown editor */}
          {tab === "layouts" && kit.layoutLibraryMd && (
            <div style={{ marginBottom: 16 }}>
              <PatternThumbnails kitId={id} layoutLibraryMd={kit.layoutLibraryMd} version={kit.version} />
            </div>
          )}

          {/* Design / layouts / skill markdown editor */}
          {(tab === "design" || tab === "layouts" || tab === "skill") && (
            <MarkdownEditor
              file={tab === "design" ? "designSystemMd" : tab === "layouts" ? "layoutLibraryMd" : "skillMd"}
              initialValue={tab === "design" ? kit.designSystemMd ?? "" : tab === "layouts" ? kit.layoutLibraryMd ?? "" : kit.skillMd ?? ""}
              isUserEdited={kit.userEditedFiles.includes(tab === "design" ? "designSystemMd" : tab === "layouts" ? "layoutLibraryMd" : "skillMd")}
              saving={savingFile === (tab === "design" ? "designSystemMd" : tab === "layouts" ? "layoutLibraryMd" : "skillMd")}
              onSave={saveMd}
              brandVars={vars}
              onToggleLock={toggleLock}
            />
          )}

          {/* Sources tab */}
          {tab === "sources" && (
            <SourcesPanel kit={kit} />
          )}

          {/* Extraction log tab */}
          {tab === "extraction" && (
            <ExtractionLogPanel kit={kit} />
          )}

          {/* Version history tab */}
          {tab === "history" && (
            <VersionHistoryPanel kitId={id} onRolledBack={() => {
              fetch(`/api/brand-kits/${id}`).then((r) => r.json()).then((d) => {
                if (d.kit) { setKit(d.kit); setVars(d.kit.brandVars); }
              }).catch(() => {});
            }} />
          )}
          </div>

          {/* Sticky preview rail */}
          <div style={{ position: "sticky", top: 24, alignSelf: "start" }}>
            <Uplabel style={{ marginBottom: 12 }}>Live preview</Uplabel>
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
                background: "var(--bg)",
              }}
            >
              <div
                style={{
                  padding: 14,
                  background: vars.colors.bg ?? "var(--bg)",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <MiniSlide
                  kit={{
                    brandVars: {
                      headerLeft: vars.headerLeft ?? vars.brandName,
                      headerRight: vars.headerRight ?? "Confidential",
                      colors: {
                        bg: vars.colors.bg,
                        text: vars.colors.text,
                        textSecondary: vars.colors.textSecondary ?? "#888",
                        accent: vars.colors.accent,
                      },
                    },
                  }}
                  size="md"
                />
              </div>
              <div
                style={{
                  padding: "10px 14px",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 11,
                  color: "var(--text3)",
                }}
              >
                <span style={{ fontFamily: monoFamily }}>
                  {vars.fonts.headingFamily} · {vars.colors.accent}
                </span>
                <span style={{ display: "flex", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--text3)" }} />
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: vars.colors.accent }} />
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--text3)" }} />
                </span>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <Uplabel style={{ marginBottom: 10 }}>Locked files</Uplabel>
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  background: "var(--bg)",
                  padding: "12px 14px",
                  fontSize: 12,
                  color: "var(--text2)",
                }}
              >
                {kit.userEditedFiles.length === 0 ? (
                  <div style={{ color: "var(--text3)", fontSize: 12 }}>
                    No files locked. Edit any markdown file to protect it from re-extraction.
                  </div>
                ) : (
                  kit.userEditedFiles.map((f) => (
                    <div
                      key={f}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px 0",
                        fontFamily: monoFamily,
                        fontSize: 11,
                      }}
                    >
                      <span>{f}</span>
                      <span style={{ color: "var(--accent-text)" }}>locked</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrandThemeWrapper>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text3)", margin: "0 0 12px" }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, marginBottom: 10, alignItems: "center" }}>
      <div style={{ fontSize: 12, color: "var(--text2)" }}>{label}</div>
      {children}
    </div>
  );
}

function Pill({ children, color = "var(--text2)", bg = "var(--bg2)" }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color, background: bg, padding: "3px 8px", borderRadius: 6 }}>
      {children}
    </span>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg2)",
  fontSize: 12,
  color: "var(--text)",
  outline: "none",
};

/**
 * Hover-X chip for the Default tag — same visual as the Tag but with an X
 * that reveals on hover. Click clears the default flag (kit no longer
 * auto-applies to new presentations until re-promoted).
 */
function DefaultChip({ onClear }: { onClear: () => void | Promise<void> }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={async (e) => { e.stopPropagation(); await onClear(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Click to clear default — kit will no longer auto-apply to new presentations"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        borderRadius: 999,
        fontFamily: monoFamily,
        fontSize: 10,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        background: "var(--accent-soft)",
        color: "var(--accent-text)",
        border: "1px solid rgba(233, 30, 120, 0.25)",
        cursor: "pointer",
        transition: "background 120ms var(--ease)",
        ...(hovered ? { background: "rgba(194,24,91,0.22)" } : {}),
      }}
    >
      <span>✓ Default</span>
      <span
        style={{
          fontSize: 9,
          opacity: hovered ? 1 : 0,
          transition: "opacity 120ms var(--ease)",
          width: hovered ? 8 : 0,
          overflow: "hidden",
        }}
      >
        ✕
      </span>
    </button>
  );
}

function DetailSkeleton() {
  return (
    <div style={{ width: "100%", minHeight: "100%" }}>
      {/* Breadcrumb + title block */}
      <div style={{ padding: "20px 40px 0", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
          <Skel width={94} height={22} radius={999} />
          <Skel width={50} height={11} delay={50} />
          <Skel width={50} height={11} delay={50} />
          <Skel width={140} height={11} delay={100} />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            paddingBottom: 18,
            gap: 16,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Skel width={300} height={36} radius={6} />
              <Skel width={70} height={20} radius={999} delay={100} />
              <Skel width={90} height={20} radius={999} delay={150} />
            </div>
            <Skel width="60%" height={13} delay={120} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Skel width={100} height={32} radius={10} delay={150} />
            <Skel width={140} height={32} radius={10} delay={200} />
          </div>
        </div>
        {/* Tab strip */}
        <div style={{ display: "flex", gap: 4, paddingBottom: 6 }}>
          {[60, 90, 70, 50, 70, 80, 60].map((w, i) => (
            <Skel key={i} width={w} height={28} radius={6} delay={i * 40} />
          ))}
        </div>
      </div>

      {/* Body grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: 32,
          padding: 32,
        }}
      >
        <div
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 24,
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, marginBottom: 16, alignItems: "center" }}>
              <Skel width={120} height={11} delay={i * 60} />
              <Skel height={32} radius={8} delay={i * 60 + 40} />
            </div>
          ))}
          <div style={{ height: 24 }} />
          <Skel width={120} height={11} />
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, marginTop: 12, alignItems: "center" }}>
              <Skel width={100} height={11} delay={i * 50} />
              <Skel height={32} radius={8} delay={i * 50 + 40} />
            </div>
          ))}
        </div>
        <div style={{ position: "sticky", top: 24, alignSelf: "start" }}>
          <Skel width={90} height={10} style={{ marginBottom: 12 }} />
          <Skel height={210} radius={12} delay={80} />
          <div style={{ height: 16 }} />
          <Skel width={90} height={10} style={{ marginBottom: 10 }} delay={150} />
          <Skel height={120} radius={10} delay={200} />
        </div>
      </div>
    </div>
  );
}

function PatternThumbnails({ kitId, layoutLibraryMd, version }: { kitId: string; layoutLibraryMd: string; version: number }) {
  // Count `## Pattern N: <name>` headings to know how many thumbnails to render.
  const headers = useMemo(() => {
    const out: Array<{ idx: number; name: string }> = [];
    const re = /## Pattern (\d+): ([^\n]+)/g;
    let m: RegExpExecArray | null;
    let i = 0;
    while ((m = re.exec(layoutLibraryMd))) {
      out.push({ idx: i, name: m[2].trim() });
      i++;
    }
    return out;
  }, [layoutLibraryMd]);

  if (headers.length === 0) return null;

  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text3)", margin: 0 }}>
          {headers.length} {headers.length === 1 ? "pattern" : "patterns"}
        </h3>
        <span style={{ fontSize: 11, color: "var(--text3)" }}>v{version}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {headers.map((h) => (
          <div key={h.idx} style={{ borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden", background: "var(--bg2)" }}>
            <div style={{ position: "relative", paddingBottom: "56.25%", background: "var(--bg2)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/brand-kits/${kitId}/thumbnail?pattern=${h.idx}&v=${version}`}
                alt={`Pattern ${h.idx + 1}: ${h.name}`}
                loading="lazy"
                style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%",
                  objectFit: "cover",
                  background: "var(--bg2)",
                }}
              />
            </div>
            <div style={{ padding: "8px 10px", fontSize: 11, fontWeight: 600, color: "var(--text)", borderTop: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text3)" }}>#{h.idx + 1}</span> · {h.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourcesPanel({ kit }: { kit: KitDetail }) {
  const sources = kit.sourceFiles ?? [];
  if (sources.length === 0) {
    return (
      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, color: "var(--text2)", fontSize: 13 }}>
        No source files recorded for this kit.
      </div>
    );
  }
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
      <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text3)", margin: "0 0 12px" }}>
        Source files ({sources.length})
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sources.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 12px", borderRadius: 8,
            background: "var(--bg2)", border: "1px solid var(--border)",
          }}>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
              padding: "3px 8px", borderRadius: 4,
              background: "var(--accent-soft)", color: "var(--accent-text)",
            }}>{s.kind}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.originalName}
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>
                Uploaded {new Date(s.uploadedAt).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExtractionLogPanel({ kit }: { kit: KitDetail }) {
  const log = kit.extractionLog ?? [];
  if (log.length === 0) {
    return (
      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, color: "var(--text2)", fontSize: 13 }}>
        No extraction log for this kit. Triggering an extraction will populate this view.
      </div>
    );
  }
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text3)", margin: 0 }}>
          Extraction log ({log.length} steps)
        </h3>
        <span style={{ fontSize: 11, color: kit.status === "ready" ? "var(--green)" : kit.status === "failed" ? "var(--red)" : "var(--text3)" }}>
          {kit.status}
        </span>
      </div>
      <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11 }}>
        {log.map((entry, i) => (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "20px 130px 90px 1fr",
            gap: 8,
            padding: "5px 0",
            borderBottom: i < log.length - 1 ? "1px solid var(--border-subtle, var(--border))" : "none",
            color: entry.status === "succeeded" ? "var(--text)" : entry.status === "failed" ? "var(--red)" : "var(--text3)",
          }}>
            <span>{entry.status === "succeeded" ? "✓" : entry.status === "failed" ? "✗" : "…"}</span>
            <span style={{ fontWeight: 600 }}>{entry.step}</span>
            <span style={{ color: "var(--text3)" }}>
              {entry.durationMs ? `${(entry.durationMs / 1000).toFixed(1)}s` : ""}
            </span>
            <span style={{ color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {entry.message ?? entry.error ?? ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VersionHistoryPanel({ kitId, onRolledBack }: { kitId: string; onRolledBack: () => void }) {
  const [versions, setVersions] = useState<Array<{ id: string; version: number; changeReason: string | null; createdAt: string }> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => fetch(`/api/brand-kits/${kitId}/versions`).then((r) => r.json()).then((d) => setVersions(d.versions ?? []));
  useEffect(() => { load(); }, [kitId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function rollback(versionId: string, version: number) {
    if (!confirm(`Roll back to v${version}? Current state will be saved as a snapshot first so this is reversible.`)) return;
    setBusy(versionId);
    try {
      await fetch(`/api/brand-kits/${kitId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      await load();
      onRolledBack();
    } finally {
      setBusy(null);
    }
  }

  if (versions === null) {
    return <div style={{ padding: 24, color: "var(--text3)" }}>Loading…</div>;
  }
  if (versions.length === 0) {
    return (
      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, color: "var(--text2)", fontSize: 13 }}>
        No history yet. Snapshots are created on every save and re-extraction.
      </div>
    );
  }
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
      <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text3)", margin: "0 0 12px" }}>
        History ({versions.length})
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {versions.map((v) => (
          <div key={v.id} style={{
            display: "grid", gridTemplateColumns: "60px 1fr 90px",
            gap: 12, alignItems: "center",
            padding: "10px 12px", borderRadius: 8,
            background: "var(--bg2)", border: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-text)" }}>v{v.version}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {v.changeReason ?? "saved"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text3)" }}>
                {new Date(v.createdAt).toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => rollback(v.id, v.version)}
              disabled={!!busy}
              style={{
                padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)",
                background: busy === v.id ? "var(--bg2)" : "var(--bg)",
                color: "var(--text)",
                fontSize: 11, fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              {busy === v.id ? "…" : "Roll back"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogoUploader({
  kitId,
  currentUrl,
  onUpdated,
}: {
  kitId: string;
  currentUrl: string;
  onUpdated: (newUrl: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/brand-kits/${kitId}/logo`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      onUpdated(data.logoUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/brand-kits/${kitId}/logo`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      onUpdated("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div
        style={{
          width: 64, height: 64, borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--bg2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", flexShrink: 0,
        }}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        ) : (
          <span style={{ fontSize: 10, color: "var(--text3)" }}>No logo</span>
        )}
      </div>
      <label
        htmlFor={`logo-upload-${kitId}`}
        style={{
          padding: "6px 12px", borderRadius: 8,
          background: "var(--bg2)", border: "1px solid var(--border)",
          fontSize: 12, fontWeight: 600, color: "var(--text)",
          cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Uploading…" : currentUrl ? "Replace" : "Upload"}
        <input
          id={`logo-upload-${kitId}`}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          disabled={busy}
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </label>
      {currentUrl && (
        <button
          onClick={clear}
          disabled={busy}
          style={{
            padding: "6px 12px", borderRadius: 8,
            background: "transparent", border: "1px solid var(--border)",
            fontSize: 12, fontWeight: 500, color: "var(--red)",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          Clear
        </button>
      )}
      {err && <span style={{ fontSize: 11, color: "var(--red)" }}>{err}</span>}
    </div>
  );
}

function MarkdownEditor(props: {
  file: "skillMd" | "designSystemMd" | "layoutLibraryMd";
  initialValue: string;
  isUserEdited: boolean;
  saving: boolean;
  onSave: (file: "skillMd" | "designSystemMd" | "layoutLibraryMd", value: string) => void;
  brandVars?: BrandVars | null;
  /** Toggle lock — protects file from re-extraction overwrite. */
  onToggleLock?: (file: "skillMd" | "designSystemMd" | "layoutLibraryMd", locked: boolean) => void;
}) {
  const [value, setValue] = useState(props.initialValue);
  const [previewOpen, setPreviewOpen] = useState(false);
  const isDirty = value !== props.initialValue;
  const lineCount = useMemo(() => value.split("\n").length, [value]);

  // Re-sync on file switch
  useEffect(() => { setValue(props.initialValue); }, [props.initialValue]);

  // Extract first ```html``` code block for preview, substitute brand vars.
  const previewHtml = useMemo(() => {
    if (!previewOpen || !props.brandVars) return null;
    const m = value.match(/```html\s*\n([\s\S]+?)```/);
    if (!m) return "<!-- No HTML code block found in this file -->";
    const raw = m[1];
    // Inline brand-var substitution (mirrors substituteBrandVars logic — kept
    // local to avoid pulling the module into the client bundle through a
    // server-side import chain).
    return raw.replace(/\{\{\s*brand\.([a-zA-Z0-9_.]+)\s*\}\}/g, (_full, p) => {
      const parts = (p as string).split(".");
      let cur: unknown = props.brandVars;
      for (const part of parts) {
        if (cur == null || typeof cur !== "object") return "";
        cur = (cur as Record<string, unknown>)[part];
      }
      return cur === undefined || cur === null ? "" : String(cur);
    });
  }, [previewOpen, value, props.brandVars]);

  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "var(--text3)", display: "flex", alignItems: "center", gap: 8 }}>
          <span>{value.length.toLocaleString()} chars · {lineCount} lines</span>
          {props.onToggleLock && (
            <button
              onClick={() => props.onToggleLock?.(props.file, !props.isUserEdited)}
              title={props.isUserEdited ? "This file is locked from re-extraction. Click to unlock." : "Lock this file so re-extraction won't overwrite it."}
              style={{
                fontSize: 10, fontWeight: 600,
                padding: "3px 8px", borderRadius: 4,
                border: "1px solid var(--border)",
                background: props.isUserEdited ? "var(--accent-soft)" : "var(--bg2)",
                color: props.isUserEdited ? "var(--accent-text)" : "var(--text2)",
                cursor: "pointer",
              }}
            >
              {props.isUserEdited ? "🔒 Locked" : "Unlocked"}
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setPreviewOpen((v) => !v)}
            style={{
              padding: "8px 14px", borderRadius: 8,
              border: "1px solid var(--border)",
              background: previewOpen ? "var(--accent-soft)" : "var(--bg2)",
              color: previewOpen ? "var(--accent-text)" : "var(--text2)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            {previewOpen ? "Hide preview" : "Preview"}
          </button>
          <button
            onClick={() => props.onSave(props.file, value)}
            disabled={!isDirty || props.saving}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: !isDirty ? "var(--bg2)" : "var(--accent)",
              color: !isDirty ? "var(--text3)" : "white",
              fontSize: 12, fontWeight: 600,
              cursor: !isDirty || props.saving ? "not-allowed" : "pointer",
            }}
          >
            {props.saving ? "Saving…" : isDirty ? "Save" : "Saved"}
          </button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: previewOpen ? "1fr 1fr" : "1fr", gap: 12 }}>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        spellCheck={false}
        style={{
          width: "100%",
          minHeight: 540,
          padding: 12,
          borderRadius: 10,
          border: "1px solid var(--border)",
          background: "var(--bg2)",
          fontSize: 12,
          fontFamily: "var(--font-geist-mono, ui-monospace, SFMono-Regular, monospace)",
          color: "var(--text)",
          outline: "none",
          resize: "vertical",
          tabSize: 2,
        }}
      />
      {previewOpen && (
        <div style={{
          minHeight: 540,
          borderRadius: 10,
          border: "1px solid var(--border)",
          background: "var(--bg2)",
          overflow: "hidden",
          position: "relative",
        }}>
          {previewHtml === null ? (
            <div style={{ padding: 24, color: "var(--text3)", fontSize: 12 }}>
              No brand vars loaded. Switch to Variables tab and save once.
            </div>
          ) : (
            <iframe
              title="Pattern preview"
              srcDoc={`<!doctype html><html><body style="margin:0">${previewHtml}</body></html>`}
              sandbox="allow-same-origin"
              style={{
                // 1280x720 native; scale to half (640x360) for the preview pane.
                width: 1280, height: 720,
                border: "none",
                transform: "scale(0.5)", transformOrigin: "top left",
                background: "#fff",
              }}
            />
          )}
        </div>
      )}
      </div>
    </div>
  );
}
