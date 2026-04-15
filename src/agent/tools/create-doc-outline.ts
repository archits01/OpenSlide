import type { AgentTool } from "./index";
import type { Outline, OutlineSlide } from "@/lib/redis";
import { randomUUID } from "crypto";

export const createDocOutlineTool: AgentTool = {
  name: "create_outline",
  description:
    "Create a structured outline for the document BEFORE writing any pages. Shows the user the planned section structure and waits for their approval.",
  input_schema: {
    type: "object",
    properties: {
      document_title: {
        type: "string",
        description: "The document title",
      },
      sections: {
        type: "array",
        description: "Planned sections in order. Each section becomes one or more pages.",
        items: {
          type: "object",
          properties: {
            index: { type: "number", description: "Zero-based section index" },
            title: { type: "string", description: "Section heading (include section number, e.g. '1. Purpose')" },
            type: {
              type: "string",
              enum: ["cover", "body", "table", "steps", "checklist", "two_column", "callout", "reference"],
              description:
                "Section type determines the page layout pattern:\n" +
                "- 'cover': Title page with document metadata\n" +
                "- 'body': Prose paragraphs with optional bullet lists — for purpose, scope, summaries\n" +
                "- 'table': Full-width data table — for prerequisites, roles, expected outputs, financial data\n" +
                "- 'steps': Numbered step-by-step procedure with owner/duration metadata — for instructions, processes\n" +
                "- 'checklist': Grouped checkbox items with signature blocks — for compliance, verification\n" +
                "- 'two_column': Paired columns — for troubleshooting (issue/cause/resolution), FAQ, comparison\n" +
                "- 'callout': Accent-bordered callout boxes with prose — for terms, warnings, key takeaways\n" +
                "- 'reference': Revision history, appendices, end-of-document",
            },
            key_points: {
              type: "array",
              items: { type: "string" },
              description:
                "What this section will cover. Be specific — use actual details from the user's request.\n" +
                "For 'steps' type: list each step title (e.g. 'Step 1: Create digital identity — IT Helpdesk, 30 min')\n" +
                "For 'table' type: describe columns (e.g. 'Table: #, Prerequisite, Owner')\n" +
                "For 'two_column' type: describe the column pairing (e.g. 'Columns: Issue, Likely Cause, Resolution')\n" +
                "For 'checklist' type: list the groups (e.g. 'Groups: Pre-Arrival, Day 1, Day 2-4, Day 5')",
            },
          },
          required: ["index", "title", "type", "key_points"],
        },
      },
    },
    required: ["document_title", "sections"],
  },

  async execute(input) {
    const { document_title, sections } = input as {
      document_title: string;
      sections: Array<{ index: number; title: string; type: string; key_points: string[] }>;
    };

    const outline: Outline = {
      id: randomUUID(),
      presentation_title: document_title,
      slides: sections.map((s) => ({
        index: s.index,
        title: s.title,
        type: s.type as OutlineSlide["type"],
        key_points: s.key_points,
      })),
    };

    return outline;
  },
};
