# Implementation Plan: Explorer UI Polish

**Branch**: `003-explorer-ui-polish` | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-explorer-ui-polish/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Four UI-only refinements to the existing Web Artifact Explorer (feature 002), entirely
within `web/src/`: (1) wire browser Back/Forward to in-app tab/folder navigation via the
native History API, including a baseline entry on load so a single navigation is still
undoable; (2) expand each tab's tree root by default the first time its data loads; (3) add
a folder icon to tree nodes and folder rows in the contents table; (4) replace the
contents table's row divider lines with alternating ("candy stripe") row shading. No
backend or API changes are required — everything here is client-side rendering/interaction
built on data the existing `/api/tabs`, `/api/tree/:tab`, and `/api/contents/:tab` endpoints
already provide.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (unchanged from feature 002).

**Primary Dependencies**: `@mui/icons-material` added as a new devDependency (build-time
only, bundled into `web/dist/` like the rest of MUI — no new runtime dependency for the
published package) for the folder icon. Browser navigation uses the native
`History`/`popstate` API — no router library.

**Storage**: N/A — unchanged; no backend or data-model changes.

**Testing**: Node's built-in test runner for the new pure navigation-history decision logic
(constitution Principle V, main clause); manual verification in a running browser for
everything else (History API wiring, icon rendering, row styling) per Principle V's
UI-rendering carve-out, documented in `quickstart.md`. `window.history`/`popstate` cannot be
exercised by `node:test` without a DOM, which is exactly the class of behavior that carve-out
covers.

**Target Platform**: Same as feature 002 — full-size desktop browsers only (no change to
FR-014's desktop-only scope).

**Project Type**: Frontend-only change within the existing `web/` source tree; no new
top-level project structure.

**Performance Goals**: None mandated; History API calls and CSS-only row styling are
effectively free at this feature's scale.

**Constraints**: No backend/API changes (this feature's scope is entirely `web/src/`); no
new runtime dependency for the published package; desktop-only (unchanged).

**Scale/Scope**: Same as feature 002.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved and clarified (`spec.md`) before this plan; every requirement below traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes | No new routes, no mutation of any kind — purely client-side navigation/rendering changes. |
| III. Zero-Install, Local-First Operation | Yes | `@mui/icons-material` is a devDependency bundled at build time, same treatment as `@mui/material`/`@mui/x-tree-view` in feature 002 — no change to the published package's runtime dependencies or npx cold start. |
| IV. TypeScript CLI & Web Interface Standards | Yes | No CLI surface changes. The new navigation-decision logic (`web/src/navigationHistory.ts`) is a plain, DOM-independent module, unit-testable on its own. |
| V. Test-First for Parsing & Rendering Logic | Yes | `navigationHistory.ts`'s pure decision logic (baseline state, state-equality) gets tests written first; the History API wiring, icon rendering, and row styling are UI/rendering, manually verified per Principle V's explicit carve-out (`quickstart.md`). |

**Result**: PASS — no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts (`data-model.md`, `contracts/`, `quickstart.md`)
introduce no backend/API changes, no new runtime dependency, and no mutation of any kind —
confirmed still entirely client-side. PASS confirmed unchanged.

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
    ├── navigationHistory.ts          # NEW — pure history-state decision logic
    ├── App.tsx                        # MODIFIED — wires History API, root-expand-by-default
    └── components/
        ├── FolderTree.tsx              # MODIFIED — folder icon per node
        └── ContentsTable.tsx            # MODIFIED — folder icon, no dividers, row striping

tests/
└── unit/
    └── web/
        └── navigationHistory.test.ts   # NEW
```

**Structure Decision**: No new top-level structure — this feature only touches files
already established by feature 002's `web/src/` tree, plus one new pure-logic module
(`navigationHistory.ts`) that follows the same pattern as feature 002's `sortEntries.ts`:
DOM-independent decision logic pulled out of the component for testability, with the
actual browser-API/rendering code left in the components themselves.

## Complexity Tracking

*No violations — Constitution Check passed cleanly, so this section is intentionally empty.*
