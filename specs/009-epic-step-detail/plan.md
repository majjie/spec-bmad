# Implementation Plan: Epic Step Detail

**Branch**: `009-epic-step-detail` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-epic-step-detail/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Epic tiles in the Sprint Status view collapse to just their key and status by default,
with a top-right control to expand/collapse. Once expanded, each step renders as a
candy-striped, header-then-body row (mirroring the Action Items tile's pattern): a header
line with the step's index, its status, and an optional magnifying-glass control; a body
line with a human-readable title derived from the step's raw key. The magnifying glass
opens a matching spec document - found by filename prefix (`spec-<index>-`), not full-text
match - in the same file viewer already used elsewhere, and is simply absent when no match
exists. This requires: (1) deriving each step's index/title from its raw key and matching
it against `implementation-artifacts`' own file listing server-side (the browser has no
filesystem access, and the server already reads that same folder for sprint-status.yaml);
and (2) client-side collapse/expand state per epic tile, plus a step-row layout reusing the
established header/body/candy-stripe pattern and the existing `onOpenFile` plumbing (no new
routes or file-opening mechanism needed).

## Technical Context

**Language/Version**: TypeScript 5.x + React 18, Node.js ≥20 (unchanged).

**Primary Dependencies**: None new. Icons from the already-installed `@mui/icons-material`:
`ExpandMore`/`ExpandLess` (collapse/expand control), `Search` (the magnifying glass - the
exact same icon the Action Items tile's jump control already uses).

**Storage**: N/A - reads `implementation-artifacts` (already read for `sprint-status.yaml`)
plus a directory listing of that same folder, via `listRealEntries` (already used by the
Infra/Output content routes) for spec-file matching; no new data source.

**Testing**: Node's built-in test runner for the new pure derivation functions -
`deriveStepDisplay()` (index/title extraction) and `matchSpecFileName()` (prefix matching
with the deterministic tie-break) - genuine parsing/derivation logic under constitution
Principle V, following `parseActionItems`/`parseSprintStatus`'s own precedent. Collapse/
expand interaction, row layout, and the candy stripe are UI/rendering, manually verified
per the carve-out (`quickstart.md`).

**Target Platform**: Same as prior features - localhost server + full-size desktop
browsers only.

**Project Type**: Extends the existing single Node.js CLI + bundled web frontend - one new
backend module, no new routes (the existing `GET /api/navigator/sprint-status` response's
`epics[].steps` gains three fields per step; `stories`/`StoryStatus` are renamed to
`steps`/`StepDetail`, the same entities with three new derived fields, not a second
parallel array).

**Performance Goals**: None mandated - an epic's step count and an
`implementation-artifacts` folder's file count are both small, consistent with this app's
established scale assumptions.

**Constraints**: Read-only (constitution Principle II) - this feature only ever lists a
directory and reads a file already covered by the existing File Content Viewer; no new
write path. Must reuse, not duplicate, the existing `onOpenFile`/file-viewer mechanism
(feature 008) rather than building a second file-opening path.

**Scale/Scope**: Same as prior features.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved and clarified (`spec.md`) before this plan; every requirement traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes | A new read/display path over already-existing sprint-status data plus a directory listing of an already-read folder, and reuse of the existing (already read-only) file viewer - no new write capability anywhere. |
| III. Zero-Install, Local-First Operation | Yes | No new dependency of any kind - icons come from the already-installed `@mui/icons-material`. |
| IV. TypeScript CLI & Web Interface Standards | Yes | `deriveStepDisplay`/`matchSpecFileName`/`buildStepDetails` are plain, DOM-independent TypeScript functions, unit-testable without a browser, alongside `parseActionItems`/`parseSprintStatus`. |
| V. Test-First for Parsing & Rendering Logic | Yes | The index/title derivation and the spec-file matching (including its deterministic tie-break) are genuine derivation logic - full test-first coverage. Collapse/expand interaction, row layout, and the candy stripe remain manually verified per the carve-out. |

**Result**: PASS - no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts introduce no new dependency, no new route (the
existing sprint-status route's response shape changes shape for `epics[].steps`, gaining
fields, not gaining a new concept), and no editing affordance - the magnifying glass only
ever opens the existing read-only viewer. PASS confirmed unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/009-epic-step-detail/
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
└── navigator/
    ├── step-detail.ts                 # NEW - StepDetail type, deriveStepDisplay(),
    │                                   # matchSpecFileName(), buildStepDetails()
    └── sprint-status.ts               # MODIFIED - parseSprintStatus() takes the
                                        # implementation-artifacts file listing too;
                                        # EpicStatusGroup.stories (StoryStatus[]) becomes
                                        # .steps (StepDetail[])

src/server/routes/
└── navigator-sprint-status.ts        # MODIFIED - lists implementation-artifacts
                                       # (listRealEntries, already used by Infra/Output
                                       # content routes) and passes the filenames through

web/
└── src/
    ├── api.ts                         # MODIFIED - StoryStatus becomes StepDetail (+index/
    │                                   # title/specPath), EpicStatusGroup.stories becomes
    │                                   # .steps
    └── components/
        └── SprintStatusView.tsx       # MODIFIED - per-epic collapse/expand state and
                                        # top-right toggle control; step rows restyled to
                                        # the header/body, candy-striped pattern, reusing
                                        # the existing onOpenFile prop already threaded here

tests/
├── unit/navigator/
│   ├── step-detail.test.ts           # NEW
│   └── sprint-status.test.ts         # MODIFIED - parseSprintStatus's new signature,
│                                      # steps[] shape in existing assertions
└── integration/
    └── web-server.test.ts            # MODIFIED - asserts steps[] (index/title/specPath)
                                       # in the existing sprint-status route test
```

**Structure Decision**: `step-detail.ts` is a new sibling to `action-items.ts`/
`prd-grouping.ts` in `src/navigator/` - its own distinct derivation concern, called from
`parseSprintStatus` rather than folded into it, mirroring how that file already composes
multiple steps (summary extraction, epic/story derivation, action items) as separate
pieces. `stories`/`StoryStatus` are renamed to `steps`/`StepDetail` rather than kept
alongside a second, redundant array - they're the same entities gaining three derived
fields, not a new parallel concept. On the frontend, the step-row layout is added directly
inside `SprintStatusView.tsx` (the only file that already renders epic tiles), matching
this project's existing preference for small, file-local UI pieces over new shared
cross-file abstractions for a single reused visual pattern (e.g., `Tile` is already
separately defined in both `SprintStatusView.tsx` and `ActionItemsTile.tsx`). Everything
else is a targeted edit to plumbing that already exists - no new routes, no new
file-opening mechanism.

## Complexity Tracking

*No violations - Constitution Check passed cleanly, so this section is intentionally empty.*
