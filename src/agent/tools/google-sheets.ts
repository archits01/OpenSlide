import { registerAuthTool } from './tool-registry';
import { getValidToken } from '@/lib/get-valid-token';
import type { AgentTool } from './types';

const googleSheetsTool: AgentTool = {
  name: 'google_sheets_read',
  description: 'Read data from a Google Sheets spreadsheet. Use when the user says "chart this data", "pull from spreadsheet", or references a Google Sheet.',
  providerTag: 'google_sheets',
  input_schema: {
    type: 'object',
    properties: {
      spreadsheetId: { type: 'string', description: 'The spreadsheet ID (from the URL)' },
      range: { type: 'string', description: 'Cell range like "Sheet1!A1:D10" or "Sheet1"' },
    },
    required: ['spreadsheetId'],
  },
  async execute(input, _signal, context) {
    const { spreadsheetId, range } = input as { spreadsheetId: string; range?: string };
    if (!context?.userId) return { error: 'NOT_CONNECTED', code: 'NOT_CONNECTED' };

    const token = await getValidToken(context.userId, 'google_sheets');
    if (!token) return { error: 'NOT_CONNECTED', code: 'NOT_CONNECTED' };

    const effectiveRange = range ?? 'Sheet1';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(effectiveRange)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      return { error: `Sheets API error: ${res.status} ${text}` };
    }

    const data = await res.json() as { range: string; values: string[][] };
    return {
      range: data.range,
      headers: data.values?.[0] ?? [],
      rows: data.values?.slice(1) ?? [],
      totalRows: (data.values?.length ?? 1) - 1,
    };
  },
};

registerAuthTool(googleSheetsTool);
export { googleSheetsTool };
