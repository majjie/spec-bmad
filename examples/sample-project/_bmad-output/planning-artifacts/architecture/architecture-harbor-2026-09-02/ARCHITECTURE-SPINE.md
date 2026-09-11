---
title: "Harbor Architecture Spine"
type: "architecture"
created: "2026-09-02"
status: "approved"
baseline_commit: "f0e1d2c3b4a5968778695a4b3c2d1e0f9a8b7c6d"
review_loop_iteration: 1
---

<frozen-after-approval reason="architecture intent locked for sprint 1–2">

# Architecture Spine - Harbor

Harbor is a read-only localhost console over BMAD planning and implementation artifacts.

## Decisions

### AD-1 - Local-first HTTP server

Bind exclusively to `127.0.0.1` with an OS-assigned port. The UI is a built static bundle
served by the same process as the artifact API.

### AD-2 - Curated Navigator vs raw explorers

Navigator exposes PRD, Architecture, and Sprint Status views. Infra and Output remain
faithful folder explorers over `_bmad` and `_bmad-output`.

### AD-3 - In-memory hierarchy cache

Folder trees are scanned once per root and cached until an explicit refresh. File contents
are never cached long-term; each open re-reads from disk.

### AD-12 - Path containment

Caller-supplied paths are rejected unless they fall under the active tab root. Binary files
return 415; unknown API verbs return 405.

## Cross-cutting notes

Inline mentions like AD-1 in running text are not indexed - only header-style codes above
appear in the requirement-code column.

| Layer | Technology |
| --- | --- |
| CLI / API | Node + TypeScript |
| UI | React + MUI |
| Spec process | Spec Kit / BMAD |

```typescript
export type TabId = "navigator" | "infra" | "output";
```

</frozen-after-approval>
