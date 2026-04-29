import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '@/prompts';
import { buildSlidesPrompt } from '@/prompts/modes/slides';
import type { SlideCategory } from '@/skills/slide-categories/slide-classifier';

describe('slides prompt router parity', () => {
  const cases: Array<{
    label: string;
    slideCategory?: SlideCategory;
    presentationType?: string;
    deepResearch?: boolean;
    brand?: { brandJson: Record<string, unknown> };
  }> = [
    { label: 'bare defaults' },
    { label: 'deepResearch=true', deepResearch: true },
    { label: 'general-deck (image guidance on)', slideCategory: 'general-deck' as SlideCategory },
    { label: 'presentationType triggers cover archetype', presentationType: 'board_deck' },
    { label: 'brand appends BrandPromptSection', brand: { brandJson: { primaryColor: '#ff00aa' } } },
    {
      label: 'kitchen sink',
      slideCategory: 'general-deck' as SlideCategory,
      presentationType: 'investor_pitch_seed_deck',
      deepResearch: true,
      brand: { brandJson: { primaryColor: '#abcdef' } },
    },
  ];

  for (const { label, slideCategory, presentationType, deepResearch, brand } of cases) {
    it(`router matches direct call: ${label}`, () => {
      const viaRouter = buildSystemPrompt({ mode: 'slides', category: slideCategory, presentationType, deepResearch, brand });
      const viaDirect = buildSlidesPrompt({ slideCategory, presentationType, deepResearch, brand });
      expect(viaRouter).toBe(viaDirect);
    });
  }
});
