---

description: "Task list template for feature implementation"
---

# Tasks: Architecture Tree

**Input**: Design documents from `/specs/015-architecture-tree/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-behavior.md, quickstart.md

**Tests**: No new pure derivation logic is introduced — `groupPrdFolders` is reused
unmodified and already has full test-first coverage (feature 006). This feature adds one
integration test to `/api/navigator/tree`'s own wiring (which had none before), written
test-first per constitution Principle V. Tree rendering and dispatch are UI, covered by
manual `quickstart.md` verification instead, per that same principle's carve-out.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project: backend route/type code lives under `src/server/` and `src/navigator/`;
frontend code under `web/src/`; the modified integration test lives under
`tests/integration/`.

---

## Phase 1: Setup

**Purpose**: Confirm the feature needs no new dependencies before touching any code.

- [X] T001 Verify no new package is needed — this feature only reuses the already-existing
      `groupPrdFolders` (feature 006) and the same `@mui/x-tree-view` components
      `NavigatorTree.tsx` already renders "PRD" with.

**Checkpoint**: No dependency work needed — proceed directly to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared backend field and the generalized folder-lookup helper both user
stories (and the feature-014 regression fix) depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] In `src/server/types.ts`, add `architecture: PrdGroupingResult | null` to
      the `NavigatorTree` interface (data-model.md).
- [X] T003 [P] In `web/src/api.ts`, add the same `architecture: PrdGroupingResult | null`
      field to the client `NavigatorTree` interface (data-model.md).

### Test for the route's new wiring ⚠️

> The route's own wiring has no prior direct test (research.md § 4) — write this first
> and confirm it fails before implementing T005.

- [X] T004 Extend `tests/integration/web-server.test.ts`: add
      "GET /api/navigator/tree groups architecture folders the same way it groups PRD
      folders" (mirroring the existing PRD-grouping test's fixture/assertions exactly,
      using `planning-artifacts/architecture` folders), and extend the existing
      "returns prd: null ... when neither exists" test to also assert
      `architecture: null` (depends on T002; contracts/ui-behavior.md).

### Implementation

- [X] T005 In `src/server/routes/navigator-tree.ts`, add an `architecturePath`/
      `architectureNode`/`subfolders` lookup mirroring the existing `prdsPath` sequence,
      pointed at `planning-artifacts/architecture`, and call the existing
      `groupPrdFolders(subfolders)` again to populate the new `architecture` field — to
      make T004 pass (depends on T002, T004; research.md § 1).
- [X] T006 In `web/src/navigatorApi.ts`, generalize `findPrdFolderEntry(tree, itemId)`
      into `findFolderEntry(grouping: PrdGroupingResult | null, itemId: string)`, taking a
      grouping result directly instead of the whole tree; update its two existing call
      sites — `NavigatorDetailPane.tsx`'s PRD-leaf lookup (now `findFolderEntry(tree?.prd
      ?? null, selectedItemId)`) and `App.tsx`'s refresh handler (feature 014) — the
      latter now checking `findFolderEntry(tree.prd, current) || findFolderEntry(tree
      .architecture, current)` before resetting the selection, closing the gap
      research.md § 3 identifies. Update the `import { ..., findPrdFolderEntry } from
      "../navigatorApi.js"` statement in both files to import `findFolderEntry` instead —
      easy to miss alongside the invocation-site changes (depends on T003;
      contracts/ui-behavior.md).

**Checkpoint**: Foundation ready — User Stories 1 and 2 can now both start.

---

## Phase 3: User Story 1 - Browse architecture artifacts grouped by project and date (Priority: P1) 🎯 MVP

**Goal**: The Navigator tree shows an "Architecture" grouping, organized by project and
date exactly like "PRD" already is, appearing only when architecture folders exist
(FR-001–FR-004).

**Independent Test**: Open a project whose architecture folder contains two or more
`<project>-<date>`-named subfolders; confirm the Navigator tree shows an "Architecture"
grouping organized by project and date, matching the PRD grouping's own structure.

### Implementation for User Story 1

- [X] T007 [US1] In `web/src/components/NavigatorTree.tsx`, render an "Architecture" root
      (itemId `"architecture"`) between the existing "PRD" and "Sprint Status" roots,
      structured identically to "PRD"'s own JSX — one `TreeItem` per project group (itemId
      `` `architecture:${project}` ``) containing one `TreeItem` per date entry (itemId
      its own `path`), followed by one `TreeItem` per non-conforming entry. Also update
      this component's own early-return guard (`if (!tree || (tree.prd === null &&
      !tree.sprintStatusAvailable))`) to also account for `tree.architecture`, i.e.
      `tree.prd === null && tree.architecture === null && !tree.sprintStatusAvailable` —
      otherwise a project with only architecture folders (no PRD, no sprint-status.yaml)
      would incorrectly show "Nothing to show yet" instead of the Architecture grouping
      (depends on T005; FR-001/FR-002/FR-003, contracts/ui-behavior.md).
- [X] T008 [US1] In `web/src/components/NavigatorView.tsx`, extend `isStructuralOnly` to
      also treat `itemId === "architecture"` and any `itemId` starting with
      `"architecture:"` as structural-only (depends on T007; FR-004).
- [X] T009 [US1] In `web/src/App.tsx`'s mount effect, auto-expand `"architecture"`
      whenever `tree.architecture` is non-null, alongside the existing auto-expansion of
      `"prd"`/`"sprint-status"` (depends on T005; Assumptions).
- [X] T010 [US1] Manually verify quickstart.md Scenarios 1, 3, and 3b via Playwright: the
      Architecture grouping renders in the right position with correct project/date
      structure and its non-conforming folder shown; the root and project nodes are
      non-interactive; no Architecture root appears when no architecture folders exist;
      and the Architecture grouping still renders (not the tree's "Nothing to show yet"
      empty state) when it's the *only* thing present — no PRD folders, no Sprint Status.

**Checkpoint**: User Story 1 is fully functional and independently testable — the grouping
renders correctly, even though selecting a leaf shows nothing yet.

---

## Phase 4: User Story 2 - See which architecture folder is selected (Priority: P1)

**Goal**: Selecting an architecture leaf folder shows its bare folder name in the
right-hand pane, and that selection survives a refresh exactly like a PRD leaf's already
does (FR-005, plus the feature-014 integration).

**Independent Test**: Select an architecture leaf folder in the tree; confirm its folder
name renders in the right-hand pane, and confirm selecting any other existing Navigator
item continues to work exactly as before.

### Implementation for User Story 2

- [X] T011 [US2] In `web/src/components/NavigatorDetailPane.tsx`, add a new branch after
      the existing PRD-leaf check: `findFolderEntry(tree?.architecture ?? null,
      selectedItemId)`; when it resolves, render that entry's bare `folderName` as plain
      text, the same minimal `<Typography>` placeholder the PRD leaf view used before
      feature 012 (depends on T006; FR-005, contracts/ui-behavior.md).
- [X] T012 [US2] Manually verify quickstart.md Scenarios 2 and 4 via Playwright: selecting
      an architecture leaf shows its folder name; the same leaf remains selected after a
      refresh; a deleted architecture leaf falls back to the default unselected state
      after a refresh (confirming the T006 regression fix).

**Checkpoint**: Both user stories are fully functional — the grouping renders, selection
shows the folder name, and refresh integration behaves consistently with PRD.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Confirm nothing regressed across the whole test suite and existing behavior.

- [X] T013 [P] Run the full `npm test` suite and confirm the new/modified integration
      tests pass alongside every pre-existing test with zero regressions.
- [X] T014 Manually verify quickstart.md's Regression pass: PRD grouping and its own
      leaf's full detail view (features 012/013) still render correctly; Sprint Status
      still renders; the refresh control's own placement/behaviors (feature 014) are
      unchanged; Infra/Output tabs are untouched (FR-006).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS both user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational only.
- **User Story 2 (Phase 4)**: Depends on Foundational only — independent of Phase 3, can
  run in parallel with it (unlike feature 012, neither story here produces output the
  other consumes).
- **Polish (Phase 5)**: Depends on both user stories being complete.

### Within Each Phase

- T004 (the integration test) MUST be written and confirmed failing before T005.
- T004 (the integration test) doesn't need T002 to exist first — it parses the response
  with its own inline local type, the same way the existing PRD test already does, so it
  can be written and confirmed failing before any type change lands. It does need T005 to
  make it pass.
- T005 before T007/T009; T006 before T011.

### Parallel Opportunities

- T002 and T003 (Foundational) touch different files and can run in parallel.
- Once Foundational is complete, User Story 1 (T007–T010) and User Story 2 (T011–T012) can
  proceed fully in parallel.
- T013 is independent of T014 and can run in parallel.

---

## Parallel Example: Foundational Phase

```bash
# Launch T002 and T003 together — different files, no shared dependency:
Task: "Add architecture field to NavigatorTree in src/server/types.ts"
Task: "Add architecture field to NavigatorTree in web/src/api.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL — blocks both stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: Run quickstart.md Scenarios 1 and 3 independently.
5. This alone already makes architecture artifacts visible and navigable in the tree — a
   meaningful increment even before leaf selection shows anything.

### Incremental Delivery

1. Setup + Foundational → foundation ready (including the feature-014 regression fix).
2. User Story 1 → validate → the Architecture grouping renders correctly (MVP).
3. User Story 2 → validate → leaf selection shows the folder name and survives a refresh.
4. Polish → full regression pass.

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- Unlike feature 012, this feature's two stories are genuinely independent of each other —
  either order, or full parallelism, is safe once Foundational is done.
- The Foundational phase's `findFolderEntry` generalization (T006) fixes a real,
  pre-existing gap in feature 014's own refresh handler — worth flagging in review even
  though it's framed here as infrastructure for *this* feature.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
