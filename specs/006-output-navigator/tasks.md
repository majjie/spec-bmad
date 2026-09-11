---

description: "Task list template for feature implementation"
---

# Tasks: Output Navigator Tab

**Input**: Design documents from `/specs/006-output-navigator/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. `groupPrdFolders` and `parseSprintStatus` are genuine parsing/
derivation logic under constitution Principle V's main clause (like feature 005's
`parseCsvGrid`), not just UI-adjacent pure logic, so they get full test-first coverage.
The tree/tile rendering itself is UI/rendering, manually verified per Principle V's
carve-out (`quickstart.md`). Route handlers get integration-level HTTP contract tests,
matching this project's existing coverage of `/api/tree`, `/api/contents`, `/api/file`.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Per `plan.md` § Project Structure: a new `src/navigator/` module for pure logic, two new
route files under `src/server/routes/`, and a new `web/src/components/Navigator*.tsx`
family alongside the existing `FolderTree`/`ContentsTable` (not a modification of them).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add this feature's one new dependency - the project's first genuine runtime
dependency (plan.md's Constitution Check)

- [X] T001 Add `js-yaml` (`^5.4.1`) to root `package.json`'s `dependencies` (a new,
      non-dev field - js-yaml v5 ships its own TypeScript types, so no `@types/js-yaml`
      is needed); run `npm install`

---

## Phase 2: Foundational

No cross-story blocking work is needed for this feature - User Story 2 only extends files
User Story 1 creates (`NavigatorTree.tsx`, `NavigatorDetailPane.tsx`,
`src/server/api-router.ts`); nothing needs to land before US1 itself. Proceed directly to
User Story 1.

---

## Phase 3: User Story 1 - Browse PRDs by project and date (Priority: P1) 🎯 MVP

**Goal**: A "Navigator" tab appears (before "Infra"/"Output", only when `_bmad-output`
exists) with a left-hand tree grouping `planning-artifacts/prds` folders by project and
date; selecting a folder shows its name in the right-hand pane.

**Independent Test**: With a project containing PRD folders spanning at least two projects
and multiple dates each, plus one non-conforming folder, open the tab and confirm the
grouping, ordering, and selection behavior described in spec.md's own Independent Test for
this story.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T002 [P] [US1] Unit tests for `groupPrdFolders()` in
      `tests/unit/navigator/prd-grouping.test.ts`: the prd-foo/prd-bar/
      not-following-convention example from spec.md (dates descending within each
      project); two folders differing only by the case of their project portion produce
      two separate project groups; a bare date-only folder name (no project text before
      it) is treated as non-conforming; projects and non-conforming folders are each
      sorted by code-point order; an empty input list returns `{ projects: [],
      nonConforming: [] }`

### Implementation for User Story 1

- [X] T003 [US1] Implement `groupPrdFolders()` in `src/navigator/prd-grouping.ts` per
      `data-model.md` and `research.md` § 3; must make T002 pass
- [X] T004 [P] [US1] Extend `TabId`/`TabAvailability` to add `"navigator"`/
      `navigator: boolean` in both `src/server/types.ts` and `web/src/api.ts` (kept in
      sync, mirroring how the existing `infra`/`output` fields are already duplicated
      across both files)
- [X] T005 [US1] Update `getTabsResponse()` in `src/server/routes/tabs.ts` to report
      `navigator: root.bmadOutputFolderPath !== null` (FR-002) - the same signal `output`
      already uses; depends on T004
- [X] T006 [US1] Implement `GET /api/navigator/tree` in
      `src/server/routes/navigator-tree.ts`: locate `planning-artifacts/prds` within the
      cached `_bmad-output` tree (mirroring `src/server/tab-tree.ts`'s
      `findFolderNodeByPath` traversal), call `groupPrdFolders()` on its direct
      subfolders (or set `prd: null` per FR-008 when the folder is absent or has no
      subfolders), and compute `sprintStatusAvailable` via a stat-based existence check on
      `implementation-artifacts/sprint-status.yaml`; return `NavigatorTree`
      (`data-model.md`); 404 if `_bmad-output` itself doesn't exist for this project;
      depends on T003, T005
- [X] T007 [US1] Wire `/api/navigator/tree` into `src/server/api-router.ts`'s
      `createApiRequestHandler`, following the existing regex-match-per-route pattern;
      depends on T006
- [X] T008 [US1] Add integration test cases to `tests/integration/web-server.test.ts` for
      `GET /api/navigator/tree` (200 with populated `prd`, 200 with `prd: null` when the
      prds folder is absent/empty, 404 when `_bmad-output` doesn't exist, `sprintStatusAvailable:
      true` when the sprint-status file exists and `false` when it doesn't - FR-011's
      underlying data signal, not just its UI-rendering consequence) and for the extended
      `GET /api/tabs` (`navigator` reflects `_bmad-output` presence); depends on T007
- [X] T009 [P] [US1] Implement `fetchNavigatorTree(): Promise<NavigatorTree>` in new file
      `web/src/navigatorApi.ts`, following `web/src/api.ts`'s existing `fetch`-wrapper
      conventions; depends on T007
- [X] T010 [P] [US1] Implement `web/src/components/NavigatorTree.tsx`: renders the "PRD"
      root (only when `prd !== null`, FR-008) as a multi-root `@mui/x-tree-view`
      `SimpleTreeView` - one item per project (expand/collapse only, FR-010, itemId
      `` `prd:${project}` ``), one item per that project's date entry and per
      non-conforming entry (both selectable, itemId = their `path`, FR-009) - per
      `contracts/ui-behavior.md`; both the "PRD" root and (once US2 adds it) "Sprint
      Status" root start expanded by default
- [X] T011 [P] [US1] Implement `web/src/components/NavigatorDetailPane.tsx`: an empty/
      prompt state when nothing is selected, and - when a PRD date or non-conforming
      itemId is selected - plain text showing that entry's `folderName` (FR-009); selecting
      the "PRD" root or a project itemId must not change this pane's content (FR-010)
- [X] T012 [US1] Implement `web/src/components/NavigatorView.tsx`: renders
      `<NavigatorTree>` + `<NavigatorDetailPane>` side by side (mirroring the existing
      Infra/Output two-`Box` layout) and filters out clicks on structural-only itemIds
      (`"prd"`, `` `prd:${project}` ``, FR-010) before calling its `onNavigate` prop.
      **Design deviation from the original plan**: this ended up as a controlled/
      presentational component rather than one that owns fetch/selection state itself -
      `App.tsx`'s existing generic `navigate()` unconditionally calls `fetchContents`,
      which doesn't apply to Navigator's opaque node-ids, so the tree fetch and the
      history-integrated selection state had to move up to `App.tsx` (T013) instead, next
      to the single shared `currentNavStateRef` that redundancy-detection depends on
      across every tab; depends on T009, T010, T011
- [X] T013 [US1] Wire the "Navigator" tab into `web/src/App.tsx`: prepend `"navigator"` to
      `TAB_IDS` (label "Navigator") so it renders before "Infra"/"Output" (FR-001), gated
      on `TabAvailability.navigator` (FR-002); fetch `NavigatorTree` once (extending the
      existing mount effect) and add a Navigator-specific `navigateNavigator(itemId)`
      function - pushing `{ tab: "navigator", path: itemId }` via the existing shared
      `currentNavStateRef`/`statesEqual`/`pushState` mechanism, but skipping
      `fetchContents` entirely (unlike the existing generic `navigate()`) - plus a
      `state.tab === "navigator"` branch in the `popstate` handler that restores selection
      without going through the generic `navigate()` either; renders `<NavigatorView>`
      instead of the existing `<FolderTree>`+`<ContentsTable>` pair when
      `activeTab === "navigator"`;
      depends on T004, T012

**Checkpoint**: At this point, User Story 1 should be fully functional and testable
independently (quickstart.md Scenarios 1–3, and the "no Sprint Status root" half of
Scenario 7)

---

## Phase 4: User Story 2 - View sprint status at a glance (Priority: P2)

**Goal**: A "Sprint Status" root node (shown only when `sprint-status.yaml` exists) whose
detail pane renders a Summary tile plus one Status tile per epic.

**Independent Test**: With a project containing a valid sprint-status file, open the
Sprint Status node and confirm the Summary tile and per-epic Status tiles described in
spec.md's own Independent Test for this story, including that epic `1` and epic `10`/`11`
are never confused.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T014 [P] [US2] Unit tests for `parseSprintStatus()` in
      `tests/unit/navigator/sprint-status.test.ts`: full summary + epics extraction from
      a sample-shaped object; epic `1`'s stories (`1-1-...`, `1-6a-...`) are not confused
      with epic `10`'s or `11`'s (delimiter-based match); an epic with no
      `epic-N-retrospective` key yields `retrospectiveStatus: null`; an entry matching
      neither an epic key nor any epic's numbered-story grouping is excluded (FR-015); a
      `development_status` that's absent, empty, or not an object yields `epics: []`
      without throwing

### Implementation for User Story 2

- [X] T015 [US2] Implement `parseSprintStatus()` in `src/navigator/sprint-status.ts` per
      `data-model.md` and `research.md` § 4 (the two-pass derivation); must make T014
      pass
- [X] T016 [US2] Implement `GET /api/navigator/sprint-status` in
      `src/server/routes/navigator-sprint-status.ts`: read
      `implementation-artifacts/sprint-status.yaml` fresh, call `js-yaml`'s `load()` then
      `parseSprintStatus()`; 404 if the file doesn't exist, 422 with `{ error: string }` if
      `load()` throws a `YAMLException` (FR-014), 200 with `SprintStatusResult` otherwise;
      depends on T015
- [X] T017 [US2] Wire `/api/navigator/sprint-status` into
      `src/server/api-router.ts` (same file as T007 - sequential, not parallel); depends
      on T007, T016
- [X] T018 [US2] Add integration test cases to `tests/integration/web-server.test.ts` for
      `GET /api/navigator/sprint-status` (200, 404, 422 on a deliberately malformed
      fixture); depends on T017
- [X] T019 [P] [US2] Extend `web/src/navigatorApi.ts` with
      `fetchSprintStatus(): Promise<SprintStatusResult>`, throwing a specific message on a
      422 response (mirroring `fetchFileContent`'s existing 415-specific-message
      handling); depends on T017
- [X] T020 [P] [US2] Implement `web/src/components/SprintStatusView.tsx`: a Summary tile
      (the six `SprintStatusSummary` fields, FR-012) and one Status tile per
      `EpicStatusGroup` in array order (epic status, its stories with their own statuses,
      its retrospective status - `null` shown as e.g. "not started"); an empty-state
      message in place of Status tiles when `epics.length === 0`
- [X] T021 [P] [US2] Extend `web/src/components/NavigatorTree.tsx` (from T010) to render
      the "Sprint Status" root item when `sprintStatusAvailable` is true (itemId
      `"sprint-status"`, selectable, no children, FR-011)
- [X] T022 [US2] Extend `web/src/components/NavigatorDetailPane.tsx` (from T011) to
      dispatch a `"sprint-status"` selection to `<SprintStatusView>`, fetching via
      `fetchSprintStatus()` once per selection (cached in `NavigatorView`'s state so
      re-selecting doesn't re-fetch) and rendering the 422 error message in place of the
      tiles on failure (FR-014); depends on T019, T020

**Checkpoint**: Both user stories should now be independently functional (all of
quickstart.md's scenarios)

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verification that spans both stories

- [X] T023 Run `npm test` (the full automated suite) and confirm everything passes: the
      new `tests/unit/navigator/*.test.ts` files, the extended
      `tests/integration/web-server.test.ts`, and every untouched existing suite - per
      constitution Development Workflow ("All changes MUST pass type-checking and the
      automated test suite before merge")
- [X] T024 [P] Run `npm run typecheck` and resolve any strict-mode type errors introduced
      by the new dependency/code
- [X] T025 Execute `quickstart.md` Scenarios 1–7 in a real desktop browser and confirm
      each matches its expected outcome - actually performed this time (not just disclosed
      as unavailable): installed headless Chromium via Playwright (cached from feature
      005's debugging session) and drove the live CLI server through all 7 scenarios,
      screenshotting each. All passed, including the critical epic-1-vs-epic-10
      disambiguation proof. One real finding along the way: the tree already starts
      correctly expanded by default (confirmed via `aria-expanded="true"` before any
      interaction) - an early verification script mistakenly clicked the already-expanded
      "PRD" root and collapsed it, which looked like a bug until inspecting the DOM
      directly; the application itself had no bug here, only the script did

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Empty for this feature - no cross-story blocking work exists
- **User Story 1 (Phase 3)**: Depends only on Setup completing; no dependency on User
  Story 2
- **User Story 2 (Phase 4)**: Depends on User Story 1 - it extends
  `NavigatorTree.tsx`/`NavigatorDetailPane.tsx`/`api-router.ts`, all created by US1, and its
  route depends on the `sprintStatusAvailable` field US1's tree route already computes
- **Polish (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independently testable; no dependency on User Story 2
- **User Story 2 (P2)**: Independently testable once implemented, but its tasks extend
  files User Story 1 creates - sequence after US1

### Within Each User Story

- Tests MUST be written (and confirmed failing) before implementation
- `groupPrdFolders`/`parseSprintStatus` (pure logic) before the route that calls them
- A story's route implementation before that route is wired into `api-router.ts`
- A story's route being wired in before that story's integration tests are added
- A story's `navigatorApi.ts` fetch function before the component that calls it
  (`NavigatorView.tsx` for T009; `NavigatorDetailPane.tsx`'s US2 extension for T019)

### Parallel Opportunities

- T004 (type extension) can run in parallel with T002/T003 (`groupPrdFolders` and its
  test) - different files, no dependency between the two tracks; they converge at T006
- T009, T010, T011 (US1's `navigatorApi.ts`, `NavigatorTree.tsx`, `NavigatorDetailPane.tsx`)
  can all run in parallel - different files, none calls another
- T019, T020, T021 (US2's `navigatorApi.ts` extension, `SprintStatusView.tsx`,
  `NavigatorTree.tsx` extension) can all run in parallel - different files
- T024 (typecheck) can run in parallel with T023 (test suite) and T025 (manual quickstart)
  in Polish

---

## Parallel Example: User Story 1

```bash
Task: "Unit tests for groupPrdFolders() in tests/unit/navigator/prd-grouping.test.ts"
Task: "Extend TabId/TabAvailability in src/server/types.ts and web/src/api.ts"
```

```bash
# After T006-T009 land:
Task: "Implement web/src/navigatorApi.ts's fetchNavigatorTree()"
Task: "Implement web/src/components/NavigatorTree.tsx"
Task: "Implement web/src/components/NavigatorDetailPane.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 3: User Story 1 (Phase 2/Foundational is empty for this feature)
3. **STOP and VALIDATE**: Run quickstart.md Scenarios 1–3 in a real browser
4. This is the smallest usable slice: PRD browsing works end-to-end, just without a
   Sprint Status view yet

### Incremental Delivery

1. Complete Setup → nothing to validate yet (just a dependency install)
2. Add User Story 1 → validate independently (MVP - PRD browsing)
3. Add User Story 2 → validate independently (Sprint Status tiles)
4. Each story adds value without breaking the previous one

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- This feature's core value proposition (correctly grouping PRD folders, and correctly
  disambiguating epic numbers) is genuine parsing/derivation logic per constitution
  Principle V's main clause - T002/T014 are as important as any backend test task in
  earlier features, not a thin sliver alongside mostly-manual UI work
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
