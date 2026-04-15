// src/agent/tools/gmail-send.ts
import { registerAuthTool } from './tool-registry';
import { getValidToken } from '@/lib/get-valid-token';
import type { AgentTool, AgentToolContext } from './types';

const GMAIL_SIZE_LIMIT = 25_000_000; // 25MB

interface SendResult {
  messageId: string;
  to: string;
}

interface SendError {
  error: string;
  code?: string;
}

/**
 * RFC 2047 encode a header value for non-ASCII characters.
 * Splits into 75-byte encoded-word chunks if needed.
 */
function encodeSubject(subject: string): string {
  // If pure ASCII, no encoding needed
  if (!/[^\x20-\x7E]/.test(subject)) return subject;
  // Base64-encode the entire subject as UTF-8
  const b64 = Buffer.from(subject, 'utf-8').toString('base64');
  return `=?UTF-8?B?${b64}?=`;
}

/**
 * Wrap base64 string to 76-char lines per RFC 2045.
 */
function wrapBase64(b64: string): string {
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += 76) {
    lines.push(b64.slice(i, i + 76));
  }
  return lines.join('\r\n');
}

/**
 * Build a proper RFC 2822 MIME message.
 * - Subject is RFC 2047 encoded for non-ASCII
 * - HTML body is base64-encoded to avoid any charset mangling
 * - All base64 blocks are line-wrapped at 76 chars per RFC 2045
 * - Attachments use multipart/mixed
 */
function buildMimeMessage(
  to: string,
  subject: string,
  htmlBody: string,
  attachment?: { filename: string; mimeType: string; base64: string }
): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const parts: string[] = [];

  // Headers
  parts.push(`To: ${to}`);
  parts.push(`Subject: ${encodeSubject(subject)}`);
  parts.push('MIME-Version: 1.0');

  // Base64-encode the HTML body so ALL content is 7-bit safe
  const bodyBase64 = wrapBase64(Buffer.from(htmlBody, 'utf-8').toString('base64'));

  if (attachment) {
    // Multipart message with attachment
    parts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    parts.push(''); // blank line ends headers

    // HTML body part
    parts.push(`--${boundary}`);
    parts.push('Content-Type: text/html; charset=utf-8');
    parts.push('Content-Transfer-Encoding: base64');
    parts.push('');
    parts.push(bodyBase64);

    // Attachment part
    parts.push(`--${boundary}`);
    parts.push(`Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`);
    parts.push('Content-Transfer-Encoding: base64');
    parts.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
    parts.push('');
    parts.push(wrapBase64(attachment.base64));

    parts.push(`--${boundary}--`);
  } else {
    // Simple message, no attachment
    parts.push('Content-Type: text/html; charset=utf-8');
    parts.push('Content-Transfer-Encoding: base64');
    parts.push(''); // blank line ends headers
    parts.push(bodyBase64);
  }

  return parts.join('\r\n');
}

const gmailSendTool: AgentTool = {
  name: 'gmail_send',
  description:
    'Send an email via the user\'s connected Gmail account. Use after export_pdf when the user wants to email their deck. Requires Gmail to be connected.',
  providerTag: 'gmail',
  input_schema: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'Recipient email address' },
      subject: { type: 'string', description: 'Email subject line' },
      body: { type: 'string', description: 'Email body as plain text or HTML' },
      attachment: {
        type: 'object',
        description: 'Optional file attachment',
        properties: {
          filename: { type: 'string' },
          mimeType: { type: 'string' },
          base64: { type: 'string', description: 'Base64-encoded file content' },
        },
        required: ['filename', 'mimeType', 'base64'],
      },
    },
    required: ['to', 'subject', 'body'],
  },
  async execute(input, _signal, context?: AgentToolContext): Promise<SendResult | SendError> {
    const { to, subject, body, attachment } = input as {
      to: string;
      subject: string;
      body: string;
      attachment?: { filename: string; mimeType: string; base64: string };
    };

    if (!context?.userId) {
      return { error: 'NOT_CONNECTED', code: 'NOT_CONNECTED' };
    }

    // Log what we actually received
    console.log(`[gmail_send] to=${to}, subject=${subject.slice(0, 50)}, hasAttachment=${!!attachment}, attachmentBase64Length=${attachment?.base64?.length ?? 0}, base64Start=${attachment?.base64?.slice(0, 20) ?? 'none'}`);

    // Attachment size check (base64 → approx raw bytes)
    if (attachment) {
      const approxBytes = attachment.base64.length * 0.75;
      if (approxBytes > GMAIL_SIZE_LIMIT) {
        return { error: 'ATTACHMENT_TOO_LARGE', code: 'ATTACHMENT_TOO_LARGE' };
      }
    }

    const token = await getValidToken(context.userId, 'gmail');
    if (!token) {
      return { error: 'NOT_CONNECTED', code: 'NOT_CONNECTED' };
    }

    const mimeMessage = buildMimeMessage(to, subject, body, attachment);

    // Gmail API expects base64url encoding of the full MIME message
    const raw = Buffer.from(mimeMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      return { error: err?.error?.message ?? `Gmail API error ${res.status}` };
    }

    const data = await res.json() as { id: string };
    return { messageId: data.id, to };
  },
};

registerAuthTool(gmailSendTool);
export { gmailSendTool };
