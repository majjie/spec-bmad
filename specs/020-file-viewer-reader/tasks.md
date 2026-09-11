---

description: "Task list template for feature implementation"
---

# Tasks: File Viewer as a Reading Surface

**Input**: Design documents from `/specs/020-file-viewer-reader/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-behavior.md, quickstart.md

**Tests**: Required for the DOM-free derivations - `web/src/fileViewerMeta.ts` (genuine string
parsing) and `web/src/fileViewerPaper.ts` - per constitution Principles IV and V. The dialog's
arrangement falls under Principle V's manual-browser carve-out and is covered by
`quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

> **Retrospective task list.** T001-T012 reconstruct delivered work and are marked `[X]`.
> Phase 5 is genuinely outstanding.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Path Conventions

Frontend code under `web/src/`, unit tests under `tests/unit/web/`.

---

## Phase 1: Setup

- [X] T001 Confirm no new dependency is required - rendering continues through feature 017's
      shared `MarkdownContent`, and both derivations are plain string and value work.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The two derivation modules the dialog consumes.

- [X] T002 [P] Create `web/src/fileViewerMeta.ts` with the `FileViewerMeta` shape and the
      blank-is-absent rule that treats an empty or whitespace declared value as missing
      (data-model.md § 1).
- [X] T003 [P] Create `web/src/fileViewerPaper.ts` returning the reading and expanded panel
      sizes as plain values, both expressed so the panel never exceeds the viewport
      (data-model.md § 3, FR-011).

**Checkpoint**: Derivations exist and are importable without a browser.

---

## Phase 3: User Story 1 - Know what I just opened (Priority: P1) 🎯 MVP

**Goal**: Every document opens under a readable title with the facts that identify it.

**Independent Test**: quickstart.md § A.

### Tests for User Story 1

- [X] T004 [P] [US1] Unit-test `humanizeFileName` in `tests/unit/web/fileViewerMeta.test.ts`:
      the specification prefix is stripped including a lettered step suffix, words are
      sentence-cased, a filename matching no convention keeps its words, and the result is
      never empty (FR-002, SC-001).
- [X] T005 [P] [US1] Unit-test `deriveFileViewerMeta` in the same file: a declared title wins,
      a **blank** declared title falls back to the filename, and absent facts come back as
      null rather than empty strings (FR-001, FR-003).

### Implementation for User Story 1

- [X] T006 [US1] Implement `humanizeFileName` and `deriveFileViewerMeta` in
      `web/src/fileViewerMeta.ts` per data-model.md § 2, with the ordered fallbacks that let
      `title` guarantee a non-empty result without the caller checking.
- [X] T007 [US1] Render the derived header in `web/src/components/FileViewerDialog.tsx` -
      title, the declared facts, and the filename - omitting any absent fact entirely, with no
      label and no placeholder, and ignoring unrecognised declared keys (FR-003, FR-004).
- [X] T008 [US1] Use the derived title as the panel's accessible name.

**Checkpoint**: Every document is identifiable on opening.

---

## Phase 4: User Story 2 & 3 - Read comfortably, expand when needed (Priority: P1 / P2)

**Goal**: A centred reading panel with a comfortable measure, and an escape hatch for wide
content.

**Independent Test**: quickstart.md §§ B and C.

### Tests

- [X] T009 [P] [US3] Unit-test `fileViewerPaperSize` in
      `tests/unit/web/fileViewerPaper.test.ts`: the two states differ, and the expanded state
      is the larger - the assertion that makes the panel/content pairing checkable at all.

### Implementation

- [X] T010 [US2] Convert `web/src/components/FileViewerDialog.tsx` from a full-screen sheet to
      a centred panel sized by `fileViewerPaperSize`, on a surface distinct from the page
      behind it (FR-006).
- [X] T011 [US2] Add `density` and `wide` to `web/src/components/MarkdownContent.tsx`,
      bounding the prose measure for the reading surface and releasing it when wide - extending
      the shared renderer rather than forking it, so feature 017's behavior stays identical in
      all four call sites (FR-005, FR-008, FR-012).
- [X] T012 [US3] Add the expand control to `web/src/components/FileViewerDialog.tsx`: toggles
      the panel size, passes the same flag down as `wide`, exposes its pressed state to
      assistive technology, and **resets on close** so the next document opens at the reading
      size (FR-007, FR-009, FR-010).

**Checkpoint**: Documents read comfortably by default and expand on demand.

---

## Phase 5: Outstanding

- [ ] T013 Add a fixture to `examples/sample-project` for a document declaring a **blank**
      title. The blank-is-absent rule protects SC-001 and is the case most likely to regress
      silently - it renders as an empty header rather than an error - but no document in the
      shipped corpus exercises it, so `quickstart.md` § A currently asks the verifier to
      construct one by hand.
- [ ] T014 Verify §§ B-E of `quickstart.md` against the **light** appearance as well as dark.
      This feature and feature 019 were developed in parallel on the same branch, and the
      panel's surface treatment and elevation were tuned largely in dark; § E exists for this
      but has not been recorded as passing.
- [ ] T015 Consider whether the panel sizes belong in the token layer rather than their own
      module. research § 6 records this as a reasonable alternative that was not taken - the
      renderer's measure decision is conditional logic rather than a value, so it would still
      need the flag. Worth revisiting only if a third size state is ever added; noted here so
      the option is not rediscovered from scratch.

---

## Dependencies

- **Phase 2 blocks everything** - both derivations are consumed by the dialog.
- **US1 (Phase 3) is the MVP** and is independent of the layout work; the header change stands
  on its own.
- **US2 and US3 share Phase 4** because they are two halves of one coupling: T010 sizes the
  panel and T011 sets the measure, both from the flag T012 owns. Splitting them across phases
  would leave a checkpoint at which the panel grows but its content does not - the exact
  defect data-model.md § 4 warns about.
- **Phase 5** is independent, and T015 is a decision to defer rather than work to schedule.

## Parallel opportunities

T002/T003 are unrelated modules. T004/T005 and T009 touch different test files.
