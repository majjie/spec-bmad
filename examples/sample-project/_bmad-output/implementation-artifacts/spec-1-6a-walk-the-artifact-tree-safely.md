---
title: "Walk the artifact tree safely"
type: "feature"
created: "2026-09-05"
status: "done"
baseline_commit: "3333333333333333333333333333333333333333"
review_loop_iteration: 1
context: []
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

# Spec 1-6a - Walk the artifact tree safely

## Intent

Scan `_bmad` and `_bmad-output` into an in-memory hierarchy while skipping symlinks,
dot-folders, and `node_modules`.

## Acceptance

- Paths outside the tab root return 403
- Symlinked directories are not followed
- Refresh invalidates every cached root

</frozen-after-approval>
