"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PreflightQuestion } from "@/app/api/website-preflight/route";

interface AgentQuestionCardProps {
  questions: PreflightQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  onSkip: () => void;
}

export function AgentQuestionCard({ questions, onSubmit, onSkip }: AgentQuestionCardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function select(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function handleAuto() {
    const auto: Record<string, string> = {};
    for (const q of questions) auto[q.id] = q.autoAnswer;
    onSubmit(auto);
  }

  function handleSubmit() {
    // Fill any unanswered with autoAnswer
    const filled: Record<string, string> = {};
    for (const q of questions) filled[q.id] = answers[q.id] ?? q.autoAnswer;
    onSubmit(filled);
  }

  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)",
        overflow: "hidden",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 12px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              letterSpacing: "-0.02em",
            }}
          >
            Quick setup
          </span>
        </div>
        <button
          onClick={onSkip}
          style={{
            fontSize: 12,
            color: "var(--text3)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: "var(--r-md)",
            transition: "color 0.12s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text2)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text3)"; }}
        >
          Skip
        </button>
      </div>

      {/* Questions */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {questions.map((q, qi) => {
          const selected = answers[q.id];
          return (
            <div key={q.id}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text)",
                  marginBottom: 8,
                  letterSpacing: "-0.01em",
                }}
              >
                {qi + 1}. {q.text}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {q.options.map((opt) => {
                  const isSelected = selected === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => select(q.id, opt.id)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 999,
                        fontSize: 12.5,
                        fontWeight: isSelected ? 600 : 400,
                        cursor: "pointer",
                        transition: "all 0.12s",
                        background: isSelected ? "var(--accent)" : "var(--bg2)",
                        color: isSelected ? "#fff" : "var(--text2)",
                        border: isSelected
                          ? "1.5px solid var(--accent)"
                          : "1.5px solid var(--border)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "10px 16px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text3)" }}>
          {answeredCount}/{questions.length} answered
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={handleAuto}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
              background: "var(--bg2)",
              color: "var(--text2)",
              border: "1.5px solid var(--border)",
              transition: "all 0.12s",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--border)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg2)"; }}
          >
            Auto
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              background: allAnswered ? "var(--accent)" : "var(--bg2)",
              color: allAnswered ? "#fff" : "var(--text3)",
              border: allAnswered ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
              transition: "all 0.15s",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => {
              if (allAnswered) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)";
            }}
            onMouseLeave={(e) => {
              if (allAnswered) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
            }}
          >
            Start building →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
