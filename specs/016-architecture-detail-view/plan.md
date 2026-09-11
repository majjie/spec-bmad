# Implementation Plan: Architecture Detail View

**Branch**: `016-architecture-detail-view` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-architecture-detail-view/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Selecting an architecture leaf node currently shows only its bare folder name (feature
015's own deliberately minimal placeholder). This feature replaces that placeholder with a
new `ArchitectureDetailView.tsx`, structurally mirroring `PrdDetailView.tsx` (features
012/013) but narrower in scope per the feature description: it renders the folder's fixed
`ARCHITECTURE-SPINE.md` as formatted Markdown (frontmatter stripped, the same established
`FrontmatterInfoControl`), a right-hand requirement-code index column restricted to
heading-style codes only (never bullet-style), a "reviews" tile sourced from the folder's
own `reviews/` subfolder (not the folder directly), and a "memory log" tile reusing the
existing `MemoryLogDialog`/`parseMemlogEntries` verbatim with an always-empty
`prdReferences` array so no code ever renders as a link - and no "addendum" tile at all. No
backend changes are needed: every read goes through the same `GET /api/file/output` and
`GET /api/contents/output` routes PRD's own equivalent tiles already use.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (unchanged).

**Primary Dependencies**: None new. `react-markdown`/`remark-gfm` (already used by
`PrdDetailView.tsx`) render the document; `@mui/icons-material`'s `RateReview` and
`History` icons (already imported for PRD's own reviews/memory-log tiles) are reused
as-is - no `PostAdd` import, since no addendum tile exists here.

**Storage**: N/A - reads `ARCHITECTURE-SPINE.md` and `.memlog.md` via the existing
`GET /api/file/output` route (`fetchFileContentOrNull`), and both the leaf folder's own
contents and its `reviews` subfolder's contents via the existing `GET /api/contents/output`
route (`fetchContents`, called twice - once per listing) - all three already used by
`PrdDetailView.tsx`; no new route, no backend code touched at all.

**Testing**: Node's built-in test runner, extending the existing `prdIndex.test.ts`
(feature 012) with new cases for `buildRequirementCodeIndex`'s new optional `styles`
parameter - genuine derivation-logic under constitution Principle V's main clause.
`reviewFiles.ts`, `memlogParser.ts`, and `MemoryLogDialog.tsx` are reused completely
unmodified and already have full test-first coverage (feature 013); nothing new to test
there. `ArchitectureDetailView.tsx`'s layout and tile wiring are UI, manually verified per
the carve-out (`quickstart.md`).

**Target Platform**: Same as prior features - localhost server + full-size desktop
browsers only.

**Project Type**: Extends the existing single Node.js CLI + bundled web frontend -
frontend-only; no backend files touched, no new routes.

**Performance Goals**: None mandated - same scale assumptions as PRD's own equivalent view.

**Constraints**: Read-only (constitution Principle II) - every new interaction only ever
reads existing files through routes this tool already exposes. Must reuse, not duplicate,
`prdIndex.ts`/`reviewFiles.ts`/`memlogParser.ts`/`MemoryLogDialog.tsx`/
`FrontmatterInfoControl.tsx` rather than building parallel copies (Assumptions, spec.md).

**Scale/Scope**: Same as prior features.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved and clarified (`spec.md`) before this plan; every requirement traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes | Every new interaction reads through routes that already exist (`/api/contents`, `/api/file`) - no new write capability anywhere. |
| III. Zero-Install, Local-First Operation | Yes | No new dependency of any kind. |
| IV. TypeScript CLI & Web Interface Standards | Yes | `prdIndex.ts`'s modified `buildRequirementCodeIndex` remains a plain, DOM-independent TypeScript function, unit-testable without a browser. |
| V. Test-First for Parsing & Rendering Logic | Yes | The one genuine derivation-logic change (style-filtered code detection) gets test-first coverage extending `prdIndex.test.ts`. `ArchitectureDetailView.tsx`'s layout/tile wiring remain manually verified per the carve-out, exactly as `PrdDetailView.tsx` itself was. |

**Result**: PASS - no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts introduce no new dependency, no new route, and
no editing affordance - every change is a new read-only view over data this tool already
has access to, plus one narrowly-scoped, backward-compatible parameter addition to an
existing pure function. PASS confirmed unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/016-architecture-detail-view/
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
    ├── prdIndex.ts                      # MODIFIED - buildRequirementCodeIndex() gains an
    │                                     # optional `styles: RequirementCodeStyle[]`
    │                                     # parameter (default: `["bullet", "header"]`,
    │                                     # preserving every existing caller's behavior
    │                                     # unchanged) so a caller can restrict detection to
    │                                     # header-style only, without a second, duplicated
    │                                     # scan-and-sort function
    └── components/
        ├── ArchitectureDetailView.tsx   # NEW - the architecture leaf's own full-pane
        │                                 # view: fetches ARCHITECTURE-SPINE.md + the
        │                                 # folder's own contents + its "reviews"
        │                                 # subfolder's contents; renders Markdown with
        │                                 # only an h3 anchor-renderer override (no bullet-
        │                                 # style `strong` override - architecture never
        │                                 # detects that style at all); a requirement-code
        │                                 # index column built with `styles: ["header"]`;
        │                                 # a reviews tile (reusing `ReviewsTile`'s own
        │                                 # established shape, re-declared here since it's
        │                                 # `PrdDetailView`-local, not exported) fed the
        │                                 # "reviews" subfolder's own listing; a memory log
        │                                 # tile reusing `MemoryLogDialog` verbatim with a
        │                                 # `prdReferences={[]}` prop; no addendum tile
        └── NavigatorDetailPane.tsx      # MODIFIED - replaces the architecture leaf's bare
                                          # folder-name placeholder (feature 015) with
                                          # <ArchitectureDetailView>

tests/
└── unit/web/
    └── prdIndex.test.ts                # MODIFIED - new cases for the `styles` parameter
```

**Structure Decision**: `ArchitectureDetailView.tsx` is a new, separate sibling component to
`PrdDetailView.tsx` - not a generalized, parameterized version of it - matching this
project's demonstrated preference for small, explicit duplication over premature
abstraction (research.md § 1; the same call made for `ReviewsTile` vs. `PrefixTile` in
feature 013's own plan). The two views' tile rows differ in real, non-cosmetic ways (no
addendum tile at all; the reviews tile's source folder differs; the requirement-code index
is style-restricted), and PRD's own view is already load-bearing, tested-by-use code -
threading conditional branches through it for architecture's narrower needs would add
indirection to that existing component for no shared benefit, since nothing here is a third
consumer of any shared piece beyond what already *is* shared (`prdIndex.ts`,
`reviewFiles.ts`, `memlogParser.ts`, `MemoryLogDialog.tsx`, `FrontmatterInfoControl.tsx` -
every one of those is reused as-is, zero duplication, research.md §§ 2–4). `prdIndex.ts`
itself *is* modified rather than duplicated, because the alternative (a second
`buildHeaderOnlyRequirementCodeIndex` function) would fork the one piece of logic
(`collectMatches` + the shared sort) both features actually need identically - the
opposite situation from `ReviewsTile`/`ArchitectureDetailView`'s own layout code, which
share no meaningful implementation to fork in the first place.

## Complexity Tracking

*No violations - Constitution Check passed cleanly, so this section is intentionally empty.*
