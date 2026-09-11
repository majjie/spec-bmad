---
title: "Boundaries Review"
type: "review"
created: "2026-09-02"
status: "complete"
---

# Review - Boundaries

## Confirmed

- **AD-1** and **AD-12** together prevent accidental network exposure of project files.
- Cache invalidation (**AD-3**) is user-initiated only; no file watchers in v1.

## Follow-ups

- Document refresh behaviour in the operator runbook.
- Consider a future “watch mode” behind an explicit flag (out of spine scope).
