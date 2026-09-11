# Implementation Plan: Output Navigator Tab

**Branch**: `006-output-navigator` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-output-navigator/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a third tab ("Navigator"), shown before "Infra" and "Output" and only when
`_bmad-output` exists, with a left-hand tree of curated views rather than raw folders: a
"PRD" root grouping `planning-artifacts/prds` subfolders by project and date (newest
first), and a "Sprint Status" root (shown only when `sprint-status.yaml` exists) whose
detail pane renders a Summary tile plus one Status tile per epic. This is a genuinely new
view model, not an extension of the existing folder-tree/contents-table pattern: its tree
has multiple roots and non-folder node kinds, and its detail pane shows structured,
derived data rather than a folder listing. It gets its own frontend components and its own
backend routes, alongside - not inside - the existing generic tab infrastructure.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18, Node.js ≥20 (unchanged).

**Primary Dependencies**: `js-yaml` (new) to parse `sprint-status.yaml` server-side - this
project's **first genuine runtime dependency** (every prior dependency is a devDependency
bundled into the static web build or used only at build/test time). js-yaml v5 ships its
own TypeScript types (no separate `@types/` package needed) and its `load()` API is
safe-by-default (unlike pre-v4 `js-yaml`, which required explicitly calling `safeLoad`).
Everything else (grouping logic, tree/detail-pane components) is plain TypeScript/React,
no new libraries.

**Storage**: N/A - reads existing files/folders under the resolved project's
`_bmad-output`; no new storage or persistence of any kind.

**Testing**: Node's built-in test runner for the two genuine parsing/derivation functions
this feature introduces - `groupPrdFolders` (folder-name list → project/date tree,
FR-005–FR-008) and `parseSprintStatus` (parsed-YAML object → Summary + epic/story/
retrospective groups, FR-012–FR-015) - both are exactly the kind of logic constitution
Principle V's main clause targets, following feature 005's `parseCsvGrid` precedent, not
just its UI-carve-out. New route handlers get integration-level HTTP contract tests
(matching `tests/integration/web-server.test.ts`'s existing coverage of `/api/tree`,
`/api/contents`, `/api/file`). The tree/detail-pane React components are UI/rendering,
manually verified per the carve-out.

**Target Platform**: Same as prior features - localhost server + full-size desktop
browsers only.

**Project Type**: Extension of the existing single Node.js CLI + bundled web frontend -
new backend routes, new frontend components, no new services or processes.

**Performance Goals**: None mandated. PRD grouping and sprint-status parsing both run
against small, in-memory data (a folder-name list and one YAML file) well within the
existing app's established performance envelope; no specific target needed.

**Constraints**: No editing capability of any kind (constitution Principle II) - this
tab only ever reads and displays. Must not force the Navigator tab's fundamentally
different tree/detail-pane shape into the existing `FolderTreeNode`/`ContentsEntry`
generic-tab abstraction; it gets its own types and components instead of contorting that
one (see Project Structure).

**Scale/Scope**: Same as prior features - tens to low thousands of files per project; no
specific PRD-folder-count or epic-count target for an individual project.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved and clarified (`spec.md`) before this plan; every requirement traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes | Purely new read/display views over already-existing `_bmad-output` files - no new route, capability, or code path writes to the target project directory. |
| III. Zero-Install, Local-First Operation | Yes, with a noted first - | `js-yaml` is a genuine runtime dependency (unlike every prior library, which is a devDependency bundled at build time), which is a real change to this project's dependency footprint. Justified: correctly parsing arbitrary real-world YAML (quoted scalars, block styles, embedded comments - all present in the actual sample data) is exactly the kind of thing this project's own constitution warns against hand-rolling (Principle V's rationale: "hand-written... parsing is the part of this system most likely to break silently on template drift"), and js-yaml is small, mature, and safe-by-default in the version used. Still runs fully offline once installed, still binds to localhost only - no other Principle III guarantee is affected. |
| IV. TypeScript CLI & Web Interface Standards | Yes | `groupPrdFolders`/`parseSprintStatus` are plain, DOM-independent TypeScript functions, unit-testable without a browser, matching the existing artifact-parsing layer's separation from the web UI. |
| V. Test-First for Parsing & Rendering Logic | Yes | Both new pure functions are genuine parsing/derivation logic under Principle V's main clause (like feature 005's `parseCsvGrid`), not just UI-adjacent pure logic - full test-first coverage. The tree/tile rendering itself remains manually verified per the UI-rendering carve-out. |

**Result**: PASS - no unjustified violations. The `js-yaml` runtime-dependency note above is
recorded for transparency, not because it's a violation; no Complexity Tracking entry is
needed.

**Post-Phase 1 re-check**: Design artifacts (`data-model.md`, `contracts/`, `quickstart.md`)
introduce no editing affordances, no new persistence, and no additional runtime
dependencies beyond `js-yaml`. PASS confirmed unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/006-output-navigator/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── navigator/                          # NEW - this feature's own pure logic module
│   ├── prd-grouping.ts                  # NEW - groupPrdFolders(): folder names → project/date tree
│   └── sprint-status.ts                 # NEW - parseSprintStatus(): parsed YAML → summary + epics
├── server/
│   ├── routes/
│   │   ├── navigator-tree.ts             # NEW - GET /api/navigator/tree
│   │   ├── navigator-sprint-status.ts    # NEW - GET /api/navigator/sprint-status
│   │   └── tabs.ts                        # MODIFIED - TabAvailability gains `navigator`
│   ├── api-router.ts                      # MODIFIED - wires the two new routes
│   └── types.ts                           # MODIFIED - TabId gains "navigator"; new response types

web/
└── src/
    ├── navigatorApi.ts                    # NEW - fetchNavigatorTree(), fetchSprintStatus()
    ├── api.ts                             # MODIFIED - TabAvailability/TabId mirror server/types.ts
    ├── App.tsx                            # MODIFIED - new tab, routed to NavigatorView instead of
    │                                       # FolderTree+ContentsTable when active
    └── components/
        ├── NavigatorView.tsx              # NEW - owns Navigator's own tree+detail-pane state
        ├── NavigatorTree.tsx              # NEW - multi-root tree (PRD + Sprint Status roots)
        ├── NavigatorDetailPane.tsx        # NEW - dispatches to placeholder text or SprintStatusView
        └── SprintStatusView.tsx           # NEW - Summary tile + per-epic Status tiles

tests/
├── unit/
│   ├── navigator/
│   │   ├── prd-grouping.test.ts           # NEW
│   │   └── sprint-status.test.ts          # NEW
│   └── web/                                # (no new unit tests - Navigator's frontend is
│                                            # presentational, per constitution's UI carve-out)
└── integration/
    └── web-server.test.ts                  # MODIFIED - add cases for the two new routes +
                                             # `navigator` in GET /api/tabs
```

**Structure Decision**: A new `src/navigator/` module holds this feature's pure
grouping/parsing logic, parallel to `src/artifacts/` and `src/discovery/` - it's a
distinct domain (curated views derived from `_bmad-output`'s contents), not an extension
of the existing generic artifact-tree layer. Two new route files follow the existing
`src/server/routes/*.ts` one-file-per-endpoint convention. On the frontend, `NavigatorView`
(and its three sub-components) is a sibling to `FolderTree`/`ContentsTable`, not a
modification of them - `App.tsx` picks one or the other based on `activeTab`, since the two
models (folder-path-driven vs. curated-view-driven) are irreconcilably different, per
Technical Context's Constraints.

## Complexity Tracking

*No violations - Constitution Check passed cleanly, so this section is intentionally empty.*
