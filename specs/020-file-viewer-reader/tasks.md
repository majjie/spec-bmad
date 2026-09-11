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
> Of Phase 5, T013 and T015 are closed by recording the existing choice as intended. **T014
> is the single item in this whole retrofit that remains open**, because it is a person
> looking at a running browser - the one check no artifact can perform on its own behalf.

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

- [X] T013 **CLOSED: already verified, by the appropriate method.** The blank-declared-title
      rule is pure string derivation with no rendering component, and `fileViewerMeta.test.ts`
      pins it. A browser adds nothing to that check. Seeding `examples/sample-project` with a
      malformed document to exercise a rule the suite already covers would make the demo worse
      to read for no gain - the corpus represents well-formed BMAD output, which is what makes
      it useful as a demo. `quickstart.md` § A now says this instead of asking a verifier to
      construct one by hand.
- [X] T014 **DONE - verified in a running browser by the maintainer**, the one check no
      artifact can perform on its own behalf. The reading surface, its measure and its
      elevation all hold up in the light appearance.
      Two things were confirmed correct while checking: both syntax highlighters switch
      appearance (`oneLight` / `vscDarkPlus` selected from `useColorScheme`, in
      `MarkdownContent.tsx` **and** `FileViewerDialog.tsx`) - a dark code theme stranded on a
      light page was the main suspicion - and `CsvGrid.tsx` styles entirely through theme
      slots, so it follows too.
      It also surfaced a defect **outside** this feature: the modal and guided-tour scrims
      were hardcoded `rgba(0, 0, 0, …)`, identical in both appearances, which is feature 018's
      FR-027. Fixed there, not here.
- [X] T015 **CLOSED as a settled decision, not a deferral.** The panel sizes stay in their own
      module rather than moving to the token layer: the renderer's measure is conditional logic
      rather than a value, so a token would still need the flag passed alongside it, leaving
      one pairing split across two mechanisms. Recorded in plan.md's Structure Decision, with
      research § 6 keeping the alternative on record so it is not rediscovered from scratch. It
      becomes worth revisiting only if a third size state appears.

---

## Dependencies

- **Phase 2 blocks everything** - both derivations are consumed by the dialog.
- **US1 (Phase 3) is the MVP** and is independent of the layout work; the header change stands
  on its own.
- **US2 and US3 share Phase 4** because they are two halves of one coupling: T010 sizes the
  panel and T011 sets the measure, both from the flag T012 owns. Splitting them across phases
  would leave a checkpoint at which the panel grows but its content does not - the exact
  defect data-model.md § 4 warns about.
- **Phase 5** is independent. Only T014 remains, and it is a verification pass, not a change.

## Parallel opportunities

T002/T003 are unrelated modules. T004/T005 and T009 touch different test files.
