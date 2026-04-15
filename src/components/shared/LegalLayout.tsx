"use client";

import { Footer } from "@/components/layout/Footer";

export function LegalLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ height: "100%", overflowY: "auto", background: "var(--app-bg)", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: "linear-gradient(180deg, #0a0a0f 0%, var(--app-bg) 100%)",
          borderBottom: "1px solid var(--border)",
          padding: "64px 24px 48px",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--accent)",
              background: "var(--accent-soft)",
              padding: "4px 10px",
              borderRadius: "var(--r-sm)",
              marginBottom: 20,
            }}
          >
            Legal
          </span>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "var(--text)",
              margin: "0 0 16px",
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text3)", margin: 0 }}>
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      <div style={{ flex: 1, padding: "56px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {children}
        </div>
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        <Footer />
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2
        style={{
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "var(--text)",
          margin: "0 0 16px",
          paddingBottom: 12,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text2)", margin: "0 0 14px" }}>
      {children}
    </p>
  );
}

export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "20px 0 8px", letterSpacing: "-0.01em" }}>
      {children}
    </h3>
  );
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul style={{ paddingLeft: 20, margin: "0 0 14px" }}>
      {children}
    </ul>
  );
}

export function Li({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text2)", marginBottom: 6 }}>
      {children}
    </li>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--accent-soft)",
        border: "1px solid rgba(67,56,202,0.15)",
        borderRadius: "var(--r-md)",
        padding: "14px 18px",
        margin: "0 0 14px",
        fontSize: 14,
        lineHeight: 1.7,
        color: "var(--accent-text)",
      }}
    >
      {children}
    </div>
  );
}
