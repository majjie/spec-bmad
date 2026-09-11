---

description: "Task list template for feature implementation"
---

# Tasks: CSV Spreadsheet View

**Input**: Design documents from `/specs/005-csv-spreadsheet-view/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included, and fuller than usual for this project's UI features - per
constitution Principle V's *main* clause, not just its UI-rendering carve-out:
`parseCsvGrid`'s quoting/escaping/embedded-newline/ragged-row correctness (FR-006) *is*
parsing logic. Only the grid's visual layout (sticky headers, dark theme, column sizing)
is UI/rendering, validated manually per the carve-out (`quickstart.md`).

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Per `plan.md` § Project Structure: this feature only touches `web/src/` (feature
002/003/004's existing frontend tree) plus one new test file. No backend/API changes.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the one new dependency this feature needs

- [X] T001 Add `papaparse` and `@types/papaparse` to root `package.json` devDependencies
      (build-time only, bundled into `web/dist/` - research.md § 1); run `npm install`

---

## Phase 2: Foundational

No cross-story blocking work is needed for this feature - User Story 2 is a pure CSS/
layout refinement on top of User Story 1's grid, so nothing needs to land before US1
itself. Proceed directly to User Story 1.

---

## Phase 3: User Story 1 - View a CSV file as a spreadsheet grid (Priority: P1) 🎯 MVP

**Goal**: Double-clicking a `.csv` file shows its data as a grid - spreadsheet-style
column letters, the CSV's own header row distinguished, numbered data rows, correct
quote/escape/embedded-newline parsing, dark theme, strictly read-only.

**Independent Test**: Double-click a `.csv` file containing a header row plus a few data
rows and columns, including at least one data field with a comma inside quotes; confirm
the grid shows lettered columns, the header row visually distinguished from the data,
numbered data rows starting at 1, the quoted field intact in a single cell, and dark
theming throughout (per spec.md's own Independent Test for this story).

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T002 [P] [US1] Unit tests for `columnLetter(index)` in
      `tests/unit/web/csvGrid.test.ts`: `0` → `"A"`, `25` → `"Z"`, `26` → `"AA"`, `27` →
      `"AB"`, `51` → `"AZ"`, `52` → `"BA"`, `701` → `"ZZ"`, `702` → `"AAA"` (bijective
      base-26 - research.md § 3)
- [X] T003 [P] [US1] Unit tests for `parseCsvGrid(text)` in
      `tests/unit/web/csvGrid.test.ts`: a typical header + data rows; a quoted field
      containing a comma stays one field, not two; a quoted field containing a line break
      stays in one row, not split into two; a ragged data row (fewer fields than the
      header) is preserved as a shorter array, not padded; a header-only file (one line)
      returns `{ header: [...], rows: [] }`; a completely empty file (zero lines) returns
      `{ header: null, rows: [] }` (data-model.md's derivation table, research.md § 5)
- [X] T004 [P] [US1] Update the existing `.csv` case in
      `tests/unit/web/fileRenderMode.test.ts` to expect `{ kind: "csv-grid" }` instead of
      `{ kind: "plain" }`; confirm it now FAILS against the current implementation

### Implementation for User Story 1

- [X] T005 [US1] Implement `columnLetter` and `parseCsvGrid` in `web/src/csvGrid.ts` per
      `data-model.md`, using `papaparse` configured with `header: false` and
      `skipEmptyLines: true` (research.md § 1/§5); must make T002/T003 pass
- [X] T006 [US1] Extend `FileRenderMode` and `getFileRenderMode` in
      `web/src/fileRenderMode.ts` to map `.csv` to `{ kind: "csv-grid" }` instead of
      `{ kind: "plain" }` (data-model.md); must make T004 pass
- [X] T007 [US1] Implement `web/src/components/CsvGrid.tsx`: calls `parseCsvGrid` on the
      file's text; renders an MUI `Table`-based grid with `columnLetter`-labeled column
      headers, the CSV's own header row shown with distinguished styling (e.g. bold),
      numbered data rows starting at 1, empty cells for rows shorter than the widest row
      (FR-010); shows an empty-state message when `header === null` (FR-011) or when
      `rows.length === 0` but a header exists (FR-012, header still rendered); uses the
      application's existing dark theme (FR-007); has no editing affordance anywhere
      (FR-008); depends on T005
- [X] T008 [US1] Wire `{ kind: "csv-grid" }` into
      `web/src/components/FileViewerDialog.tsx`'s render-mode dispatch, rendering
      `CsvGrid` for it; depends on T006, T007

**Checkpoint**: At this point, User Story 1 should be fully functional and testable
independently (quickstart.md Scenarios 1–6)

---

## Phase 4: User Story 2 - Column and row headers stay visible while scrolling (Priority: P2)

**Goal**: The column-letter row, the CSV's own header row, and the row-number column all
stay visible (sticky/frozen) while scrolling a CSV larger than fits on screen.

**Independent Test**: Open a CSV with enough rows and columns to require both vertical and
horizontal scrolling; scroll in each direction and confirm the column-letter row, the
CSV's own header row, and the row-number column all remain visible throughout (per
spec.md's own Independent Test for this story).

### Implementation for User Story 2

- [X] T009 [US2] In `web/src/components/CsvGrid.tsx`, add `position: sticky` styling via
      `sx`: `top: 0` on the column-letter row, `top: <row height>` on the CSV's own header
      row, and `left: 0` on the row-number column - including the corner cells (the
      row-number column's header-row cells), which need `position: sticky` on *both* axes
      to stay pinned in the top-left corner while scrolling in either direction
      (research.md § 2, FR-009); depends on T007

**Checkpoint**: Both user stories should now be independently functional (quickstart.md
Scenario 7)

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verification that spans both stories, plus four post-implementation
corrections found during user review (T013–T016) - added to `spec.md` as new FR-014/
FR-015/FR-016/SC-005 (and an Assumptions clarification) before being fixed here, per
constitution Principle I

- [X] T010 Run `npm test` (the full automated suite) and confirm everything passes: the
      new `tests/unit/web/csvGrid.test.ts`, the updated `.csv` case in
      `tests/unit/web/fileRenderMode.test.ts`, and the untouched features 001–004 suites -
      per constitution Development Workflow ("All changes MUST pass type-checking and the
      automated test suite before merge"); this is also the only regression check for
      FR-013 (every non-`.csv` file type's rendering path must remain unaffected)
- [X] T011 [P] Run `npm run typecheck` and resolve any strict-mode type errors introduced
      by the new dependency/code
- [X] T012 Execute `quickstart.md` Scenarios 1–7 in a real desktop browser and confirm each
      matches its expected outcome - note this **supersedes** feature 004's own
      quickstart.md Scenario 8 (`.csv` falling back to plain text), which this feature
      intentionally changes
- [X] T013 Post-implementation correction (new FR-014): add a `1px solid` `divider`-colored
      `borderRight` to every `.MuiTableCell-root` in `web/src/components/CsvGrid.tsx`'s
      `Table` so adjacent columns are visually separated - found during user review; the
      grid had rendered borderless
- [X] T014 Post-implementation correction (new FR-015): replace the data rows' hover state
      in `web/src/components/CsvGrid.tsx` - first tried as a flat black
      `background-image` wash (still grayscale, and found to make hovered rows converge
      toward the same shade regardless of striping), then replaced with the theme's
      `primary` color at low opacity (via `alpha(theme.palette.primary.main, 0.16)`) so
      hover reads as a distinct accent rather than a shade of gray; applied to descendant
      `.MuiTableCell-root` cells (not the row itself) so it also reaches the sticky
      row-number cell, which paints its own background separately - found during user
      review across two rounds of feedback
- [X] T015 Post-implementation correction (new FR-016): raise the close ("X") icon's
      `Box` `zIndex` in `web/src/components/FileViewerDialog.tsx` from `1` to `10` - found
      during user review to be covered by `CsvGrid.tsx`'s own frozen header cells, which
      use `zIndex` values up to `3`
- [X] T016 Post-implementation correction (FR-009 amendment): fix scrolled data rows
      staying visible above the frozen header instead of being clipped behind it. Root
      cause, confirmed with a headless-Chromium (Playwright) reproduction rather than CSS
      theory alone: the scrolling container in `web/src/components/FileViewerDialog.tsx`
      applied a uniform `padding: "16px"` to every rendering mode, leaving a gap between
      the container's own clip boundary and the point where the sticky header actually
      stuck, through which scrolled-past rows remained briefly visible. Fixed by removing
      that shared padding and moving equivalent padding into each non-CSV rendering mode's
      own content instead, so `CsvGrid.tsx` sits flush against the real clip boundary; also
      kept an explicit `position: relative; zIndex: 0` on plain data cells
      (`web/src/components/CsvGrid.tsx`), since testing showed real browsers don't paint
      static table cells below positioned siblings as reliably as the CSS stacking spec
      implies. Two earlier attempts - z-index/stacking-context tweaks on the existing
      `<table>` markup, then a full rewrite to a CSS Grid layout - were tried first and
      both failed to fix it (per direct user testing), and were rolled back once headless-
      browser testing pinpointed the actual padding-gap cause

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Empty for this feature - no cross-story blocking work exists
- **User Story 1 (Phase 3)**: No dependency on Setup beyond it completing; no dependency
  on User Story 2
- **User Story 2 (Phase 4)**: Depends on User Story 1 - there is no grid to add sticky
  positioning to until US1 builds `CsvGrid.tsx`
- **Polish (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independently testable; no dependency on User Story 2
- **User Story 2 (P2)**: Independently testable on its own once implemented, but its one
  task extends `CsvGrid.tsx`, the same file User Story 1 creates - sequence after US1

### Within Each User Story

- Tests MUST be written (and confirmed failing) before implementation
- `csvGrid.ts` (T005) before the component that calls it (T007)
- `fileRenderMode.ts` (T006) and `CsvGrid.tsx` (T007) before wiring them together in
  `FileViewerDialog.tsx` (T008)

### Parallel Opportunities

- T002, T003, T004 (User Story 1 tests) can run in parallel - T002/T003 share a test file
  but cover disjoint functions with no shared state; T004 is a different file entirely
- T011 (typecheck) can run in parallel with T010 (automated test suite) and T012 (manual
  quickstart run) in Polish

---

## Parallel Example: User Story 1 Tests

```bash
Task: "Unit tests for columnLetter() in tests/unit/web/csvGrid.test.ts"
Task: "Unit tests for parseCsvGrid() in tests/unit/web/csvGrid.test.ts"
Task: "Update the .csv case in tests/unit/web/fileRenderMode.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 3: User Story 1 (Phase 2/Foundational is empty for this feature)
3. **STOP and VALIDATE**: Run quickstart.md Scenarios 1–6 in a real browser
4. This is the smallest usable slice: any CSV can be viewed as a properly-parsed,
   dark-themed spreadsheet grid - just without frozen headers on a large file

### Incremental Delivery

1. Complete Setup → nothing to validate yet (just a dependency install)
2. Add User Story 1 → validate independently (MVP - the whole grid, correctly parsed)
3. Add User Story 2 → validate independently (frozen headers on large CSVs)
4. Each story adds value without breaking the previous one

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Unlike features 002-004, this feature's test-first coverage is not a thin sliver
  alongside mostly-manual UI work - `parseCsvGrid`'s correctness genuinely is the
  constitution's "parsing logic" concern, so T002/T003 are as important as any backend
  test task in earlier features
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
