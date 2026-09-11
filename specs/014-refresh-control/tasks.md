---

description: "Task list template for feature implementation"
---

# Tasks: Refresh Control

**Input**: Design documents from `/specs/014-refresh-control/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-behavior.md, quickstart.md

**Tests**: The new server-side route handler gets a test-first unit test - thin, but
genuine, logic (its first real caller of `HierarchyCache.invalidate()`), per constitution
Principle V's main clause. Everything else in this feature reuses existing, already-tested
fetch functions and introduces no new client-side derivation logic, so it's covered by
manual `quickstart.md` verification instead, per that same principle's explicit carve-out.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project: backend route code lives under `src/server/`; frontend code under
`web/src/`; the one new unit-test file lives under `tests/unit/server/`.

---

## Phase 1: Setup

**Purpose**: Confirm the feature needs no new dependencies before touching any code.

- [X] T001 Verify `@mui/icons-material/Refresh` is already available in
      `node_modules` (it is - the package is already installed and used elsewhere in this
      app) - no `npm install` required.

**Checkpoint**: No dependency work needed - proceed directly to User Story 1.

**Note**: This feature has no Foundational phase - its two stories share no blocking
prerequisite beyond Setup. (User Story 2 does depend on User Story 1's own button
existing to wire a click handler onto - see Dependencies below - but that's a
story-to-story dependency, not shared foundational work blocking both up front.)

---

## Phase 2: User Story 1 - A visible, well-placed refresh control (Priority: P1) 🎯 MVP

**Goal**: A refresh control renders in the top-right corner, on the same row as the
Navigator/Infra/Output tabs and close to their height, showing a conventional refresh icon
(FR-001–FR-003).

**Independent Test**: Load the tool in a browser; confirm a refresh control renders in the
top-right corner, vertically aligned with the tab row and close to its height, showing a
recognizable refresh icon - checkable by inspection alone, even before its click behavior
(User Story 2) is wired up.

### Implementation for User Story 1

- [X] T002 [US1] In `web/src/App.tsx`, wrap the existing `<Tabs>` element and a new
      `IconButton` (containing `RefreshIcon` from `@mui/icons-material/Refresh`, no
      `onClick` yet) in a shared flex row (`display: "flex"`, `alignItems: "center"`,
      `justifyContent: "space-between"`), `IconButton` on the right, vertically centered
      against the tabs' own height rather than a hardcoded pixel value (depends on T001;
      FR-001/FR-002/FR-003, research.md § 5).
- [X] T003 [US1] Manually verify quickstart.md Scenario 1 via Playwright: the control
      renders in the top-right corner, on the same row as the tabs, close to their height,
      with a recognizable refresh icon.

**Checkpoint**: User Story 1 is fully functional and independently testable - the control
exists and looks right, even though selecting it does nothing yet.

---

## Phase 3: User Story 2 - Refreshing stale cached folder structure (Priority: P1)

**Goal**: Selecting the control invalidates the server's cached folder structure for every
tab at once and re-fetches whatever is currently displayed, preserving the current
selection when it still exists and falling back to a sensible default when it doesn't
(FR-004–FR-011).

**Independent Test**: With the tool already running against a project, add a new file on
disk, select the refresh control, and confirm the new file becomes visible in the
currently displayed tree/listing without restarting the tool.

### Tests for User Story 2 ⚠️

> Genuine (if thin) logic - the first real caller of `HierarchyCache.invalidate()` - write
> this first and confirm it fails before implementing T005.

- [X] T004 [P] [US2] Write a failing unit test in `tests/unit/server/refresh.test.ts` for
      `getRefreshResponse`: given a stub `HierarchyCache` whose `invalidate` records
      whether/how it was called, confirm `getRefreshResponse(root, cache)` calls
      `cache.invalidate(root)` exactly once and resolves to `{ status: 200 }` with no body
      (contracts/ui-behavior.md).

### Implementation for User Story 2

- [X] T005 [US2] Implement `getRefreshResponse(root, cache)` in
      `src/server/routes/refresh.ts` to make T004 pass (depends on T004; FR-004,
      research.md § 1).
- [X] T006 [US2] Wire `GET /api/refresh` into `src/server/api-router.ts`, calling
      `getRefreshResponse(root, cache)` (depends on T005).
- [X] T007 [P] [US2] In `web/src/api.ts`, add `fetchRefresh(): Promise<void>` calling
      `GET /api/refresh`, throwing on a non-ok response like this file's other fetch
      functions (depends on T006).
- [X] T008 [P] [US2] In `web/src/navigatorApi.ts`, export `findPrdFolderEntry(tree,
      itemId)`, moved from its current unexported, local definition in
      `NavigatorDetailPane.tsx` (research.md § 3).
- [X] T009 [US2] In `web/src/components/NavigatorDetailPane.tsx`, remove its own local
      `findPrdFolderEntry` and import the shared one from `navigatorApi.ts` instead - no
      behavior change (depends on T008).
- [X] T010 [P] [US2] In `web/src/components/NavigatorView.tsx`, accept a new
      `refreshToken: number` prop and apply it as `key={refreshToken}` on
      `NavigatorDetailPane` only, not on the tree sidebar beside it (research.md § 3).
- [X] T011 [US2] In `web/src/App.tsx`, add `refreshing`/`refreshToken` state and a refresh
      handler: calls `fetchRefresh()`; then re-fetches `fetchTabs()` (updating
      `availability`); for each available folder tab, re-fetches `fetchTree(tabId)` and
      attempts `fetchContents(tabId, tabStates[tabId].selectedPath)`, falling back to the
      freshly-fetched tree's own root path on failure (`expandedPaths` left as-is either
      way); re-fetches `fetchNavigatorTree()` and, using the shared `findPrdFolderEntry`
      (T008) or the fresh tree's own `sprintStatusAvailable` flag, resets
      `navigatorSelectedItemId` to `null` if it no longer resolves; then increments
      `refreshToken` (depends on T007, T008, T010; FR-004/FR-005/FR-006, research.md
      §§ 2/3/4). Each of these re-fetches applies its own state update independently as it
      resolves - no rollback if a sibling re-fetch later fails (contracts/ui-behavior.md
      "Partial-failure semantics").
- [X] T012 [US2] Wire User Story 1's `IconButton` (T002) to call the T011 handler: sets
      `refreshing = true` and disables the button with a rotating icon (`sx` keyframe)
      while in flight; on completion (success or failure) sets `refreshing = false`; on
      failure, briefly renders the icon with `color="error"` before reverting (depends on
      T002, T011; FR-008/FR-009, research.md § 6).
- [X] T013 [US2] Manually verify quickstart.md Scenarios 2–7 via Playwright: Infra/Output
      pick up an added file; falling back to the tab root when the selected folder is
      deleted; the PRD detail view's tiles and Sprint Status both reflecting on-disk
      changes after a refresh (via the `NavigatorDetailPane` remount); the Navigator
      selection resetting when the selected item disappears; no overlapping refreshes; and
      failure feedback.

**Checkpoint**: Both user stories are fully functional - the control exists, looks right,
and selecting it genuinely refreshes every tab's data.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Confirm nothing regressed across the whole test suite and existing behavior.

- [X] T014 [P] Run the full `npm test` suite and confirm `refresh.test.ts` passes
      alongside every pre-existing test with zero regressions.
- [X] T015 Manually verify quickstart.md's Regression pass: an open file-viewer dialog is
      untouched by a refresh; history (back/forward) still works; the requirement-code
      index column (feature 012) and the reviews/addendum/memory-log tiles (feature 013)
      still behave exactly as before (FR-011, SC-005); and that triggering a refresh
      creates, modifies, or deletes no file anywhere under the project root (FR-007) -
      confirmed by construction (`HierarchyCache.invalidate()` is a pure in-memory
      operation, feature 001) but never previously checked explicitly for this feature's
      own new code.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately.
- **User Story 1 (Phase 2)**: Depends on Setup only.
- **User Story 2 (Phase 3)**: Depends on Setup; its final wiring task (T012) also depends
  on User Story 1's own button (T002) already existing to attach a click handler to - so
  in practice, complete Phase 2 before Phase 3, even though both are P1.
- **Polish (Phase 4)**: Depends on both user stories being complete.

### Within Each User Story

- User Story 2's test (T004) MUST be written and confirmed failing before T005.
- T005 before T006; T006 before T007; T008 before T009; T007/T008/T010 before T011; T002/
  T011 before T012.

### Parallel Opportunities

- T007, T008, and T010 (User Story 2) touch different files and can all run in parallel
  once their own individual dependencies (T006, none, none respectively) are met.
- T014 is independent of T015 and can run in parallel.

---

## Parallel Example: User Story 2 (after T006 completes)

```bash
# Launch T007, T008, and T010 together - different files, no shared dependency:
Task: "Add fetchRefresh() in web/src/api.ts"
Task: "Export findPrdFolderEntry from web/src/navigatorApi.ts"
Task: "Accept refreshToken prop in web/src/components/NavigatorView.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: User Story 1.
3. **STOP and VALIDATE**: Run quickstart.md Scenario 1 independently.
4. This alone already gives the control its correct look and placement - a meaningful,
   inspectable increment even before it does anything on click.

### Incremental Delivery

1. Setup → foundation ready.
2. User Story 1 → validate → the control looks and sits right (MVP for appearance).
3. User Story 2 → validate → selecting it actually refreshes every tab's data.
4. Polish → full regression pass.

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- This feature's core backend enabler - `HierarchyCache.invalidate()` - already existed
  and was already tested before this feature began (feature 001); T004/T005 are about
  exposing it, not building it from scratch.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
