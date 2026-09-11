# Implementation Plan: CSV Spreadsheet View

**Branch**: `005-csv-spreadsheet-view` | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-csv-spreadsheet-view/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Replace `.csv`'s current plain-text rendering in the file viewer dialog (File Content
Viewer feature) with a spreadsheet-style grid: spreadsheet-style column letters (A, B, C,
...), the CSV's own first row shown as a distinguished, frozen header, and its remaining
rows numbered and rendered as data cells - all in the application's existing dark theme,
strictly read-only, with correct RFC-4180-style CSV quoting/escaping. This is entirely a
frontend change: the file's raw text is already fetched via the existing `/api/file/:tab`
endpoint (File Content Viewer feature); this feature only adds a new rendering mode for
it. It directly supersedes the "falls back to plain text" behavior that feature's own spec
explicitly flagged as deferred.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (unchanged).

**Primary Dependencies**: `papaparse` + `@types/papaparse` added as new devDependencies
(build-time only, bundled into `web/dist/`, same treatment as every other rendering
library in this project) for RFC-4180-correct CSV parsing (quoted commas, escaped quotes,
embedded newlines).

**Storage**: N/A - no backend or data-model changes; parsing happens client-side on text
the browser already has.

**Testing**: Node's built-in test runner for the CSV-parsing wrapper (`parseCsvGrid`) and
the column-letter algorithm (`columnLetter`) - this feature's core value proposition
(FR-006's correct quote/escape/newline handling) *is* parsing logic in the constitution's
own sense, so it gets fuller test-first coverage than a typical UI-only feature, not just
the usual thin sliver of pure logic. The grid's visual layout (sticky headers, dark theme,
column sizing) is still UI/rendering, manually verified per Principle V's carve-out
(`quickstart.md`).

**Target Platform**: Same as prior features - localhost server + full-size desktop
browsers only.

**Project Type**: Frontend-only extension of the existing `web/src/` tree - no backend
route changes.

**Performance Goals**: None mandated; per spec.md's Assumptions, no virtualization is
required and large-CSV performance is future work, consistent with the precedent already
set for the folder contents table.

**Constraints**: No editing capability of any kind (constitution Principle II); must
extend, not duplicate, the existing `getFileRenderMode`/`FileViewerDialog` dispatch
structure from the File Content Viewer feature rather than introducing a parallel one.

**Scale/Scope**: Same as prior features - tens to low thousands of files per project; no
specific row/column count target for an individual CSV.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved and clarified (`spec.md`) before this plan; every requirement traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes | Purely a new rendering mode for already-fetched text - no new route, no mutation capability of any kind. |
| III. Zero-Install, Local-First Operation | Yes | `papaparse` is a devDependency bundled at build time - no change to the published package's runtime dependencies or npx cold start. |
| IV. TypeScript CLI & Web Interface Standards | Yes | `parseCsvGrid`/`columnLetter` are plain, DOM-independent TypeScript functions, unit-testable without a browser. |
| V. Test-First for Parsing & Rendering Logic | Yes | Unlike features 002-004, this feature's core requirement (FR-006) *is* parsing logic per Principle V's main clause - `parseCsvGrid` gets full test-first coverage for quoting/escaping/embedded-newline/ragged-row cases, not just a thin pure-logic sliver alongside mostly-manual UI work. The grid's sticky/dark-theme layout remains manually verified. |

**Result**: PASS - no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts (`data-model.md`, `contracts/`,
`quickstart.md`) introduce no backend/API changes, no editing affordances, and no new
runtime dependency (papaparse stays build-time only). PASS confirmed unchanged.

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
web/
└── src/
    ├── csvGrid.ts                    # NEW - columnLetter(), parseCsvGrid() pure logic
    ├── fileRenderMode.ts               # MODIFIED - .csv now maps to a new "csv-grid" kind
    └── components/
        ├── FileViewerDialog.tsx         # MODIFIED - dispatches "csv-grid" to CsvGrid
        └── CsvGrid.tsx                   # NEW - the sticky-header spreadsheet grid

tests/
└── unit/
    └── web/
        ├── csvGrid.test.ts             # NEW
        └── fileRenderMode.test.ts       # MODIFIED - .csv case updated to expect csv-grid
```

**Structure Decision**: Extends the existing `web/src/` layering from features 002-004 -
`csvGrid.ts` follows the `sortEntries.ts`/`fileRenderMode.ts`/`navigationHistory.ts`
pattern (pure, DOM-independent logic pulled out for testability), and `CsvGrid.tsx` sits
alongside `FolderTree.tsx`/`ContentsTable.tsx`/`FileViewerDialog.tsx` as another
presentation component. No backend changes, no new top-level structure.

## Complexity Tracking

*No violations - Constitution Check passed cleanly, so this section is intentionally empty.*
