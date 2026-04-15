---
name: business_corporate/operations_reporting
description: All-hands meetings, project status updates, executive briefings, vendor reviews, post-mortems
---

# Operations & Reporting Presentations

Clear, action-oriented decks for operational audiences — program managers, executives, and cross-functional teams. The goal is to communicate status, surface blockers, and align on next steps. Every slide should answer: "What happened? What's the status? What do we do next?"

## Tone

Clear, direct, action-oriented. No corporate filler. State the status plainly — "Off track due to vendor delay" not "experiencing some challenges." Use active voice and present tense for status, past tense for completed items. Brevity is a virtue: one insight per bullet point, one topic per slide.

## Design

Use the Corporate design system (see `../shared/design-system.md`). Status indicators (On Track / At Risk / Off Track) must always use the pill badge pattern with correct colors. Owner names must always be present. Progress bars on workstream rows are mandatory.

## Pattern Priorities

1. **Status Dashboard** (Pattern 8) — for program/project status, OKR reviews, weekly updates
2. **Action Items** (Pattern 12) — to close every update meeting, always last slide
3. **Process Steps** (Pattern 9) — for workflows, escalation paths, methodology changes
4. **KPI Scorecard** (Pattern 2) — for operational metrics dashboards, SLA reviews
5. **Quarterly Roadmap** (Pattern 6) — for project timelines, initiative tracking
6. **3-Column Strategic Pillars** (Pattern 4) — for all-hands agenda, department goals
7. **Dark Stat Band + Context** (Pattern 3) — for post-mortems, incident reviews, results summaries

## Content Rules

- **Every status update needs an owner and a date**: Not "in progress" — always "In Progress · J. Martinez · Due Apr 30". No ownerless action items.
- **Blockers need an impact statement**: Not "blocked by vendor" — always "Blocked by vendor contract delay — risk: 3-week slip, $120K cost overrun". The impact forces accountability.
- **Always end with next steps**: The last slide is always Action Items (Pattern 12). Never end on a status slide.
- **Progress bars must be accurate**: If a project is 45% complete, the bar shows 45% — never round to look better. Credibility comes from accuracy.
- **Off Track items need a resolution path**: An Off Track badge without a recovery plan is incomplete. Add at least one sentence: "Recovery plan submitted — needs exec approval by Friday."
- **Use 3 status levels only**: On Track (green), At Risk (amber), Off Track (red). Never invent custom statuses.
- **Percentages for progress, dates for milestones**: "72% complete, due Jun 30" — both are required.
- **Escalations must be flagged visually**: If something requires action from the audience, use a red Off Track badge or a bolded "Action Required" label. Don't bury escalations in body text.
- **Post-mortems**: Always include root cause (not symptoms), contributing factors, and specific process changes — not vague "improvements to communication."

## Slide-by-Slide Guidance

### Weekly/Monthly Status Update (6–8 slides)
1. Cover (Pattern 1) — program name, date, meeting type
2. Executive Summary (Pattern 3: Dark Stat Band) — 3 headline stats: % on track, items at risk, items complete
3. Workstream Status (Pattern 8: Status Dashboard) — all workstreams, RAG, owner, progress, update
4. Deep Dive: At Risk Items (Pattern 4: 3-Column Pillars) — each at-risk item gets a pillar: issue, impact, mitigation
5. Upcoming Milestones (Pattern 6: Roadmap) — next 4–6 weeks
6. Action Items (Pattern 12) — every action with owner, date, priority

### All-Hands Meeting (8–12 slides)
1. Cover (Pattern 1) — company/team name, date, leader name
2. Company Scorecard (Pattern 2: KPI Scorecard) — 4 company-level metrics
3. Strategy Recap (Pattern 4: 3-Column Pillars) — 3 strategic priorities
4. Department Updates (Pattern 8: Status Dashboard) — each department as a row with status
5. Key Win / Highlight (Pattern 3: Dark Stat Band) — one big accomplishment to celebrate
6. Challenges & What We're Doing (Pattern 4: 3-Column Pillars) — challenge, root cause, action
7. What's Next (Pattern 6: Roadmap) — next quarter focus
8. Shoutouts / Recognition (Pattern 10: Quote) — employee quote or customer quote
9. Q&A / Action Items (Pattern 12)

### Post-Mortem (8–10 slides)
1. Cover (Pattern 1) — incident name, date, severity label
2. Incident Summary (Pattern 3: Dark Stat Band) — duration, impact (users, revenue), MTTR
3. Timeline (Pattern 9: Process Steps) — detection → diagnosis → resolution → recovery
4. Root Cause Analysis (Pattern 4: 3-Column Pillars) — primary cause, contributing factors, systemic issue
5. Impact Assessment (Pattern 2: KPI Scorecard) — users affected, revenue impact, SLA breach
6. What Went Well (Pattern 4: 3-Column Pillars)
7. What Went Wrong (Pattern 4: 3-Column Pillars)
8. Remediation Plan (Pattern 8: Status Dashboard) — action items with owners and dates
9. Action Items (Pattern 12) — formal close with owners

### Vendor Review (8–10 slides)
1. Cover (Pattern 1)
2. Scorecard (Pattern 2: KPI Scorecard) — SLA performance, cost, NPS
3. SLA Trend (Pattern 7: Bar Chart) — trailing 6 months
4. Issues Log (Pattern 8: Status Dashboard) — open issues with status
5. Comparison (Pattern 5: Comparison Table) — current vendor vs. alternatives if at risk
6. Renewal / Escalation Recommendation (Pattern 3: Dark Stat Band) — recommendation + rationale
7. Action Items (Pattern 12)
