---

description: "Task list template for feature implementation"
---

# Tasks: Epic Step Detail

**Input**: Design documents from `/specs/009-epic-step-detail/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included for the new derivation functions (`deriveStepDisplay`/`matchSpecFileName`)
- genuine parsing/derivation logic under constitution Principle V's main clause (like
feature 006/007/008's `groupPrdFolders`/`parseSprintStatus`/`calculateActiveEpic`/
`parseActionItems`), not just UI-adjacent pure logic. The existing `parseSprintStatus`
tests are updated for its new signature and the `stories`→`steps` rename, not dropped.
Collapse/expand interaction, row layout, and the candy stripe are UI/rendering, manually
verified per Principle V's carve-out (`quickstart.md`).

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Per `plan.md` § Project Structure: one new backend module
(`src/navigator/step-detail.ts`), targeted edits to feature 006/007/008's existing
sprint-status/Navigator/SprintStatusView plumbing, and a rename of `stories`/`StoryStatus`
to `steps`/`StepDetail` across the server/client type-duplication boundary - no new routes.

---

## Phase 1: Setup

No new dependency or project-structure work is needed for this feature (plan.md's
Technical Context: icons come from the already-installed `@mui/icons-material`; the
directory listing reuses the already-existing `listRealEntries`). Proceed directly to
Foundational.

---

## Phase 2: Foundational

**Purpose**: The `stories`→`steps` rename and the new index/title/spec-matching
derivation are used by all three user stories below (US1 needs the renamed field just to
keep the view compiling; US2 needs the derived index/title; US3 needs the derived
`specPath`) - none of them is a single story's exclusive concern, so this work is a
blocking prerequisite, not folded into any one story's phase.

### Tests for Foundational ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T001 [P] Unit tests for `deriveStepDisplay()` and `matchSpecFileName()` in
      `tests/unit/navigator/step-detail.test.ts`: well-formed keys ("1-1-run-the-command...",
      "1-2-establish-the-visual-foundation", "1-6a-walk-the-artifact-tree-safely") each
      produce the expected `{ index, title }` (FR-005/FR-006); a key with no recognizable
      `<epic>-<story>` index falls back to the raw key for both `index` and `title`
      (FR-013); `matchSpecFileName` returns `null` for zero matches, the single matching
      filename for exactly one, and the alphabetically-first filename when more than one
      matches (FR-008/FR-012); an index that's a textual prefix of another index (e.g.
      "1-1" against a filename for "1-10" or "1-1a") never produces a false-positive match
      (FR-008)

### Implementation for Foundational

- [X] T002 Implement the `StepDetail` type, `deriveStepDisplay()`, `matchSpecFileName()`,
      and `buildStepDetails()` in `src/navigator/step-detail.ts` per data-model.md and
      research.md §§ 1, 3, 6; must make T001 pass
- [X] T003 Update the existing `parseSprintStatus()` calls and assertions in
      `tests/unit/navigator/sprint-status.test.ts` for its new third parameter
      (`specFileNames: string[]`) and the `stories`→`steps` rename - assert the full
      `StepDetail` shape (`index`/`title`/`specPath`) for at least one well-formed key, one
      malformed key, and one key whose index has a matching filename in the fixture's
      `specFileNames`, asserting a correctly-built `specPath`; no dependency on T002 (a
      separate module with its own tests) - must land before T004 (see Dependencies)
- [X] T004 Rename `EpicStatusGroup.stories` to `.steps` (`StepDetail[]`) in
      `src/navigator/sprint-status.ts`; extend `parseSprintStatus()`'s signature with the
      new `specFileNames: string[]` parameter, calling `buildStepDetails()` for each epic's
      steps; must make T003 pass; depends on T002
- [X] T005 Update `src/server/routes/navigator-sprint-status.ts` to list
      `implementation-artifacts` via the existing `listRealEntries` (research.md § 2),
      filter to non-directory entries, and pass the resulting filenames as
      `parseSprintStatus()`'s new third argument; depends on T004
- [X] T006 [P] Rename `StoryStatus` to `StepDetail` (adding `index`/`title`/`specPath`) and
      `EpicStatusGroup.stories` to `.steps` in `web/src/api.ts`, mirroring the backend
      interface (this project's established server/client type-duplication convention)
- [X] T007 Add integration test cases to `tests/integration/web-server.test.ts` for
      `GET /api/navigator/sprint-status`'s `epics[].steps` shape: a fixture with a
      well-formed step key and a matching `spec-<index>-*` file (asserting a correctly
      resolved `specPath`) and a step with no matching file (asserting `specPath: null`);
      depends on T005

**Checkpoint**: Backend derivation is complete and independently tested; the frontend type
mirror is in place. No user-visible change yet - proceed to User Story 1.

---

## Phase 3: User Story 1 - Epic tiles collapse by default (Priority: P1) 🎯 MVP

**Goal**: Every epic tile renders collapsed (key + overall status only) by default, with a
top-right control that expands it to reveal its full step list and retrospective status,
independently of every other tile's own collapsed/expanded state.

**Independent Test**: Open a Sprint Status view for a file with multiple epics, each with
several steps; confirm every tile starts collapsed, expand one, confirm its steps and
retrospective status appear, collapse it again, confirm they disappear - all without
affecting any other tile's state.

### Implementation for User Story 1

- [X] T008 [US1] In `web/src/components/SprintStatusView.tsx`: add a `useState<Set<string>>`
      of expanded epic keys (default empty - every tile collapsed, research.md § 5); add a
      top-right toggle control (`ExpandMore`/`ExpandLess` from `@mui/icons-material`) to
      each epic tile's header that adds/removes its own `epicKey` from that set; a
      collapsed tile (its key not in the set) renders only its key and overall status; an
      expanded tile renders its existing step list and retrospective status line exactly as
      today, with `epic.stories` reference updated to `epic.steps` (T004's rename) - no
      change yet to how each step itself is displayed (that's User Story 2); depends on T006

**Checkpoint**: User Story 1 should be fully functional and testable independently
(quickstart.md Scenarios 1–2)

---

## Phase 4: User Story 2 - Readable step rows (Priority: P1)

**Goal**: Once an epic tile is expanded, each step renders as a header/body row - its
index and status on one line, a human-readable title below it - instead of its raw,
dash-separated key, with adjacent rows visually alternating.

**Independent Test**: Expand an epic tile whose steps include at least one two-segment
index (e.g. "2-1") and one with a letter suffix (e.g. "1-6a"); confirm each step's index,
status, and title render correctly and match the expected transformation of its raw key.

### Implementation for User Story 2

- [X] T009 [US2] Restructure the step-rendering branch inside
      `web/src/components/SprintStatusView.tsx`'s expanded-epic content (from T008): each `step` in `epic.steps` renders as a header
      line (`step.index`, then `step.status` via the existing `StatusText` component) with
      a body line below it (`step.title`) - no magnifying-glass control yet (User Story 3);
      alternate each row's background shading ("candy stripe"), matching
      `ActionItemsTile.tsx`'s established per-row pattern (FR-004/FR-006/FR-011); depends
      on T008

**Checkpoint**: Both user stories should now be independently functional (quickstart.md
Scenarios 1–3)

---

## Phase 5: User Story 3 - Jump to a step's spec document (Priority: P2)

**Goal**: A step whose index has a matching spec document shows a magnifying-glass control
that opens it in the existing file viewer; a step with no match shows no such control.

**Independent Test**: Expand an epic tile containing a step whose index has a matching
`spec-<index>-*` file under the project's implementation artifacts, and one whose index has
no such file; confirm the first shows a magnifying-glass control that opens that document,
and the second shows no such control at all.

### Implementation for User Story 3

- [X] T010 [US3] Add the magnifying-glass control (the same `SearchIcon` from
      `@mui/icons-material` already used by `ActionItemsTile.tsx`'s jump icon) to each
      step's header line (from T009), rendered only when `step.specPath !== null`
      (FR-007); wire its `onClick` to call the `onOpenFile` prop already threaded into
      `web/src/components/SprintStatusView.tsx` (feature 008), passing `step.specPath`;
      depends on T009

**Checkpoint**: All three user stories should now be independently functional (all of
quickstart.md's scenarios)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification that spans all three stories

- [X] T011 Run `npm test` (the full automated suite) and confirm everything passes: the
      new `tests/unit/navigator/step-detail.test.ts`, the updated
      `tests/unit/navigator/sprint-status.test.ts`, the extended
      `tests/integration/web-server.test.ts`, and every untouched existing suite
- [X] T012 [P] Run `npm run typecheck` and resolve any strict-mode type errors introduced
      by the change (including every remaining `stories`/`StoryStatus` reference this
      rename must have touched)
- [X] T013 Execute `quickstart.md` Scenarios 1–5 in a real desktop browser and confirm
      each matches its expected outcome - a headless Chromium is available via Playwright
      in this environment (used for features 006/007/008's own quickstart verification);
      prefer actually driving the app with it over only disclosing that manual
      verification wasn't performed

---

## Phase 7: Post-Implementation Design Feedback (2026-09-08)

**Context**: User feedback after T001–T013 landed, corrected in the same session per
feature 007/008's precedent - fix now, spec updated to match (spec.md's new
Clarifications session, FR-002).

- [X] T014 [US1] In `web/src/components/SprintStatusView.tsx`: make the entire epic-tile
      header clickable to toggle expand/collapse, not only the chevron icon (FR-002); the
      chevron becomes a plain (non-button) icon so a click anywhere in the header - chevron
      included - fires exactly one toggle, never two from event bubbling through a nested
      interactive element
- [X] T015 Re-run `npm test`/`npm run typecheck` and manually verify in a real browser: a
      click anywhere on the header toggles the tile (not just the chevron), and clicking a
      step's magnifying-glass control (inside an expanded tile) does not also collapse it

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Empty for this feature - no dependencies, no work
- **Foundational (Phase 2)**: No dependency on Setup; MUST complete before any user story
  (all three depend on the renamed `steps` field, and US2/US3 depend on its derived fields)
- **User Story 1 (Phase 3)**: Depends on Foundational; no dependency on User Story 2 or 3
- **User Story 2 (Phase 4)**: Depends on User Story 1 - it restructures the step-rendering
  branch User Story 1's collapse/expand mechanism reveals
- **User Story 3 (Phase 5)**: Depends on User Story 2 - its magnifying-glass control
  extends the header line User Story 2 renders
- **Polish (Phase 6)**: Depends on all three user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independently testable once Foundational is complete; no
  dependency on User Story 2 or 3
- **User Story 2 (P1)**: Independently testable once implemented, but sequenced after User
  Story 1 since it restructures content User Story 1 first makes visible
- **User Story 3 (P2)**: Independently testable once implemented, but sequenced after User
  Story 2 since it extends the header line User Story 2 renders

### Within Each Phase

- Tests MUST be written (and confirmed failing) before implementation (Foundational)
- `deriveStepDisplay()`/`matchSpecFileName()` (T002) before `parseSprintStatus`'s extension
  that calls them (T004)
- The existing `parseSprintStatus` tests are updated (T003) before that function's own
  signature actually changes (T004), confirming they fail against the *old* signature first
- The collapse/expand mechanism (T008) before the step-row restructure that appears inside
  it (T009) before the magnifying-glass control added to that row (T010)

### Parallel Opportunities

- T001 (derivation tests) and T006 (the frontend type mirror in `web/src/api.ts`) can run
  in parallel - different files, no dependency between them
- T012 (typecheck) can run in parallel with T011 (test suite) and T013 (manual quickstart)
  in Polish

---

## Parallel Example: Foundational

```bash
Task: "Unit tests for deriveStepDisplay()/matchSpecFileName() in tests/unit/navigator/step-detail.test.ts"
Task: "Rename StoryStatus to StepDetail in web/src/api.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (backend rename + derivation, fully tested)
2. Complete Phase 3: User Story 1 (collapse/expand)
3. **STOP and VALIDATE**: Run quickstart.md Scenarios 1–2 in a real browser
4. This is the smallest usable slice: epic tiles no longer clutter the view by default,
   even though expanded content still shows raw step keys until User Story 2 lands

### Incremental Delivery

1. Add Foundational + User Story 1 → validate independently (collapse/expand, raw step
   keys still showing when expanded)
2. Add User Story 2 → validate independently (readable, candy-striped step rows)
3. Add User Story 3 → validate independently (jump-to-spec)
4. Each story adds value without breaking the previous one

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- `deriveStepDisplay()`/`matchSpecFileName()`'s correctness (T001/T002), including the
  deterministic tie-break and the index-prefix-collision guard, matters as much as any
  other backend test task in earlier features - it's genuine derivation logic, not
  UI-adjacent pure logic
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
