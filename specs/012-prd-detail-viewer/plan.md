# Implementation Plan: PRD Detail Viewer

**Branch**: `012-prd-detail-viewer` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-prd-detail-viewer/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Selecting a PRD leaf node in the Navigator tree currently shows only its bare folder
name. This feature replaces that placeholder with a full, non-modal view of that folder's
`prd.md`: three inert placeholder tiles along the top; below them, the Markdown content
(frontmatter stripped, same as the existing file viewer) filling most of the pane, with
the same established (i) info control in its top-right corner but no close control; and,
structurally separate from that scrollable content - never scrolling away with it - a
column of small tiles, one per unique requirement-code prefix detected in the document
(e.g. "FR", "UJ", "NFR"). Hovering a prefix tile reveals every code under it, in numerical
order, full code text shown; selecting one scrolls the document to it. No backend changes
are needed at all: the folder path is already known from the existing Navigator tree data
(feature 006), and its `prd.md` content is fetched via the Output tab's existing file
route, the same way an action item's or a step's spec document already is (features
008/009).

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (unchanged).

**Primary Dependencies**: None new. `react-markdown`/`remark-gfm` (already used by
`FileViewerDialog.tsx`) render the PRD content, with custom per-element renderers to
attach scroll-anchor `id`s to detected requirement codes. Icons for the three placeholder
tiles come from the already-installed `@mui/icons-material` (`RateReview` for "reviews",
already used by `SprintStatusView.tsx`'s status icons; `PostAdd` for "addendum"; `History`
for "memory log").

**Storage**: N/A - reads `prd.md` via the same `GET /api/file/output` route the Infra/
Output tabs and every prior Navigator-opened-file feature (008, 009) already use; no new
route, no new backend code at all.

**Testing**: Node's built-in test runner for the new requirement-code detection module
(`buildRequirementCodeIndex`, its numeric grouping/sorting) - genuine parsing/derivation
logic under constitution Principle V's main clause, following `stripFrontmatter`/
`deriveStepDisplay`'s own precedent. The anchor-assignment renderer overrides, the
layout, and the tooltip's hover/click/scroll interaction are UI/rendering, manually
verified per the carve-out (`quickstart.md`).

**Target Platform**: Same as prior features - localhost server + full-size desktop
browsers only.

**Project Type**: Extends the existing single Node.js CLI + bundled web frontend -
frontend-only; no backend files touched, no new routes.

**Performance Goals**: None mandated - a PRD's content is fetched and scanned once per
selection, consistent with this app's established scale assumptions (tens of thousands of
words, not megabytes).

**Constraints**: Read-only (constitution Principle II) - this feature only ever reads
`prd.md` through the existing file route; no new write path. Must reuse, not duplicate,
the existing frontmatter-stripping (`frontmatter.ts`, feature 010) and file-fetch
mechanisms rather than building parallel ones.

**Scale/Scope**: Same as prior features.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved and clarified (`spec.md`) before this plan; every requirement traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes | Purely a new read/display path over already-existing Navigator tree data and the already-existing Output file route - no new write capability anywhere. |
| III. Zero-Install, Local-First Operation | Yes | No new dependency of any kind. |
| IV. TypeScript CLI & Web Interface Standards | Yes | `buildRequirementCodeIndex` is a plain, DOM-independent TypeScript function, unit-testable without a browser, alongside `stripFrontmatter`/`deriveStepDisplay`. |
| V. Test-First for Parsing & Rendering Logic | Yes | Requirement-code detection (both styles) and its numeric grouping are genuine derivation logic - full test-first coverage. The anchor-rendering, layout, and tooltip interaction remain manually verified per the carve-out. |

**Result**: PASS - no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts introduce no new dependency, no new route, and
no editing affordance - every change is a new read-only view over data this tool already
has access to. PASS confirmed unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/012-prd-detail-viewer/
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
    ├── api.ts                          # MODIFIED - adds fetchFileContentOrNull(), a
    │                                    # narrowly-scoped sibling to the existing
    │                                    # fetchFileContent() that resolves to null on a
    │                                    # 404 instead of throwing, so PrdDetailView can
    │                                    # distinguish "no prd.md here" (FR-004) from a
    │                                    # genuine fetch error (research.md § 7) without
    │                                    # changing fetchFileContent's existing callers
    ├── prdIndex.ts                     # NEW - RequirementCodeReference type,
    │                                    # buildRequirementCodeIndex(), groupByPrefix()
    └── components/
        ├── FrontmatterInfoControl.tsx  # NEW - the (i) icon + controlled tooltip +
        │                                # key/value readout, extracted from
        │                                # FileViewerDialog.tsx so both it and the new
        │                                # PrdDetailView share one implementation
        ├── FileViewerDialog.tsx        # MODIFIED - uses the extracted
        │                                # FrontmatterInfoControl instead of its own
        │                                # inline copy; no behavior change
        ├── PrdDetailView.tsx           # NEW - the non-modal PRD pane: placeholder
        │                                # tiles row, Markdown content (with anchor
        │                                # renderer overrides + FrontmatterInfoControl,
        │                                # no close control), and the prefix-tile index
        │                                # column
        └── NavigatorDetailPane.tsx     # MODIFIED - renders PrdDetailView for a PRD
                                         # leaf selection instead of today's bare
                                         # folder-name text

tests/
└── unit/web/
    └── prdIndex.test.ts               # NEW
```

**Structure Decision**: `prdIndex.ts` is a new sibling to `frontmatter.ts` in
`web/src/` - its own distinct piece of derivation logic, mirroring how that file already
sits alongside `fileRenderMode.ts`. `FrontmatterInfoControl.tsx` is extracted because,
unlike prior features' single-use UI pieces, this one is now needed *identically* by two
call sites (`FileViewerDialog.tsx` and the new `PrdDetailView.tsx`) - a genuine second
consumer, not a hypothetical one, which is exactly the point at which this project's
existing style (small, file-local pieces over premature shared abstractions) calls for
extracting a shared component instead of duplicating it. `PrdDetailView.tsx` is a new
top-level component (not folded into `NavigatorDetailPane.tsx`) matching the existing
pattern where `SprintStatusView.tsx` is its own file rather than inlined there too.

## Complexity Tracking

*No violations - Constitution Check passed cleanly, so this section is intentionally empty.*
