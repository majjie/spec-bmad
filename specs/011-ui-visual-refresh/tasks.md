---

description: "Task list template for feature implementation"
---

# Tasks: UI Visual Refresh

**Input**: Design documents from `/specs/011-ui-visual-refresh/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: None — this feature has no genuine derivation/parsing logic of its own (unlike
every prior feature this session); constitution Principle V's test-first clause doesn't
apply, only its UI-rendering carve-out does. Every task here is manually verified in a
real browser (`quickstart.md`), consistent with plan.md's Technical Context.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Per `plan.md` § Project Structure: two existing frontend components
(`ActionItemsTile.tsx`, `SprintStatusView.tsx`) and the shared theme file
(`web/src/theme.ts`) — no new files, no backend changes, no new routes.

---

## Phase 1: Setup

No new dependency or project-structure work is needed for this feature (plan.md's
Technical Context: every change reuses this project's existing MUI theme and palette
tokens). Proceed directly to User Story 1.

---

## Phase 2: Foundational

No cross-story blocking work exists — all three user stories touch independent visual
concerns (icon spacing; Summary tile colors; font size/accent/status colors) with no
shared setup one depends on the others completing first. Proceed directly to User Story 1.

---

## Phase 3: User Story 1 - Consistent icon spacing in item-row headers (Priority: P1) 🎯 MVP

**Goal**: The visual gap between the first two header elements in an Action Items row, and
in an Epic Step Detail row, matches the gap between the second and third — despite the
third being housed in a padded `IconButton`.

**Independent Test**: Open a Sprint Status view with an action item that has an owner
icon, a status icon, and a jump control, and an epic step with a status and a jump
control; visually confirm the gap between the first two icons matches the gap between the
second and third in both places.

### Implementation for User Story 1

- [X] T001 [P] [US1] In `web/src/components/ActionItemsTile.tsx`'s `ActionItemRow` header
      Box: add extra `marginRight` to the owner-icon element (the `OwnerIcon`/`Tooltip`
      wrapper), widening only the gap before the status checkbox, tuned empirically so it
      visually matches the gap before the jump control (research.md § 1, data-model.md);
      does not touch the jump control's own padding or click behavior
- [X] T002 [US1] In `web/src/components/SprintStatusView.tsx`'s `StepRow` header Box: add
      extra `marginRight` to the index `Typography` (`step.index`), widening only the gap
      before `StatusText`, tuned empirically so it visually matches the gap before the
      jump control when present (research.md § 1, data-model.md); a row with no jump
      control (no matching spec document) is unaffected beyond this one gap

**Checkpoint**: User Story 1 should be fully functional and testable independently
(quickstart.md Scenario 1)

---

## Phase 4: User Story 2 - Summary tile key/value colors match the frontmatter tooltip (Priority: P1)

**Goal**: The Summary tile's field labels and values render in the exact same two colors
already used by the Markdown frontmatter tooltip's key/value readout.

**Independent Test**: Open the Sprint Status Summary tile and a Markdown file with a
frontmatter preamble; confirm the Summary tile's field labels use the same color as the
tooltip's keys, and its field values use the same color as the tooltip's values.

### Implementation for User Story 2

- [X] T003 [US2] In `web/src/components/SprintStatusView.tsx`'s `Field` component: change
      the label `Typography`'s color from `text.secondary` to `info.light`, and give the
      value `Typography` an explicit `warning.light` color (currently unset/inherited) —
      the exact same two tokens `FileViewerDialog.tsx`'s `PreambleReadout` already uses
      (research.md § 5, data-model.md); depends on T002 (same file — sequenced, not a
      functional dependency)

**Checkpoint**: Both user stories should now be independently functional (quickstart.md
Scenarios 1–2)

---

## Phase 5: User Story 3 - A more deliberate, less monotone visual theme (Priority: P2)

**Goal**: Larger base text throughout the app; the existing blue accent applied
deliberately to every tile heading; each of the four recognized statuses rendering its
icon in its own distinct, semantically-fitting color.

**Independent Test**: Open the app fresh; confirm body text is legible at a comfortable
size without leaning in, that the blue accent already used for the active tab now also
appears on tile headings, and that status icons no longer all share the surrounding
text's color.

### Implementation for User Story 3

- [X] T004 [P] [US3] In `web/src/theme.ts`: raise `typography.fontSize` from `13` to `15`,
      and add an explicit `palette.primary` pinned to `#90caf9` (MUI's own existing
      dark-mode default — same hue, now a deliberate, explicit choice rather than an
      implicit one) (research.md §§ 2–3, data-model.md)
- [X] T005 [US3] In `web/src/components/SprintStatusView.tsx`: apply `color:
      "primary.light"` to the Summary tile's "Summary" heading, to the epic key portion
      of each epic tile's heading (`epic.epicKey` only — its status text keeps its own
      semantic color from T007, not this accent), and to each step row's index text
      (`step.index`) (research.md § 4, data-model.md); depends on T003 (same file —
      sequenced, not a functional dependency) and on T004 (this accent is only
      *deliberately* pinned, per FR-005, once `theme.ts`'s explicit `palette.primary`
      lands — a real, not merely scheduling, dependency)
- [X] T006 [US3] In `web/src/components/ActionItemsTile.tsx`: apply `color:
      "primary.light"` to the "Action Items" heading (research.md § 4, data-model.md);
      depends on T001 (same file — sequenced, not a functional dependency) and on T004
      (same real dependency as T005, above)
- [X] T007 [US3] In `web/src/components/SprintStatusView.tsx`'s `StatusText`: add a
      per-status `color` lookup parallel to the existing `STATUS_ICONS` map — `done` →
      `success`, `review` → `warning`, `backlog` → `disabled`, `in-progress` → `info` —
      passed as the icon's own `color` prop; any other status value continues to render
      with no icon and no special color, exactly as today (research.md § 6, data-model.md);
      depends on T005 (same file — sequenced, not a functional dependency)

**Checkpoint**: All three user stories should now be independently functional (all of
quickstart.md's scenarios)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification that spans all three stories

- [X] T008 Run `npm test` (the full automated suite) and confirm it passes completely
      unmodified — this feature adds no new test file and must not change the behavior any
      existing test asserts (FR-007/SC-005)
- [X] T009 [P] Run `npm run typecheck` and resolve any strict-mode type errors introduced
      by the change
- [X] T010 Execute `quickstart.md` Scenarios 1–6 in a real desktop browser and confirm
      each matches its expected outcome — a headless Chromium is available via Playwright
      in this environment (used for every prior feature's own quickstart verification this
      session); prefer actually driving the app with it over only disclosing that manual
      verification wasn't performed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Empty for this feature — no dependencies, no work
- **Foundational (Phase 2)**: Empty for this feature — no cross-story blocking work exists
- **User Story 1 (Phase 3)**: No dependency on Setup/Foundational completing anything; no
  dependency on User Story 2 or 3
- **User Story 2 (Phase 4)**: No functional dependency on User Story 1; sequenced after it
  only because both edit `SprintStatusView.tsx`
- **User Story 3 (Phase 5)**: No functional dependency on User Story 1 or 2; sequenced
  after them only because all three edit the same two component files
- **Polish (Phase 6)**: Depends on all three user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independently testable; no dependency on User Story 2 or 3
- **User Story 2 (P1)**: Independently testable; no dependency on User Story 1 or 3 beyond
  sharing a file with User Story 1
- **User Story 3 (P2)**: Independently testable; no dependency on User Story 1 or 2 beyond
  sharing files with both

### Within Each Phase

- T001 and T002 are independent of each other (different files) — either order is fine
- T003 comes after T002 only because both touch `SprintStatusView.tsx`; no functional
  ordering requirement between them
- T005 comes after T003 for the same same-file reason (`SprintStatusView.tsx`) — not
  because FR-002/FR-003 and FR-005 functionally depend on one another; T007 similarly
  comes after T005 for the same-file reason, not a functional one
- T005 and T006 also have a *real* dependency on T004: FR-005's accent is only
  deliberately-pinned, not merely incidental, once `theme.ts`'s explicit
  `palette.primary` exists — unlike their same-file predecessors, this one isn't just a
  scheduling convenience
- T006 comes after T001 for the same same-file reason (`ActionItemsTile.tsx`)

### Parallel Opportunities

- T001 (`ActionItemsTile.tsx`) and T004 (`theme.ts`) can run in parallel — different
  files, no dependency between them
- T009 (typecheck) can run in parallel with T008 (test suite) and T010 (manual
  quickstart) in Polish

---

## Parallel Example: User Story 1 / User Story 3

```bash
Task: "Fix ActionItemsTile.tsx's header spacing (T001)"
Task: "Raise base font size and pin the primary accent in theme.ts (T004)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1 (icon-spacing fix)
2. **STOP and VALIDATE**: Run quickstart.md Scenario 1 in a real browser
3. This is the smallest usable slice: the one concrete, most visible layout bug is fixed,
   independent of the broader color/font work

### Incremental Delivery

1. Add User Story 1 → validate independently (even icon spacing)
2. Add User Story 2 → validate independently (Summary tile colors match the tooltip)
3. Add User Story 3 → validate independently (larger text, blue tile headings, semantic
   status colors)
4. Each story adds value without breaking the previous one

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No automated tests are added by this feature — every task is manually verified per
  constitution Principle V's UI-rendering carve-out; the existing suite (T008) simply must
  keep passing unmodified, confirming no behavior regressed
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
