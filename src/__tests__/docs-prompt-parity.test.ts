import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '@/prompts';
import { buildDocsPrompt } from '@/prompts/modes/docs';
import type { DocCategory } from '@/skills/DocSkills/doc-classifier';

describe('docs prompt router parity', () => {
  const cases: Array<{ label: string; docCategory?: DocCategory; deepResearch?: boolean; brand?: { brandJson: Record<string, unknown> } }> = [
    { label: 'no category, no brand, no deepResearch' },
    { label: 'deepResearch=true', deepResearch: true },
    { label: 'with brand', brand: { brandJson: { primaryColor: '#000' } } },
    { label: 'with brand + deepResearch', brand: { brandJson: { primaryColor: '#0a0' } }, deepResearch: true },
  ];

  for (const { label, docCategory, deepResearch, brand } of cases) {
    it(`router matches direct call: ${label}`, () => {
      const viaRouter = buildSystemPrompt({ mode: 'docs', category: docCategory, deepResearch, brand });
      const viaDirect = buildDocsPrompt({ docCategory, deepResearch, brand });
      expect(viaRouter).toBe(viaDirect);
    });
  }
});
