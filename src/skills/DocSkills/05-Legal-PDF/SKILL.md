---
name: doc-legal
description: >-
  Build professional 816x1056px HTML legal documents from any brief, template
  request, or agreement terms. Each section becomes a separate page created via
  the create_page tool. Designed for contracts, NDAs, service agreements, terms
  of service, privacy policies, MOUs, lease agreements, consulting agreements,
  employment agreements, waivers, and any document where precise legal structure,
  numbered clauses, and formal language are non-negotiable. Trigger when the user
  says draft a contract, create an NDA, write terms of service, privacy policy,
  agreement between, memorandum of understanding, or provides legal terms and asks
  for a formal agreement. Also handles PDF operations like merge, split, fill
  forms, OCR, encrypt. Uses a conservative legal design system with tight
  numbering hierarchy and signature blocks.
---


# Legal Document HTML Page Builder

## Before You Start

Read both reference files **in order** before writing any content:
1. `references/design-system.md` — Colors, typography, clause formatting, legal conventions
2. `references/page-library.md` — 7 page patterns for legal documents

**Do not begin building until you have read both files.**

**Important disclaimer:** The agent must include a disclaimer on every legal document stating it was AI-generated and should be reviewed by a qualified legal professional before execution.

## What This Skill Produces

Individual 816×1056px pages created via `create_page` tool calls — one per section.

## Pipeline

### Step 1: Analyze the Content
- **Document type** — NDA, service agreement, consulting agreement, terms of service, privacy policy, MOU, lease, employment agreement, waiver, partnership agreement
- **Parties** — who is entering this agreement (Party A, Party B — extract names)
- **Key terms** — term/duration, compensation, obligations, termination conditions, governing law
- **Jurisdiction** — which law governs; which courts have jurisdiction

### Step 2: Determine Required Clauses

Every legal document type has mandatory structural elements:

| Doc Type | Required Clauses |
|---|---|
| NDA | Recitals, Definitions, Confidential Information, Obligations, Exclusions, Term, Remedies, General Provisions, Signatures |
| Service Agreement | Recitals, Definitions, Scope of Services, Compensation, Term & Termination, IP Ownership, Confidentiality, Limitation of Liability, Indemnification, General Provisions, Signatures |
| Terms of Service | Acceptance, Definitions, Use License, User Obligations, Prohibited Conduct, IP, Disclaimers, Limitation of Liability, Termination, Governing Law, Changes, Contact |
| Privacy Policy | Information Collected, How Used, Sharing/Disclosure, Data Retention, Security, User Rights, Cookies, Children's Privacy, Changes, Contact |
| MOU | Purpose, Scope, Roles & Responsibilities, Duration, Confidentiality, Termination, Non-Binding Clause, Signatures |
| Employment Agreement | Position, Duties, Compensation, Benefits, Term, Termination, Confidentiality, Non-Compete, IP Assignment, Governing Law, Signatures |

### Step 3: Structure the Document

Legal documents use a strict **numbered hierarchy**:
```
1. ARTICLE TITLE (all caps, bold)
   1.1 Section (bold)
   1.1.1 Subsection (normal)
      (a) Sub-subsection
      (b) Sub-subsection
```

### Step 4: Build following page patterns from page-library.md

### Step 5: Legal Content Rules

- **Defined terms** are bold on first use and capitalized throughout: "**Confidential Information**"
- **WHEREAS** clauses (recitals) are italicized
- **Party references** use defined short names: "Company" and "Recipient" not full legal names after first use
- **Cross-references** use clause numbers: "as defined in Section 2.1" not "as defined above"
- **Signature blocks** include: name, title, company, date, signature line
- **ALL CAPS for article headings** — this is legal convention, not a design choice
- **No decorative elements** — legal documents are maximally conservative
- **Page numbers** in footer with "Page X of Y" format
- **Add AI disclaimer** in footer or before signature block

### Step 6: Validate Before Saving

**Legal-specific:**
- [ ] All articles numbered sequentially (1, 2, 3...)
- [ ] All sections numbered hierarchically (1.1, 1.2, 2.1...)
- [ ] Defined terms bold on first use, capitalized everywhere
- [ ] Recitals use WHEREAS format
- [ ] Signature blocks present for all parties
- [ ] Governing law / jurisdiction clause present
- [ ] Entire agreement / severability / waiver clauses present
- [ ] AI-generated disclaimer included
- [ ] Page numbers in "Page X of Y" format

### Step 7: Generate Pages

```
```

## Skill Files

```
SKILL.md                         ← You are here
references/design-system.md     ← Legal typography, clause formatting, conventions
references/page-library.md      ← 7 page patterns for legal documents
```
