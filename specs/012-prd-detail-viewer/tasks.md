---

description: "Task list template for feature implementation"
---

# Tasks: PRD Detail Viewer

**Input**: Design documents from `/specs/012-prd-detail-viewer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-behavior.md, quickstart.md

**Tests**: Only `web/src/prdIndex.ts` (genuine parsing/derivation logic) gets test-first
unit-test tasks, per constitution Principle V's main clause. Everything else in this
feature is UI/rendering, covered by manual `quickstart.md` verification instead, per that
same principle's explicit carve-out.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project with a bundled web frontend (per plan.md): frontend code lives under
`web/src/`; the one new unit-test file lives under `tests/unit/web/`.

---

## Phase 1: Setup

**Purpose**: Confirm the feature needs no new dependencies before touching any code.

- [X] T001 Verify `web/package.json` already lists `react-markdown`, `remark-gfm`,
      `js-yaml`, and `@mui/icons-material` (for `RateReview`, `PostAdd`, `History`) - all
      already used elsewhere in this app (`FileViewerDialog.tsx`, `frontmatter.ts`,
      `SprintStatusView.tsx`) - and that no `npm install` is required.

**Checkpoint**: No dependency work needed - proceed directly to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared plumbing every user story's work sits on top of - the folder-path
lookup, the extracted info-control, and the new component's basic wiring into the
Navigator.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] In `web/src/components/NavigatorDetailPane.tsx`, generalize
      `findPrdFolderName` to return the whole matching `PrdDateEntry`/`PrdNonConformingEntry`
      (which already carries both `folderName` and `path`) instead of just `folderName`, so
      callers can build `prd.md`'s absolute path (data-model.md § "Relationship to existing
      entities").
- [X] T003 [P] Extract the (i)-icon + controlled `Tooltip` + `PreambleReadout` block out of
      `web/src/components/FileViewerDialog.tsx` into a new
      `web/src/components/FrontmatterInfoControl.tsx`, taking `preamble:
      Record<string, unknown>` as its only prop and preserving the existing hover/click/
      opaque-background/larger-font tooltip behavior exactly (research.md § 2).
- [X] T004 In `web/src/components/FileViewerDialog.tsx`, replace the now-inlined block with
      `FrontmatterInfoControl`, keeping the Close button as a separate sibling - no
      observable behavior change (depends on T003; contracts/ui-behavior.md "Regression
      guard").
- [X] T005 In `web/src/api.ts`, add `fetchFileContentOrNull(tab, path): Promise<string |
      null>` alongside the existing `fetchFileContent` - identical, except it resolves to
      `null` on a 404 instead of throwing (research.md § 7). Then create
      `web/src/components/PrdDetailView.tsx`: accepts the resolved PRD folder entry,
      fetches `` `${entry.path}/prd.md` `` via this new function, and renders a "Loading…"
      state while pending (depends on T002; research.md § 1).
- [X] T006 In `web/src/components/NavigatorDetailPane.tsx`, render `PrdDetailView` (passing
      the entry from T002) for a PRD leaf selection instead of today's bare folder-name
      `Typography`; leave every other branch (`"sprint-status"`, `null`, unmatched)
      untouched (depends on T002, T005; FR-014).

**Checkpoint**: Foundation ready - User Story 1 and User Story 2 can now both start.

---

## Phase 3: User Story 1 - View the PRD in a full-pane viewer (Priority: P1) 🎯 MVP

**Goal**: Selecting a PRD leaf node renders its `prd.md` as formatted Markdown filling the
whole pane, frontmatter excluded and surfaced via the (i) control (no close button), with a
clear message when no `prd.md` exists (FR-001–FR-004).

**Independent Test**: Select a PRD leaf node whose folder contains a `prd.md` file; confirm
its content renders as formatted Markdown filling the pane, with no dialog, no close
control, and its YAML frontmatter excluded from the rendered view exactly as already
happens for any other Markdown file opened in this tool.

### Implementation for User Story 1

- [X] T007 [US1] In `PrdDetailView.tsx`, strip the fetched content's frontmatter via the
      existing `stripFrontmatter()` (`web/src/frontmatter.ts`) and render the body with
      `ReactMarkdown`/`remarkGfm`, matching `FileViewerDialog.tsx`'s existing Markdown
      styling (code/table borders, etc.) (depends on T005; FR-001/FR-002).
- [X] T008 [US1] In `PrdDetailView.tsx`, render `FrontmatterInfoControl` (T003)
      `position: absolute` in the file-viewer region's top-right corner whenever a
      preamble was present - with no accompanying close button (depends on T004, T007;
      FR-003).
- [X] T023 [US1] Post-implementation fix: in `PrdDetailView.tsx`, move the (i) control out
      from inside the scrolling Box into a sibling of it (both children of the same
      `position: relative` wrapper), so it stays fixed in the top-right corner regardless
      of scroll position - previously it was nested inside the same element that had both
      `position: relative` and `overflow: auto`, which meant it scrolled away with the
      content instead of staying fixed, unlike `FileViewerDialog`'s own (i)/Close controls
      (depends on T008; FR-003, Clarifications).
- [X] T009 [US1] In `PrdDetailView.tsx`, render a clear "no PRD document" message (not an
      error, not a blank pane) when `fetchFileContentOrNull` resolves to `null` -
      distinct from the genuine-fetch-error branch, which still shows the thrown error's
      message (depends on T005; FR-004, research.md § 7).
- [X] T010 [US1] Manually verify quickstart.md Scenario 1 via Playwright: full-pane render
      with no dialog/close control, frontmatter tooltip present and correct, no-PRD message
      for an empty folder, and other Navigator selections (Sprint Status, no selection)
      unaffected.

**Checkpoint**: User Story 1 is fully functional and independently testable - a PRD now
renders full-pane with its frontmatter tooltip, with or without a `prd.md` file present.

---

## Phase 4: User Story 2 - Navigate the PRD via its requirement-code index (Priority: P1)

**Goal**: A structurally separate column of prefix tiles lets a user find and jump to any
detected requirement code without scrolling the document by hand (FR-007–FR-013).

**Independent Test**: Open a PRD containing both bullet-style codes (e.g. `**FR-25**`) and
header-style codes (e.g. `### UJ-1 - ...`) across at least two different prefixes; confirm
one tile appears per unique prefix, hovering one lists every code under it in numerical
order by full code text, and clicking a code scrolls the document to its location.

### Tests for User Story 2 ⚠️

> Genuine derivation logic (constitution Principle V) - write these first and confirm they
> fail before implementing T012.

- [X] T011 [P] [US2] Write failing unit tests in `tests/unit/web/prdIndex.test.ts` for
      `buildRequirementCodeIndex`/`groupByPrefix` covering: bullet-style detection,
      header-style detection, a duplicated code counted as two distinct references, the
      same code appearing in both styles counted separately, a plain `### Overview` heading
      producing no reference, uppercase-only prefix matching, numeric (not lexical) sort
      within a group (`FR-9` before `FR-25`), prefix-group ordering by first document
      appearance, and an empty input producing an empty group array (data-model.md; Edge
      Cases).

### Implementation for User Story 2

- [X] T012 [US2] Implement `buildRequirementCodeIndex` and `groupByPrefix` in
      `web/src/prdIndex.ts` to make T011 pass (depends on T011; data-model.md).
- [X] T013 [US2] In `PrdDetailView.tsx`, compute the requirement-code index via `useMemo`
      over the frontmatter-stripped content using T012's functions (depends on T007, T012).
- [X] T014 [US2] In `PrdDetailView.tsx`, add custom `strong`/`h3` `ReactMarkdown`
      `components` overrides that attach each matching element's corresponding
      `RequirementCodeReference.id` as its anchor, using a per-render counter that consumes
      T013's ordered array in document order (depends on T013; research.md § 3).
- [X] T015 [US2] In `PrdDetailView.tsx`, render the requirement-code index column as a
      structurally separate flex sibling of the file-viewer region (its own
      `overflow: auto`, never inside the document's own scroll container) - one tile per
      prefix group ordered by first appearance, entirely absent when no codes are detected
      (depends on T013; FR-009, Clarifications).
- [X] T016 [US2] Add a controlled `Tooltip` (matching feature 010's `open`/`onOpen`/
      `onClose` pattern) to each prefix tile, listing its group's references in numerical
      order by full code text, with `slotProps.tooltip.sx` adding `maxHeight`/
      `overflowY: auto` for internal scrolling (depends on T015; FR-010, FR-013). Leave
      `disableInteractive` unset (MUI's own default) so hover-through to the tooltip's own
      content keeps it open (FR-011) - add a one-line comment at the call site noting this,
      per research.md § 5's implementation note.
- [X] T017 [US2] Wire selecting a code in the tooltip to
      `document.getElementById(reference.id)?.scrollIntoView(...)` against the file-viewer
      region and close the tooltip afterward (depends on T014, T016; FR-011 is satisfied
      automatically by MUI's default interactive `Tooltip`, FR-012).
- [X] T024 [US2] Post-implementation fix: add `leaveDelay={400}` to the prefix tile's
      `Tooltip` (T016) - MUI's own default is 0ms (closes instantly on mouseleave), which
      felt too abrupt; 400ms gives the pointer a comfortable grace period to reach the
      tooltip's content before it closes (depends on T016; FR-011, Clarifications).
- [X] T018 [US2] Manually verify quickstart.md Scenario 2 via Playwright: index column
      stays fixed while the document scrolls, numeric sort proven with `FR-9`/`FR-25`,
      duplicate-code rows jump to distinct locations, the non-matching `### Overview`
      heading is untouched, and zero detected codes suppresses the column entirely.

**Checkpoint**: User Stories 1 and 2 both work independently - the PRD renders full-pane
and its requirement codes are indexed and jumpable.

---

## Phase 5: User Story 3 - Placeholder tiles for future PRD-related content (Priority: P2)

**Goal**: Three inert placeholder tiles ("reviews," "addendum," "memory log") reserve space
along the top of the pane for later work (FR-005/FR-006).

**Independent Test**: Open any PRD leaf node; confirm three small tiles render along the
top of the pane, left to right, titled "reviews," "addendum," and "memory log," each with
an icon to the title's left, occupying only a small portion of the pane's height; confirm
none of them do anything when selected.

### Implementation for User Story 3

- [X] T019 [P] [US3] In `PrdDetailView.tsx`, add the top placeholder-tile row - "reviews"
      (`RateReviewIcon`), "addendum" (`PostAddIcon`), "memory log" (`HistoryIcon`), icon
      left of title, small fixed height, no `onClick` handlers at all (depends on T005;
      FR-005/FR-006).
- [X] T020 [US3] Manually verify quickstart.md Scenario 3 via Playwright: tile order and
      icon placement, small height relative to the pane, and no-op clicks.

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Confirm nothing regressed across the whole test suite and the existing modal
viewer.

- [X] T021 [P] Run the full `npm test` suite and confirm `prdIndex.test.ts` passes
      alongside every pre-existing test with zero regressions.
- [X] T022 Manually verify quickstart.md's Regression pass: the existing modal
      `FileViewerDialog` (Output/Infra tabs) still shows its (i) icon, tooltip, and Close
      button exactly as before, confirming the `FrontmatterInfoControl` extraction (T003/
      T004) introduced no behavior change (SC-005).
- [X] T025 Post-implementation fix: in `PrdDetailView.tsx`, add a `borderBottom` divider
      under the placeholder tiles row and a `borderLeft` divider on the requirement-code
      index column, visually partitioning the pane's three regions - a whole-pane outer
      border was tried first and found to add little value, since the pane's right/bottom
      edges coincide with the browser viewport's own edge and are invisible there (FR-015,
      Clarifications).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational only.
- **User Story 2 (Phase 4)**: Depends on Foundational; its rendering tasks (T013+) also
  depend on User Story 1's T007 (the frontmatter-stripped content and Markdown render it
  attaches anchors to) - so in practice, complete Phase 3 before Phase 4, even though both
  are P1.
- **User Story 3 (Phase 5)**: Depends on Foundational only (T005) - independent of Phases 3
  and 4, and can run in parallel with either.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Within Each User Story

- User Story 2's tests (T011) MUST be written and confirmed failing before T012.
- Models/derivation before rendering: T012 before T013; T013 before T014/T015; T015 before
  T016; T014+T016 before T017.

### Parallel Opportunities

- T002 and T003 (Phase 2) touch different files and can run in parallel.
- T011 (Phase 4 tests) and T019 (Phase 5) can run in parallel with each other and with
  Phase 3's tasks, since none share a file with them.
- T021 is independent of T022 and can run in parallel.

---

## Parallel Example: Foundational Phase

```bash
# Launch T002 and T003 together - different files, no shared dependency:
Task: "Generalize findPrdFolderName in web/src/components/NavigatorDetailPane.tsx"
Task: "Extract FrontmatterInfoControl.tsx from web/src/components/FileViewerDialog.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: Run quickstart.md Scenario 1 independently.
5. This alone already replaces today's bare-folder-name placeholder with a real, readable
   PRD view - a meaningful increment even before the index or placeholder tiles exist.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. User Story 1 → validate → PRD is readable full-pane (MVP).
3. User Story 2 → validate → the actual "cumbersome to navigate" problem is solved.
4. User Story 3 → validate → placeholder tiles reserve space for later work.
5. Polish → full regression pass.

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- User Story 2 is the story that delivers this feature's actual "solve cumbersome
  navigation" value - treat it as equally essential to ship as User Story 1, not an
  optional extra, despite being sequenced after it for practical file-dependency reasons.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
