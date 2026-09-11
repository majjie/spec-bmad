---
title: "Architecture detail view"
type: "feature"
created: "2026-09-09"
status: "in-progress"
baseline_commit: "6666666666666666666666666666666666666666"
review_loop_iteration: 0
context: []
---

# Spec 2-3 — Architecture detail view

## Intent

Selecting an architecture leaf renders `ARCHITECTURE-SPINE.md` with a header-only
requirement-code index and reviews loaded from `reviews/`.

## Acceptance

- Missing spine shows a calm empty message
- Reviews come from the folder's `reviews/` subfolder
- Memlog codes render as plain text (not PRD links)

## Remaining work

- Polish empty-state copy
- Wire magnifying-glass from sprint steps when specs mention architecture ADs
