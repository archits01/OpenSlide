import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '@/prompts';
import { buildSheetsPrompt } from '@/prompts/modes/sheets';
import type { SheetCategory } from '@/skills/SheetSkills/sheet-classifier';

describe('sheets prompt router parity', () => {
  const cases: Array<{ label: string; sheetCategory?: SheetCategory; brand?: { brandJson: Record<string, unknown> } }> = [
    { label: 'no category, no brand' },
    { label: 'with brand, no category', brand: { brandJson: { primaryColor: '#000' } } },
  ];

  for (const { label, sheetCategory, brand } of cases) {
    it(`router matches direct call: ${label}`, () => {
      const viaRouter = buildSystemPrompt({ mode: 'sheets', category: sheetCategory, brand });
      const viaDirect = buildSheetsPrompt({ sheetCategory, brand });
      expect(viaRouter).toBe(viaDirect);
    });
  }
});
