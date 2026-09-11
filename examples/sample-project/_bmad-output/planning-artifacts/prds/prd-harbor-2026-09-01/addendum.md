---
title: "Harbor PRD Addendum"
type: "addendum"
created: "2026-09-01"
status: "draft"
---

# Addendum — Harbor PRD (2026-09-01)

## Clarifications after adversarial review

1. **FR-12** applies to the console process itself; CI bots remain free to write reports
   into `_bmad-output` as they do today.
2. Experimental tier counts include private forks only when the operator opts in.
3. Token drift thresholds default to ±2% of the brand primitive; per-brand overrides live
   in project config, not in this PRD.
