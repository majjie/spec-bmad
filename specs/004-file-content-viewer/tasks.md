---

description: "Task list template for feature implementation"
---

# Tasks: File Content Viewer

**Input**: Design documents from `/specs/004-file-content-viewer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included for server/data logic (`file.ts`'s binary detection, `getFileRenderMode`,
`statesEqual`'s extension) - constitution Principle V's main clause. The dialog itself, its
three rendering modes, and its history-close behavior are UI/rendering, validated manually
per Principle V's explicit carve-out (`quickstart.md`), matching features 002/003.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Per `plan.md` § Project Structure: one new backend route (`src/server/routes/file.ts`),
one new frontend component (`web/src/components/FileViewerDialog.tsx`) and pure module
(`web/src/fileRenderMode.ts`), plus targeted extensions to `web/src/App.tsx`,
`web/src/navigationHistory.ts`, `web/src/api.ts`, `web/src/components/ContentsTable.tsx`,
and `src/server/http-server.ts`/`api-router.ts`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the new frontend rendering dependencies

- [X] T001 Add `react-markdown`, `remark-gfm`, `react-syntax-highlighter`, and
      `@types/react-syntax-highlighter` to root `package.json` devDependencies
      (build-time only, bundled into `web/dist/` - research.md § 3/§4); run `npm install`
      (pinned `react-syntax-highlighter` to `^16.1.1` rather than the initially-planned
      `^15.x` - `npm audit` flagged a moderate PrismJS DOM-clobbering advisory in the
      `refractor`/`prismjs` transitive dependency chain at 15.x, fixed in 16.1.1; verified
      compatible with React 18 and with the `@types/react-syntax-highlighter` module
      declarations, which still match v16's `dist/esm/*` layout)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The one piece of logic all four user stories need - deciding how a file
should render at all

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Write unit tests for `getFileRenderMode(filename)` covering every branch in
      `tests/unit/web/fileRenderMode.test.ts`: `.gitignore` and other known extensionless
      names → `plain`; `.md` → `markdown`; `.yaml`/`.toml`/`.py` → `syntax` with the
      matching `language`; `.txt`/`.csv` → `plain`; an unrecognized extension → `plain`
      (data-model.md's derivation table)
- [X] T003 Implement `getFileRenderMode` in `web/src/fileRenderMode.ts` per
      `data-model.md`'s `FileRenderMode` type and derivation table; must make T002 pass

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View a file's contents in a full-screen dialog (Priority: P1) 🎯 MVP

**Goal**: Double-clicking a file opens a dialog filling the viewport (20px border) showing
its contents in monospace with line numbers; an "X" icon closes it back to the exact
folder view underneath; an unreadable/binary file shows an error instead.

**Independent Test**: Double-click a plain-text file (e.g. `.txt`, or no recognized
extension); confirm a full-screen dialog opens showing its contents in monospace with
line numbers, and confirm clicking the "X" closes it and the previously visible folder
contents are unchanged underneath (per spec.md's own Independent Test for this story).

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T004 [P] [US1] Add failing test cases to `tests/unit/web/navigationHistory.test.ts`
      for `statesEqual`'s new `openFile` field: two states are equal when both lack
      `openFile`; equal when both have the same `openFile` path; NOT equal when only one
      has `openFile` set, or when set to different paths (data-model.md's `NavigationState`
      extension)
- [X] T005 [P] [US1] Unit test `looksBinary()` in `tests/unit/server/file.test.ts`: returns
      `true` for a buffer containing a null byte within the scan window, `false` for
      ordinary UTF-8 text content (research.md § 2)
- [X] T006 [P] [US1] Integration test extending `tests/integration/web-server.test.ts` for
      `GET /api/file/:tab`: a real text file → 200 with its exact contents and
      `Content-Type: text/plain`; missing `path` → 400; unrecognized `:tab` → 400; a
      recognized `:tab` whose folder doesn't exist for the fixture project (e.g. `output`
      when only `_bmad` exists) → 404, matching `/api/tree/:tab`'s existing convention;
      `path` outside the tab's tree → 403; nonexistent `path` → 404; a file containing a
      null byte → 415 (contracts/http-api-addendum.md)

### Implementation for User Story 1

- [X] T007 [P] [US1] Extend `src/server/http-server.ts`'s `RouteResponse`/response-sending
      to support a plain-text body: add an optional `contentType` field, and when it's set
      and `body` is a `string`, send it as-is with that content type instead of
      JSON-encoding it; existing JSON routes (`tabs`/`tree`/`contents`) must keep working
      unchanged
- [X] T008 [US1] Extend `NavigationState`/`statesEqual` in `web/src/navigationHistory.ts`
      with the optional `openFile` field per `data-model.md`; must make T004 pass
- [X] T009 [US1] Implement `looksBinary()` and the `GET /api/file/:tab` route
      (`getFileResponse`) in `src/server/routes/file.ts` per
      `contracts/http-api-addendum.md`, reusing `isTabId`/`getTabRootPath`/`isWithinRoot`
      from `src/server/tab-tree.ts`. `:tab` being a recognized value whose folder doesn't
      exist for this project (i.e. `getTabRootPath` returns `null`) is a 404, matching
      `/api/tree/:tab`'s existing convention (feature 002) - NOT a 400, which is only for
      an unrecognized `:tab` value or a missing `path`. Wire the route into
      `src/server/api-router.ts`'s dispatch; depends on T007, and must make T005/T006 pass
- [X] T010 [US1] Add a `fetchFileContent(tab, path)` helper to `web/src/api.ts`: calls
      `GET /api/file/:tab?path=...` and returns the response text on 200, throwing a
      descriptive error for any other status
- [X] T011 [US1] Implement `web/src/components/FileViewerDialog.tsx`: an MUI `Dialog` sized
      to fill the viewport minus a 20px margin on every side via `sx` (research.md § 5,
      NOT the built-in `fullScreen` prop). Wire the `Dialog`'s own `onClose` prop - not
      just the "X" `IconButton`'s `onClick` - to the same `onClose` callback prop passed
      into `FileViewerDialog`: MUI's `Dialog.onClose` is what actually fires for Escape and
      backdrop-click (spec.md's Assumptions accept backdrop-click as an accepted 4th
      closing method), so both the `IconButton` and `Dialog`'s `onClose` must call the
      identical handler or FR-010 (Escape) silently won't work. Add a loading state while
      content is `null`, an error state, and - for this story's scope - the
      `{ kind: "plain" }` rendering path via `react-syntax-highlighter` (`language="text"`,
      `showLineNumbers`); depends on T003, T010
- [X] T012 [US1] Add an `onDoubleClick` handler to file rows only (not folder rows) in
      `web/src/components/ContentsTable.tsx` that calls a new `onOpenFile(path)` prop
- [X] T013 [US1] Implement `openFileDialog(path)`/`closeFileDialog()` in
      `web/src/App.tsx`: opening pushes a `NavigationState` carrying the *current*
      `tab`/`path` plus `openFile: path` (research.md § 6, data-model.md) and calls T010's
      `fetchFileContent`; closing calls `window.history.back()` (Clarifications session)
      rather than clearing dialog state directly; extend the existing `popstate` handler
      to also apply/clear `openFile` from the restored state (opening or closing the
      dialog as a side effect, same as `navigate` already does for tab/path); wire
      `FileViewerDialog` (`onClose={closeFileDialog}`) and `ContentsTable`'s new
      `onOpenFile` prop to `openFileDialog`; depends on T008, T009, T011, T012

**Checkpoint**: At this point, User Story 1 should be fully functional and testable
independently (quickstart.md Scenarios 1–3)

---

## Phase 4: User Story 2 - Close the dialog with Escape or the browser's Back action (Priority: P2)

**Goal**: Escape and the browser's Back action close the dialog the same way the "X" icon
does, and Forward/Back move through the same history stack correctly.

**Independent Test**: Open the dialog, press Escape, confirm it closes; open it again, use
the browser's Back action, confirm it closes the same way - without navigating the
underlying folder/tab view, and without leaving the application (per spec.md's own
Independent Test for this story).

- [X] T014 [US2] No new implementation expected *provided T011 wired `Dialog`'s own
      `onClose` prop as instructed* (not just the "X" `IconButton`'s `onClick`) - that's
      what makes Escape (and backdrop-click) fire `closeFileDialog` for free, and Back
      already flows through T013's extended `popstate` handler. Confirm both work via
      `quickstart.md` Scenarios 4–5 (including that Forward after an X/Escape close does
      *not* reopen the file, per the Clarifications session) - if Escape doesn't close the
      dialog, check first whether `Dialog`'s `onClose` was actually wired in T011 before
      treating this as new scope (code review confirms `<Dialog open={...} onClose={onClose}>`
      in `FileViewerDialog.tsx` is wired to the same `closeFileDialog` passed from `App.tsx`
      as the "X" `IconButton`'s `onClick` - actual Escape/Back behavior still needs
      confirming in a real browser per T018, since no browser is available in this
      environment)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently
(quickstart.md Scenarios 4–5)

---

## Phase 5: User Story 3 - Markdown files render as formatted content (Priority: P3)

**Goal**: `.md` files render as formatted HTML (headings, lists, tables) instead of raw
Markdown source, with no line numbers.

**Independent Test**: Double-click a `.md` file containing at least a heading, a list, and
a table; confirm each renders as formatted HTML rather than raw Markdown syntax, and
confirm no line numbers are shown (per spec.md's own Independent Test for this story).

### Implementation for User Story 3

- [X] T015 [US3] Extend `web/src/components/FileViewerDialog.tsx` to render
      `{ kind: "markdown" }` files via `react-markdown` with the `remark-gfm` plugin, with
      no line numbers (research.md § 3, FR-005); depends on T003, T011

**Checkpoint**: User Stories 1, 2, AND 3 should now all work independently
(quickstart.md Scenario 6)

---

## Phase 6: User Story 4 - Recognized code/config files get syntax highlighting (Priority: P4)

**Goal**: `.yaml`/`.toml`/`.py` files render with syntax-appropriate coloring, in addition
to the monospace font and line numbers every file already gets.

**Independent Test**: Double-click a `.yaml`, a `.toml`, and a `.py` file in turn; confirm
each shows line numbers plus coloring appropriate to that file type (per spec.md's own
Independent Test for this story).

### Implementation for User Story 4

- [X] T016 [US4] Extend `web/src/components/FileViewerDialog.tsx` to render
      `{ kind: "syntax", language } ` files via `react-syntax-highlighter` using that
      `language` with `showLineNumbers` (research.md § 4, FR-006); explicitly register the
      TOML language definition if the bundle variant in use requires it (research.md § 4's
      noted nuance); depends on T003, T011

**Checkpoint**: All four user stories should now be independently functional
(quickstart.md Scenario 7)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification that spans all four stories, plus two post-implementation
corrections found during user review (T019/T020) - added to `spec.md` as FR-012's
addendum and new FR-017/SC-005 before being fixed here, per constitution Principle I

- [X] T017 [P] Run `npm run typecheck` and resolve any strict-mode type errors introduced
      by the new dependencies/code
- [X] T019 [US1] Post-implementation correction (FR-012 addendum): wrap the close ("X")
      `IconButton` in `web/src/components/FileViewerDialog.tsx` in a `Box` with a
      semi-opaque background (`rgba(0, 0, 0, 0.6)`) and 4px padding, so it stays visible
      over arbitrary file content rendered behind it - found during user review, not
      caught by any automated test since it's a visual/rendering concern
- [X] T020 Post-implementation correction (new FR-017/SC-005): apply dark-theme-consistent
      colors to all three rendering modes in `web/src/components/FileViewerDialog.tsx` -
      `react-syntax-highlighter`'s `style` prop set to `vscDarkPlus` (was using Prism's
      light default), and the Markdown container's `sx` given explicit dark-compatible
      `color`/table-border/inline-code colors - found during user review; verified via
      server-side rendering that the resulting inline styles use a dark background
      (`#1e1e1e`) and light text (`#d4d4d4`) instead of the previous light defaults
- [X] T018 Execute `quickstart.md` Scenarios 1–9 in a real desktop browser and confirm each
      matches its expected outcome (partial - no browser is available in this environment,
      so only the HTTP/data layer was verified: every fixture file's `GET /api/file/infra`
      status matches its expected rendering-mode outcome (200 for `.txt`/`.csv`/unknown-ext/
      `.gitignore`/`.md`/`.yaml`/`.toml`/`.py`, 415 for the binary fixture), and
      `react-markdown`/`react-syntax-highlighter` were independently verified via
      server-side rendering to produce correct HTML/highlighted output (real `<h1>`/`<ul>`/
      `<table>` for Markdown; colored token spans for yaml/toml/python). Along the way,
      found and fixed a real bug in quickstart.md's own binary fixture: `head -c 32
      /dev/urandom` has a ~89% chance of containing zero null bytes, so it wasn't a
      reliable way to trigger the 415 binary-rejection path - replaced with a fixture that
      guarantees a null byte. The actual double-click/dialog/Escape/Back/Forward/visual
      behavior across all 4 user stories has **not** been human-confirmed in a real
      browser)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
  (`getFileRenderMode` is the one piece every story's rendering decision routes through)
- **User Story 1 (Phase 3)**: Depends on Foundational; no dependency on US2/US3/US4
- **User Story 2 (Phase 4)**: Depends on User Story 1 (there is no dialog to close until
  US1 builds it) - expected to require no new code, only verification
- **User Story 3 (Phase 5)**: Depends on User Story 1 (`FileViewerDialog.tsx` must exist);
  independent of US2/US4
- **User Story 4 (Phase 6)**: Depends on User Story 1 (`FileViewerDialog.tsx` must exist);
  independent of US2/US3
- **Polish (Phase 7)**: Depends on all four user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: The foundation every other story extends; not independent of
  Foundational, but independent of US2/US3/US4
- **User Story 2 (P2)**: Independently *testable* on its own, but adds no new file
  changes - it verifies behavior T011/T013 already provide
- **User Story 3 (P3)**: Independently testable; extends `FileViewerDialog.tsx` from US1
  but has no dependency on US2/US4, so could be built in parallel with US4 by a second
  contributor
- **User Story 4 (P4)**: Independently testable; extends `FileViewerDialog.tsx` from US1
  but has no dependency on US2/US3

### Within Each User Story

- Tests MUST be written (and confirmed failing) before implementation
- `http-server.ts`'s response extension (T007) before the route that needs it (T009)
- The route (T009) and the frontend fetch helper (T010) before the dialog that calls it
  (T011)
- The dialog (T011) before wiring it into `App.tsx` (T013)

### Parallel Opportunities

- T002 (Foundational) has no dependency on Setup beyond it completing
- T004, T005, T006 (US1 tests) can run in parallel - different files
- T007 (US1, `http-server.ts`) can run in parallel with T004/T005/T006 - different file,
  no dependency
- T015 (US3) and T016 (US4) can run in parallel - both extend `FileViewerDialog.tsx` but
  add independent rendering branches; sequence their merge if built by different
  contributors
- T017 (typecheck) can run in parallel with T018 (manual quickstart run) in Polish

---

## Parallel Example: User Story 1 Tests

```bash
Task: "Add openFile test cases in tests/unit/web/navigationHistory.test.ts"
Task: "Unit test looksBinary() in tests/unit/server/file.test.ts"
Task: "Integration test GET /api/file/:tab in tests/integration/web-server.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart.md Scenarios 1–3 in a real browser
5. This is the smallest usable slice: any text file can be opened and read, full-screen,
   closeable

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Validate independently (MVP!)
3. Add User Story 2 → Validate independently (Escape/Back, expected free from US1)
4. Add User Story 3 → Validate independently (Markdown formatting)
5. Add User Story 4 → Validate independently (syntax highlighting)
6. Each story adds value without breaking the previous ones

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- User Story 2 is expected to require zero new code - it exists as its own phase because
  it's independently *specified and testable* in spec.md, even though its mechanics are a
  byproduct of building User Story 1 correctly (the same pattern seen in feature 001's
  T012/T013 and feature 002's T019/T020)
- The dialog (`FileViewerDialog.tsx`, `App.tsx`, `ContentsTable.tsx`) is validated manually
  via `quickstart.md`, per constitution Principle V's UI-rendering carve-out - the *pure*
  logic that happens to live alongside it (`fileRenderMode.ts`, `looksBinary`,
  `statesEqual`) still gets test-first treatment since it's data/decision logic, not
  rendering
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- T019/T020 are numbered after T018 only because they were added later (post-review); they
  were actually completed, and their corresponding `spec.md` amendments made, before T018's
  quickstart pass was finalized
