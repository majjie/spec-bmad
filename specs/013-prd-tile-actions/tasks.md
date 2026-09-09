---

description: "Task list template for feature implementation"
---

# Tasks: PRD Tile Actions

**Input**: Design documents from `/specs/013-prd-tile-actions/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-behavior.md, quickstart.md

**Tests**: `web/src/reviewFiles.ts` and `web/src/memlogParser.ts` (genuine parsing/
derivation logic) get test-first unit-test tasks, per constitution Principle V's main
clause. Everything else in this feature is UI/rendering, covered by manual `quickstart.md`
verification instead, per that same principle's explicit carve-out.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project with a bundled web frontend (per plan.md): frontend code lives under
`web/src/`; the two new unit-test files live under `tests/unit/web/`.

---

## Phase 1: Setup

**Purpose**: Confirm the feature needs no new dependencies before touching any code.

- [X] T001 Verify no new package is needed — this feature only uses `@mui/material`
      (`Tooltip`, `Dialog`, `Paper`) and `@mui/icons-material` icons already installed and
      already assigned to these tiles by feature 012.

**Checkpoint**: No dependency work needed — proceed directly to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared plumbing every tile's story sits on top of — the folder-contents
fetch every tile's enabled/disabled state reads from, the `onOpenFile` threading reviews
and addendum both need, and the shared requirement-code shape memlog parsing reuses.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] In `web/src/components/NavigatorDetailPane.tsx`, pass its own existing
      `onOpenFile` prop down into `PrdDetailView` (currently not threaded further)
      (research.md § 2).
- [X] T003 In `web/src/components/PrdDetailView.tsx`, accept a new `onOpenFile: (path:
      string) => void` prop; alongside the existing `prd.md` fetch effect, also call
      `fetchContents("output", entry.path)` (`web/src/api.ts`) and store the result as new
      state (e.g. `folderFiles: ContentsEntry[] | null`) — treat a fetch failure the same
      as "no matching files" for every tile's gating, rather than surfacing a separate
      error state (depends on T002; contracts/ui-behavior.md "Data fetched once per PRD
      selection").
- [X] T004 [P] In `web/src/prdIndex.ts`, export the existing requirement-code shape
      (`[A-Z]{2,}-\d+`, word-boundary-aware) as a named constant
      (e.g. `REQUIREMENT_CODE_PATTERN`) so `memlogParser.ts` can reuse the exact same
      definition instead of a second copy — no behavior change to `prdIndex.ts` itself
      (research.md § 5).

**Checkpoint**: Foundation ready — User Stories 1, 2, and 3 can now all start.

---

## Phase 3: User Story 1 - Browse and open review documents from the PRD view (Priority: P1) 🎯 MVP

**Goal**: The reviews tile detects every `review-*.md` file in the current PRD folder,
lists them by friendly Title-Case name on hover, and opens the selected one in the
existing file-viewer dialog (FR-001–FR-006).

**Independent Test**: Open a PRD folder containing at least two `review-*.md` files;
confirm hovering the reviews tile shows both, alphabetically ordered by friendly name, and
selecting one opens its content in a file-viewer dialog.

### Tests for User Story 1 ⚠️

> Genuine derivation logic (constitution Principle V) — write these first and confirm
> they fail before implementing T006.

- [X] T005 [P] [US1] Write failing unit tests in `tests/unit/web/reviewFiles.test.ts` for
      `buildReviewFileList` covering: only `review-*.md` files are matched (folders and
      other filenames excluded), the Title-Case friendly-name transform (multi-dash and
      single-word filenames), sorting by the *derived* display name rather than raw
      filename (a case where the two orders would differ), and an empty/no-match input
      producing an empty array (data-model.md "Review File Reference").

### Implementation for User Story 1

- [X] T006 [US1] Implement `buildReviewFileList` in `web/src/reviewFiles.ts` to make T005
      pass — copy `fileName`/`path` directly from each matching `ContentsEntry`, do not
      reconstruct `path` via string concatenation (depends on T005; data-model.md).
- [X] T007 [US1] In `PrdDetailView.tsx`, compute the reviews list via
      `buildReviewFileList(folderFiles)` (depends on T003, T006).
- [X] T008 [US1] In `PrdDetailView.tsx`, add a local `ReviewsTile` component: a controlled
      `Tooltip` matching `PrefixTile`'s own configuration (`open`/`onOpen`/`onClose`,
      `leaveDelay={400}`, opaque/scrollable `sx`) listing each review's `displayName`;
      when the list is empty, the tile renders with `color="disabled"` on its icon and
      `color="text.disabled"` on its label (two different tokens — not the same string on
      both, research.md § 7) and no `onClick`/tooltip at all (depends on T007;
      FR-002/FR-004/FR-006, research.md § 4).
- [X] T009 [US1] Wire selecting a listed review to `onOpenFile(review.path)` and close the
      tooltip (depends on T008, T003; FR-005, research.md § 2).
- [X] T025 [US1] Post-implementation fix: in `ReviewsTile`, track the tile's own
      `offsetWidth` via a `ref` + `ResizeObserver` (the same technique
      `SprintStatusView.tsx` uses to match Action Items' height to Summary's) and set the
      tooltip's `width` to match it, rather than letting it shrink to fit its narrowest
      listed name — feedback that the tooltip felt too small (depends on T008; FR-002,
      Clarifications).
- [X] T010 [US1] Manually verify quickstart.md Scenario 1 via Playwright: alphabetical
      friendly-name order in the tooltip, selecting one opens the standard file-viewer
      dialog, and the tile appears disabled with no interaction when no `review-*.md`
      files exist.

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Open the addendum document from the PRD view (Priority: P1)

**Goal**: The addendum tile detects `addendum.md` and opens it in the existing
file-viewer dialog on click (FR-007/FR-008).

**Independent Test**: Open a PRD folder containing `addendum.md`; confirm clicking the
addendum tile opens its content in a file-viewer dialog. Open a folder with no
`addendum.md`; confirm the tile is disabled and does nothing on click.

### Implementation for User Story 2

- [X] T011 [US2] In `PrdDetailView.tsx`, compute `hasAddendum` from `folderFiles` (depends
      on T003; FR-007).
- [X] T012 [US2] Wire the addendum tile: enabled with `onClick={() =>
      onOpenFile(`${entry.path}/addendum.md`)}` when `hasAddendum`; otherwise
      `color="disabled"` on its icon, `color="text.disabled"` on its label, and no
      `onClick` (depends on T011; FR-008, research.md §§ 2/7).
- [X] T013 [US2] Manually verify quickstart.md Scenario 2 via Playwright: clicking opens
      the standard file-viewer dialog with `addendum.md`'s content; the tile appears
      disabled and does nothing when `addendum.md` is absent.

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Review the memory log with jump-enabled requirement codes (Priority: P2)

**Goal**: The memory log tile detects `.memlog.md` and opens a bespoke dialog rendering
each bullet as a candy-striped row with its category broken into a colored header, and
any requirement code it mentions that also exists in the current PRD as a clickable link
that jumps the PRD to it and closes the dialog (FR-009–FR-017).

**Independent Test**: Open a PRD folder containing `.memlog.md` with an entry mentioning a
requirement code that exists in that PRD's `prd.md`; confirm the dialog renders
candy-striped rows with category headers, confirm the mentioned code is a clickable link,
and confirm selecting it closes the dialog and jumps the PRD to that code's location.

### Tests for User Story 3 ⚠️

> Genuine derivation logic (constitution Principle V) — write these first and confirm
> they fail before implementing T015.

- [X] T014 [P] [US3] Write failing unit tests in `tests/unit/web/memlogParser.test.ts` for
      `parseMemlogEntries` covering: category extraction from a valid `(word)` prefix;
      fallback to `category: null` when the leading text has no parentheses or multiple
      words inside them; splitting multiple bullets into separate entries; bare inline
      requirement-code detection with a word boundary (e.g. `FR-56's` splits into the code
      `FR-56` plus trailing plain text `'s`); two distinct codes within one bullet each
      resolved independently; a code resolved against `prdReferences` (non-null
      `referenceId`) versus one not present there (`referenceId: null`); a code matching
      more than one `prdReferences` entry resolving to the *first* one in document order;
      and empty input producing an empty array (data-model.md "Memory Log Entry").

### Implementation for User Story 3

- [X] T015 [US3] Implement `parseMemlogEntries` in `web/src/memlogParser.ts`, using T004's
      shared `REQUIREMENT_CODE_PATTERN`, to make T014 pass (depends on T004, T014;
      data-model.md).
- [X] T016 [US3] In `PrdDetailView.tsx`, compute `hasMemlog` from `folderFiles`, and add
      local state for the memory log dialog (an open flag plus fetched content/error)
      (depends on T003; FR-009).
- [X] T017 [US3] Wire the memory log tile: when `hasMemlog`, clicking fetches
      `${entry.path}/.memlog.md` via `fetchFileContentOrNull("output", ...)` and opens the
      dialog; otherwise `color="disabled"` on its icon, `color="text.disabled"` on its
      label, and no `onClick` (depends on T016; FR-010, research.md §§ 6/7).
- [X] T018 [US3] Create `web/src/components/MemoryLogDialog.tsx`: a `Dialog` shell modeled
      on `FileViewerDialog.tsx`'s own (margin/sizing, `position: absolute` corner controls
      rendered as a *sibling* of the scrolling content, never nested inside it), reusing
      `FrontmatterInfoControl` for the file's own stripped YAML preamble (depends on T015;
      FR-011, research.md § 6).
- [X] T019 [US3] In `MemoryLogDialog.tsx`, render `parseMemlogEntries`'s output as a
      sequence of candy-striped rows (alternating background by index, matching
      `SprintStatusView.tsx`'s `StepRow` convention); when an entry's `category` is
      non-null, render it as its own `primary.light` header, separate from the row's body
      (depends on T018; FR-012/FR-013).
- [X] T020 [US3] In `MemoryLogDialog.tsx`, render each entry's `segments` in order: a
      `"text"` segment as plain text; a `"code"` segment with a non-null `referenceId` as
      a clickable inline link showing its `text`; a `"code"` segment with
      `referenceId: null` as plain text (depends on T019; FR-014/FR-015/FR-017).
- [X] T021 [US3] Add an `onSelectReference(id: string)` prop to `MemoryLogDialog`, called
      when a link is selected; in `PrdDetailView.tsx`, implement it to call the existing
      `handleSelectReference` (scrolls the PRD to that anchor) and then close the memory
      log dialog (depends on T020, T017; FR-016, research.md § 6).
- [X] T022 [US3] Manually verify quickstart.md Scenario 3 via Playwright: candy-striping,
      the category header rendering separately, the no-category fallback row, a resolved
      code rendering as a link versus an unresolved one as plain text, both codes in a
      single bullet independently jumpable, and the tile appearing disabled with no
      `.memlog.md` present.

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Confirm nothing regressed across the whole test suite and existing
Navigator/PRD-viewer behavior.

- [X] T023 [P] Run the full `npm test` suite and confirm `reviewFiles.test.ts` and
      `memlogParser.test.ts` pass alongside every pre-existing test with zero
      regressions.
- [X] T024 Manually verify quickstart.md's Regression pass: the requirement-code index
      column (feature 012) still works; opening a file named `.memlog.md` directly from
      the Output tab's own file browser still renders as plain Markdown, unaffected by
      this feature's bespoke rendering; Sprint Status and every other existing Navigator
      selection still renders exactly as before (FR-018, SC-005).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational only.
- **User Story 2 (Phase 4)**: Depends on Foundational only — independent of Phase 3, can
  run in parallel with it.
- **User Story 3 (Phase 5)**: Depends on Foundational only — independent of Phases 3 and
  4, can run in parallel with either.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Within Each User Story

- User Story 1's tests (T005) MUST be written and confirmed failing before T006.
- User Story 3's tests (T014) MUST be written and confirmed failing before T015.
- Models/derivation before rendering: T006 before T007; T015 before T018; T018 before
  T019; T019 before T020; T020 before T021.

### Parallel Opportunities

- T002 and T004 (Phase 2) touch different files and can run in parallel.
- T005 (US1 tests) and T014 (US3 tests) can run in parallel with each other and with
  Phase 4's tasks, since none share a file with them.
- T023 is independent of T024 and can run in parallel.
- Once Foundational is complete, User Stories 1, 2, and 3 can all proceed in parallel —
  unlike feature 012, none of this feature's stories has a real cross-story file
  dependency forcing a particular order.

---

## Parallel Example: Foundational Phase

```bash
# Launch T002 and T004 together — different files, no shared dependency:
Task: "Thread onOpenFile through web/src/components/NavigatorDetailPane.tsx"
Task: "Export REQUIREMENT_CODE_PATTERN from web/src/prdIndex.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: Run quickstart.md Scenario 1 independently.
5. This alone already turns the reviews tile from an inert placeholder into a working
   file-browsing affordance — a meaningful increment even before addendum or the memory
   log are wired up.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. User Story 1 → validate → reviews tile works (MVP).
3. User Story 2 → validate → addendum tile works.
4. User Story 3 → validate → memory log tile works, including its bespoke rendering and
   requirement-code jump links.
5. Polish → full regression pass.

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- Unlike feature 012 (where User Story 2 had a real file-dependency on User Story 1's own
  output), this feature's three stories are genuinely independent of one another — any
  order, or full parallelism, is safe.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
