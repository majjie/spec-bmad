---

description: "Task list template for feature implementation"
---

# Tasks: Navigator Tab Uplift

**Input**: Design documents from `/specs/007-navigator-uplift/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included for `calculateActiveEpic` — genuine derivation logic under
constitution Principle V's main clause (like feature 006's `parseSprintStatus`/
`groupPrdFolders`), not just UI-adjacent pure logic. `createBaselineState`'s existing test
is updated for its generalized signature rather than dropped. Icons, tile layout, and
default-tab wiring are UI/rendering, manually verified per Principle V's carve-out
(`quickstart.md`).

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Per `plan.md` § Project Structure: this feature only touches existing files from feature
006 (`web/src/{App,api,navigationHistory}.ts(x)`, `web/src/components/SprintStatusView.tsx`,
`src/navigator/sprint-status.ts`) and their existing tests — no new files.

---

## Phase 1: Setup

No new dependency or project-structure work is needed for this feature (plan.md's
Technical Context: no new libraries). Proceed directly to User Story 1.

---

## Phase 2: Foundational

No cross-story blocking work is needed — each of the four user stories below is
independent (spec.md's own per-story Independent Tests confirm this); several touch the
same file sequentially (noted in Dependencies below), but none blocks another's start.

---

## Phase 3: User Story 1 - Land on the Navigator tab (Priority: P1) 🎯 MVP

**Goal**: The Navigator tab is active on load when available, falling back to Infra when
it isn't.

**Independent Test**: Open the tool against a project with `_bmad-output` present and
confirm the Navigator tab is already active with no click; open it against a project
without `_bmad-output` and confirm it falls back to Infra, unchanged from before this
feature.

### Tests for User Story 1

- [X] T001 [US1] Update `createBaselineState()`'s existing test in
      `tests/unit/web/navigationHistory.test.ts` for its generalized `(tab, path)`
      signature (was `(infraRootPath)`), and add a case building a `"navigator"` baseline
      (`{ tab: "navigator", path: "" }`)

### Implementation for User Story 1

- [X] T002 [US1] Generalize `createBaselineState(infraRootPath: string)` to
      `createBaselineState(tab: TabId, path: string): NavigationState` in
      `web/src/navigationHistory.ts`; must make T001 pass
- [X] T003 [US1] Update `web/src/App.tsx`: initialize `activeTab` to `"navigator"`
      (optimistic default, research.md § 1); in the mount effect, once `fetchTabs()`
      resolves, explicitly `setActiveTab("infra")` when `tabs.navigator` is `false`
      (FR-002); establish the baseline via the now-generalized `createBaselineState` as
      soon as the resolved default tab is known — `{tab: "navigator", path: ""}`
      immediately once `tabs.navigator` is `true` (no further fetch needed), or the
      existing `{tab: "infra", path: tree.path}` once Infra's tree resolves, when falling
      back. Extend the existing `baselineEstablishedRef` guard to cover *both* paths (not
      just the Infra one) — it exists to prevent establishing the baseline twice (e.g.
      under React 18 Strict Mode's double-invoked effects in development), and that
      applies equally to the new Navigator-baseline path; depends on T002

**Checkpoint**: User Story 1 fully functional and testable independently
(quickstart.md Scenario 1)

---

## Phase 4: User Story 2 - See status at a glance via icons (Priority: P2)

**Goal**: Every epic's and story's status (done/review/backlog/in-progress) shows a
distinct icon alongside its existing text label; any other status shows text only.

**Independent Test**: Open a Sprint Status view with epics/stories covering all four
statuses plus one unrelated status value; confirm each of the four shows a distinct,
consistent icon and the unrelated one shows text only, with no error.

### Implementation for User Story 2

- [X] T004 [US2] In `web/src/components/SprintStatusView.tsx`, add a status→icon mapping
      for `done`/`review`/`backlog`/`in-progress` using `@mui/icons-material` (no new
      dependency, research.md § 3) and a small rendering helper that returns the icon (or
      nothing, for any other status — FR-005); apply it next to both an epic's own status
      (FR-003) and each of its stories' statuses (FR-004), using the identical mapping in
      both places

**Checkpoint**: User Stories 1 AND 2 both work independently (quickstart.md Scenario 2)

---

## Phase 5: User Story 3 - Read epic tiles as a single stacked list (Priority: P3)

**Goal**: Epic tiles render as one full-width column in their existing order; the Summary
tile's own appearance and position are unchanged.

**Independent Test**: Open a Sprint Status view with at least three epics; confirm each
tile spans the full detail-pane width and they stack top-to-bottom in existing order,
with the Summary tile unaffected.

### Implementation for User Story 3

- [X] T005 [US3] Restructure `web/src/components/SprintStatusView.tsx`'s outer layout:
      keep the Summary tile's existing appearance/position (FR-008), and render epic
      tiles in a full-width vertical stack (`flexDirection: "column"`, each tile
      `width: "100%"`) instead of the current wrapping grid (FR-006), preserving their
      existing file-declared order (FR-007); same file as T004 — sequential, not
      parallel, with it

**Checkpoint**: User Stories 1–3 all work independently (quickstart.md Scenario 3)

---

## Phase 6: User Story 4 - See which epic is active at a glance (Priority: P4)

**Goal**: The Summary tile shows a new "Active Epic" field, calculated per FR-009/FR-010.

**Independent Test**: Open Sprint Status views for all-done, all-backlog, one-in-progress,
and mixed-with-none-in-progress epics; confirm "Active Epic" shows the expected value
each time.

### Tests for User Story 4

- [X] T006 [P] [US4] Unit tests for `calculateActiveEpic()` in
      `tests/unit/navigator/sprint-status.test.ts`: every epic `done` → `"All complete"`;
      every epic `backlog` → `"Not started"`; a mix with one epic `in-progress` → that
      epic's `epicKey`; a mix with more than one epic `in-progress` → the *first* one in
      file-declared order; a mix with none `in-progress` and not all-done/all-backlog →
      `"unknown"`; an empty `epics` array → `"unknown"` (FR-010, not vacuously
      "All complete"/"Not started")

### Implementation for User Story 4

- [X] T007 [US4] Implement `calculateActiveEpic(epics: EpicStatusGroup[]): string` in
      `src/navigator/sprint-status.ts` per data-model.md/research.md § 4; wire it into
      `parseSprintStatus()` to populate a new `activeEpic` field on
      `SprintStatusSummary` (not a sibling of `epics`, research.md § 4); must make T006
      pass
- [X] T008 [US4] Add `activeEpic: string` to `SprintStatusSummary` in `web/src/api.ts`
      (mirroring the backend interface, this project's established server/client
      type-duplication convention — see feature 006's `PrdGroupingResult`/
      `SprintStatusResult` precedent), and add an "Active Epic" entry to
      `web/src/components/SprintStatusView.tsx`'s existing `SUMMARY_FIELDS` list so it
      renders through the existing loop with no special-casing; depends on T007; same
      file as T004/T005 — sequential, not parallel, with them
- [X] T009 [US4] Extend the existing `GET /api/navigator/sprint-status` integration test
      in `tests/integration/web-server.test.ts` to also assert `body.summary.activeEpic`
      for that test's fixture; depends on T007

**Checkpoint**: All four user stories work independently (quickstart.md Scenario 4)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification that spans all four stories, plus one post-implementation
correction found during user review (T013) — added to `spec.md` as new FR-011 and an
Edge Cases bullet before being fixed here, per constitution Principle I

- [X] T010 Run `npm test` (the full automated suite) and confirm everything passes: the
      updated `navigationHistory.test.ts`, the extended `sprint-status.test.ts` and
      `web-server.test.ts`, and every untouched existing suite
- [X] T011 [P] Run `npm run typecheck` and resolve any strict-mode type errors introduced
      by the change
- [X] T012 Execute `quickstart.md` Scenarios 1–4 in a real desktop browser and confirm
      each matches its expected outcome — a headless Chromium is available via Playwright
      in this environment (used for feature 006's own quickstart verification); prefer
      actually driving the app with it over only disclosing that manual verification
      wasn't performed. All four scenarios passed on the first real-browser pass.
- [X] T013 Post-implementation correction (new FR-011): while verifying Scenario 1's
      fallback case with Playwright, found that `web/src/App.tsx`'s tab bar rendered all
      three tabs (`TAB_IDS.map(...)`) unconditionally — the `TabAvailability` fetched from
      `/api/tabs` was stored (`setAvailability(tabs)`) but its read value was discarded
      (`const [, setAvailability] = useState(...)`), so an unavailable tab (e.g. Output
      with no `_bmad-output`, or Navigator) still appeared in the bar and was clickable, a
      latent defect from feature 002/003's original tab-bar code that both this feature's
      FR-002 and feature 006's FR-002 had already assumed was true. Fixed by keeping the
      read value and filtering `TAB_IDS` by it before rendering (showing all three
      optimistically only while `availability` is still `null`, i.e. before `/api/tabs`
      resolves); verified with Playwright both that an unavailable tab disappears and that
      all three still show when every folder is present (no regression)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Empty for this feature — no dependencies, no work
- **Foundational (Phase 2)**: Empty for this feature — no cross-story blocking work exists
- **User Story 1 (Phase 3)**: No dependency on Setup/Foundational completing anything; no
  dependency on the other three stories
- **User Story 2 (Phase 4)**: Independent of User Story 1; no dependency on User Stories
  3/4 either, though it shares a file with both (see below)
- **User Story 3 (Phase 5)**: Independent of User Stories 1/2/4 in behavior, but its one
  task edits the same file as User Story 2's task — sequence after US2
- **User Story 4 (Phase 6)**: Independent of User Stories 1/2/3 in behavior, but its
  `SprintStatusView.tsx` task edits the same file as US2/US3's tasks — sequence after
  both
- **Polish (Phase 7)**: Depends on all four user stories being complete

### User Story Dependencies

- All four user stories are behaviorally independent (per spec.md's own Independent
  Tests) — the sequencing below is a **file-conflict** ordering, not a functional one

### Within Each User Story

- Tests MUST be written/updated (and confirmed failing against the old behavior) before
  implementation
- `createBaselineState`'s generalization (T002) before `App.tsx` uses it (T003)
- `calculateActiveEpic`'s implementation (T007) before both its type surface (T008) and
  its integration-test assertion (T009)

### Parallel Opportunities

- T006 (`calculateActiveEpic` tests) can run in parallel with T001–T005 (User Stories
  1–3, entirely different files)
- T011 (typecheck) can run in parallel with T010 (test suite) and T012 (manual
  quickstart) in Polish

---

## Parallel Example: Across Stories

```bash
# User Story 1's test/impl track and User Story 4's test track touch entirely different
# files and can run at the same time:
Task: "Update createBaselineState()'s test in tests/unit/web/navigationHistory.test.ts"
Task: "Unit tests for calculateActiveEpic() in tests/unit/navigator/sprint-status.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1 (Phases 1/2 are empty for this feature)
2. **STOP and VALIDATE**: Run quickstart.md Scenario 1 in a real browser
3. This is the smallest usable slice: the Navigator tab opens by default, with a correct
   fallback — independent of icons, layout, or the Active Epic field

### Incremental Delivery

1. Add User Story 1 → validate independently (MVP — default tab)
2. Add User Story 2 → validate independently (status icons)
3. Add User Story 3 → validate independently (stacked tiles)
4. Add User Story 4 → validate independently (Active Epic field)
5. Each story adds value without breaking the previous ones — though 2, 3, and 4 touch
   the same file in sequence, so apply them in that order even though nothing about their
   *behavior* depends on one another

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- `calculateActiveEpic`'s correctness (T006/T007) matters as much as any backend test
  task in earlier features — it's genuine derivation logic, not UI-adjacent pure logic
- Verify tests fail (or fail to compile, for T001's signature change) before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
