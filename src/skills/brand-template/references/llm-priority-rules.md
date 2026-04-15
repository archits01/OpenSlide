# LLM Priority Rules for Brand-Constrained Slide Generation

These are ranked. When conflicts arise, higher-numbered rules override lower ones.

1. **Template structure overrides AI creativity** — never invent a layout the template doesn't have
2. **Brand colors, fonts, and logo override content convenience** — never swap for "something that looks better"
3. **Header, footer, legal text, and logo are immutable** — highest priority, never touched
4. **Layout grid and safe zones override auto-generated arrangement** — content fits the template, not the other way around
5. **If a slide type isn't in the template, fall back to the nearest approved type** — never create a new visual pattern
6. **If a field is missing from user input, infer within the template structure only** — don't add visual elements to compensate
7. **If the template has dark mode, generate dark. If light, generate light.** Never switch unless explicitly asked.
8. **Accessibility minimums are non-negotiable** — minimum 14pt body text, 4.5:1 contrast ratio, no color-only information
9. **User-configured rules (Bucket 2) override auto-extracted patterns (Bucket 1)** — the brand admin's explicit choices trump what the AI inferred from the PPTX
10. **When in doubt, be more conservative** — a plain on-brand slide is better than a creative off-brand slide
