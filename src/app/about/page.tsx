"use client";

import { motion } from "framer-motion";
import { Footer } from "@/components/layout/Footer";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function AboutPage() {
  return (
    <div style={{ height: "100%", overflowY: "auto", background: "var(--app-bg)", display: "flex", flexDirection: "column" }}>
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(180deg, #0a0a0f 0%, var(--app-bg) 100%)",
          borderBottom: "1px solid var(--border)",
          padding: "80px 24px 72px",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <motion.div variants={fadeUp}>
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
                About Us
              </span>
              <h1
                style={{
                  fontSize: "clamp(32px, 5vw, 52px)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                We&apos;re tired of busywork.
              </h1>
            </motion.div>

            <motion.p
              variants={fadeUp}
              style={{
                fontSize: 17,
                lineHeight: 1.7,
                color: "var(--text2)",
                margin: 0,
                maxWidth: 580,
              }}
            >
              Every founder, operator, and team we know spends hours doing the same thing: taking work that already exists and reformatting it into slides. The data is in your Drive. The story is in your head. But somehow you still lose a Sunday to PowerPoint.
            </motion.p>

            <motion.p
              variants={fadeUp}
              style={{
                fontSize: 17,
                lineHeight: 1.7,
                color: "var(--text2)",
                margin: 0,
              }}
            >
              That&apos;s the problem we set out to fix.
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "72px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 64 }}>

          {/* Founders section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ height: 1, flex: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text3)" }}>
                The Team
              </span>
              <div style={{ height: 1, flex: 1, background: "var(--border)" }} />
            </div>

            <h2
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--text)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              We&apos;re Archit and Saksham
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: "var(--text2)", margin: 0 }}>
              Two builders based in Bengaluru who believe AI should do more than answer questions. The real opportunity isn&apos;t a smarter search box. It&apos;s agents that connect to where your work already lives and actually <em>do things</em> for you.
            </p>
          </motion.section>

          {/* Open Computer section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, rgba(67,56,202,0.06) 0%, rgba(67,56,202,0.02) 100%)",
                border: "1px solid rgba(67,56,202,0.15)",
                borderRadius: "var(--r-xl)",
                padding: "36px 40px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)" }}>
                  The Vision
                </span>
                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    color: "var(--text)",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Open Computer
                </h2>
              </div>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: "var(--text2)", margin: 0 }}>
                Every repetitive, high-effort task that sits between you and your real work should have an agent for it. One that understands your context, talks to your tools, and builds alongside you. That&apos;s what we&apos;re building. A suite of specialized agents, each one connected to how you already work.
              </p>
            </div>
          </motion.section>

          {/* OpenSlide section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ height: 1, flex: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text3)" }}>
                Agent One
              </span>
              <div style={{ height: 1, flex: 1, background: "var(--border)" }} />
            </div>

            <h2
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--text)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              OpenSlide is the first.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: "var(--text2)", margin: 0 }}>
              Describe what you need. Connect your tools. Watch it build. We&apos;re just getting started. Over the coming months we&apos;ll be rolling out more agents built on the same foundation, each one specialized, each one connected to how you already work.
            </p>
          </motion.section>

          {/* Contact */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <p style={{ fontSize: 15, color: "var(--text2)", margin: 0 }}>
              Based in Bengaluru, India.
            </p>
            <a
              href="mailto:tryopencomputer@gmail.com"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--accent)",
                textDecoration: "none",
                padding: "8px 16px",
                borderRadius: "var(--r-md)",
                border: "1px solid rgba(67,56,202,0.25)",
                background: "var(--accent-soft)",
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(67,56,202,0.12)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(67,56,202,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent-soft)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(67,56,202,0.25)";
              }}
            >
              tryopencomputer@gmail.com
            </a>
          </motion.section>

        </div>
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        <Footer />
      </div>
    </div>
  );
}
