"use client";

import Link from "next/link";
import { ParticleCanvas } from "@/components/shared/ParticleCanvas";
import { TextHoverEffect, FooterBackgroundGradient } from "@/components/layout/HoverFooter";

// ─── Link data ────────────────────────────────────────────────────────────────

const PRODUCT_LINKS = [
  { label: "Explore", href: "/" },
  { label: "Presentations", href: "/presentations" },
  { label: "Apps", href: "/websites" },
  { label: "Docs", href: "/docs" },
  { label: "Sheets", href: "/sheets" },
  { label: "Assets", href: "/assets" },
  { label: "Brand Kit", href: "/brand" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Blog", href: "#" },
];

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
];

const COMPLIANCE_LINKS = [
  { label: "GDPR & Data Compliance", href: "/gdpr" },
];

// ─── Social icons (inline SVG paths from SimpleIcons) ────────────────────────

type SocialIcon = { label: string; href: string; path: string };

const SOCIAL_ICONS: SocialIcon[] = [
  {
    label: "Twitter / X",
    href: "https://x.com/tryopencomputer",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "GitHub",
    href: "https://github.com/archits01/OpenSlides",
    path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/opencomputer-ai/",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/tryopencomputer/",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  {
    label: "Discord",
    href: "https://discord.gg/d4k2wg8gCU",
    path: "M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z",
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function WordMark() {
  return (
    <span
      className="select-none"
      style={{
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: "white",
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>Open</span>
      <span>Slide</span>
    </span>
  );
}

function SocialButton({ icon }: { icon: SocialIcon }) {
  return (
    <Link
      href={icon.href}
      aria-label={icon.label}
      title={icon.label}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.55)",
        transition: "all 200ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = "rgba(194,24,91,0.12)";
        el.style.borderColor = "rgba(194,24,91,0.35)";
        el.style.color = "#E91E78";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = "rgba(255,255,255,0.04)";
        el.style.borderColor = "rgba(255,255,255,0.08)";
        el.style.color = "rgba(255,255,255,0.55)";
        el.style.transform = "translateY(0)";
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d={icon.path} />
      </svg>
    </Link>
  );
}

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p
        style={{
          color: "white",
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 18,
        }}
      >
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
              textDecoration: "none",
              transition: "color 200ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#E91E78";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)";
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function ContactColumn() {
  return (
    <div>
      <p
        style={{
          color: "white",
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 18,
        }}
      >
        Contact Us
      </p>
      <a
        href="mailto:tryopencomputer@gmail.com"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13,
          color: "rgba(255,255,255,0.55)",
          textDecoration: "none",
          transition: "color 200ms ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.color = "#E91E78";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)";
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C2185B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        tryopencomputer@gmail.com
      </a>
    </div>
  );
}

// ─── Main Footer ─────────────────────────────────────────────────────────────

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#0F0F11",
        fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif",
        borderRadius: 20,
      }}
    >
      {/* Dynamic particle canvas — pointer-events: none so it doesn't block hover */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 1, pointerEvents: "none" }}
      >
        <ParticleCanvas />
      </div>

      {/* Radial background gradient tint */}
      <FooterBackgroundGradient />

      <div
        className="footer-outer"
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* Responsive column grid — 5col desktop → 3col tablet → 2col mobile → 1col tiny */}
        <div className="footer-grid">
          {/* Brand column */}
          <div>
            <div style={{ marginBottom: 12 }}>
              <WordMark />
            </div>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.6,
                margin: "0 0 20px",
                maxWidth: 320,
              }}
            >
              AI-powered presentations, sheets, docs, and apps. Built by chatting.
            </p>

            {/* Social icons — tight cluster below tagline */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {SOCIAL_ICONS.map((icon) => (
                <SocialButton key={icon.label} icon={icon} />
              ))}
            </div>
          </div>

          <LinkColumn title="Product" links={PRODUCT_LINKS} />
          <LinkColumn title="Company" links={COMPANY_LINKS} />
          <LinkColumn title="Legal" links={LEGAL_LINKS} />
          <LinkColumn title="Compliance" links={COMPLIANCE_LINKS} />
          <ContactColumn />
        </div>

        {/* Copyright row — tight to the divider */}
        <div className="footer-copyright">
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>
            Copyright OpenSlide {year}
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>
            All rights reserved.
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>
            An Open Computer product
          </span>
        </div>

        {/* Divider line */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.12)" }} />

        {/* TextHoverEffect — pulled up close to the line with negative margin */}
        <div className="footer-textmark">
          <TextHoverEffect text="OpenSlide" />
        </div>
      </div>
    </footer>
  );
}
