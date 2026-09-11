# Implementation Plan: Navigator Tab Uplift

**Branch**: `007-navigator-uplift` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-navigator-uplift/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Four small, independent changes to feature 006's Navigator tab: (1) make it the default
active tab on load, falling back to Infra when it isn't available; (2) show a status icon
next to every epic's and story's status value, for done/review/backlog/in-progress; (3)
rearrange the epic tiles from a wrapping grid into a full-width vertical stack, leaving
the Summary tile untouched; (4) add a calculated "Active Epic" field to the Summary tile.
All four are frontend-only except (4), whose calculation lives server-side alongside the
sprint-status parsing logic it already depends on.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18, Node.js ≥20 (unchanged).

**Primary Dependencies**: None new. Status icons use `@mui/icons-material`, already a
dependency since feature 002 (e.g. `FolderIcon`, `CloseIcon`).

**Storage**: N/A - no new data sources; this feature only changes how already-fetched
Navigator/Sprint-Status data is defaulted-to and rendered.

**Testing**: Node's built-in test runner for the one new piece of genuine derivation
logic this feature introduces - `calculateActiveEpic` (FR-009/FR-010) - following feature
006's `parseSprintStatus`/`groupPrdFolders` precedent, not just a UI-adjacent afterthought.
`createBaselineState`'s generalization (below) gets its existing unit test updated rather
than dropped. Everything else (default-tab wiring, icons, tile layout) is UI/rendering,
manually verified per constitution Principle V's carve-out (`quickstart.md`).

**Target Platform**: Same as prior features - localhost server + full-size desktop
browsers only.

**Project Type**: Frontend-only extension of the existing `web/src/` tree, plus one
small addition to feature 006's existing backend derivation module
(`src/navigator/sprint-status.ts`) - no new routes, no new backend modules.

**Performance Goals**: None mandated - same small, in-memory data as feature 006.

**Constraints**: No editing capability of any kind (constitution Principle II) - every
change here is either a default/fallback choice or a rendering change. Must extend, not
duplicate, feature 006's existing `parseSprintStatus`/`SprintStatusView`/`App.tsx`
structures.

**Scale/Scope**: Same as prior features.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved and clarified (`spec.md`) before this plan; every requirement traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes | No new route, no new capability that writes anything - a default-tab choice and three rendering changes over already-read-only data. |
| III. Zero-Install, Local-First Operation | Yes | No new dependency of any kind, runtime or otherwise. |
| IV. TypeScript CLI & Web Interface Standards | Yes | `calculateActiveEpic` is a plain, DOM-independent TypeScript function, unit-testable without a browser, alongside `parseSprintStatus` in the same module. |
| V. Test-First for Parsing & Rendering Logic | Yes | `calculateActiveEpic` is genuine derivation logic (FR-009/FR-010's rules) - full test-first coverage, like `parseSprintStatus` before it. Icon rendering, tile layout, and default-tab wiring are UI/rendering, manually verified per the carve-out. |

**Result**: PASS - no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts introduce no new dependency, no new route, and
no editing affordance. PASS confirmed unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/007-navigator-uplift/
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
└── navigator/
    └── sprint-status.ts          # MODIFIED - adds calculateActiveEpic() and the
                                    # activeEpic field on SprintStatusSummary

web/
└── src/
    ├── api.ts                     # MODIFIED - SprintStatusSummary gains activeEpic
    ├── App.tsx                    # MODIFIED - default-tab-on-load + fallback (FR-001/002),
    │                               # generalizes the baseline-history call site
    ├── navigationHistory.ts        # MODIFIED - createBaselineState(tab, path), generalized
    │                               # from its Infra-only signature
    └── components/
        └── SprintStatusView.tsx    # MODIFIED - status icons (FR-003/004/005), full-width
                                     # stacked epic tiles (FR-006/007/008), renders
                                     # Active Epic via the existing SUMMARY_FIELDS loop

tests/
└── unit/
    ├── navigator/
    │   └── sprint-status.test.ts   # MODIFIED - add calculateActiveEpic() cases
    └── web/
        └── navigationHistory.test.ts # MODIFIED - createBaselineState()'s existing test
                                       # updated for its new (tab, path) signature
```

**Structure Decision**: No new files. `calculateActiveEpic` extends feature 006's existing
`src/navigator/sprint-status.ts` (the same module already computing `epics`, avoiding a
second derivation layer for data that module already owns). Everything else is a targeted
edit to a component or module feature 006 already created. `createBaselineState`'s
generalization is the one small "infrastructure" change this feature needs, since
defaulting to the Navigator tab means the FR-012-style baseline history entry can no
longer be hardcoded to Infra.

## Complexity Tracking

*No violations - Constitution Check passed cleanly, so this section is intentionally empty.*
