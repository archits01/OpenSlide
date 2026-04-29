"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

const TABS = ["Profile", "Connections"] as const;
type Tab = (typeof TABS)[number];

// ─── Gooey SVG filter ─────────────────────────────────────────────────────────
function GooeyFilter() {
  return (
    <svg className="hidden absolute" aria-hidden>
      <defs>
        <filter id="settings-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

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

// ─── Connections Tab ──────────────────────────────────────────────────────────
const PROVIDERS = [
  { id: "github", label: "GitHub", description: "Push code to GitHub repos" },
  { id: "gmail", label: "Gmail", description: "Email decks directly from the editor" },
  { id: "google_drive", label: "Google Drive", description: "Access your files and import documents" },
  { id: "google_sheets", label: "Google Sheets", description: "Pull data and charts into slides" },
];

interface Connection {
  provider: string;
  status: "active" | "broken";
  metadata: { email?: string; login?: string } | null;
}

function ConnectionsTab() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/connections");
      if (res.ok) setConnections(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.origin === window.location.origin && e.data?.type === "oauth_success") {
        setConnecting(null);
        void load();
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [load]);

  async function disconnect(provider: string) {
    setDisconnecting(provider);
    try {
      await fetch("/api/user/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      await load();
    } finally {
      setDisconnecting(null);
    }
  }

  function connect(providerId: string) {
    setConnecting(providerId);
    const url = `/api/auth/connect/${providerId}?returnTo=/settings/connections`;
    const popup = window.open(url, `oauth_${providerId}`, "width=600,height=700,left=200,top=100");
    if (!popup) { window.location.href = url; return; }
    // Poll for popup close in case postMessage doesn't fire
    const timer = setInterval(() => {
      if (popup.closed) { clearInterval(timer); setConnecting(null); void load(); }
    }, 800);
  }

  if (loading) {
    return <div style={{ color: "var(--text3)", fontSize: 13 }}>Loading…</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {PROVIDERS.map((p) => {
        const conn = connections.find((c) => c.provider === p.id);
        const isConnected = conn?.status === "active";
        const isBroken = conn?.status === "broken";
        const identifier = conn?.metadata?.email ?? conn?.metadata?.login;
        const isDisconnecting = disconnecting === p.id;
        const isConnecting = connecting === p.id;

        return (
          <div
            key={p.id}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 14px", borderRadius: 10,
              border: "1px solid var(--border)", background: "var(--bg)",
              marginBottom: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)" }}>{p.label}</span>
                {isBroken && (
                  <span style={{ fontSize: 11, color: "var(--red)", background: "var(--red-soft)", padding: "1px 6px", borderRadius: 4, fontWeight: 500 }}>
                    Reconnect needed
                  </span>
                )}
                {isConnected && (
                  <span style={{ fontSize: 11, color: "var(--green)", background: "var(--green-soft)", padding: "1px 6px", borderRadius: 4, fontWeight: 500 }}>
                    Connected
                  </span>
                )}
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {identifier ? `Connected as ${identifier}` : p.description}
              </p>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
              {(isConnected || isBroken) && (
                <button
                  onClick={() => void disconnect(p.id)}
                  disabled={isDisconnecting}
                  style={{
                    height: 28, padding: "0 10px", borderRadius: 7,
                    border: "1px solid var(--border-strong)", background: "transparent",
                    color: isDisconnecting ? "var(--text3)" : "var(--red)",
                    fontSize: 12, fontWeight: 500, cursor: isDisconnecting ? "default" : "pointer",
                    transition: "border-color 100ms",
                  }}
                  onMouseEnter={(e) => { if (!isDisconnecting) e.currentTarget.style.borderColor = "var(--red)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                >
                  {isDisconnecting ? "…" : "Disconnect"}
                </button>
              )}
              {(!isConnected || isBroken) && (
                <button
                  onClick={() => connect(p.id)}
                  disabled={isConnecting}
                  style={{
                    height: 28, padding: "0 10px", borderRadius: 7,
                    border: "none",
                    background: isConnecting ? "var(--bg2)" : "var(--accent)",
                    color: isConnecting ? "var(--text3)" : "#fff",
                    fontSize: 12, fontWeight: 500, cursor: isConnecting ? "default" : "pointer",
                    transition: "opacity 100ms",
                  }}
                  onMouseEnter={(e) => { if (!isConnecting) e.currentTarget.style.opacity = "0.85"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  {isConnecting ? "Opening…" : isBroken ? "Reconnect" : "Connect"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  function getSupabase(): SupabaseClient {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current!;
  }

  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Profile");
  const { profile, refresh: refreshProfile } = useProfile();

  useEffect(() => {
    if (!open) return;
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user);
    });
    // Reset to Profile tab when reopening
    setActiveTab("Profile");
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

                {/* Gooey tabs + content */}
                <GooeyFilter />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
                  {/* Filtered layer — tab blobs + content panel share bg, gooey merges them */}
                  <div
                    style={{
                      position: "absolute", inset: 0,
                      filter: "url(#settings-goo)",
                      pointerEvents: "none",
                    }}
                    aria-hidden
                  >
                    {/* Tab row blobs */}
                    <div style={{ display: "flex", padding: "0 24px" }}>
                      {TABS.map((tab) => (
                        <div key={tab} style={{ position: "relative", flex: 1, height: 40 }}>
                          {activeTab === tab && (
                            <motion.div
                              layoutId="settings-tab-blob"
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: "var(--bg2)",
                                borderRadius: "10px 10px 0 0",
                              }}
                              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Content panel blob — same bg as active tab so gooey connects them */}
                    <div style={{
                      flex: 1,
                      background: "var(--bg2)",
                      borderRadius: "0 0 12px 12px",
                    }} />
                  </div>

                  {/* Interactive layer — text buttons + actual content (no filter) */}
                  <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                    {/* Tab buttons */}
                    <div style={{ display: "flex", padding: "0 24px", flexShrink: 0 }}>
                      {TABS.map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          style={{
                            flex: 1, height: 40, border: "none",
                            background: "transparent", cursor: "pointer",
                            fontSize: 13, fontWeight: activeTab === tab ? 600 : 500,
                            letterSpacing: "-0.01em",
                            color: activeTab === tab ? "var(--text)" : "var(--text3)",
                            transition: "color 150ms",
                          }}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Content area */}
                    <div style={{ flex: 1, overflow: "auto", padding: "32px 24px 20px" }}>
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          exit={{ opacity: 0, y: -30, filter: "blur(8px)" }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          {activeTab === "Profile" ? (
                            <ProfileTab
                              profile={profile}
                              user={user}
                              refreshProfile={refreshProfile}
                              getSupabase={getSupabase}
                            />
                          ) : (
                            <ConnectionsTab />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    {/* Bottom spacing */}
                    <div style={{ height: 16, flexShrink: 0 }} />
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </>,
    document.body
  );
}
