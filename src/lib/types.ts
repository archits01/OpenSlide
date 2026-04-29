export interface Message {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: "text" | "tool_use" | "tool_result" | "document" | "image" | "thinking";
  text?: string;
  thinking?: string;
  signature?: string;
  id?: string;
  name?: string;
  input?: unknown;
  tool_use_id?: string;
  content?: string | ContentBlock[];
  // For document / image blocks (file attachments)
  source?: {
    type: "base64" | "text";
    media_type: string;
    data: string;
  };
  title?: string;
}

/** Persisted reference to an uploaded file in Supabase Storage. No content stored here. */
export interface SessionAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  /** "raw" = PDF or image stored as bytes. "text" = extracted plain text stored as UTF-8. */
  contentType: "raw" | "text";
  addedAt: number;
}

export type SessionType = "slides" | "docs" | "sheets" | "website";

export function validSessionType(t: unknown): SessionType {
  return t === "docs" || t === "sheets" || t === "website" ? t : "slides";
}

export interface Session {
  id: string;
  title: string;
  type?: SessionType;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  slides: Slide[];
  outline?: Outline | null;
  logoUrl?: string | null;
  theme?: string | null;
  themeColors?: Record<string, string> | null;
  isPublic?: boolean;
  isReplay?: boolean;
  userId?: string | null;
  toolHistory?: ToolCallEntry[];
  slideCategory?: string | null;
  presentationType?: string | null;
  classificationConfidence?: "high" | "medium" | "low" | null;
  classificationMethod?: "graph" | "default" | "template" | null;
  classifiedAt?: number | null;
  attachments?: SessionAttachment[];
  research?: Array<{
    query: string;
    url: string;
    title: string;
    snippet: string;
    retrievedAt: number;
  }>;
  // ─── Website mode fields ────────────────────────────────────────────────
  /** Website file tree: path → content. Source of truth; WebContainer FS is hydrated from this. */
  websiteFilesJson?: Record<string, string> | null;
  /** AES-256-GCM ciphertext (base64) of env vars. Decrypted server-side only. */
  websiteEnvVars?: string | null;
  /** Supabase Storage URL of last captured PNG of the preview. */
  previewScreenshotUrl?: string | null;
  /** Supabase Storage URL of last WebContainer FS snapshot (.bin). Skips npm install on reload. */
  webcontainerSnapshotUrl?: string | null;
  /** True if files/env have changed since last snapshot upload. */
  websiteSandboxDirty?: boolean;
  /** Template used to scaffold this session (e.g. "vite-react", "expo", "astro"). */
  websiteTemplateName?: string | null;
  /** Stable published URL after a Vercel deploy (e.g. https://myapp.vercel.app). */
  websitePublishedUrl?: string | null;
  /** Per-session brand kit override. When set, this kit is used regardless of the user's default. */
  brandKitId?: string | null;
  /** Free-text topic / subject of this deck (extracted from first prompt). */
  topicSubject?: string | null;
}

export interface Slide {
  id: string;
  index: number;
  title: string;
  content: string;
  theme?: string;
  layout: "title" | "content" | "split" | "image" | "blank";
  notes?: string;
  type?: OutlineSlideType;
  patternHint?: string;
  /** Serialized Univer workbook JSON (sheets only). Source of truth for sheet data. */
  workbookJson?: string;
  /** Number of sheets/tabs in the workbook (sheets only). */
  workbookSheetCount?: number;
}

export type OutlineSlideType =
  | "title" | "content" | "data" | "quote" | "image" | "transition"  // slides
  | "cover" | "body" | "table" | "steps" | "checklist" | "two_column" | "callout" | "reference";  // docs

export interface OutlineSlide {
  index: number;
  title: string;
  type: OutlineSlideType;
  key_points: string[];
  speaker_notes?: string;
  key_facts?: string[];
  sources?: string[];
  /** Exact pattern name from the loaded layout library (e.g., "B4: SVG Chart + 3-Panel Sidebar") */
  pattern_name?: string;
  /** One sentence: what goes where, how many items, focal point, and density hint if non-standard (e.g., "data-heavy, 12px body") */
  layout_notes?: string;
}

export interface Outline {
  id: string;
  presentation_title: string;
  slides: OutlineSlide[];
}

export interface ToolCallEntry {
  id: string;
  toolName: string;
  status: "running" | "done" | "error";
  input?: Record<string, unknown>;
  result?: string;
  timestamp: number;
}

export interface LogoResult {
  url: string;
  source: "logo.dev" | "google_favicon" | "monogram";
  /** Brand colors from Logo.dev (hex strings), empty for other sources */
  colors: string[];
  /** Company name from Logo.dev describe API, if available */
  name?: string;
}

export interface SessionSummary {
  id: string;
  title: string;
  updatedAt: number;
  slideCount: number;
  firstSlide?: {
    content: string;
    theme: string;
  };
  /** Last captured preview PNG — only populated for website sessions. */
  previewScreenshotUrl?: string | null;
}

export type ConnectorStatus = "available" | "soon" | "connected" | "beta";
export type ConnectorAction = "connect" | "install";

export interface Connector {
  id: string;
  label: string;
  iconUrl: string;
  status: ConnectorStatus;
  action?: ConnectorAction;
}
