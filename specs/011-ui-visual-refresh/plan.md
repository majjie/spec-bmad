# Implementation Plan: UI Visual Refresh

**Branch**: `011-ui-visual-refresh` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-ui-visual-refresh/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Five targeted visual changes, all styling-only (no behavior, data, or interaction
changes): (1) fix the uneven icon spacing in Action Items and Epic Step Detail row
headers, caused by the jump control's own `IconButton` padding; (2) recolor the Summary
tile's field labels/values to match the existing Markdown frontmatter tooltip's key/value
color pairing; (3) raise the app's base font size; (4) apply the app's existing blue
accent (already visible in the active-tab indicator, never previously used elsewhere)
deliberately to every tile heading; (5) give each of the four recognized statuses
(done/review/backlog/in-progress) its own distinct, semantically-fitting icon color
instead of all four inheriting the surrounding text color. Nothing here touches a route,
a data shape, or an interaction — every change is confined to `web/src/theme.ts` and
existing components' own styling.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (unchanged).

**Primary Dependencies**: None new — every color/spacing change uses this project's
existing MUI theme and palette tokens; no new icon, no new library.

**Storage**: N/A — no data of any kind is involved in this feature.

**Testing**: This feature is exclusively UI/rendering — per constitution Principle V's
carve-out, it's manually verified in a running browser (`quickstart.md`), not
unit-tested. There is no genuine parsing/derivation logic anywhere in this feature (unlike
every prior feature this session), so no new `node:test` coverage is introduced; the
existing suite must simply keep passing unmodified, since no derivation logic changes.

**Target Platform**: Same as prior features — localhost server + full-size desktop
browsers only.

**Project Type**: Extends the existing single Node.js CLI + bundled web frontend —
frontend-only, no backend files touched at all, no new routes.

**Performance Goals**: None mandated — same scale assumptions as prior features.

**Constraints**: Read-only (constitution Principle II, trivially satisfied — this feature
touches no artifact-reading code path at all). Every existing layout must continue to
display without clipping or overlapping content once the base font size increases
(FR-004's own constraint) — verified visually, not by a fixed pixel budget.

**Scale/Scope**: Same as prior features.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved, clarified, and checklist-passed (`spec.md`) before this plan; every requirement traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes (trivially) | This feature touches no artifact-reading or file-serving code at all — purely theme/component styling. |
| III. Zero-Install, Local-First Operation | Yes | No new dependency of any kind. |
| IV. TypeScript CLI & Web Interface Standards | Yes | No parsing logic is added or changed by this feature — N/A beyond "don't regress it," which the Polish tasks verify. |
| V. Test-First for Parsing & Rendering Logic | Yes | No genuine derivation/parsing logic exists in this feature — every change is UI/rendering, manually verified per the carve-out (`quickstart.md`). This is the first feature this session with *no* new `node:test` coverage, and that's the correct call, not an oversight. |

**Result**: PASS — no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts introduce no new dependency, no new route, and
no behavior change of any kind — every acceptance scenario from every prior feature must
still pass unchanged (spec.md's own FR-007/SC-005). PASS confirmed unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/011-ui-visual-refresh/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
web/
└── src/
    ├── theme.ts                        # MODIFIED — explicit primary palette (pinning
    │                                    # the existing blue hue deliberately, research.md
    │                                    # § 3), raised base typography.fontSize (§ 2)
    └── components/
        ├── ActionItemsTile.tsx         # MODIFIED — header spacing fix (§ 1)
        └── SprintStatusView.tsx        # MODIFIED — header spacing fix for StepRow (§ 1);
                                         # Field's label/value colors (§ 4); tile-heading
                                         # accent color on Summary/Action Items/epic/step
                                         # (§ 5); StatusText's semantic icon colors (§ 6)
```

No files under `src/` (the backend) or `tests/` change — this feature has no genuine
derivation logic to unit-test (see Technical Context's Testing note), and touches no
server-side code at all.

**Structure Decision**: All five changes land in the two frontend files that already own
the affected visuals (`ActionItemsTile.tsx`, `SprintStatusView.tsx`) plus the shared
`theme.ts` — no new component files, no new shared abstraction, consistent with this
project's established preference for small, targeted edits over new abstractions for a
handful of call sites.

## Complexity Tracking

*No violations — Constitution Check passed cleanly, so this section is intentionally empty.*
