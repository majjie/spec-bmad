---
title: "Harbor Architecture Spine (early)"
type: "architecture"
created: "2026-08-20"
status: "superseded"
---

# Architecture Spine - Harbor (2026-08-20)

Early spine sketch. Prefer the 2026-09-02 run for current decisions.

### AD-1 - Local-first CLI

Harbor runs as a localhost CLI that serves a static UI; no cloud API in v1.

### AD-2 - Artifact folders

Planning lives under `_bmad-output/planning-artifacts`; implementation under
`implementation-artifacts`.
