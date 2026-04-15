export interface Message {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: "text" | "tool_use" | "tool_result" | "document" | "image";
  text?: string;
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

export interface Session {
  id: string;
  title: string;
  type?: "slides" | "docs";
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
}
