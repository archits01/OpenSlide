import type { SlideCategory } from '@/skills/slide-categories/slide-classifier';
import type { DocCategory } from '@/skills/DocSkills/doc-classifier';
import type { SheetCategory } from '@/skills/SheetSkills/sheet-classifier';
import type { BrandConfig } from '@/lib/brand-defaults';
import type { BrandKitRecord } from '@/lib/brand/types';

/** Legacy brand config (BrandConfig table) — emits a rules-only prompt section. */
export type PromptBrand = { brandJson: Record<string, unknown>; brandConfig?: BrandConfig };

/** New brand kit (BrandKit table) — emits a full skill replacement (design-system + layouts). */
export type PromptBrandKit = BrandKitRecord;

export type PromptContext =
  | { mode: 'website'; envVarNames: string[]; scaffoldHint?: string }
  | { mode: 'website-discuss' }
  | { mode: 'sheets'; category?: SheetCategory; brand?: PromptBrand; brandKit?: PromptBrandKit }
  | { mode: 'docs'; category?: DocCategory; deepResearch?: boolean; brand?: PromptBrand; brandKit?: PromptBrandKit }
  | { mode: 'slides'; category?: SlideCategory; presentationType?: string; deepResearch?: boolean; brand?: PromptBrand; brandKit?: PromptBrandKit };
