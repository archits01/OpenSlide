/**
 * Builds a short context block listing which patterns have been used so far.
 * Injected as a dynamic system block each iteration to nudge variety.
 */
export function buildConnectionStatusContext(
  connectedProviderNames: string[],
  connections?: Array<{ provider: string; metadata: Record<string, string> | null }>
): string {
  const all = ['github', 'gmail', 'google_drive', 'google_sheets'];
  const connected = connectedProviderNames.filter((p) => all.includes(p));
  const notConnected = all.filter((p) => !connectedProviderNames.includes(p));

  const lines = ['## Connected Integrations'];
  if (connected.length) {
    for (const p of connected) {
      const meta = connections?.find(c => c.provider === p)?.metadata;
      const detail = meta?.email ?? meta?.login ?? '';
      lines.push(`- ${p}: connected${detail ? ` (${detail})` : ''}`);
    }
  }
  if (notConnected.length) lines.push(`Not connected: ${notConnected.join(', ')}`);
  lines.push(
    '',
    'Rules:',
    '- Only use tools whose provider is connected.',
    '- If a tool needs an unconnected provider, tell the user to connect it first. Do NOT attempt to call the tool.',
    '- For export_pdf, no connection is needed.',
    '- When the user says "mail this to me", use their connected Gmail email address. Do NOT ask for their email.',
    '- Email composition rules for gmail_send:',
    '  Subject: presentation title only — no "Here is your..." or "Please find attached..." prefixes.',
    '  Body: 3-5 sentences max. Brief cover note, not a content summary.',
    '  Mention what the deck covers in one line. Optionally highlight 2-3 key takeaways.',
    '  Close with a sign-off (e.g. "Best regards"). Do NOT include a name in the sign-off.',
    '  Do NOT dump slide content, outlines, or bullet lists into the email body.',
    '  The PDF is attached — the email is just a handoff note.',
  );
  return lines.join('\n');
}
