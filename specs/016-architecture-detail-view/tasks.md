---

description: "Task list template for feature implementation"
---

# Tasks: Architecture Detail View

**Input**: Design documents from `/specs/016-architecture-detail-view/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-behavior.md, quickstart.md

**Tests**: Only `web/src/prdIndex.ts`'s new `styles` parameter (genuine derivation-logic
change) gets test-first unit-test tasks, per constitution Principle V's main clause.
`reviewFiles.ts`, `memlogParser.ts`, and `MemoryLogDialog.tsx` are reused completely
unmodified (already fully tested in feature 013) — nothing new to test there. Everything
else in this feature is UI/rendering, covered by manual `quickstart.md` verification
instead, per that same principle's explicit carve-out.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project with a bundled web frontend (per plan.md): frontend code lives under
`web/src/`; the one modified unit-test file lives under `tests/unit/web/`.

---

## Phase 1: Setup

**Purpose**: Confirm the feature needs no new dependencies before touching any code.

- [X] T001 Verify `web/package.json` already lists `react-markdown`, `remark-gfm`, and
      `@mui/icons-material` (for `RateReview`, `History` — no `PostAdd` needed, no
      addendum tile) — all already used by `PrdDetailView.tsx` — and that no
      `npm install` is required.

**Checkpoint**: No dependency work needed — proceed directly to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The new component's basic shell and its wiring into the Navigator — the
plumbing every user story's work sits on top of.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Create `web/src/components/ArchitectureDetailView.tsx`: accepts `entry`
      (`PrdDateEntry | PrdNonConformingEntry`) and `onOpenFile` props (mirroring
      `PrdDetailView`'s own), declares its own local `LoadState` union
      (`loading`/`no-file`/`error`/`ready`, data-model.md), and fetches
      `` `${entry.path}/ARCHITECTURE-SPINE.md` `` via the existing
      `fetchFileContentOrNull("output", ...)` on mount and whenever `entry.path` changes,
      rendering only a "Loading…" placeholder for now (research.md § 2).
- [X] T003 In `web/src/components/NavigatorDetailPane.tsx`, render
      `<ArchitectureDetailView entry={architectureEntry} onOpenFile={onOpenFile} />` for an
      architecture leaf selection, replacing feature 015's bare
      `<Typography>{architectureEntry.folderName}</Typography>` placeholder — leave every
      other branch (`"sprint-status"`, PRD, `null`, unmatched) untouched (depends on T002;
      FR-001, contracts/ui-behavior.md "Dispatch").

**Checkpoint**: Foundation ready — User Stories 1, 3, and 4 can now start (User Story 2
also needs User Story 1's rendering in place first — see Dependencies below).

---

## Phase 3: User Story 1 - View the architecture document in a full-pane viewer (Priority: P1) 🎯 MVP

**Goal**: Selecting an architecture leaf node renders `ARCHITECTURE-SPINE.md` as formatted
Markdown filling the whole pane, frontmatter excluded and surfaced via the (i) control (no
close button), with a clear message when no such document exists (FR-001–FR-004).

**Independent Test**: Select an architecture leaf node whose folder contains its main
architecture document; confirm its content renders as formatted Markdown filling the pane,
with its YAML frontmatter excluded from view and reachable via the same established
informational control used for PRD and every other Markdown file in this tool.

### Implementation for User Story 1

- [X] T004 [US1] In `ArchitectureDetailView.tsx`, strip the fetched content's frontmatter
      via the existing `stripFrontmatter()` and render the body with
      `ReactMarkdown`/`remarkGfm`, matching `PrdDetailView.tsx`'s existing Markdown styling
      (code/table borders, etc.) inside a `Box` with `borderBottom` divider under the
      (still-empty) tile row and a scrollable content region (depends on T002; FR-001/
      FR-002).
- [X] T005 [US1] In `ArchitectureDetailView.tsx`, render `FrontmatterInfoControl` as a
      sibling of — never a descendant of — the scrolling content Box (both children of one
      shared `position: relative` wrapper), fixed top-right, whenever a non-empty preamble
      was found; render nothing when it wasn't. Get this structurally right from the start
      (the sibling-not-descendant placement is a lesson feature 012 already had to fix once
      after shipping it wrong) (depends on T004; FR-003).
- [X] T006 [US1] In `ArchitectureDetailView.tsx`, render a clear "no document" message (not
      an error, not a blank pane) when `fetchFileContentOrNull` resolves to `null` —
      distinct from the genuine-fetch-error branch, which still shows the thrown error's
      message (depends on T002; FR-004).
- [X] T007 [US1] Manually verify quickstart.md Scenario 1 via Playwright: full-pane render
      with no dialog/close control, frontmatter tooltip present and correct, "no document"
      message for a folder with no `ARCHITECTURE-SPINE.md`.

**Checkpoint**: User Story 1 is fully functional and independently testable — an
architecture document now renders full-pane with its frontmatter tooltip.

---

## Phase 4: User Story 2 - Navigate the architecture document via its requirement-code index (Priority: P1)

**Goal**: A structurally separate column of prefix tiles, restricted to heading-style
codes only, lets a user find and jump to any detected requirement code without scrolling
the document by hand (FR-005–FR-010).

**Independent Test**: Open an architecture document containing several heading-style
requirement codes (e.g. `### AD-1 — Some decision`) across at least two different
prefixes; confirm one tile appears per unique prefix, hovering one lists every code under
it in numerical order, and clicking a code scrolls the document to its location.

### Tests for User Story 2 ⚠️

> Genuine derivation-logic change (constitution Principle V) — write these first and
> confirm they fail before implementing T009.

- [X] T008 [P] [US2] Extend `tests/unit/web/prdIndex.test.ts` with new cases for
      `buildRequirementCodeIndex`'s new optional `styles` parameter: called with no second
      argument still detects both bullet- and header-style codes exactly as before (no
      regression); called with `["header"]` detects a header-style code (e.g.
      `### AD-1 — Some decision`) but does NOT detect a bullet-style occurrence
      (`**AD-1**`) present elsewhere in the same content; called with `["bullet"]` detects
      only bullet-style codes; an empty content string still produces an empty array
      regardless of `styles` (data-model.md; research.md § 1).

### Implementation for User Story 2

- [X] T009 [US2] In `web/src/prdIndex.ts`, add the optional `styles: RequirementCodeStyle[]
      = ["bullet", "header"]` parameter to `buildRequirementCodeIndex`, only calling
      `collectMatches` for a style present in the given array, to make T008 pass (depends
      on T008; research.md § 1).
- [X] T010 [US2] In `ArchitectureDetailView.tsx`, compute the requirement-code index via
      `useMemo` over the frontmatter-stripped content, calling
      `buildRequirementCodeIndex(body, ["header"])` → `groupByPrefix(...)` (depends on
      T004, T009).
- [X] T011 [US2] In `ArchitectureDetailView.tsx`, add a custom `h3` `ReactMarkdown`
      `components` override only (no `strong` override — architecture never detects
      bullet-style codes, so no anchor target for that style is ever needed) that attaches
      each matching heading's corresponding `RequirementCodeReference.id` as its anchor,
      using a per-render counter that consumes T010's ordered array in document order,
      mirroring `PrdDetailView.tsx`'s own `nextAnchorId` technique (depends on T010;
      contracts/ui-behavior.md "Main document rendering").
- [X] T012 [US2] In `ArchitectureDetailView.tsx`, declare a local `PrefixTile` component
      (re-declared here, matching `PrdDetailView.tsx`'s own file-local, non-exported
      shape) and render the requirement-code index column as a structurally separate flex
      sibling of the document region (`borderLeft` divider, its own `overflow: auto`,
      never inside the document's own scroll container) — one tile per prefix group,
      entirely absent when no codes are detected (depends on T010; FR-006).
- [X] T013 [US2] Add a controlled `Tooltip` to each `PrefixTile` (matching
      `PrdDetailView.tsx`'s own established `open`/`onOpen`/`onClose`/`leaveDelay={400}`/
      opaque-and-scrollable `slotProps.tooltip.sx` configuration, applied from the start —
      no separate later fix needed this time), listing its group's references in
      numerical order by full code text. Leave `disableInteractive` unset (MUI's own
      default) so hover-through from the tile onto the tooltip's own content keeps it open
      (depends on T012; FR-007, FR-008, FR-010).
- [X] T014 [US2] Wire selecting a code in the tooltip to
      `document.getElementById(reference.id)?.scrollIntoView({ block: "start" })` against
      the document region and close the tooltip afterward (depends on T011, T013; FR-009).
- [X] T015 [US2] Manually verify quickstart.md Scenario 2 via Playwright: index column
      lists prefixes correctly, numeric sort within a group, clicking a code scrolls to
      it, the bullet-style `**AD-1**` occurrence is confirmed absent from the tooltip
      listing, and zero detected codes suppresses the column entirely.

**Checkpoint**: User Stories 1 and 2 both work independently — the architecture document
renders full-pane and its heading-style requirement codes are indexed and jumpable.

---

## Phase 5: User Story 3 - Browse and open review documents for the architecture (Priority: P1)

**Goal**: A "reviews" tile, sourced from the leaf folder's own `reviews` subfolder (not the
folder directly), lists and opens review documents exactly like PRD's own reviews tile
(FR-011–FR-014).

**Independent Test**: Open an architecture folder containing a "reviews" subfolder with
two or more review files in it; confirm hovering the reviews tile lists them by friendly
name, alphabetically, and selecting one opens its content in a file-viewer dialog.

### Implementation for User Story 3

- [X] T016 [US3] In `ArchitectureDetailView.tsx`, add a local `ReviewsTile` component
      (re-declared here, matching `PrdDetailView.tsx`'s own — the same
      `ResizeObserver`-matched tooltip width, controlled `open` state, and alphabetical
      listing) (depends on T002).
- [X] T017 [US3] In `ArchitectureDetailView.tsx`, add an effect that fetches
      `` fetchContents("output", `${entry.path}/reviews`) `` on mount and whenever
      `entry.path` changes, storing the result in local state; a rejected fetch (subfolder
      absent) is caught and treated as an empty array, matching `PrdDetailView.tsx`'s own
      folder-contents-fetch-failure handling (depends on T002; FR-011, FR-012, research.md
      § 3).
- [X] T018 [US3] In `ArchitectureDetailView.tsx`, compute
      `buildReviewFileList(reviewsFolderFiles)` via `useMemo` and render `ReviewsTile`
      (T016) in the tile row, wiring `onSelectReview` to call
      `onOpenFile(review.path)` (depends on T016, T017; FR-013, FR-014).
- [X] T019 [US3] Manually verify quickstart.md Scenario 3 via Playwright: reviews tile
      lists files from the `reviews/` subfolder (not the leaf folder itself) by friendly
      name, alphabetically; selecting one opens the file-viewer dialog; a folder with no
      `reviews` subfolder shows the tile disabled.

**Checkpoint**: User Stories 1, 2, and 3 are all independently functional.

---

## Phase 6: User Story 4 - Review the architecture's memory log (Priority: P2)

**Goal**: A "memory log" tile reuses PRD's own bespoke dialog format verbatim, but with no
requirement code ever rendered as a clickable link (FR-015–FR-019).

**Independent Test**: Open an architecture folder containing a memory log file with
several categorized entries, including one mentioning a requirement code; confirm the
dialog renders candy-striped rows with category headers, and confirm the mentioned code
renders as plain text, not a link.

### Implementation for User Story 4

- [X] T020 [US4] In `ArchitectureDetailView.tsx`, add an effect that fetches
      `fetchContents("output", entry.path)` (the leaf folder's own direct contents — a
      separate fetch from T017's `reviews`-subfolder listing) on mount and whenever
      `entry.path` changes, storing the result in local state; used only to detect a file
      named exactly `.memlog.md` (depends on T002; FR-015, FR-016).
- [X] T021 [US4] In `ArchitectureDetailView.tsx`, add memlog dialog state and a
      `handleOpenMemlog` function that fetches `` `${entry.path}/.memlog.md` `` via
      `fetchFileContentOrNull`, and render a `SingleFileTile` ("memory log", `HistoryIcon`,
      re-declared here matching `PrdDetailView.tsx`'s own) in the tile row, enabled only
      when T020's listing contains `.memlog.md` (depends on T020; FR-015, FR-016).
- [X] T022 [US4] In `ArchitectureDetailView.tsx`, render the existing `MemoryLogDialog`
      (imported unmodified from `web/src/components/MemoryLogDialog.tsx`) with
      `prdReferences={[]}` always (never a real detected-codes array), and
      `onSelectReference` simply closing the dialog (never actually reachable in practice,
      since an empty `prdReferences` array means `MemoryLogDialog` never renders a
      clickable segment — kept only for prop-shape parity with `PrdDetailView`'s own
      usage) (depends on T021; FR-017, FR-018, FR-019, research.md § 4).
- [X] T023 [US4] Manually verify quickstart.md Scenario 4 via Playwright: bespoke
      candy-striped/category-header rendering matches PRD's own; a bullet mentioning a
      code that genuinely exists in `ARCHITECTURE-SPINE.md` still renders as plain text,
      not a link; a folder with no `.memlog.md` shows the tile disabled.

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Confirm the "no addendum tile" scope exclusion holds, and that nothing
regressed across the whole test suite and PRD's own existing view.

- [X] T024 Manually verify quickstart.md Scenario 5 via Playwright: the tile row contains
      exactly two tiles (reviews, memory log) — no third, addendum-shaped tile anywhere,
      regardless of what files exist in the folder (FR-020).
- [X] T025 [P] Run the full `npm test` suite and confirm `prdIndex.test.ts`'s extended
      cases (T008) pass alongside every pre-existing test with zero regressions.
- [X] T026 Manually verify quickstart.md's Regression pass: PRD's own reviews/addendum/
      memory-log tiles and requirement-code index (features 012/013) still work exactly as
      before, including memory-log links to codes that exist in that PRD; Sprint Status
      and every other existing Navigator selection unaffected; the Infra/Output tabs' own
      file browser still renders `ARCHITECTURE-SPINE.md`/`.memlog.md` as plain Markdown
      when opened directly, unaffected by this feature's tile-driven bespoke rendering
      (FR-021).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational only.
- **User Story 2 (Phase 4)**: Depends on Foundational; its rendering tasks (T010+) also
  depend on User Story 1's T004 (the frontmatter-stripped content and Markdown render it
  attaches anchors to) — so in practice, complete Phase 3 before Phase 4, even though both
  are P1.
- **User Story 3 (Phase 5)**: Depends on Foundational only (T002) — independent of Phases
  3 and 4, and can run in parallel with either.
- **User Story 4 (Phase 6)**: Depends on Foundational only (T002) — independent of Phases
  3, 4, and 5, and can run in parallel with any of them.
- **Polish (Phase 7)**: Depends on all four user stories being complete.

### Within Each User Story

- User Story 2's test (T008) MUST be written and confirmed failing before T009.
- Derivation before rendering: T009 before T010; T010 before T011/T012; T012 before T013;
  T011+T013 before T014.
- User Story 3: T016 and T017 before T018.
- User Story 4: T020 before T021; T021 before T022.

### Parallel Opportunities

- T008 (Phase 4 tests) can run in parallel with Phase 3's tasks and with Phases 5/6, since
  none share a file with them (though all ultimately edit the same
  `ArchitectureDetailView.tsx` file for their own implementation tasks, so those specific
  implementation tasks are sequenced by story, not run concurrently against the same
  file).
- T025 is independent of T024/T026 and can run in parallel.

---

## Parallel Example: User Story 2's tests alongside other stories

```bash
# T008 (a new test file's worth of cases) can be written while Phase 3 is still underway:
Task: "Extend tests/unit/web/prdIndex.test.ts with styles-parameter cases"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: Run quickstart.md Scenario 1 independently.
5. This alone already replaces feature 015's bare-folder-name placeholder with a real,
   readable architecture document view — a meaningful increment even before the index or
   tiles exist.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. User Story 1 → validate → the architecture document is readable full-pane (MVP).
3. User Story 2 → validate → the requirement-code index is navigable, header-style only.
4. User Story 3 → validate → review documents are discoverable and openable.
5. User Story 4 → validate → the memory log is readable with no links.
6. Polish → confirm no addendum tile and full regression pass.

## Notes

- [P] tasks = different files, no dependencies (or, for T008, a file not yet touched by
  any other in-flight task).
- [Story] label maps task to specific user story for traceability.
- Unlike User Story 2 (which needs User Story 1's rendering in place first for practical
  file-dependency reasons), User Stories 3 and 4 genuinely need only the Foundational
  phase — either can be built and validated before or alongside Stories 1/2.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
