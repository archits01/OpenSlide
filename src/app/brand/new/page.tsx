"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { BrandThemeWrapper, Uplabel, monoFamily, serifFamily } from "../_design";

interface ExtractionLogEntry {
  step: string;
  status: "started" | "succeeded" | "failed";
  message?: string;
  error?: string;
  ts: string;
  durationMs?: number;
}

export default function NewBrandKitPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"source" | "url" | "manual">("source");
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<ExtractionLogEntry[]>([]);
  // Manual mode: minimal palette + fonts. Power users edit full vars on detail page.
  const [accent, setAccent] = useState("#4338CA");
  const [dark, setDark] = useState("#0F172A");
  const [headingFamily, setHeadingFamily] = useState("Inter");
  const [bodyFamily, setBodyFamily] = useState("Inter");

  function pickFile(f: File | null) {
    if (!f) return setFile(null);
    const ok = /\.(pptx|pdf)$/i.test(f.name);
    if (!ok) {
      setError("Only .pptx and .pdf files are supported.");
      return;
    }
    setError(null);
    setFile(f);
  }

  async function submit() {
    if (!name.trim()) {
      setError("Provide a name.");
      return;
    }
    if (mode === "source" && !file) {
      setError("Provide a source file or switch to Manual mode.");
      return;
    }
    if (mode === "url" && !url.trim()) {
      setError("Provide a URL.");
      return;
    }
    setRunning(true);
    setError(null);
    setLog([]);

    try {
      if (mode === "source" || mode === "url") {
        const fd = new FormData();
        if (mode === "source") fd.append("file", file as File);
        else fd.append("url", url.trim());
        fd.append("name", name.trim());
        if (description.trim()) fd.append("description", description.trim());
        fd.append("isDefault", isDefault ? "true" : "false");

        const res = await fetch("/api/brand-kits/extract", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

        setLog(data.log ?? []);
        setTimeout(() => router.push(`/brand/${data.kit.id}`), 500);
      } else {
        // Manual mode: skip extraction, seed from generic with provided palette/fonts.
        const res = await fetch("/api/brand-kits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || undefined,
            isDefault,
            brandVars: {
              brandName: name.trim(),
              headerLeft: name.trim().toUpperCase().slice(0, 40),
              colors: { accent, dark, text: dark },
              fonts: {
                headingFamily,
                headingImportUrl: `https://fonts.googleapis.com/css2?family=${headingFamily.replace(/\s+/g, "+")}:wght@400;500;600;700;800&display=swap`,
                bodyFamily,
                bodyImportUrl: `https://fonts.googleapis.com/css2?family=${bodyFamily.replace(/\s+/g, "+")}:wght@400;500;600&display=swap`,
              },
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        router.push(`/brand/${data.kit.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <BrandThemeWrapper>
      <div style={{ width: "100%", minHeight: "100%", overflow: "auto" }}>
        <div style={{ padding: "32px 48px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
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
                textDecoration: "none",
              }}
            >
              ← Brand kits
            </Link>
            <span style={{ color: "var(--text2)" }}>brand</span>
            <span>/</span>
            <span style={{ color: "var(--text)" }}>new</span>
          </div>

          <Uplabel style={{ marginTop: 8 }}>New stack</Uplabel>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: 48, fontWeight: 500, color: "var(--text)", margin: "6px 0 8px", letterSpacing: "-0.025em" }}
          >
            <span style={{ fontFamily: serifFamily, fontStyle: "italic", fontWeight: 400 }}>New</span> brand kit
          </motion.h1>
          <p style={{ fontSize: 14, color: "var(--text2)", margin: "0 0 28px", lineHeight: 1.5, maxWidth: 580 }}>
            Drop a presentation template. We&apos;ll extract the design system and layout patterns so the model produces slides that look unmistakably yours.
          </p>

          {/* Mode tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16, padding: 4, background: "var(--bg2)", borderRadius: 10 }}>
            {(["source", "url", "manual"] as const).map((m) => (
              <button
                key={m}
                onClick={() => !running && setMode(m)}
                style={{
                  flex: 1, padding: "8px 14px", borderRadius: 8, border: "none",
                  background: mode === m ? "var(--bg)" : "transparent",
                  color: mode === m ? "var(--text)" : "var(--text2)",
                  fontSize: 12, fontWeight: 600, cursor: running ? "not-allowed" : "pointer",
                  boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {m === "source" ? "From PPTX / PDF" : m === "url" ? "From URL" : "Manual"}
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
            <Field label="Brand name" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={running}
                placeholder="e.g. McKinsey & Company"
                style={inputStyle}
              />
            </Field>

            <Field label="Description (optional)">
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={running}
                placeholder="Internal notes — when to use this kit"
                style={inputStyle}
              />
            </Field>

            {mode === "url" && (
              <Field label="Homepage URL" required>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={running}
                  placeholder="https://example.com"
                  style={inputStyle}
                />
                <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>
                  We&apos;ll screenshot your homepage and extract palette, fonts, and signature visual moves from it.
                </p>
              </Field>
            )}

            {mode === "manual" && (
              <>
                <Field label="Accent color">
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} disabled={running}
                      style={{ width: 44, height: 36, border: "1px solid var(--border)", borderRadius: 8, padding: 0 }} />
                    <input value={accent} onChange={(e) => setAccent(e.target.value)} disabled={running}
                      style={{ ...inputStyle, fontFamily: "monospace", flex: 1 }} />
                  </div>
                </Field>
                <Field label="Dark color (panels)">
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="color" value={dark} onChange={(e) => setDark(e.target.value)} disabled={running}
                      style={{ width: 44, height: 36, border: "1px solid var(--border)", borderRadius: 8, padding: 0 }} />
                    <input value={dark} onChange={(e) => setDark(e.target.value)} disabled={running}
                      style={{ ...inputStyle, fontFamily: "monospace", flex: 1 }} />
                  </div>
                </Field>
                <Field label="Heading font (Google Fonts name)">
                  <input value={headingFamily} onChange={(e) => setHeadingFamily(e.target.value)} disabled={running}
                    placeholder="e.g. Inter, EB Garamond, Plus Jakarta Sans" style={inputStyle} />
                </Field>
                <Field label="Body font">
                  <input value={bodyFamily} onChange={(e) => setBodyFamily(e.target.value)} disabled={running}
                    placeholder="e.g. Inter, DM Sans" style={inputStyle} />
                </Field>
                <p style={{ fontSize: 11, color: "var(--text3)", marginTop: -8, marginBottom: 16 }}>
                  Manual kits use the generic 16-pattern layout library tinted to your palette and fonts. Upload a PPTX/PDF later for a brand-extracted layout library.
                </p>
              </>
            )}

            {mode === "source" && (
            <Field label="Source file (PPTX or PDF)" required>
              <label
                htmlFor="brand-source-file"
                style={{
                  display: "block",
                  padding: 24,
                  border: "1.5px dashed var(--border)",
                  borderRadius: 12,
                  textAlign: "center",
                  cursor: running ? "not-allowed" : "pointer",
                  background: "var(--bg2)",
                  color: "var(--text2)",
                  fontSize: 13,
                }}
              >
                {file ? (
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>{file.name}</span>
                ) : (
                  <>Drag a .pptx or .pdf here, or click to browse</>
                )}
                <input
                  id="brand-source-file"
                  type="file"
                  accept=".pptx,.pdf"
                  disabled={running}
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                  style={{ display: "none" }}
                />
              </label>
            </Field>
            )}

            <label className="flex items-center gap-2" style={{ marginBottom: 20, fontSize: 13, color: "var(--text)" }}>
              <input
                type="checkbox"
                checked={isDefault}
                disabled={running}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              Set as default kit (used automatically for new presentations)
            </label>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 8,
                background: "var(--red-soft)", color: "var(--red)",
                fontSize: 12, marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={running || !name.trim() || (mode === "source" && !file) || (mode === "url" && !url.trim())}
              style={{
                width: "100%",
                padding: "12px 20px", borderRadius: 10, border: "none",
                background: running ? "var(--bg2)" : "var(--accent)",
                color: running ? "var(--text2)" : "white",
                fontSize: 13, fontWeight: 600,
                cursor: running ? "not-allowed" : "pointer",
                opacity: !name.trim() || (mode === "source" && !file) || (mode === "url" && !url.trim()) ? 0.6 : 1,
              }}
            >
              {running ? (mode === "source" ? "Extracting…" : "Creating…") : (mode === "source" ? "Extract brand kit" : "Create brand kit")}
            </button>
          </div>

          {/* Progress log */}
          {log.length > 0 && (
            <div style={{ marginTop: 24, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text3)", margin: "0 0 12px" }}>
                Extraction log
              </h3>
              {log.map((entry, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 12, color: "var(--text2)" }}>
                  <span style={{ width: 16, color: entry.status === "succeeded" ? "var(--green)" : entry.status === "failed" ? "var(--red)" : "var(--text3)" }}>
                    {entry.status === "succeeded" ? "✓" : entry.status === "failed" ? "✗" : "…"}
                  </span>
                  <span style={{ width: 110, fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 600, color: "var(--text)" }}>
                    {entry.step}
                  </span>
                  {entry.message && <span style={{ flex: 1, color: "var(--text2)" }}>{entry.message}</span>}
                  {entry.durationMs && (
                    <span style={{ color: "var(--text3)", fontSize: 11 }}>{Math.round(entry.durationMs / 1000)}s</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BrandThemeWrapper>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--bg2)",
  fontSize: 13,
  color: "var(--text)",
  outline: "none",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: "block", marginBottom: 8,
        fontSize: 12, fontWeight: 600, color: "var(--text)",
      }}>
        {label} {required && <span style={{ color: "var(--accent)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}
