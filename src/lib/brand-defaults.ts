/**
 * brand-defaults.ts
 *
 * Sensible defaults for brand_config.json when the user doesn't configure anything.
 * Applied automatically after PPTX extraction. The user sees a simple confirmation
 * ("Brand detected → Use this brand / Skip") and these defaults handle everything else.
 *
 * Philosophy: lock what matters (logo, fonts, header/footer), flex what doesn't (layout, density).
 */

export interface BrandConfig {
  selected_logo_index: number;

  locks: {
    logo: boolean;
    fonts: boolean;
    header: boolean;
    footer: boolean;
    colors: boolean;
  };

  content: {
    whitespace_density: string;
    max_bullets_per_slide: number;
    max_words_per_slide: number;
  };

  images: {
    stock_photos_allowed: boolean;
    ai_images_allowed: boolean;
    company_images_only: boolean;
  };

  behavior: {
    allow_new_slide_types: boolean;
    allow_decorative_elements: boolean;
  };

  sequencing: {
    closing_slide_required: boolean;
    max_consecutive_data_slides: number;
  };
}

export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  selected_logo_index: 0,

  locks: {
    logo: true,
    fonts: true,
    header: true,
    footer: true,
    colors: true,
  },

  content: {
    whitespace_density: "balanced",
    max_bullets_per_slide: 6,
    max_words_per_slide: 50,
  },

  images: {
    stock_photos_allowed: true,
    ai_images_allowed: false,
    company_images_only: false,
  },

  behavior: {
    allow_new_slide_types: false,
    allow_decorative_elements: false,
  },

  sequencing: {
    closing_slide_required: true,
    max_consecutive_data_slides: 2,
  },
};

/**
 * Build the brand constraints section for the system prompt.
 * ~400 tokens. Clear, non-negotiable rules.
 */
export function buildBrandPromptSection(
  brand: Record<string, unknown>,
  rawConfig?: BrandConfig
): string {
  // Deep-merge with defaults — handles partial/empty configs from Prisma JSON fields
  const config: BrandConfig = {
    ...DEFAULT_BRAND_CONFIG,
    ...rawConfig,
    locks: { ...DEFAULT_BRAND_CONFIG.locks, ...rawConfig?.locks },
    content: { ...DEFAULT_BRAND_CONFIG.content, ...rawConfig?.content },
    images: { ...DEFAULT_BRAND_CONFIG.images, ...rawConfig?.images },
    behavior: { ...DEFAULT_BRAND_CONFIG.behavior, ...rawConfig?.behavior },
    sequencing: { ...DEFAULT_BRAND_CONFIG.sequencing, ...rawConfig?.sequencing },
  };
  const colors = brand.colors as Record<string, unknown> | undefined;
  const fonts = brand.fonts as Record<string, unknown> | undefined;
  const logoCandidates = brand.logo_candidates as Array<Record<string, unknown>> | undefined;
  const logo = logoCandidates?.[config.selected_logo_index];
  const headerFooter = brand.header_footer as Record<string, unknown> | undefined;
  const header = headerFooter?.header as Record<string, unknown> | undefined;
  const footer = headerFooter?.footer as Record<string, unknown> | undefined;
  const footerBuiltin = footer?.builtin as Record<string, unknown> | undefined;

  let prompt = `## Brand Constraints\n\n`;
  prompt += `These rules are NON-NEGOTIABLE. Template rules override AI creativity.\n\n`;

  // Colors
  prompt += `### Colors\n`;
  if (colors?.primary) prompt += `- Primary: ${colors.primary}\n`;
  if (colors?.secondary) prompt += `- Secondary: ${colors.secondary}\n`;
  const byFreq = colors?.by_frequency as Array<{ hex: string }> | undefined;
  if (byFreq?.length) {
    prompt += `- Full palette: ${byFreq.slice(0, 6).map((c) => c.hex).join(", ")}\n`;
  }
  prompt += `- DO NOT use any colors outside this palette.\n\n`;

  // Fonts
  prompt += `### Fonts\n`;
  prompt += `- Primary: ${fonts?.primary || "sans-serif"}\n`;
  if (fonts?.secondary) prompt += `- Secondary: ${fonts.secondary}\n`;
  prompt += `- DO NOT substitute or change fonts.\n\n`;

  // Logo
  if (logo) {
    prompt += `### Logo\n`;
    prompt += `- Logo image is provided and MUST appear on the cover slide.\n`;
    prompt += `- Position: top-left corner, consistent with template.\n`;
    prompt += `- DO NOT move, resize, recolor, or remove the logo.\n\n`;
  }

  // Header
  if (header?.has_content) {
    prompt += `### Header\n`;
    prompt += `- Header HTML template is provided. Inject it into every slide.\n`;
    prompt += `- DO NOT modify the header structure, position, or content.\n\n`;
  }

  // Footer
  if (footer?.has_content) {
    prompt += `### Footer\n`;
    const footerPlaceholder = footerBuiltin?.footer_placeholder as { text: string } | undefined;
    if (footerPlaceholder?.text) {
      prompt += `- Footer text: "${footerPlaceholder.text}"\n`;
    }
    if (footerBuiltin?.slide_number_placeholder) {
      prompt += `- Slide numbers: enabled, auto-increment.\n`;
    }
    prompt += `- Footer HTML template is provided. Inject it into every slide.\n`;
    prompt += `- DO NOT modify footer text, position, or legal content.\n\n`;
  }

  // Content rules
  prompt += `### Content Rules\n`;
  prompt += `- Max ${config.content.max_bullets_per_slide} bullet points per slide.\n`;
  prompt += `- Max ${config.content.max_words_per_slide} words per slide.\n`;
  prompt += `- Whitespace density: ${config.content.whitespace_density}.\n`;
  prompt += `- Never put more than ${config.sequencing.max_consecutive_data_slides} data-heavy slides in a row.\n`;
  if (config.sequencing.closing_slide_required) {
    prompt += `- Final slide must be a closing slide.\n`;
  }
  prompt += `\n`;

  // Image rules
  prompt += `### Image Rules\n`;
  if (config.images.company_images_only) {
    prompt += `- ONLY use images provided by the user. Do not source external images.\n`;
  } else {
    prompt += `- Stock photos: ${config.images.stock_photos_allowed ? "allowed" : "not allowed"}.\n`;
    prompt += `- AI-generated images: ${config.images.ai_images_allowed ? "allowed" : "not allowed"}.\n`;
  }
  prompt += `\n`;

  // Behavioral rules
  prompt += `### Behavioral Rules\n`;
  prompt += `- DO NOT create slide layouts that are not in the template.\n`;
  prompt += `- DO NOT add decorative elements (shapes, borders, icons) not in the template.\n`;
  prompt += `- DO NOT modify header, footer, or legal text under any circumstances.\n`;
  prompt += `- If content doesn't fit a template slide type, adapt the content — not the template.\n`;
  prompt += `- When in doubt, be conservative. A plain on-brand slide beats a creative off-brand one.\n`;

  return prompt;
}
