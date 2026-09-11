---
title: "Sprint Status Workflow"
type: "workflow"
created: "2026-08-10"
status: "active"
---

# Sprint Status

Maintains `implementation-artifacts/sprint-status.yaml` as the single source of truth for
epic and story progress. The Harbor Navigator reads this file to render Summary, Action
Items, and per-epic status tiles.

## Steps

1. Update epic and story keys after each story merge
2. Mark retrospectives when an epic completes
3. Keep `action_items` in sync with open follow-ups
