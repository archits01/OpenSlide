"use client";

import { useMemo } from "react";
import { diffLines, diffChars } from "diff";

interface DiffLine {
  lineNumber: number;
  content: string;
  type: "added" | "removed" | "unchanged";
  charChanges?: Array<{ value: string; type: "added" | "removed" | "unchanged" }>;
}

function computeDiff(before: string, after: string): DiffLine[] {
  const changes = diffLines(before, after, { newlineIsToken: false });
  const result: DiffLine[] = [];
  let lineNum = 0;

  for (const change of changes) {
    const lines = change.value.split("\n");
    // diffLines appends a trailing empty string when value ends with \n — drop it
    if (lines[lines.length - 1] === "") lines.pop();

    for (const line of lines) {
      lineNum++;
      if (change.added) {
        result.push({ lineNumber: lineNum, content: line, type: "added" });
      } else if (change.removed) {
        result.push({ lineNumber: lineNum, content: line, type: "removed" });
      } else {
        result.push({ lineNumber: lineNum, content: line, type: "unchanged" });
      }
    }
  }

  // For adjacent removed/added pairs (same position), compute character-level diff
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i].type === "removed" && result[i + 1].type === "added") {
      const charDiff = diffChars(result[i].content, result[i + 1].content);
      result[i].charChanges = charDiff.map((c) => ({
        value: c.value,
        type: c.removed ? "removed" : c.added ? "added" : "unchanged",
      }));
      result[i + 1].charChanges = charDiff.map((c) => ({
        value: c.value,
        type: c.added ? "added" : c.removed ? "removed" : "unchanged",
      }));
    }
  }

  return result;
}

function computeStats(lines: DiffLine[]) {
  let added = 0, removed = 0;
  for (const l of lines) {
    if (l.type === "added") added++;
    else if (l.type === "removed") removed++;
  }
  return { added, removed };
}

interface DiffPanelProps {
  path: string;
  before: string;
  after: string;
}

export function DiffPanel({ path, before, after }: DiffPanelProps) {
  const lines = useMemo(() => computeDiff(before, after), [before, after]);
  const stats = useMemo(() => computeStats(lines), [lines]);
  const hasChanges = stats.added > 0 || stats.removed > 0;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#1e1e2e", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        height: 34, display: "flex", alignItems: "center", gap: 8,
        padding: "0 12px", flexShrink: 0,
        background: "#181825", borderBottom: "1px solid rgba(255,255,255,0.06)",
        fontSize: 11, fontFamily: "var(--font-mono, monospace)",
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
        <span style={{ flex: 1, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {path}
        </span>
        {hasChanges ? (
          <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {stats.added > 0 && <span style={{ color: "#a6e3a1", fontWeight: 600 }}>+{stats.added}</span>}
            {stats.removed > 0 && <span style={{ color: "#f38ba8", fontWeight: 600 }}>-{stats.removed}</span>}
          </span>
        ) : (
          <span style={{ color: "#a6e3a1", fontSize: 10 }}>No changes</span>
        )}
      </div>

      {/* Diff lines */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
        {!hasChanges ? (
          <div style={{ padding: "20px 16px", color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: "var(--font-mono, monospace)" }}>
            No changes since last turn.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "var(--font-mono, monospace)" }}>
            <tbody>
              {lines.map((line, i) => (
                <DiffLineRow key={i} line={line} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function DiffLineRow({ line }: { line: DiffLine }) {
  const bg = line.type === "added" ? "rgba(166,227,161,0.08)" : line.type === "removed" ? "rgba(243,139,168,0.08)" : "transparent";
  const borderColor = line.type === "added" ? "#a6e3a1" : line.type === "removed" ? "#f38ba8" : "transparent";
  const gutter = line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
  const gutterColor = line.type === "added" ? "#a6e3a1" : line.type === "removed" ? "#f38ba8" : "rgba(255,255,255,0.2)";

  return (
    <tr style={{ background: bg, borderLeft: `3px solid ${borderColor}` }}>
      {/* Line number */}
      <td style={{
        padding: "0 8px", width: 40, minWidth: 40, textAlign: "right",
        color: "rgba(255,255,255,0.2)", userSelect: "none", verticalAlign: "top",
        lineHeight: "20px", paddingTop: 2, paddingBottom: 2,
      }}>
        {line.lineNumber}
      </td>
      {/* +/- gutter */}
      <td style={{
        width: 16, minWidth: 16, textAlign: "center",
        color: gutterColor, userSelect: "none", verticalAlign: "top",
        lineHeight: "20px", paddingTop: 2, paddingBottom: 2,
        fontWeight: 600,
      }}>
        {gutter}
      </td>
      {/* Content */}
      <td style={{
        padding: "2px 12px 2px 4px", color: "rgba(255,255,255,0.85)",
        lineHeight: "20px", whiteSpace: "pre", verticalAlign: "top",
      }}>
        {line.charChanges ? (
          line.charChanges
            .filter((c) => c.type !== (line.type === "removed" ? "added" : "removed"))
            .map((c, i) => {
              const charBg = c.type === "added"
                ? "rgba(166,227,161,0.3)"
                : c.type === "removed"
                  ? "rgba(243,139,168,0.3)"
                  : "transparent";
              return (
                <span key={i} style={{ background: charBg, borderRadius: 2 }}>
                  {c.value}
                </span>
              );
            })
        ) : (
          line.content
        )}
      </td>
    </tr>
  );
}
