---
title: "Serve static UI"
type: "feature"
created: "2026-09-04"
status: "done"
baseline_commit: "2222222222222222222222222222222222222222"
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

# Spec 1-2 — Serve static UI

## Intent

Start a localhost HTTP server that serves the built UI and exposes read-only artifact
routes.

## Acceptance

- Server binds to `127.0.0.1` only
- `GET /` returns the built index
- Non-GET methods return 405

</frozen-after-approval>
