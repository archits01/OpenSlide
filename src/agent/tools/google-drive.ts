import { registerAuthTool } from './tool-registry';
import { getValidToken } from '@/lib/get-valid-token';
import type { AgentTool } from './types';

const googleDriveTool: AgentTool = {
  name: 'google_drive_search',
  description: 'Search and read files from the user\'s Google Drive. Use when the user wants to import a doc, spreadsheet, or file into their presentation.',
  providerTag: 'google_drive',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query (e.g., "Q4 report", "marketing plan")' },
      fileId: { type: 'string', description: 'If known, read a specific file by ID' },
    },
  },
  async execute(input, _signal, context) {
    const { query, fileId } = input as { query?: string; fileId?: string };
    if (!context?.userId) return { error: 'NOT_CONNECTED', code: 'NOT_CONNECTED' };

    const token = await getValidToken(context.userId, 'google_drive');
    if (!token) return { error: 'NOT_CONNECTED', code: 'NOT_CONNECTED' };

    const headers = { Authorization: `Bearer ${token}` };

    // If fileId provided, read the file content directly
    if (fileId) {
      // Try export as plain text (works for Google Docs/Sheets)
      const exportRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
        { headers }
      );
      if (exportRes.ok) {
        const text = await exportRes.text();
        return { fileId, content: text.slice(0, 10000) }; // Cap at 10k chars
      }
      // Fallback: get file metadata
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType,description`,
        { headers }
      );
      if (metaRes.ok) return metaRes.json();
      return { error: `Failed to read file: ${exportRes.status}` };
    }

    // Search for files
    const searchQuery = query ? `name contains '${query.replace(/'/g, "\\'")}'` : '';
    const params = new URLSearchParams({
      q: searchQuery || "mimeType != 'application/vnd.google-apps.folder'",
      fields: 'files(id,name,mimeType,modifiedTime,description)',
      pageSize: '10',
      orderBy: 'modifiedTime desc',
    });

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers });
    if (!res.ok) return { error: `Drive API error: ${res.status}` };

    const data = await res.json() as { files: Array<{ id: string; name: string; mimeType: string; modifiedTime: string }> };
    return { files: data.files };
  },
};

registerAuthTool(googleDriveTool);
export { googleDriveTool };
