# Implementation Plan: Architecture Tree

**Branch**: `015-architecture-tree` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-architecture-tree/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

The Navigator tree gains an "Architecture" grouping, positioned after "PRD" and before
"Sprint Status," organizing `_bmad-output/planning-artifacts/architecture/`'s subfolders by
project and date exactly the way the PRD tree already does - because the underlying
grouping logic (`groupPrdFolders`, feature 006) is already fully generic (it takes a plain
list of folder names/paths, with no PRD-specific behavior at all), this is a matter of
calling that same, already-tested function a second time against a different folder, not
building new grouping logic. Selecting an architecture leaf shows its bare folder name in
the right-hand pane - a deliberately minimal placeholder, mirroring how the PRD tree's own
leaf view looked before feature 012 built it out further. The one genuine integration
point this plan must get right: feature 014's refresh handler currently only re-checks
whether a selected *PRD* leaf still exists after invalidating the cache - it must be
extended to check architecture leaves too, or refreshing while an architecture folder is
selected would incorrectly reset the selection every time.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (client), Node.js ≥20 (server) - both unchanged.

**Primary Dependencies**: None new.

**Storage**: N/A - reads the already-cached `_bmad-output` artifact tree
(`HierarchyCache`, feature 001) the "output" tab's own tree route and `/api/navigator/tree`
already share; no new scan, no new cache entry.

**Testing**: No new pure derivation logic - `groupPrdFolders` (feature 006) is reused
unmodified and is already fully unit-tested. This feature adds one new integration test to
`tests/integration/web-server.test.ts` (the first direct test coverage `/api/navigator/tree`
gains for its architecture-specific wiring) and manual `quickstart.md` verification for the
tree's rendering and the feature-014 selection-preservation fix, per constitution Principle
V's UI-rendering carve-out.

**Target Platform**: Same as prior features - localhost server + full-size desktop
browsers only.

**Project Type**: Extends the existing single Node.js CLI + bundled web frontend - a small
backend addition (one more grouped folder in the existing Navigator-tree route) plus
frontend tree/dispatch wiring.

**Performance Goals**: None mandated - reuses an already-cached tree; no new scan.

**Constraints**: Read-only (constitution Principle II) - purely a new read/display path
over data this tool already scans; no write capability anywhere.

**Scale/Scope**: Same as prior features.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved and clarified (`spec.md`, zero ambiguities) before this plan; every requirement traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes | Purely a new read/display path over the already-cached artifact tree - no new write capability anywhere. |
| III. Zero-Install, Local-First Operation | Yes | No new dependency of any kind. |
| IV. TypeScript CLI & Web Interface Standards | Yes | The generalized `findFolderEntry` helper (research.md § 3) remains a plain, DOM-independent TypeScript function. |
| V. Test-First for Parsing & Rendering Logic | Yes | No new derivation logic - `groupPrdFolders` is reused unmodified and already has full test-first coverage (feature 006). The route's own thin wiring gets a new integration test (research.md § 4), since none existed for it before. Tree rendering and dispatch are UI, manually verified per the carve-out. |

**Result**: PASS - no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts introduce no new dependency, no new route, and
reuse existing derivation logic unmodified. PASS confirmed unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/015-architecture-tree/
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
    ├── types.ts                        # MODIFIED - NavigatorTree gains
    │                                     # `architecture: PrdGroupingResult | null`
    │                                     # (reusing the existing, already-generic type)
    └── routes/
        └── navigator-tree.ts           # MODIFIED - looks up
                                          # planning-artifacts/architecture the same way it
                                          # already looks up planning-artifacts/prds, and
                                          # calls the existing groupPrdFolders() again

web/
└── src/
    ├── api.ts                          # MODIFIED - client NavigatorTree gains the same
    │                                    # `architecture` field
    ├── navigatorApi.ts                 # MODIFIED - generalizes findPrdFolderEntry into
    │                                    # findFolderEntry(grouping, itemId), taking a
    │                                    # PrdGroupingResult directly rather than a whole
    │                                    # NavigatorTree, so it serves both PRD and
    │                                    # architecture lookups without duplicating the
    │                                    # traversal logic
    ├── App.tsx                         # MODIFIED - auto-expands "architecture" alongside
    │                                    # "prd" on load; its refresh handler (feature 014)
    │                                    # now checks *both* tree.prd and tree.architecture
    │                                    # before resetting the Navigator selection -
    │                                    # closing a real gap the original refresh handler
    │                                    # would otherwise have against this new grouping
    └── components/
        ├── NavigatorTree.tsx           # MODIFIED - renders an "Architecture" root
        │                                # (between "PRD" and "Sprint Status"),
        │                                # structurally identical to the PRD root's own
        │                                # JSX
        ├── NavigatorView.tsx           # MODIFIED - isStructuralOnly() also recognizes
        │                                # "architecture"/"architecture:*" itemIds
        └── NavigatorDetailPane.tsx     # MODIFIED - after the existing PRD-leaf check,
                                         # also checks for an architecture-leaf match and
                                         # renders its bare folderName the same way

tests/
└── integration/
    └── web-server.test.ts             # MODIFIED - extends the existing
                                         # `/api/navigator/tree` coverage with an
                                         # architecture-grouping case
```

**Structure Decision**: `groupPrdFolders` and its `PrdGroupingResult`/`PrdDateEntry`/
`PrdProjectGroup`/`PrdNonConformingEntry` types (feature 006) are reused **unmodified, and
unrenamed**, for architecture data too - a deliberate choice (research.md § 2): the
underlying shape and algorithm are already fully generic, and a broad rename to
artifact-agnostic names would ripple across a dozen+ already-shipped files (features
006–014) for a purely cosmetic gain, which this project's own established preference for
minimal-footprint changes over speculative refactors argues against. The one real,
non-cosmetic change on the client is generalizing `findPrdFolderEntry` into
`findFolderEntry(grouping, itemId)` (research.md § 3) - justified because it now serves a
genuine second consumer (architecture lookups) and, more importantly, fixes a real gap in
feature 014's own refresh handler, which today only re-validates a selected *PRD* leaf
after a refresh.

## Complexity Tracking

*No violations - Constitution Check passed cleanly, so this section is intentionally empty.*
