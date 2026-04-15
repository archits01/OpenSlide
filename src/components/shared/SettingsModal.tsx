"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Mail01Icon, Camera01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import { useProfile } from "@/lib/hooks/useProfile";
interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Gooey SVG filter ─────────────────────────────────────────────────────────
// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({
  profile,
  user,
  refreshProfile,
  getSupabase,
}: {
  profile: ReturnType<typeof useProfile>["profile"];
  user: User | null;
  refreshProfile: () => Promise<void>;
  getSupabase: () => SupabaseClient;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) setName(profile.fullName ?? "");
  }, [profile]);

  const initial = profile
    ? (profile.fullName?.[0] ?? profile.email?.[0] ?? "U").toUpperCase()
    : "U";
  const avatarUrl = profile?.avatarUrl;
  const email = profile?.email ?? user?.email ?? "";
  const displayName = profile?.fullName ?? email.split("@")[0] ?? "User";
  const nameChanged = name.trim() !== (profile?.fullName ?? "");

  function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const SIZE = 400;
        const canvas = document.createElement("canvas");
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("No canvas context")); return; }
        const ratio = Math.max(SIZE / img.width, SIZE / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Compression failed")),
          "image/jpeg",
          0.82
        );
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
      img.src = objectUrl;
    });
  }

  async function handleAvatarUpload(file: File) {
    if (!user) return;
    setUploading(true);
    const supabase = getSupabase();
    try {
      const compressed = await compressImage(file);
      const avatarPath = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(avatarPath, compressed, { contentType: "image/jpeg" });
      if (error) { setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarPath, avatarUrl: urlData.publicUrl }),
      });
      if (res.ok) await refreshProfile();
    } catch {
      // Silently fail
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name.trim() }),
      });
      if (res.ok) {
        await refreshProfile();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Avatar — centered */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
        <div
          style={{ position: "relative", cursor: "pointer" }}
          onClick={() => !uploading && fileRef.current?.click()}
          onMouseEnter={() => setAvatarHovered(true)}
          onMouseLeave={() => setAvatarHovered(false)}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              style={{
                width: 84, height: 84, borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid var(--border)",
                display: "block",
                transition: "filter 150ms",
                filter: (avatarHovered && !uploading) ? "brightness(0.5)" : "none",
              }}
            />
          ) : (
            <div style={{
              width: 84, height: 84, borderRadius: "50%",
              background: (avatarHovered && !uploading) ? "var(--accent)" : "var(--accent-soft)",
              color: (avatarHovered && !uploading) ? "#fff" : "var(--accent-text)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 600,
              border: "2px solid var(--border)",
              transition: "background 150ms, color 150ms",
            }}>
              {initial}
            </div>
          )}
          {(avatarHovered || uploading) && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 2,
              pointerEvents: "none",
            }}>
              {uploading ? (
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  <path d="M8 2a6 6 0 0 1 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="0.8s" repeatCount="indefinite" />
                  </path>
                </svg>
              ) : (
                <HugeiconsIcon icon={Camera01Icon} size={16} style={{ color: "#fff" }} />
              )}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAvatarUpload(file);
              e.target.value = "";
            }}
          />
        </div>
        <p style={{
          margin: "10px 0 0", fontSize: 15, fontWeight: 600, color: "var(--text)",
          letterSpacing: "-0.02em", lineHeight: 1.3,
        }}>
          {displayName}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text3)", lineHeight: 1.3 }}>
          {email}
        </p>
      </div>

      {/* Fields */}
      <div style={{ marginBottom: 4 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text2)", marginBottom: 6, letterSpacing: "0.01em" }}>
          Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="Your name"
          style={{
            width: "100%", height: 40, padding: "0 14px",
            borderRadius: 10, border: "1px solid var(--border)",
            background: "var(--bg)", color: "var(--text)",
            fontSize: 13.5, fontWeight: 400, outline: "none",
            transition: "border-color 150ms",
            boxSizing: "border-box", letterSpacing: "-0.01em",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        />
        <span style={{ display: "block", textAlign: "right", fontSize: 10.5, color: "var(--text3)", marginTop: 4 }}>
          {name.length} / 40
        </span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text2)", marginBottom: 6, letterSpacing: "0.01em" }}>
          Email Address
        </label>
        <div style={{
          width: "100%", height: 40, padding: "0 14px",
          borderRadius: 10, border: "1px solid var(--border)",
          background: "var(--bg2)", color: "var(--text3)",
          fontSize: 13.5, display: "flex", alignItems: "center", gap: 10,
          boxSizing: "border-box", letterSpacing: "-0.01em",
        }}>
          <HugeiconsIcon icon={Mail01Icon} size={14} style={{ color: "var(--text3)", flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
        </div>
      </div>

      {/* Delete account — subtle inline */}
      <p style={{ margin: "0 0 20px", fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>
        If you wish to permanently remove your account,{" "}
        <span
          onClick={async () => {
            if (!confirm("Are you sure? This will permanently delete your account and all presentations. This cannot be undone.")) return;
            const supabase = getSupabase();
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
          style={{
            color: "var(--red)", cursor: "pointer",
            textDecoration: "underline", textUnderlineOffset: 2,
          }}
        >
          click here
        </span>.
      </p>

      {/* Save button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleSave}
          disabled={!nameChanged || saving}
          style={{
            height: 34, padding: "0 20px", borderRadius: 9, border: "none",
            background: saved ? "var(--green)" : nameChanged ? "var(--accent)" : "var(--bg2)",
            color: saved || nameChanged ? "#fff" : "var(--text3)",
            fontSize: 13, fontWeight: 500, cursor: nameChanged ? "pointer" : "default",
            letterSpacing: "-0.01em", transition: "background 150ms, color 150ms",
          }}
        >
          {saving ? "Saving..." : saved ? "Saved" : "Done"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  const [user, setUser] = useState<User | null>(null);
  const { profile, refresh: refreshProfile } = useProfile();

  useEffect(() => {
    if (!open) return;
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onClose}
              style={{
                position: "fixed", inset: 0, zIndex: 999,
                background: "rgba(0,0,0,0.25)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
            />

            {/* Modal centering wrapper */}
            <div style={{
              position: "fixed", inset: 0, zIndex: 1000,
              display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none",
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{
                  width: 520,
                  height: 600,
                  maxWidth: "calc(100vw - 40px)",
                  maxHeight: "calc(100vh - 80px)",
                  background: "var(--bg)",
                  borderRadius: 18,
                  border: "1px solid var(--border)",
                  boxShadow: "0 24px 80px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)",
                  overflow: "hidden",
                  pointerEvents: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "20px 24px 16px", flexShrink: 0,
                }}>
                  <span style={{
                    fontSize: 17, fontWeight: 600, color: "var(--text)",
                    letterSpacing: "-0.025em",
                  }}>
                    Settings
                  </span>
                  <button
                    onClick={onClose}
                    style={{
                      width: 30, height: 30, borderRadius: 8, border: "none",
                      background: "transparent", color: "var(--text3)", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--text)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; }}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={15} />
                  </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: "auto", padding: "24px 24px 20px" }}>
                  <ProfileTab
                    profile={profile}
                    user={user}
                    refreshProfile={refreshProfile}
                    getSupabase={getSupabase}
                  />
                </div>
                <div style={{ height: 16, flexShrink: 0 }} />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
