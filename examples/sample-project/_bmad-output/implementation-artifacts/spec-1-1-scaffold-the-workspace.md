---
title: "Scaffold the workspace"
type: "feature"
created: "2026-09-03"
status: "done"
baseline_commit: "1111111111111111111111111111111111111111"
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

# Spec 1-1 - Scaffold the workspace

## Intent

Create the Harbor CLI package layout, TypeScript strict config, and empty web shell so
later stories have a place to land.

## Acceptance

- `npm install` succeeds on Node 20+
- `tsx src/cli.ts --help` prints usage
- Web build emits `web/dist/`

</frozen-after-approval>
