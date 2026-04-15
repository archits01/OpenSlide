#!/bin/bash
# Lint SKILL.md files for hardcoded hex colors that should be CSS variables.
# These 7 hex values have direct CSS variable mappings and should NEVER appear
# in HTML template examples inside skill files.
#
# Usage: bash src/skills/lint-skill-colors.sh

FORBIDDEN_HEX=(
  "#15803D"   # should be var(--slide-accent)
  "#4ADE80"   # should be var(--slide-accent)
  "#0F172A"   # should be var(--slide-text)
  "#F8FAFC"   # should be var(--slide-bg)
  "#1E293B"   # should be var(--slide-dark)
  "#94A3B8"   # should be var(--slide-secondary)
  "#E2E8F0"   # should be var(--slide-border)
  "#CBD5E1"   # should be var(--slide-border)
)

found=0
for hex in "${FORBIDDEN_HEX[@]}"; do
  # Skip documentation table rows (lines with |) and "Never use" examples
  matches=$(grep -rni "$hex" src/skills/ --include="*.md" 2>/dev/null | grep -v '|' | grep -v 'Never use' | grep -v 'Opacity-based')
  if [ -n "$matches" ]; then
    echo "VIOLATION: $hex found in skill files (should use CSS variable):"
    echo "$matches" | head -10
    echo ""
    found=1
  fi
done

if [ $found -eq 0 ]; then
  echo "All clear — no forbidden hardcoded hex colors found in skill files."
  exit 0
else
  echo "Fix: Replace hardcoded hex values with CSS variables (var(--slide-accent), etc.)"
  exit 1
fi
