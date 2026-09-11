---
title: "Render sprint status"
type: "feature"
created: "2026-09-08"
status: "review"
baseline_commit: "5555555555555555555555555555555555555555"
review_loop_iteration: 1
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

# Spec 2-2 — Render sprint status

## Intent

Parse `sprint-status.yaml` into Summary, Action Items, and per-epic tiles with status
icons. Magnifying-glass opens matching `spec-<index>-*.md` files.

## Acceptance

- Active epic is the first `in-progress` epic
- Done action items sort below open ones
- Step `1-6a-…` matches `spec-1-6a-…` only

</frozen-after-approval>
