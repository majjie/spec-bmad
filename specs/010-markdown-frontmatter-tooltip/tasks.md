---

description: "Task list template for feature implementation"
---

# Tasks: Markdown Frontmatter Tooltip

**Input**: Design documents from `/specs/010-markdown-frontmatter-tooltip/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included for the new derivation module (`stripFrontmatter`/
`stringifyPreambleValue`) - genuine parsing/derivation logic under constitution
Principle V's main clause (like `getFileRenderMode`/`parseActionItems`/
`deriveStepDisplay`), not just UI-adjacent pure logic. The info control's hover/click
interaction and its color rendering are UI/rendering, manually verified per Principle V's
carve-out (`quickstart.md`).

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Per `plan.md` § Project Structure: one new frontend-only module
(`web/src/frontmatter.ts`) and a targeted edit to the existing `FileViewerDialog.tsx` -
no new routes, no backend changes.

---

## Phase 1: Setup

No new dependency or project-structure work is needed for this feature (plan.md's
Technical Context: `js-yaml` is already a project dependency, and the info control's icon
comes from the already-installed `@mui/icons-material`). Proceed directly to
Foundational.

---

## Phase 2: Foundational

**Purpose**: `stripFrontmatter()` (and its sibling `stringifyPreambleValue()`, same
module) is what both user stories build on - User Story 1 renders its `body`, User Story
2 renders its `preamble` - so this derivation work is a blocking prerequisite, not either
story's exclusive concern.

### Tests for Foundational ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T001 Unit tests for `stripFrontmatter()` and `stringifyPreambleValue()` in
      `tests/unit/web/frontmatter.test.ts`, per data-model.md's derivation table: content
      not starting with `---` → unchanged, `preamble: null` (FR-003); a `---` line with no
      closing `---` → unchanged (FR-004); YAML between the `---` lines that doesn't parse
      as a mapping (a scalar, a list, invalid YAML) → unchanged (FR-004); a YAML mapping
      with no marker element after it → YAML block removed, `preamble` returns the parsed
      mapping (FR-001); a YAML mapping followed by an opening tag whose same-named closing
      tag is found later in the document → both tag lines removed, the content between and
      after them preserved in place (FR-002); **the same case but with one or more blank
      lines between the closing `---` and the opening tag, and again between the opening
      tag and the content that follows it** - detection must not assume the opening tag
      sits on the very next line (research.md § 3 step 4, matching quickstart.md's own
      fixture shape); **the same case but with a substantial block of ordinary Markdown
      (several paragraphs, not just blank lines) between the opening tag and its closing
      tag** - the closing tag is found by scanning the rest of the document for a matching
      tag name, never assumed to be adjacent to the opening tag or near the top of the
      file (FR-002, per the file's own real-world shape: the closing tag can sit after a
      whole block of Markdown, arbitrarily far from the opening tag); an opening tag with
      no matching closing tag found anywhere later → only the opening tag line removed
      (Edge Cases); a YAML mapping with zero keys → still detected and stripped,
      `preamble` returns an empty object (FR-006's "no preamble" component-level treatment
      is a later task's concern, not this function's); `stringifyPreambleValue()` renders
      strings/numbers/booleans plainly and arrays/objects via `JSON.stringify` (e.g. `[]`
      for an empty list, FR-007)

### Implementation for Foundational

- [X] T002 Implement the `FrontmatterResult` type, `stripFrontmatter()`, and
      `stringifyPreambleValue()` in `web/src/frontmatter.ts` per data-model.md and
      research.md §§ 1-4; must make T001 pass

**Checkpoint**: The frontmatter derivation module is complete and independently tested. No
user-visible change yet - proceed to User Story 1.

---

## Phase 3: User Story 1 - Clean Markdown rendering (Priority: P1) 🎯 MVP

**Goal**: A Markdown file's YAML preamble (and, when present, its wrapping marker
element's tag lines) no longer appear in the rendered view - only the document's actual
content shows, exactly where it appears in the source.

**Independent Test**: Open a Markdown file whose content starts with a YAML block
followed by a marker element whose closing tag sits at the very end of the document,
wrapping ordinary Markdown in between; confirm the rendered view shows only that ordinary
Markdown, with no visible YAML syntax and neither of the marker element's tag lines
anywhere in it. Also confirm a file that merely starts with `---` for an unrelated reason,
and every non-Markdown file, render completely unaffected.

### Implementation for User Story 1

- [X] T003 [US1] In `web/src/components/FileViewerDialog.tsx`: when
      `getFileRenderMode(fileNameOf(path)).kind === "markdown"` and `content` is loaded
      (not `null`/`error`), compute `stripFrontmatter(content)` and pass its `body` to the
      existing `ReactMarkdown` render path instead of the raw `content` (FR-001/FR-002);
      every other render mode (`syntax`/`csv-grid`/`plain`) continues to receive `content`
      unchanged (FR-003); a file where `stripFrontmatter` detected no preamble renders via
      its unchanged `body` (which equals the original `content`), so FR-004's fallback
      needs no special-casing here; depends on T002

**Checkpoint**: User Story 1 should be fully functional and testable independently
(quickstart.md Scenarios 1, 3, 4, 5, 6)

---

## Phase 4: User Story 2 - Preamble readout on demand (Priority: P2)

**Goal**: An informational control appears next to the file viewer's existing close
control whenever a non-empty preamble was stripped from the current Markdown file;
hovering or clicking it reveals every preamble key/value pair, keys and values in two
visually distinct colors.

**Independent Test**: Open a Markdown file with a multi-key YAML preamble; confirm an
informational control appears next to the close control, and that hovering or clicking it
reveals every key/value pair from that preamble, with keys and values visually
distinguishable by color. Confirm the control is entirely absent for a Markdown file with
no preamble (or an empty one) and for any non-Markdown file.

### Implementation for User Story 2

- [X] T004 [US2] In `web/src/components/FileViewerDialog.tsx`: add an `IconButton`
      (`InfoOutlined` from `@mui/icons-material`) inside the existing floating
      close-button `Box`, alongside the close `IconButton`, rendered only when the current
      file's `stripFrontmatter(content).preamble` is non-null and has at least one key
      (FR-005/FR-006); depends on T003
- [X] T005 [US2] Wire that control to a controlled tooltip/popover (hover *and* click both
      open it - MUI's default `Tooltip` only opens on hover, so this needs an explicit
      controlled `open` state per research.md § 5) listing one row per
      `Object.entries(preamble)`: the key in one theme palette color,
      `stringifyPreambleValue(value)` in a second, visually distinct theme palette color
      (FR-007/FR-008); the marker element's own tag lines/attributes never appear here -
      only the YAML mapping's own pairs (FR-009); depends on T004

**Checkpoint**: Both user stories should now be independently functional (all of
quickstart.md's scenarios)

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verification that spans both stories

- [X] T006 Run `npm test` (the full automated suite) and confirm everything passes: the
      new `tests/unit/web/frontmatter.test.ts` and every untouched existing suite
- [X] T007 [P] Run `npm run typecheck` and resolve any strict-mode type errors introduced
      by the change
- [X] T008 Execute `quickstart.md` Scenarios 1–6 in a real desktop browser and confirm
      each matches its expected outcome - a headless Chromium is available via Playwright
      in this environment (used for features 006–009's own quickstart verification);
      prefer actually driving the app with it over only disclosing that manual
      verification wasn't performed

---

## Phase 6: Post-Implementation Design Feedback (2026-09-08)

**Context**: User feedback after T001–T008 landed - the readout's default tooltip
styling (translucent background, small text) was hard to read over varied Markdown
content. Corrected in the same session per this project's established precedent (features
007–009); spec.md updated to match (new Clarifications entry, FR-011).

- [X] T009 In `web/src/components/FileViewerDialog.tsx`: override the `Tooltip`'s default
      styling via `slotProps.tooltip.sx` - a fully opaque background (`bgcolor:
      "grey.900"`, not MUI's default translucent grey) and a larger `fontSize` (`"0.85rem"`
      vs. the default ~11px tooltip text), per FR-011; also removed the default `maxWidth`
      constraint, since it was truncating longer values (e.g. `baseline_commit`'s
      40-character hash) even before this fix

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Empty for this feature - no dependencies, no work
- **Foundational (Phase 2)**: No dependency on Setup; MUST complete before any user story
  (both depend on `stripFrontmatter()`'s result shape)
- **User Story 1 (Phase 3)**: Depends on Foundational; no dependency on User Story 2
- **User Story 2 (Phase 4)**: Depends on User Story 1 - it extends the same
  `FileViewerDialog.tsx` edit User Story 1 makes, adding the info control alongside it
- **Polish (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independently testable once Foundational is complete; no
  dependency on User Story 2
- **User Story 2 (P2)**: Independently testable once implemented, but sequenced after
  User Story 1 since it edits the same file and depends on the `stripFrontmatter` call
  User Story 1 already introduces there

### Within Each Phase

- Tests MUST be written (and confirmed failing) before implementation (Foundational)
- `stripFrontmatter()`/`stringifyPreambleValue()` (T002) before either story consumes them
  (T003, T004)
- The info control's presence (T004) before its tooltip/readout content (T005)

### Parallel Opportunities

- None in Foundational or the user-story phases - every implementation task from T002
  onward edits the same single file (`web/src/frontmatter.ts` then `FileViewerDialog.tsx`)
  sequentially, and T001 has no sibling task to run alongside it.
- T007 (typecheck) can run in parallel with T006 (test suite) and T008 (manual
  quickstart) in Polish - the only real parallel opportunity in this feature.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (frontmatter derivation, fully tested)
2. Complete Phase 3: User Story 1 (clean rendering)
3. **STOP and VALIDATE**: Run quickstart.md Scenarios 1, 3, 4, 5, 6 in a real browser
4. This is the smallest usable slice: the preamble no longer clutters the view, even
   though its values aren't yet recoverable via the info control

### Incremental Delivery

1. Add Foundational + User Story 1 → validate independently (clean rendering)
2. Add User Story 2 → validate independently (info control + color-differentiated readout)
3. Each story adds value without breaking the previous one

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- `stripFrontmatter()`'s correctness (T001/T002), including the tag-pair matching and its
  best-effort fallback, matters as much as any other backend test task in earlier
  features - it's genuine derivation logic, not UI-adjacent pure logic
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
