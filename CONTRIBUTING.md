# Contributing to OpenSlide

Thanks for your interest in contributing. This document covers everything you need to get a PR merged.

---

## Getting Started

Clone the repo, set up your environment, and run locally following the steps in [README.md](README.md). Make sure the dev server runs cleanly before making any changes.

---

## Reporting Bugs

Open an issue and include:

- What you did (steps to reproduce)
- What you expected to happen
- What actually happened
- Your environment (OS, Node version, browser if relevant)
- Any error messages or screenshots

The more specific, the faster it gets fixed.

---

## Suggesting Features

Open an issue before writing any code. Describe the **problem** you're trying to solve, not the solution. This lets us align on whether it fits the project direction before anyone spends time building it.

Features that are clearly in scope:
- Improvements to the agent loop, tools, or skill system
- New slide/document output formats or themes
- Better integrations (MCP tools, connectors)
- Performance, UX, or accessibility improvements

Features that won't be accepted:
- Payment or billing systems
- Analytics or telemetry
- Anything that breaks self-hostability

---

## Submitting a Pull Request

### Process

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Open a PR against `main` with a clear description

### Branch naming

```
feat/your-feature-name
fix/what-youre-fixing
docs/what-youre-updating
chore/what-youre-doing
```

### PR rules

- **One thing per PR.** Don't bundle a bug fix with a refactor. Small, focused PRs get reviewed and merged faster.
- **Write a description.** Explain what the PR does and why. "Fixed bug" is not a description.
- **Don't break existing behaviour.** If your change is intentionally breaking, discuss it in an issue first.
- **No new dependencies without discussion.** Open an issue first if you need to add a package.

---

## Commit Messages

Use conventional commits:

```
feat: add new slide tool for X
fix: resolve canvas scaling issue on mobile
docs: update self-hosting instructions
chore: remove unused dependency
```

Keep the subject line under 72 characters. Use the body for context if needed.

---

## Code Style

- Follow the patterns already in the codebase — don't introduce new conventions
- Use CSS custom properties from `globals.css` — never hardcode colors
- Icons: `@hugeicons/react` only, always `weight="light"`
- Animations: `framer-motion` imported from `"framer-motion"` (not `"motion/react"`)
- No shadcn or external component libraries — all components are custom
- TypeScript strict — no `any` unless absolutely unavoidable

---

## Questions

Open an issue or reach out at tryopencomputer@gmail.com.
