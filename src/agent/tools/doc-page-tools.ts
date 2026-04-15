/**
 * doc-page-tools.ts
 *
 * Document page tools. Same DB operations as slide tools,
 * but with names and descriptions the agent won't confuse with slides.
 */

import type { AgentTool } from "./index";
import { createSlideTool } from "./create-slide";
import { updateSlideTool } from "./update-slide";
import { deleteSlideTool } from "./delete-slide";
import { reorderSlidesTool } from "./reorder-slides";

export const createPageTool: AgentTool = {
  name: "create_page",
  description:
    "Create a new page in the document. Each page is a self-contained 816×1056px HTML block " +
    "representing one section of the document (cover page, prose section, data table, " +
    "numbered steps, checklist, etc). Call this once per section in the outline.",
  input_schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Page title (e.g., '1. Purpose', '5. Step-by-Step Procedure — Day 1')",
      },
      content: {
        type: "string",
        description:
          "HTML content for this page. Must follow the design system: " +
          "Inter font, 13px body text with line-height 1.7, section headings with " +
          "5px left border accent. Include page header and footer.",
      },
      layout: {
        type: "string",
        enum: ["cover", "body", "table", "steps", "checklist", "two_column", "callout", "reference"],
        description:
          "Page layout type matching the outline: " +
          "cover=P1, body=P2, table=P3, steps=P4, checklist=P5, " +
          "two_column=P6, callout=P7, reference=P8.",
      },
    },
    required: ["title", "content"],
  },
  execute: createSlideTool.execute,
};

export const updatePageTool: AgentTool = {
  name: "update_page",
  description:
    "Update an existing document page by ID. Use only when the user requests changes.",
  input_schema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The page ID to update",
      },
      title: {
        type: "string",
        description: "Updated page title (optional)",
      },
      content: {
        type: "string",
        description: "Updated HTML content for this page",
      },
    },
    required: ["id", "content"],
  },
  execute: updateSlideTool.execute,
};

export const deletePageTool: AgentTool = {
  name: "delete_page",
  description: "Delete a document page by ID.",
  input_schema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The page ID to delete",
      },
    },
    required: ["id"],
  },
  execute: deleteSlideTool.execute,
};

export const reorderPagesTool: AgentTool = {
  name: "reorder_pages",
  description: "Reorder document pages. Pass an array of page IDs in the desired order.",
  input_schema: {
    type: "object",
    properties: {
      order: {
        type: "array",
        items: { type: "string" },
        description: "Page IDs in the desired order",
      },
    },
    required: ["order"],
  },
  execute: reorderSlidesTool.execute,
};

// Build phase: only create + reorder
export const docBuildTools = [
  createPageTool,
  reorderPagesTool,
];

// Edit phase: all tools including update + delete
export const docEditTools = [
  createPageTool,
  updatePageTool,
  deletePageTool,
  reorderPagesTool,
];
