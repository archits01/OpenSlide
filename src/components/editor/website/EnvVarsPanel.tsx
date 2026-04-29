"use client";

import { useEffect, useState } from "react";

const PRESETS = [
  {
    id: "resend",
    name: "Resend",
    blurb: "Send emails from your site.",
    link: "https://resend.com/api-keys",
    linkLabel: "Get a free key at resend.com",
    fields: [{ key: "RESEND_API_KEY", label: "API Key", placeholder: "re_..." }],
  },
  {
    id: "stripe",
    name: "Stripe",
    blurb: "Accept payments via Stripe Checkout.",
    link: "https://dashboard.stripe.com/apikeys",
    linkLabel: "Get keys at dashboard.stripe.com",
    fields: [
      { key: "VITE_STRIPE_PUBLISHABLE_KEY", label: "Publishable Key", placeholder: "pk_test_..." },
      { key: "STRIPE_SECRET_KEY", label: "Secret Key", placeholder: "sk_test_..." },
    ],
  },
  {
    id: "google",
    name: "Google OAuth",
    blurb: "Let users sign in with Google.",
    link: "https://console.cloud.google.com/apis/credentials",
    linkLabel: "Set up at console.cloud.google.com",
    fields: [
      { key: "GOOGLE_CLIENT_ID", label: "Client ID", placeholder: "..." },
      { key: "GOOGLE_CLIENT_SECRET", label: "Client Secret", placeholder: "..." },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    blurb: "AI features inside your built site.",
    link: "https://platform.openai.com/api-keys",
    linkLabel: "Get a key at platform.openai.com",
    fields: [{ key: "OPENAI_API_KEY", label: "API Key", placeholder: "sk-..." }],
  },
];

export function EnvVarsPanel({
  sessionId,
  initialNames,
  onClose,
  onSaved,
}: {
  sessionId: string;
  initialNames: string[];
  onClose: () => void;
  onSaved?: (names: string[]) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [existingNames, setExistingNames] = useState<Set<string>>(new Set(initialNames));
  const [customKey, setCustomKey] = useState("");
  const [customVal, setCustomVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setExistingNames(new Set(initialNames)); }, [initialNames]);

  function setValue(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      // Client-side: only upload the keys the user entered this session.
      // Server-side: merges with existing encrypted blob.
      const payload = Object.fromEntries(
        Object.entries(values).filter(([, v]) => v.trim().length > 0),
      );
      if (customKey && customVal) {
        if (!/^[A-Z][A-Z0-9_]*$/.test(customKey)) {
          throw new Error("Custom key must be UPPER_SNAKE_CASE");
        }
        payload[customKey] = customVal;
      }
      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }
      const res = await fetch("/api/website-env-vars", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, vars: payload }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Save failed (${res.status})`);
      }
      const data = (await res.json()) as { names: string[] };
      setExistingNames(new Set(data.names));
      onSaved?.(data.names);
      setValues({});
      setCustomKey("");
      setCustomVal("");
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="absolute top-0 right-0 bottom-0 overflow-y-auto z-20"
      style={{
        width: 380,
        background: "var(--bg)",
        borderLeft: "1px solid var(--border)",
        boxShadow: "-8px 0 24px rgba(0,0,0,0.04)",
      }}
    >
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Environment variables</div>
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 14 }}
        >
          Close
        </button>
      </div>

      <div className="px-4 py-3 text-xs" style={{ color: "var(--text2)", lineHeight: 1.5 }}>
        Paste API keys for services your site uses. Values are encrypted at rest, injected into the dev server at runtime, and never shown back to you after save. You&apos;ll need to restart the sandbox for changes to take effect.
      </div>

      <div className="px-4 py-2 space-y-3">
        {PRESETS.map((p) => (
          <div
            key={p.id}
            className="rounded-[var(--r-lg)] p-3"
            style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}
          >
            <div className="flex items-center justify-between mb-1">
              <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11, color: "var(--accent)" }}
              >
                {p.linkLabel} ↗
              </a>
            </div>
            <div className="text-xs mb-2" style={{ color: "var(--text2)" }}>{p.blurb}</div>
            <div className="space-y-2">
              {p.fields.map((f) => {
                const saved = existingNames.has(f.key);
                return (
                  <div key={f.key}>
                    <label className="block text-xs mb-1" style={{ color: "var(--text2)" }}>
                      {f.label} <code style={{ fontSize: 10, color: "var(--text3)" }}>{f.key}</code>
                    </label>
                    <input
                      type="password"
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValue(f.key, e.target.value)}
                      placeholder={saved ? "••••••••••••• (saved — re-enter to replace)" : f.placeholder}
                      className="w-full px-2.5 py-1.5 rounded-[var(--r-md)] text-xs"
                      style={{
                        border: "1px solid var(--border)",
                        background: "var(--bg)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Custom key/value */}
        <div
          className="rounded-[var(--r-lg)] p-3"
          style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Custom</div>
          <div className="text-xs mb-2" style={{ color: "var(--text2)" }}>Add your own key/value pair. Key must be UPPER_SNAKE_CASE.</div>
          <input
            type="text"
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value.toUpperCase())}
            placeholder="MY_API_KEY"
            className="w-full px-2.5 py-1.5 rounded-[var(--r-md)] text-xs mb-2"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
          />
          <input
            type="password"
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            placeholder="value"
            className="w-full px-2.5 py-1.5 rounded-[var(--r-md)] text-xs"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
          />
        </div>
      </div>

      {error && (
        <div className="mx-4 my-2 px-3 py-2 text-xs rounded-[var(--r-md)]" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
          {error}
        </div>
      )}

      <div className="px-4 py-3 sticky bottom-0" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-[var(--r-lg)] py-2 text-sm font-medium"
          style={{
            background: "var(--accent)",
            color: "white",
            opacity: saving ? 0.6 : 1,
            cursor: saving ? "not-allowed" : "pointer",
            border: "none",
          }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
