---
name: slide-categories
description: Documents the active presentation categories. The system auto-selects the best one based on the user's prompt. The agent can suggest switching if the user's intent changes.
---

# Slide Categories

The system has automatically selected a design skill for this presentation based on the user's prompt. Only that skill is loaded — the others are not in your context.

## Active Categories

### Business Corporate

| Category | When to use |
|---|---|
| **business_corporate/investment_finance** | Board decks, investor presentations, fundraising, earnings reports, QBRs, financial reviews, due diligence |
| **business_corporate/operations_reporting** | All-hands, status updates, executive briefings, post-mortems, vendor reviews, risk reviews, operational reviews |
| **business_corporate/people_culture** | Culture decks, DEI presentations, onboarding, org design, performance reviews, employer branding |
| **business_corporate/strategy_planning** | Product roadmaps, GTM strategy, competitive analysis, OKRs, business cases, scenario planning, SWOT |

### Sales & Marketing

| Category | When to use |
|---|---|
| **sales_marketing/marketing** | Brand presentations, campaign decks, product launches, marketing strategy, media kits, agency pitches |
| **sales_marketing/sales** | Sales pitch decks, product demos, proposals, case studies, customer QBRs, competitive battlecards, renewals |

### Fallback

| Category | When to use |
|---|---|
| **general-deck** | Anything that doesn't clearly fit a domain above — vague prompts, personal projects, educational content, general presentations |

## When to Suggest Switching

If the user's feedback or follow-up message suggests a different category would serve them better, mention it once:
- "This feels more like a sales pitch — want me to switch to the sales skill for better layout patterns?"
- "This looks like a board deck — want me to switch to the investment/finance skill?"

Do NOT switch automatically. Just suggest — the user decides.
