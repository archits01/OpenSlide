"use client";

import type { ResearchProgressData } from "./ChatPanel";
import { ShiningText } from "@/components/shared/ShiningText";

const STATUS_DOT: Record<string, { color: string; pulse?: boolean }> = {
  pending: { color: "var(--border-hover)" },
  active: { color: "var(--accent)", pulse: true },
  done: { color: "var(--green)" },
  error: { color: "var(--red)" },
};

function StatusDot({ status }: { status: string }) {
  const dot = STATUS_DOT[status] ?? STATUS_DOT.pending;
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: dot.color,
        flexShrink: 0,
        display: "inline-block",
        boxShadow: dot.pulse ? `0 0 0 3px ${dot.color}22` : undefined,
      }}
    />
  );
}

function StageLabel({ label, status }: { label: string; status: string }) {
  if (status === "active") {
    return <ShiningText text={label} />;
  }
  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: 500,
        color: status === "done" ? "var(--text2)" : status === "error" ? "var(--red)" : "var(--text3)",
      }}
    >
      {label}
    </span>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div
      style={{
        height: 4,
        borderRadius: 2,
        background: "var(--bg2)",
        flex: 1,
        minWidth: 40,
        maxWidth: 80,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 2,
          background: "var(--accent)",
          width: `${pct}%`,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

export function ResearchProgressCard({ progress }: { progress: ResearchProgressData }) {
  const isComplete = progress.isComplete;
  const hasError = progress.stages.some((s) => s.status === "error");

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
          padding: "10px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg2)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 13 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--text2)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Deep Research
        </span>
        <span style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 999,
            background: hasError
              ? "var(--red-soft)"
              : isComplete
                ? "var(--green-soft)"
                : "var(--accent-soft)",
            color: hasError
              ? "var(--red)"
              : isComplete
                ? "var(--green)"
                : "var(--accent-text)",
          }}
        >
          {hasError ? "Error" : isComplete ? "Complete" : "Researching…"}
        </span>
      </div>

      {/* Stages */}
      <div style={{ padding: "12px 16px", background: "var(--bg)" }}>
        {progress.stages.map((stage, i) => {
          const isLast = i === progress.stages.length - 1;
          const hasSubagents = stage.subagents && stage.subagents.length > 0;

          return (
            <div key={stage.id}>
              {/* Stage row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 28,
                }}
              >
                <StatusDot status={stage.status} />
                <StageLabel label={stage.label} status={stage.status} />
                <span style={{ flex: 1 }} />
                {stage.status === "done" && (
                  <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 500 }}>
                    done
                  </span>
                )}
                {stage.status === "error" && (
                  <span style={{ fontSize: 11, color: "var(--red)", fontWeight: 500 }}>
                    failed
                  </span>
                )}
              </div>

              {/* Subagent rows (for stage 1 — research agents) */}
              {hasSubagents && (
                <div style={{ paddingLeft: 17, marginTop: 2, marginBottom: 4 }}>
                  {stage.subagents!.map((agent, j) => {
                    const isLastAgent = j === stage.subagents!.length - 1;
                    return (
                      <div
                        key={agent.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          minHeight: 24,
                          paddingLeft: 8,
                          borderLeft: isLastAgent ? "none" : "1px solid var(--border)",
                          position: "relative",
                        }}
                      >
                        {/* Tree connector */}
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: 8,
                            height: 12,
                            borderLeft: "1px solid var(--border)",
                            borderBottom: "1px solid var(--border)",
                            borderBottomLeftRadius: 4,
                          }}
                        />
                        <span style={{ width: 4 }} />

                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 500,
                            color:
                              agent.status === "active"
                                ? "var(--accent)"
                                : agent.status === "done"
                                  ? "var(--text2)"
                                  : "var(--text3)",
                            minWidth: 65,
                          }}
                        >
                          {agent.id}
                        </span>

                        <ProgressBar value={agent.searchCount} max={agent.maxSearches} />

                        <span
                          style={{
                            fontSize: 10.5,
                            color: "var(--text3)",
                            minWidth: 24,
                            textAlign: "right",
                          }}
                        >
                          {agent.searchCount}/{agent.maxSearches}
                        </span>

                        <StatusDot status={agent.status} />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Connector between stages */}
              {!isLast && (
                <div style={{ paddingLeft: 3 }}>
                  <div
                    style={{
                      width: 1,
                      height: 10,
                      background: "var(--border)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Summary line */}
        {progress.summary && (
          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: "1px solid var(--border)",
              fontSize: 12,
              color: "var(--text2)",
              fontWeight: 500,
            }}
          >
            {progress.summary}
          </div>
        )}
      </div>
    </div>
  );
}
