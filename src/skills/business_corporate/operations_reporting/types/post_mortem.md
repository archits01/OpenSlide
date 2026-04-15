# Post-Mortem / Retrospective Presentation

**What it is:** A structured analysis of what went wrong (or what could have gone better) after an incident, project failure, or significant miss — with root cause analysis and process changes.

---

## Audience
Leadership team, engineering and ops leads, and relevant stakeholders. Audience wants to understand the full picture and leave with confidence that lessons are being applied. Blameless culture is essential.

## Tone
Analytical, honest, and constructive. Post-mortems should be blameless — the goal is to improve systems, not assign fault. Acknowledge the impact directly, then focus on systemic root causes and concrete fixes.

---

## Slide Structure

1. **Cover** — Incident/event name, date, presenter, severity level
2. **Summary** — What happened, when, what was impacted, current status.
3. **Timeline** — Minute-by-minute or hour-by-hour: detection, escalation, mitigation, resolution.
4. **Impact** — Quantified: downtime, customers affected, revenue impact, SLA breach.
5. **Root Cause Analysis** — The 5 Whys or equivalent. What was the systemic cause?
6. **What Went Well** — Even in a failure, what worked? Detection speed, escalation, communication.
7. **What Went Wrong** — Specific process or system failures. Blameless framing.
8. **Contributing Factors** — Circumstances that made this worse (existing tech debt, staffing gap, etc.).
9. **Action Items** — Specific fixes: what, who owns it, deadline. Not vague recommendations.
10. **Process Changes** — Longer-term systemic improvements. Timeline to implement.
11. **Communication to Customers / Stakeholders** — What was communicated, when, and how.

---

## Must-Have Elements
- Quantified impact — downtime, customers affected, revenue
- Blameless framing throughout — never name individuals as the cause
- Root cause analysis (5 Whys or similar) — not just proximate cause
- Concrete action items with owners and deadlines
- What went well — post-mortems should also capture resilience, not just failure
- Timeline that's accurate and agreed by all parties

## Must-Avoid
- Post-mortems that assign individual blame
- Root cause identified as "human error" without asking why the human could make that error
- Action items without owners and dates
- Glossing over impact — quantify it, even if it's painful
- Post-mortems that result in no process change

---

## Key Data Points to Include
- Downtime or incident duration (minutes/hours)
- Customers or users affected (number or %)
- Revenue impact (if calculable)
- Time to detection and time to resolution
- Number of action items: total, immediate, long-term
- SLA breach: yes/no and severity

---

## Example Outline (Service Outage Post-Mortem)

1. Post-Mortem: Payment Processing Outage — March 14, 2025 (P1)
2. Summary: 94-Minute Outage, 2,400 Customers Affected, Now Resolved
3. Timeline: From First Alert to Full Recovery
4. Impact: $180K Revenue Delayed, 3 SLA Breaches, 14 Customer Complaints
5. Root Cause: Database Connection Pool Exhaustion Under Traffic Spike
6. What Went Well: Alert Fired in 4 Minutes, Runbook Followed
7. What Went Wrong: No Circuit Breaker, Runbook Outdated
8. Contributing Factors: Known Tech Debt in Connection Pool Config
9. Action Items: 8 Items, Owners, Deadlines
10. Process Changes: Runbook Review, Load Testing Protocol
11. Customer Communication: What We Sent and When
