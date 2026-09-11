---

description: "Task list template for feature implementation"
---

# Tasks: Web Artifact Explorer

**Input**: Design documents from `/specs/002-web-artifact-explorer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included for server/data logic - constitution Principle V requires test-first for
this feature's parsing/data logic (tree filtering, contents enrichment, sort ordering).
The React UI itself is validated manually per Principle V's explicit UI-rendering carve-out
(see quickstart.md), so no automated component-rendering tests are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Per `plan.md` § Project Structure: `src/server/` (backend, extends the existing single
package), `web/` (frontend source, built to `web/dist/`), `tests/` at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Frontend/backend project scaffolding

- [X] T001 Scaffold the frontend project: `web/index.html`, `web/vite.config.ts` (React
      plugin, build output to `web/dist/`); add `react`, `react-dom`, `@mui/material`,
      `@mui/x-tree-view`, `@emotion/react`, `@emotion/styled`, `vite`,
      `@vitejs/plugin-react` to root `package.json` devDependencies; add a
      `"build:web": "vite build --config web/vite.config.ts"` npm script; run
      `npm install`
- [X] T002 Create the backend directory skeleton: `src/server/`, `src/server/routes/`,
      `tests/unit/server/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be
implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Define the shared types from `data-model.md` (`TabId`, `TabAvailability`,
      `FolderTreeNode`, `ContentsEntry`) in `src/server/types.ts`
- [X] T004 [P] Implement the dependency-free HTTP server bootstrap in
      `src/server/http-server.ts`: binds `127.0.0.1` on an OS-assigned port
      (`listen(0, '127.0.0.1')`), a router that dispatches registered GET route handlers
      (injected, not yet implemented) and falls back to static file serving, resolves once
      listening with the actual `http://127.0.0.1:<port>` URL, and closes cleanly on
      `SIGINT` (research.md § 6, constitution Principle III)
- [X] T005 [P] Implement static file serving in `src/server/static-files.ts`: serves files
      from `web/dist/` with correct MIME types by extension, falling back to
      `web/dist/index.html` for any unrecognized path (contracts/http-api.md)
- [X] T006 [P] Scaffold the Vite/React entry point: `web/src/main.tsx` mounting a
      placeholder `web/src/App.tsx` (e.g. a loading message), so `npm run build:web`
      produces a working, if empty, page - depends on T001

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Browse the Infra tab's folder tree (Priority: P1) 🎯 MVP

**Goal**: A working Infra tab - folder tree on the left bound to `_bmad`, sortable-later
contents table on the right, click-to-navigate in both directions - served by the CLI's
existing valid-folder path instead of that path just exiting.

**Independent Test**: Open the UI against a project with a populated `_bmad` folder;
expand/collapse tree nodes, click into a nested folder, and confirm the right-hand table
shows exactly that folder's direct children (per spec.md's own Independent Test for this
story).

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T007 [P] [US1] Unit test in `tests/unit/server/tree.test.ts`: the tree-filtering
      helper converts a feature-001 `ArtifactNode` tree into a folders-only
      `FolderTreeNode` tree, dropping file entries at every level (FR-003, data-model.md)
- [X] T008 [P] [US1] Unit test in `tests/unit/server/contents.test.ts`: the
      contents-enrichment helper returns `ContentsEntry[]` for a folder's direct children,
      with `size: null` for folder entries, correct byte `size` for file entries, and
      `createdAt`/`updatedAt` sourced from `fs.stat()` (FR-006, research.md § 4/§5)
- [X] T009 [P] [US1] Integration test in `tests/integration/web-server.test.ts`: start the
      server against a fixture project and assert `GET /api/tabs`, `GET /api/tree/infra`,
      and `GET /api/contents/infra?path=<root>` match the shapes/status codes in
      `contracts/http-api.md` for the valid-folder case. Also assert each documented error
      response: `GET /api/tree/bogus-tab` → 404; `GET /api/contents/infra` (no `path`) →
      400; `GET /api/contents/infra?path=<nonexistent>` → 404; `GET
      /api/contents/infra?path=<a real folder outside infra's tree, e.g. a temp dir
      unrelated to the fixture project>` → 403 (contracts/http-api.md)
- [X] T010 [US1] Update BOTH existing feature-001 tests in
      `tests/integration/cli-folder-resolution.test.ts` that exercise the valid-folder path
      - "valid folder: exits 0 with no error output" AND "no folder argument: defaults to
      the current working directory" - since both currently use `spawnSync` and assert an
      immediate `exit 0`, which no longer happens once a valid folder starts a persistent
      server. Switch both to the Node.js async `child_process.spawn` (not `spawnSync`,
      which would hang forever waiting for a process that no longer exits on its own),
      parse the printed `http://127.0.0.1:<port>` URL from stdout, assert `GET /api/tabs`
      on it responds successfully, then send `SIGINT` to the child process and await its
      exit before the test ends. Confirm both updated tests FAIL against the current
      (feature-001) `cli.ts` before continuing

### Implementation for User Story 1

- [X] T011 [US1] Implement the tree-filtering helper and `GET /api/tree/:tab` route in
      `src/server/routes/tree.ts`, building a `FolderTreeNode` tree from feature 001's
      cached `ArtifactNode` for the requested tab; return 404 when `:tab` is neither
      `infra` nor `output` (contracts/http-api.md); depends on T003, T004, and must make
      T007 and T009's unknown-tab assertion pass
- [X] T012 [US1] Implement the contents-enrichment helper and `GET /api/contents/:tab`
      route (reading the `path` query param) in `src/server/routes/contents.ts`,
      `fs.stat()`-ing each direct child. Before touching the filesystem, the route MUST
      verify `path` is equal to, or a descendant of, `:tab`'s own root folder path - using
      `path.relative(root, path)` and rejecting if the result starts with `..` or is
      absolute, not a naive string-prefix check (which would wrongly accept a sibling like
      `/foo/bar-evil` as a descendant of `/foo/bar`) - and respond 403 if not -
      `path` is caller-supplied and this server has no other access control
      (contracts/http-api.md, constitution Principle II). Also return 400 when `path` is
      missing and 404 when it's within the tree but no longer exists on disk. Depends on
      T003, T004, and must make T008 and the error-case assertions in T009 pass
- [X] T013 [US1] Implement `GET /api/tabs` in `src/server/routes/tabs.ts`, deriving
      `TabAvailability` from the resolved `ProjectRoot`'s `bmadFolderPath`/
      `bmadOutputFolderPath`; depends on T003, T004; exercised by T009
- [X] T014 [US1] Implement `web/src/App.tsx`'s real behavior: fetch `GET /api/tabs` on
      load, render "Infra"/"Output" tabs (FR-001), select "Infra" by default (FR-002),
      each tab owning its own tree/selection state per `data-model.md`'s Tab view state;
      depends on T006
- [X] T015 [US1] Implement `web/src/components/FolderTree.tsx` (wraps
      `@mui/x-tree-view`, bound to `GET /api/tree/:tab`, expand/collapse via click,
      click-to-select per FR-004/FR-005) and `web/src/components/ContentsTable.tsx`
      (renders `GET /api/contents/:tab?path=...` results; clicking a folder row
      navigates like the tree per FR-007; clicking a file row no-ops per FR-008; when
      the response is an empty array, renders an empty-state message instead of an empty
      or missing table, per FR-013); depends on T014
- [X] T016 [US1] Extend `src/cli.ts`'s valid-folder branch to start the HTTP server
      (via T004's bootstrap, wired to T011/T012/T013's routes and T005's static
      serving) instead of exiting immediately, printing the listening URL to stdout;
      depends on T004, T011, T012, T013, and must make the updated T010 pass

**Checkpoint**: At this point, User Story 1 should be fully functional and testable
independently (quickstart.md Scenarios 1–3)

---

## Phase 4: User Story 2 - Browse the Output tab independently (Priority: P2)

**Goal**: The Output tab works via the same generic routes/components against
`_bmad-output`, a missing tab folder shows an empty state instead of breaking (FR-012),
and each tab's navigation state is kept fully independent (FR-011).

**Independent Test**: With the Infra tab showing some folder's contents, switch to Output,
navigate elsewhere, switch back to Infra, and confirm Infra's tree state and selection were
unaffected (per spec.md's own Independent Test for this story).

### Tests for User Story 2 ⚠️

- [X] T017 [P] [US2] Unit test in `tests/unit/server/tabs.test.ts`: `TabAvailability`
      correctly reports `false` for a tab whose folder is absent from the `ProjectRoot`
      (FR-012)
- [X] T018 [P] [US2] Integration test in `tests/integration/web-server.test.ts`: against a
      fixture project with only `_bmad` (no `_bmad-output`), `GET /api/tree/output`
      returns the missing-folder response defined in `contracts/http-api.md`

### Implementation for User Story 2

- [X] T019 [US2] Implement the FR-012 missing-folder response (404) in
      `src/server/routes/tree.ts` when the requested tab's folder is absent; depends on
      T011, T013, and must make T017/T018 pass (already satisfied by T011's
      `getCachedTabTree` returning `undefined` when a tab's root path is `null` -
      confirmed by T017/T018 passing with no further code changes)
- [X] T020 [US2] Implement per-tab independent view state in `web/src/App.tsx` (separate
      `expandedPaths`/`selectedPath` per `TabId`, so switching tabs never resets the
      other's state, per FR-011) and the empty-state message in `FolderTree.tsx` when a
      tab's tree request 404s (FR-012); depends on T014, T015, T019 (already satisfied by
      T014's per-`TabId` state record and T015's null-tree fallback message)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently
(quickstart.md Scenarios 4–5)

---

## Phase 5: User Story 3 - Sort folder contents by column (Priority: P3)

**Goal**: Clicking a column header sorts the contents table by that column, grouping
folders before files, and toggles direction on repeat clicks.

**Independent Test**: Open a folder with several mixed files and subfolders; click each
column header in turn and confirm the row order changes to match that column, ascending,
folders first; click the same header again and confirm the order reverses within each
group (per spec.md's own Independent Test for this story).

### Tests for User Story 3 ⚠️

- [X] T021 [P] [US3] Unit test in `tests/unit/web/sortEntries.test.ts`: a pure
      `sortContentsEntries(entries, column, direction)` function groups folder entries
      before file entries, sorts each group by the given column, and produces the
      reversed order when `direction` is `"desc"` (Clarifications session, data-model.md
      § Sort state)

### Implementation for User Story 3

- [X] T022 [US3] Implement `sortContentsEntries` in `web/src/sortEntries.ts` per
      `data-model.md`'s Sort state; must make T021 pass
- [X] T023 [US3] Wire `web/src/components/ContentsTable.tsx`'s column headers to
      `sortContentsEntries` (FR-009/FR-010): click sorts ascending by that column; click
      the same header again toggles to descending; clicking a different header switches
      the sorted column (resetting to ascending); sort state resets to each view's default
      when the selected folder or active tab changes (User Story 3, Acceptance Scenario
      4); depends on T015, T022

**Checkpoint**: All user stories should now be independently functional (quickstart.md
Scenario 6)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cross-cutting visual/quality requirements that apply across all three stories

- [X] T024 [P] Apply the MUI dark theme (`web/src/theme.ts`, `mode: 'dark'`) consistently
      across the app (FR-015); depends on T014
- [X] T025 [P] Review the implementation for FR-014 (desktop-only): confirm no
      mobile-specific breakpoints/layout were introduced in `web/src/App.tsx` or its
      components; depends on T014, T015 (confirmed via grep - no `useMediaQuery`,
      breakpoint-keyed `sx`, or `Drawer` usage anywhere in `web/src/`)
- [X] T026 [P] Run `npm run typecheck` across `src/` and `web/src/` and resolve any
      strict-mode type errors
- [X] T027 Execute `quickstart.md` Scenarios 1–8 manually against a real fixture project
      and confirm each matches its expected outcome (partial - see implementation notes:
      no browser is available in this environment, so only the HTTP/data layer behind
      Scenarios 1, 3, 4, 5, 7 was verified; Scenarios 2, 6, 8 and the actual click/visual
      interactions need a human to confirm in a real browser)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational; no dependency on US2/US3
- **User Story 2 (Phase 4)**: Depends on Foundational and on `tree.ts`/`tabs.ts`/`App.tsx`/
  `FolderTree.tsx` existing from US1 - extends those same files, so implement after US1
- **User Story 3 (Phase 5)**: Depends on Foundational and on `ContentsTable.tsx` existing
  from US1 - extends that same file, so implement after US1 (independent of US2)
- **Polish (Phase 6)**: Depends on all three user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independently testable once Foundational is done
- **User Story 2 (P2)**: Independently testable on its own once implemented, but its
  implementation tasks extend files US1 creates (`tree.ts`, `App.tsx`, `FolderTree.tsx`) -
  sequence after US1 to avoid file conflicts
- **User Story 3 (P3)**: Independently testable on its own once implemented; extends
  `ContentsTable.tsx` from US1 but has no dependency on US2, so it could be built in
  parallel with US2 by a second contributor if needed

### Within Each User Story

- Tests MUST be written (and confirmed failing) before implementation
- Foundational types/server-bootstrap before route implementations
- Route implementations (`tree.ts`/`contents.ts`/`tabs.ts`) before `cli.ts` wiring (US1) or
  before their frontend consumers (`FolderTree.tsx`/`ContentsTable.tsx`)
- `App.tsx`'s tab shell before the components it renders

### Parallel Opportunities

- T003, T004, T005, T006 (Foundational) can all run in parallel - different files, no
  dependency between them
- T007, T008, T009 (US1 tests) can run in parallel - different files
- T017, T018 (US2 tests) can run in parallel - different files
- T024, T025, T026 (Polish) can run in parallel - different concerns, T027 last since it
  validates the finished whole

---

## Parallel Example: Foundational Phase

```bash
Task: "Define shared types in src/server/types.ts"
Task: "Implement HTTP server bootstrap in src/server/http-server.ts"
Task: "Implement static file serving in src/server/static-files.ts"
Task: "Scaffold Vite/React entry point in web/src/main.tsx"
```

## Parallel Example: User Story 1 Tests

```bash
Task: "Unit test tree-filtering in tests/unit/server/tree.test.ts"
Task: "Unit test contents-enrichment in tests/unit/server/contents.test.ts"
Task: "Integration test HTTP round trip in tests/integration/web-server.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart.md Scenarios 1–3 against a real project
5. This is the smallest usable slice: a working Infra tab, served by the CLI instead of it
   just exiting

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Validate independently (MVP!)
3. Add User Story 2 → Validate independently (Output tab + empty states)
4. Add User Story 3 → Validate independently (column sorting)
5. Each story adds value without breaking the previous ones

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 and US3 extend files US1 creates (`tree.ts`, `App.tsx`, `FolderTree.tsx`,
  `ContentsTable.tsx`); this mirrors feature 001's pattern of later stories extending
  earlier stories' files rather than each introducing a parallel set - not a coupling of
  behavior, since each story's tests exercise only that story's requirements
- The React UI (`App.tsx`, `FolderTree.tsx`, `ContentsTable.tsx`, `theme.ts`) is validated
  manually via `quickstart.md`, per constitution Principle V's UI-rendering carve-out - the
  *pure data-transformation* logic that happens to live in `web/` (`sortEntries.ts`) still
  gets test-first treatment since it's data logic, not rendering
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
