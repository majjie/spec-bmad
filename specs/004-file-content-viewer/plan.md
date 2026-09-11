# Implementation Plan: File Content Viewer

**Branch**: `004-file-content-viewer` | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-file-content-viewer/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Double-clicking a file row opens a full-screen (20px-bordered) modal showing that file's
contents: Markdown rendered as HTML, `.yaml`/`.toml`/`.py` syntax-highlighted, everything
else as plain monospace text with line numbers. This is the first feature since 001 that
reads file *contents* - a new `GET /api/file/:tab?path=...` endpoint (reusing feature
002's path-containment check) reads and returns a file's text, rejecting anything that
looks binary. The frontend extends feature 003's browser-history navigation so the dialog
is itself a navigable step: opening pushes an entry, and closing - by the "X" icon,
Escape, or Back - always routes through `history.back()`, per the Clarifications session,
so history never falls out of sync with what's visible.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (unchanged); Node.js ≥20 LTS server
(unchanged).

**Primary Dependencies**: New devDependencies (build-time only, bundled into `web/dist/`,
same treatment as MUI in features 002/003): `react-markdown` + `remark-gfm` (Markdown → HTML,
with GitHub-flavored tables/checkboxes support); `react-syntax-highlighter` (+ its
`@types/react-syntax-highlighter`) for both syntax-highlighted *and* plain
line-numbered-monospace rendering (research.md § 4). No new runtime dependency for the
published package; no new backend dependency (binary detection is a small buffer scan, no
library needed).

**Storage**: N/A - still no persistence; the new endpoint reads a file's bytes directly
from disk on each request, no caching added (files aren't expected to be large or read
repeatedly in a tight loop for this feature).

**Testing**: Node's built-in test runner for the new server-side route (binary detection,
containment reuse) and the new pure `getFileRenderMode` function (constitution Principle
V's main clause); manual verification in a running browser for the modal, its rendering
modes, and its history integration (Principle V's UI-rendering carve-out), documented in
`quickstart.md`.

**Target Platform**: Same as prior features - localhost server + full-size desktop
browsers only.

**Project Type**: Extends the existing single-package web application - one new backend
route file, one new frontend component (the dialog), plus targeted extensions to
`web/src/App.tsx` and `web/src/navigationHistory.ts`.

**Performance Goals**: None mandated; per spec.md's Assumptions, no size limit is imposed
and large-file performance is explicitly deferred as future work.

**Constraints**: The new endpoint MUST reuse feature 002's server-side path-containment
check (constitution Principle II/S1 finding from feature 002's analysis) - a file read is
a strictly more sensitive operation than a directory listing, so this is non-negotiable,
not just a nice-to-have; MUST reject binary content rather than serving mangled bytes;
MUST NOT add any write/mutation capability (constitution Principle II).

**Scale/Scope**: Same as prior features - tens to low thousands of files per project, no
individual file assumed enormous.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved and clarified (`spec.md`) before this plan; every requirement traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes | Serving a file's *contents* for display is still "rendering", not mutating (no write/rename/delete capability added) - first feature to read content rather than just structure, but the read-only boundary is unchanged. The new endpoint reuses feature 002's path-containment check, extended to files, so it can't read outside the resolved project. |
| III. Zero-Install, Local-First Operation | Yes | New frontend libraries are devDependencies bundled at build time - no change to the published package's runtime dependencies or npx cold start. |
| IV. TypeScript CLI & Web Interface Standards | Yes | The new route handler (`src/server/routes/file.ts`) and `getFileRenderMode` are plain, UI-independent TypeScript functions, unit-testable without a browser. |
| V. Test-First for Parsing & Rendering Logic | Yes | Server route logic (containment reuse, binary detection) and `getFileRenderMode` get tests written first; the modal itself, its three rendering modes, and its history integration are UI/rendering, manually verified per Principle V's explicit carve-out (`quickstart.md`). |

**Result**: PASS - no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts (`data-model.md`, `contracts/`,
`quickstart.md`) introduce no write/mutation route (the new `/api/file/:tab` is GET-only),
reuse rather than duplicate feature 002's containment check, and add no new runtime
dependency. PASS confirmed unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
└── server/
    └── routes/
        └── file.ts               # NEW - GET /api/file/:tab route + binary detection

web/
└── src/
    ├── fileRenderMode.ts          # NEW - pure getFileRenderMode(filename) decision logic
    ├── navigationHistory.ts        # MODIFIED - NavigationState gains optional `openFile`
    ├── App.tsx                     # MODIFIED - openFileDialog/closeFileDialog, popstate handling
    └── components/
        ├── ContentsTable.tsx        # MODIFIED - double-click handler on file rows
        └── FileViewerDialog.tsx      # NEW - the full-screen modal + its 3 rendering modes

tests/
└── unit/
    ├── server/
    │   └── file.test.ts            # NEW
    └── web/
        └── fileRenderMode.test.ts  # NEW
```

**Structure Decision**: Extends the existing layering from features 002/003 - a new
`src/server/routes/file.ts` alongside `tabs.ts`/`tree.ts`/`contents.ts`, and a new
`FileViewerDialog.tsx` alongside `FolderTree.tsx`/`ContentsTable.tsx`. `fileRenderMode.ts`
follows the `sortEntries.ts`/`navigationHistory.ts` pattern: pure, DOM-independent
decision logic pulled out for testability, with actual rendering left to the component.
No new top-level structure.

## Complexity Tracking

*No violations - Constitution Check passed cleanly, so this section is intentionally empty.*
