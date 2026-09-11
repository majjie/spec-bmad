---

description: "Task list template for feature implementation"
---

# Tasks: Explorer UI Polish

**Input**: Design documents from `/specs/003-explorer-ui-polish/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included for the one piece of pure, DOM-independent logic this feature adds
(`navigationHistory.ts`) - constitution Principle V's main clause. Everything else (History
API wiring, icon rendering, row styling) is UI/rendering, validated manually per Principle
V's explicit carve-out (see `quickstart.md`), matching how feature 002 handled its own
React components.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Per `plan.md` § Project Structure: this feature only touches `web/src/` (feature 002's
existing frontend tree) plus one new test file under `tests/unit/web/`. No backend/API
changes.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the one new dependency this feature needs

- [X] T001 Add `@mui/icons-material` to root `package.json` devDependencies (build-time
      only, bundled into `web/dist/` like the rest of MUI - research.md § 5); run
      `npm install`

---

## Phase 2: Foundational

No cross-story blocking work is needed for this feature - each of the four user stories
below is independent of the others (they touch overlapping files but not overlapping
logic), so there is nothing that must land before all of them. Proceed directly to User
Story 1.

---

## Phase 3: User Story 1 - Back/forward navigates within the app, not away from it (Priority: P1) 🎯 MVP

**Goal**: Selecting a folder or switching tabs pushes a browser history entry; Back/Forward
correctly undo/redo those steps instead of leaving the app; a baseline entry means even a
single navigation is undoable; expand/collapse alone never pushes a step.

**Independent Test**: Select folder A, then folder B, then switch tabs, then select folder
C. Press Back three times and confirm each press returns to the immediately preceding
folder/tab selection, in reverse order, without the browser ever leaving the page. Press
Forward and confirm it re-applies the selection that Back had just undone (per spec.md's
own Independent Test for this story).

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T002 [P] [US1] Unit test in `tests/unit/web/navigationHistory.test.ts`:
      `createBaselineState(infraRootPath)` returns `{ tab: "infra", path: infraRootPath }`
      (FR-012); `statesEqual(a, b)` returns `true` only when both `tab` and `path` match,
      and `false` when either differs (data-model.md)

### Implementation for User Story 1

- [X] T003 [US1] Implement `createBaselineState` and `statesEqual` in
      `web/src/navigationHistory.ts` per `data-model.md`; must make T002 pass
- [X] T004 [US1] Implement the unified `navigate(tab, path, { fromHistory })` router in
      `web/src/App.tsx`: it updates React state (active tab + that tab's `selectedPath`,
      triggering a contents fetch) exactly like today's `handleSelect`/`setActiveTab`
      calls, which it replaces as the single entry point for both. Route `Tabs`' `onChange`
      and `FolderTree`/`ContentsTable`'s selection callbacks through it. When called with
      `fromHistory` false or omitted (a real user click), it also calls `history.pushState`
      with the new `NavigationState` (FR-001/FR-002) - but first uses T003's `statesEqual`
      to compare against the current state and skips the push if they're equal (a
      redundant re-click of the already-active tab or already-selected folder - see
      `data-model.md`'s `statesEqual` row for why this is *not* about expand/collapse,
      which never calls this function at all: `FolderTree.tsx`'s `onExpandedItemsChange`
      stays its own separate, untouched handler, which is what actually satisfies FR-005).
      Depends on T003
- [X] T005 [US1] In `web/src/App.tsx`, after the initial data load completes, establish
      the baseline history entry via `history.replaceState` with `createBaselineState`'s
      result (FR-012, research.md § 2); add a `popstate` listener that calls T004's
      `navigate` with `fromHistory: true` to apply `event.state` without pushing again
      (FR-003/FR-004, research.md § 4); do not read any pre-existing `history.state` on
      mount, so a reload always starts at the default view (research.md § 3); depends on
      T004

**Checkpoint**: At this point, User Story 1 should be fully functional and testable
independently (quickstart.md Scenarios 1–3)

---

## Phase 4: User Story 2 - A tab's tree opens with its root already expanded (Priority: P2)

**Goal**: The first time a tab's tree data loads, its root node renders expanded (showing
its immediate children) without the user clicking it; this auto-expansion never re-applies
on later visits to that tab.

**Independent Test**: Load the app against a project with at least one subfolder under
`_bmad`; confirm the Infra tab's tree already shows that subfolder listed under the root,
with no click needed. Switch to Output and confirm the same for `_bmad-output` (per
spec.md's own Independent Test for this story).

### Implementation for User Story 2

- [X] T006 [US2] In `web/src/App.tsx`'s initial tab-loading effect, initialize each tab's
      `expandedPaths` to `new Set([tree.path])` (the tab's own root) instead of an empty
      `Set`, the first time that tab's tree is populated (FR-006/FR-008); leave all later
      `expandedPaths` updates (from the user's own clicks) untouched, so manually
      collapsing the root persists across tab switches (FR-007); depends on T005 (same
      file as User Story 1's changes)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently
(quickstart.md Scenarios 4–5)

---

## Phase 5: User Story 3 - Folders are marked with an icon (Priority: P3)

**Goal**: Folder entries in both the tree and the contents table show a folder icon; file
entries do not.

**Independent Test**: Open a folder containing both files and subfolders; confirm every
subfolder entry (in the tree and in the table) shows a folder icon that file entries do
not (per spec.md's own Independent Test for this story).

### Implementation for User Story 3

- [X] T007 [P] [US3] Add `@mui/icons-material`'s `Folder` icon next to each node's label in
      `web/src/components/FolderTree.tsx` (FR-009); depends on T001
- [X] T008 [P] [US3] Add the same `Folder` icon next to folder rows' names in
      `web/src/components/ContentsTable.tsx`, with no icon on file rows (FR-009); depends
      on T001

**Checkpoint**: User Stories 1, 2, AND 3 should now all work independently (quickstart.md
Scenario 6)

---

## Phase 6: User Story 4 - Contents table uses alternating row shading instead of divider lines (Priority: P4)

**Goal**: The contents table has no visible row divider lines; adjacent rows alternate
between two background shades instead.

**Independent Test**: Open a folder with several entries; confirm there are no divider
lines between rows and that adjacent rows alternate between two background shades (per
spec.md's own Independent Test for this story).

### Implementation for User Story 4

- [X] T009 [US4] In `web/src/components/ContentsTable.tsx`, remove each cell's default
      bottom border (FR-010) and shade alternating rows via `sx={{ '&:nth-of-type(odd)':
      { backgroundColor: theme.palette.action.hover } }}` on each `TableRow` (FR-011,
      research.md § 6); depends on T008 (same file as User Story 3's changes)

**Checkpoint**: All four user stories should now be independently functional (quickstart.md
Scenario 7)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification that spans all four stories

- [X] T010 [P] Run `npm run typecheck` and resolve any strict-mode type errors introduced
      by the new dependency/code
- [X] T011 Execute `quickstart.md` Scenarios 1–7 in a real desktop browser and confirm each
      matches its expected outcome - this feature is entirely browser-interactive (History
      API, click behavior, visual styling), so unlike prior features' automated-test-heavy
      validation, this manual pass is the primary way most of it gets verified at all
      (partial - no browser is available in this environment; verified instead that the
      server starts, the built bundle contains the expected History API / icon / striping
      code, and `/api/tabs` still responds correctly. None of the 7 scenarios' actual
      click/visual/Back-Forward behavior has been human-confirmed in a real browser yet)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Empty for this feature - no cross-story blocking work exists
- **User Story 1 (Phase 3)**: No dependency on Setup or any other story
- **User Story 2 (Phase 4)**: Depends on User Story 1 - both modify `web/src/App.tsx`, so
  sequence after US1 to avoid file conflicts, even though the two behaviors are logically
  independent
- **User Story 3 (Phase 5)**: Depends on Setup (T001, the icon dependency); independent of
  US1/US2
- **User Story 4 (Phase 6)**: Depends on User Story 3 - both modify
  `web/src/components/ContentsTable.tsx`, so sequence after US3
- **Polish (Phase 7)**: Depends on all four user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independently testable; no dependency on the other three
- **User Story 2 (P2)**: Independently testable on its own once implemented, but its one
  task lands in `web/src/App.tsx`, the same file User Story 1 modifies - sequence after
  US1 to avoid file conflicts
- **User Story 3 (P3)**: Independently testable; only depends on Setup, not on US1/US2
- **User Story 4 (P4)**: Independently testable on its own once implemented, but its one
  task lands in `ContentsTable.tsx`, the same file User Story 3 modifies - sequence after
  US3

### Parallel Opportunities

- T007 and T008 (User Story 3) can run in parallel - different files, no dependency
  between them
- T010 (typecheck) can run in parallel with T011 (manual quickstart run) in Polish
- User Story 3 (T007/T008) has no dependency on User Story 1 or 2, so a second contributor
  could build it in parallel with US1/US2 if staffed that way, merging before US4

---

## Parallel Example: User Story 3

```bash
Task: "Add folder icon in web/src/components/FolderTree.tsx"
Task: "Add folder icon in web/src/components/ContentsTable.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 3: User Story 1 (Phase 2/Foundational is empty for this feature)
3. **STOP and VALIDATE**: Run quickstart.md Scenarios 1–3 in a real browser
4. This is the smallest usable slice: Back/Forward no longer leaves the app, which is the
   single most disruptive problem being fixed

### Incremental Delivery

1. Complete Setup → nothing to validate yet (just a dependency install)
2. Add User Story 1 → validate independently (MVP - fixes the "leaves the page" bug)
3. Add User Story 2 → validate independently (root expanded by default)
4. Add User Story 3 → validate independently (folder icons)
5. Add User Story 4 → validate independently (row striping)
6. Each story adds value without breaking the previous ones

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Unlike features 001/002, this feature's Foundational phase is genuinely empty - the four
  stories are independent enough that none of them block the others; the file-level
  sequencing noted above (US2 after US1, US4 after US3) is about avoiding edit conflicts
  in the same file, not a behavioral dependency
- Verify T002 fails before implementing T003
- T004 (the `navigate` router) and T005 (baseline entry + `popstate` listener) were split
  out of what was originally one dense task, per `/speckit-analyze` U2, so a failed
  quickstart scenario points at a narrower piece of code
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
