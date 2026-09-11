# Implementation Plan: Action Items Tile

**Branch**: `008-action-items-tile` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-action-items-tile/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a new "Action Items" tile to the Sprint Status view, beside the Summary tile (same
row, same height, filling the rest of the width), listing every `action_items` entry from
the sprint-status file as a compact scrollable row (owner icon, read-only tick-box, jump
icon, epic label, action text), with per-property hiding when a field is absent. The jump
icon reuses the existing File Content Viewer dialog (feature 004) to open the item's
referenced document, with identical close/back behavior. This requires: (1) parsing
`action_items` server-side (previously explicitly out of scope, per feature 006/007's own
Assumptions) into a new field on `SprintStatusResult`, with each item's `ref` pre-resolved
to an absolute path there (where the project root is already known) rather than guessed at
client-side; and (2) generalizing `App.tsx`'s file-opening plumbing, which currently only
knows how to open a file from the Infra/Output tabs, to also work from the Navigator tab.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18, Node.js ≥20 (unchanged).

**Primary Dependencies**: None new. Icons use `@mui/icons-material` (already a
dependency): `PersonOutline`/`Computer` (owner type), `CheckBox`/`CheckBoxOutlineBlank`
(read-only tick-box), `SubdirectoryArrowRight` (the "jump icon").

**Storage**: N/A - reads `action_items` from the same sprint-status file
`parseSprintStatus` already reads; no new data source.

**Testing**: Node's built-in test runner for `parseActionItems` (new) - genuine
parsing/derivation logic under constitution Principle V's main clause, including its
path-resolution rule, following feature 006/007's `parseSprintStatus`/`groupPrdFolders`/
`calculateActiveEpic` precedent. The tile's rendering (icon choices, per-property hiding,
scroll behavior) is UI/rendering, manually verified per the carve-out (`quickstart.md`).

**Target Platform**: Same as prior features - localhost server + full-size desktop
browsers only.

**Project Type**: Extends the existing single Node.js CLI + bundled web frontend - one
new backend module, one new frontend component, no new routes (the existing `GET
/api/navigator/sprint-status` response gains a field).

**Performance Goals**: None mandated - action item counts are small (tens, not thousands),
consistent with this app's established scale assumptions.

**Constraints**: No editing capability of any kind (constitution Principle II) - the tile
is read-only display; its only interactive element (the jump icon) opens the *existing*
read-only file viewer, introducing no new write path. Must reuse, not duplicate,
`FileViewerDialog`/`openFileDialog`'s existing mechanism (feature 004) rather than building
a second file-viewing path for the Navigator tab.

**Scale/Scope**: Same as prior features.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved and clarified (`spec.md`) before this plan; every requirement traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes | Purely a new read/display path over already-existing sprint-status data, plus reuse of the existing (already read-only) file viewer - no new write capability anywhere. |
| III. Zero-Install, Local-First Operation | Yes | No new dependency of any kind - icons come from the already-installed `@mui/icons-material`. |
| IV. TypeScript CLI & Web Interface Standards | Yes | `parseActionItems` is a plain, DOM-independent TypeScript function, unit-testable without a browser, alongside `parseSprintStatus`/`groupPrdFolders`. |
| V. Test-First for Parsing & Rendering Logic | Yes | `parseActionItems` (including its path-resolution rule) is genuine derivation logic - full test-first coverage. Icon rendering, per-property hiding, and scroll behavior remain manually verified per the carve-out. |

**Result**: PASS - no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts introduce no new dependency, no new route
(the existing sprint-status route's response shape simply grows by one field), and no
editing affordance - the jump icon only ever opens the existing read-only viewer. PASS
confirmed unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/008-action-items-tile/
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
    ├── action-items.ts               # NEW - parseActionItems(), ActionItem type
    └── sprint-status.ts              # MODIFIED - parseSprintStatus() takes the project
                                        # root path too, calls parseActionItems(), adds
                                        # `actionItems` to SprintStatusResult

src/server/routes/
└── navigator-sprint-status.ts        # MODIFIED - passes root.path to parseSprintStatus()

web/
└── src/
    ├── api.ts                         # MODIFIED - mirrors ActionItem, SprintStatusResult
    │                                   # gains actionItems
    ├── App.tsx                        # MODIFIED - generalizes openFileDialog/
    │                                   # loadFileContent to open a file from the
    │                                   # Navigator tab too (mapped to the Output tab's
    │                                   # own file-fetch route under the hood); threads
    │                                   # an onOpenFile callback down to NavigatorView
    └── components/
        ├── ActionItemsTile.tsx        # NEW - the tile + scrolling item rows
        ├── SprintStatusView.tsx       # MODIFIED - row layout (Summary + Action Items),
        │                               # threads onOpenFile through
        ├── NavigatorDetailPane.tsx    # MODIFIED - threads onOpenFile through
        └── NavigatorView.tsx          # MODIFIED - threads onOpenFile through

tests/
├── unit/navigator/
│   ├── action-items.test.ts          # NEW
│   └── sprint-status.test.ts         # MODIFIED - parseSprintStatus's new signature,
│                                      # actionItems in existing assertions
└── integration/
    └── web-server.test.ts            # MODIFIED - asserts actionItems in the existing
                                       # sprint-status route test
```

**Structure Decision**: `action-items.ts` is a new sibling to `prd-grouping.ts`/
`sprint-status.ts` in `src/navigator/` - its own distinct piece of derivation logic,
called from `parseSprintStatus` rather than folded into it, mirroring how that file
already composes multiple concerns (summary extraction, epic/story derivation) as
separate steps. On the frontend, `ActionItemsTile.tsx` is a new sibling to
`SprintStatusView.tsx`, matching the project's one-file-per-meaningful-UI-chunk
convention; everything else is a targeted edit to plumbing that already exists.

## Complexity Tracking

*No violations - Constitution Check passed cleanly, so this section is intentionally empty.*
