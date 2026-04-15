"use client";

import type { Outline, OutlineSlideType } from "@/lib/redis";

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  // Slide types
  title:      { label: "Title",      color: "var(--accent-text)",  bg: "var(--accent-soft)" },
  content:    { label: "Content",    color: "var(--blue)",         bg: "rgba(37,99,235,0.08)" },
  data:       { label: "Data",       color: "var(--green)",        bg: "var(--green-soft)" },
  quote:      { label: "Quote",      color: "var(--warn)",         bg: "var(--warn-soft)" },
  image:      { label: "Image",      color: "#7C3AED",             bg: "rgba(124,58,237,0.08)" },
  transition: { label: "Transition", color: "var(--text3)",        bg: "var(--bg2)" },
  // Document section types
  cover:      { label: "Cover",      color: "var(--accent-text)",  bg: "var(--accent-soft)" },
  body:       { label: "Body",       color: "var(--blue)",         bg: "rgba(37,99,235,0.08)" },
  table:      { label: "Table",      color: "var(--green)",        bg: "var(--green-soft)" },
  steps:      { label: "Steps",      color: "#1B5E7D",             bg: "rgba(27,94,125,0.08)" },
  checklist:  { label: "Checklist",  color: "var(--warn)",         bg: "var(--warn-soft)" },
  two_column: { label: "2-Column",   color: "#7C3AED",             bg: "rgba(124,58,237,0.08)" },
  callout:    { label: "Callout",    color: "#C0504D",             bg: "rgba(192,80,77,0.08)" },
  reference:  { label: "Reference",  color: "var(--text3)",        bg: "var(--bg2)" },
};

export function OutlineCard({ outline, sessionType = "slides" }: { outline: Outline; sessionType?: "slides" | "docs" }) {
  const isDoc = sessionType === "docs";
  // Guard against malformed outlines (e.g., doc outline with sections instead of slides)
  const items = outline.slides ?? [];
  if (items.length === 0) return null;
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        marginTop: 4,
        marginBottom: 4,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg2)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 14 }}>▦</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
          {isDoc ? "Document Outline" : "Presentation Outline"}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: "1px 7px",
            borderRadius: 999,
            background: "var(--accent-soft)",
            color: "var(--accent-text)",
          }}
        >
          {items.length} {isDoc ? "sections" : "slides"}
        </span>
        <span style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text)",
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={outline.presentation_title}
        >
          {outline.presentation_title}
        </span>
      </div>

      {/* Slide list */}
      <div style={{ background: "var(--bg)" }}>
        {items.map((slide, i) => {
          const meta = TYPE_META[slide.type] ?? TYPE_META.content;
          const isLast = i === items.length - 1;
          return (
            <div
              key={slide.index}
              style={{
                display: "flex",
                gap: 12,
                padding: "10px 16px",
                borderBottom: isLast ? "none" : "1px solid var(--border)",
                alignItems: "flex-start",
              }}
            >
              {/* Number */}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text3)",
                  minWidth: 18,
                  paddingTop: 2,
                  textAlign: "right",
                }}
              >
                {slide.index + 1}
              </span>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text)",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.4,
                  }}
                >
                  {slide.title}
                </p>
                {slide.key_points.length > 0 && (
                  <ul
                    style={{
                      margin: "5px 0 0",
                      padding: 0,
                      listStyle: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    {slide.key_points.map((point, j) => (
                      <li
                        key={j}
                        style={{
                          fontSize: 12,
                          color: "var(--text2)",
                          paddingLeft: 12,
                          position: "relative",
                          lineHeight: 1.5,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            color: "var(--text3)",
                          }}
                        >
                          ·
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Type badge — right side */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: 4,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: meta.color,
                  background: meta.bg,
                  whiteSpace: "nowrap",
                  marginTop: 1,
                  flexShrink: 0,
                }}
              >
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
