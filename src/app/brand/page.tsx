"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import BrandConfirmation, { type BrandAssets } from "@/components/shared/BrandConfirmation";
import { Footer } from "@/components/layout/Footer";

export default function BrandPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [brandData, setBrandData] = useState<BrandAssets | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [existingBrand, setExistingBrand] = useState<{ name: string; brandJson: Record<string, unknown> } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Load existing brand config on mount
  useEffect(() => {
    fetch("/api/brand")
      .then((r) => r.json())
      .then(({ config }) => {
        if (config?.brandJson?.colors?.primary) {
          setExistingBrand({ name: config.name, brandJson: config.brandJson });
          setConfigId(config.id);
        }
      })
      .catch(() => {});
  }, []);

  async function handleUpload(file: File) {
    if (!file.name.endsWith(".pptx")) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/brand", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) {
        setUploadError(data.error);
        return;
      }
      if (data.config) {
        setConfigId(data.config.id);
        const brand = data.brand;
        if (brand?.logo_candidates && brand?.colors?.by_frequency) {
          setBrandData(brand as BrandAssets);
          setShowConfirmation(true);
        } else {
          setUploadError("Brand extraction failed — please try again or use a different .pptx file.");
        }
      }
    } catch (err) {
      console.error("[brand] Upload failed:", err);
      setUploadError("Upload failed — please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirm(logoIndex: number) {
    if (!configId) return;
    await fetch("/api/brand", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ configId, brandConfigJson: { selected_logo_index: logoIndex } }),
    });
    setShowConfirmation(false);
    setDone(true);
  }

  // ── Done state ──
  if (done) {
    return (
      <div
        className="h-full overflow-y-auto"
        style={{ background: "var(--app-bg)" }}
      >
        <div className="flex" style={{ minHeight: "100%" }}>
          <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: "var(--green-soft)", border: "1px solid var(--green)",
              borderRadius: 20, padding: 48, textAlign: "center", maxWidth: 420,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h2 style={{ color: "var(--green)", fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>Brand template active</h2>
            <p style={{ color: "var(--text2)", fontSize: 14, margin: "0 0 24px" }}>
              Every slide will now follow your company&apos;s brand automatically.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => { setDone(false); setExistingBrand(null); }}
                style={{
                  padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border)",
                  background: "transparent", color: "var(--text3)", fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}
              >
                Upload different template
              </button>
              <button
                onClick={() => router.push("/")}
                style={{
                  padding: "10px 20px", borderRadius: 10, border: "none",
                  background: "var(--accent)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                Start creating slides →
              </button>
            </div>
          </motion.div>
          </div>
        </div>
        <div style={{ padding: "16px 40px 16px" }}>
          <Footer />
        </div>
      </div>
    );
  }

  // ── Upload state ──
  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: "var(--app-bg)" }}
    >
      <div className="flex" style={{ minHeight: "100%" }}>
        <div className="flex-1 flex flex-col items-center justify-center" style={{ scrollbarWidth: "none" }}>
        <div style={{ maxWidth: 520, width: "100%", padding: "0 24px" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", margin: "0 0 8px", textAlign: "center" }}>
              Brand Template
            </h1>
            <p style={{ fontSize: 14, color: "var(--text3)", margin: "0 0 32px", textAlign: "center" }}>
              Upload your company PPTX. We&apos;ll extract colors, fonts, logo, and headers automatically.
            </p>
          </motion.div>

          {/* Existing brand indicator */}
          {existingBrand && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: "14px 18px", borderRadius: 12,
                background: "var(--accent-soft)", border: "1px solid var(--accent)",
                marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                  Active: {existingBrand.name}
                </p>
                <p style={{ fontSize: 11, color: "var(--text3)", margin: "2px 0 0" }}>
                  Upload a new template to replace it.
                </p>
              </div>
              <button
                onClick={() => setDone(true)}
                style={{
                  fontSize: 12, fontWeight: 500, color: "var(--accent)",
                  background: "none", border: "none", cursor: "pointer",
                }}
              >
                Keep current →
              </button>
            </motion.div>
          )}

          {/* Upload zone */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => !uploading && document.getElementById("brand-upload")?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]); }}
            style={{
              background: "var(--bg)", border: "2px dashed var(--border-hover)",
              borderRadius: 16, padding: 56, textAlign: "center",
              cursor: uploading ? "wait" : "pointer", transition: "border-color 0.15s",
            }}
          >
            {uploading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  style={{ fontSize: 32, marginBottom: 12, display: "inline-block" }}
                >
                  ⚙️
                </motion.div>
                <p style={{ fontSize: 16, color: "var(--accent)", margin: "0 0 8px", fontWeight: 500 }}>
                  Extracting brand assets...
                </p>
                <p style={{ fontSize: 12, color: "var(--text3)" }}>
                  Reading fonts, colors, logo, headers, footers
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📎</div>
                <p style={{ fontSize: 16, color: "var(--text2)", margin: "0 0 8px" }}>
                  Drop your company PPTX here
                </p>
                <p style={{ fontSize: 12, color: "var(--text3)" }}>
                  or click to browse — .pptx files only
                </p>
              </>
            )}
          </motion.div>
          <input
            id="brand-upload"
            type="file"
            accept=".pptx"
            style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
          {uploadError && (
            <p style={{ fontSize: 13, color: "var(--red)", marginTop: 12, textAlign: "center" }}>
              {uploadError}
            </p>
          )}
        </div>
        </div>
      </div>
      <div style={{ padding: "16px 40px 16px" }}>
        <Footer />
      </div>

      {/* Brand confirmation modal */}
      <AnimatePresence>
        {showConfirmation && brandData && (
          <BrandConfirmation
            brand={brandData}
            onConfirm={handleConfirm}
            onSkip={() => setShowConfirmation(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
