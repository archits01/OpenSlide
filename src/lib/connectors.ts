import type { Connector } from "./types";

/**
 * Quick-access connectors shown in the popover.
 * Only connectors with a real OAuth config (src/lib/oauth-configs.ts) or
 * a supported integration mechanism are listed here.
 */
export const QUICK_CONNECTORS: Connector[] = [
  { id: "github", label: "GitHub", iconUrl: "/images/connectors/github.png", status: "available" },
  { id: "gmail", label: "Gmail", iconUrl: "/images/connectors/gmail.png", status: "available" },
  { id: "google_drive", label: "Google Drive", iconUrl: "/images/connectors/google-drive.png", status: "available" },
  { id: "google_sheets", label: "Google Sheets", iconUrl: "/images/connectors/google-sheets.png", status: "available" },
  { id: "slack", label: "Slack", iconUrl: "/images/connectors/slack.png", status: "available" },
  { id: "notion", label: "Notion", iconUrl: "/images/connectors/notion.png", status: "soon" },
];

/** Footer mini-icons shown in the "+ Add connectors" overflow preview. */
export const FOOTER_PREVIEW_ICONS: string[] = [
  "/images/connectors/google-drive.png",
  "/images/connectors/notion.png",
];

/** Overflow count shown next to footer preview icons (connectors in the full modal beyond quick-list). */
export const FOOTER_OVERFLOW_COUNT = Math.max(0, QUICK_CONNECTORS.length - FOOTER_PREVIEW_ICONS.length);
