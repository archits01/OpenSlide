// src/agent/tools/export-pdf.ts
import { registerAuthTool } from './tool-registry';
import { getSession } from '@/lib/redis';
import { buildSlideHtml } from '@/lib/slide-html';
import type { AgentTool, AgentToolContext } from './types';
import type { ThemeName } from '@/agent/tools/set-theme';
import type { LogoResult } from '@/lib/types';

export interface ExportResult {
  base64: string;
  sizeBytes: number;
  mimeType: string;
  filename: string;
}

export interface ExportError {
  error: string;
}

/**
 * Core export logic — reusable by both the export_pdf tool and gmail_send auto-export.
 */
export async function generateExport(
  sessionId: string,
  format: 'pdf' | 'pptx' = 'pdf'
): Promise<ExportResult | ExportError> {
  const serverUrl = process.env.PDF_SERVER_URL;
  const secret = process.env.PDF_SERVER_SECRET;
  if (!serverUrl) {
    return { error: 'PDF server not configured (PDF_SERVER_URL missing)' };
  }

  const session = await getSession(sessionId);
  if (!session) {
    return { error: 'Session not found' };
  }

  const isDoc = session.type === 'docs';
  const pages = (session.slides ?? []).sort((a, b) => a.index - b.index);
  if (pages.length === 0) {
    return { error: isDoc ? 'No pages to export' : 'No slides to export' };
  }

  const theme = (pages[0]?.theme as ThemeName) || 'minimal';
  const exportReset = isDoc ? '' : '<style>html,body,.slide-root,.slide-root>*{border-radius:0!important}</style>';
  const logoResult: LogoResult | null = (!isDoc && session.logoUrl)
    ? { url: session.logoUrl, source: 'monogram', colors: [] }
    : null;

  const slidePayload = pages.map((page, i) => ({
    html: exportReset
      ? buildSlideHtml(page, theme, logoResult, i === 0, undefined, undefined, false, isDoc).replace('</head>', `${exportReset}</head>`)
      : buildSlideHtml(page, theme, null, false, undefined, undefined, false, true),
    title: page.title,
  }));

  const filename = `${session.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${format}`;
  const viewport = isDoc ? { width: 816, height: 1056 } : { width: 1280, height: 720 };
  const endpoint = format === 'pptx' ? '/generate-pptx' : '/generate-pdf';

  let res: Response;
  try {
    res = await fetch(`${serverUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify({ slides: slidePayload, filename, viewport }),
      signal: AbortSignal.timeout(110_000),
    });
  } catch (err) {
    return { error: `PDF server unreachable: ${String(err)}` };
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: `Export failed: ${res.status}` })) as { error?: string };
    return { error: errBody.error ?? `Export failed: ${res.status}` };
  }

  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const sizeBytes = buffer.byteLength;
  const mimeType = format === 'pptx'
    ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    : 'application/pdf';

  console.log(`[export_pdf] Generated ${format}: ${sizeBytes} bytes, base64 length: ${base64.length}, starts with: ${base64.slice(0, 20)}`);

  if (sizeBytes < 100) {
    return { error: `Generated ${format} is too small (${sizeBytes} bytes) — likely corrupted` };
  }

  return { base64, sizeBytes, mimeType, filename };
}

const exportPdfTool: AgentTool = {
  name: 'export_pdf',
  description:
    'Export the current presentation as a PDF or PPTX file. Returns base64-encoded bytes. Use before gmail_send when the user wants to email their deck.',
  providerTag: null,
  input_schema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'The session ID of the presentation to export' },
      format: { type: 'string', enum: ['pdf', 'pptx'], description: 'Export format' },
    },
    required: ['sessionId', 'format'],
  },
  async execute(input, _signal, context?: AgentToolContext): Promise<ExportResult | ExportError> {
    const { format } = input as { sessionId?: string; format: 'pdf' | 'pptx' };
    const sessionId = context?.sessionId ?? (input as { sessionId?: string }).sessionId;
    if (!sessionId) {
      return { error: 'No session ID available' };
    }
    return generateExport(sessionId, format);
  },
};

registerAuthTool(exportPdfTool);
export { exportPdfTool };
