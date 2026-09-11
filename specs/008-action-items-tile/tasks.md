---

description: "Task list template for feature implementation"
---

# Tasks: Action Items Tile

**Input**: Design documents from `/specs/008-action-items-tile/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included for `parseActionItems` - genuine parsing/derivation logic under
constitution Principle V's main clause (like feature 006/007's `groupPrdFolders`/
`parseSprintStatus`/`calculateActiveEpic`), not just UI-adjacent pure logic. The existing
`parseSprintStatus` tests are updated for its new signature and new field, not dropped.
Icon rendering, per-property hiding, layout, and the jump-to-file interaction are UI/
rendering, manually verified per Principle V's carve-out (`quickstart.md`).

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Per `plan.md` § Project Structure: one new backend module
(`src/navigator/action-items.ts`), one new frontend component
(`web/src/components/ActionItemsTile.tsx`), and targeted edits to feature 006/007's
existing sprint-status/Navigator/file-viewer plumbing - no new routes.

---

## Phase 1: Setup

No new dependency or project-structure work is needed for this feature (plan.md's
Technical Context: icons come from the already-installed `@mui/icons-material`). Proceed
directly to User Story 1.

---

## Phase 2: Foundational

No cross-story blocking work is needed - User Story 2 only extends files User Story 1
creates (`ActionItemsTile.tsx`'s jump icon, and the Navigator/App.tsx plumbing around it);
nothing needs to land before User Story 1 itself.

---

## Phase 3: User Story 1 - See action items alongside the sprint summary (Priority: P1) 🎯 MVP

**Goal**: An "Action Items" tile appears beside the Summary tile, same height, listing
every action item with its owner/status/epic/action rendered (and the jump icon rendered,
though not yet clickable - that's User Story 2), hiding any element whose bound property
is absent, scrolling internally when there are more items than fit.

**Independent Test**: Open a Sprint Status view for a file with several action items
covering a mix of owners, statuses, and epics, including at least one item missing a
property; confirm the tile appears beside the Summary tile at the same height, every
item's visible elements match its data, the missing property's element is absent, and the
tile scrolls internally once there are enough items to overflow it.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T001 [P] [US1] Unit tests for `parseActionItems()` in
      `tests/unit/navigator/action-items.test.ts`: a fully-populated item; an item missing
      `owner`/`status`/`ref`/`epic`/`action` individually (each → `null`, not an empty
      string); a non-numeric `epic` value treated as missing; `action_items` absent or not
      an array → `[]`; a non-object entry within the array skipped; a missing or
      non-string `id` falls back to a synthetic (array-index-based) id; a present `ref`
      produces a `resolvedPath` computed by joining a given project root path with `ref`

### Implementation for User Story 1

- [X] T002 [US1] Implement the `ActionItem` type and `parseActionItems(root,
      projectRootPath)` in `src/navigator/action-items.ts` per data-model.md and
      research.md § 1; must make T001 pass
- [X] T003 [US1] Update the existing `parseSprintStatus()` calls in
      `tests/unit/navigator/sprint-status.test.ts` for its new
      `(parsedYaml, projectRootPath)` signature, and extend its assertions to include the
      new `actionItems` field (an empty array for fixtures that don't declare any, plus at
      least one fixture that does, asserting the parsed items and a correctly resolved
      `resolvedPath`); depends on T002
- [X] T004 [US1] Extend `parseSprintStatus()` in `src/navigator/sprint-status.ts`: accept
      the new `projectRootPath: string` parameter, call `parseActionItems()`, and add
      `actionItems` to the returned `SprintStatusResult`; must make T003 pass; depends on
      T002
- [X] T005 [US1] Update `src/server/routes/navigator-sprint-status.ts` to pass `root.path`
      as `parseSprintStatus()`'s new second argument; depends on T004
- [X] T006 [P] [US1] Add `ActionItem` and `actionItems: ActionItem[]` to
      `SprintStatusResult` in `web/src/api.ts`, mirroring the backend interface (this
      project's established server/client type-duplication convention, e.g. feature 006's
      `PrdGroupingResult`)
- [X] T007 [US1] Implement `web/src/components/ActionItemsTile.tsx`: a titled tile with a
      scrolling list, one row per `ActionItem` in array order, each showing - per
      data-model.md's rendering table - an owner-type icon (human-outline unless `owner`
      is exactly `"dev loop"`, else computer-like; tooltip = `owner`), a read-only
      tick-box icon (filled iff `status === "done"` exactly, else unfilled), a jump icon
      (tooltip = `ref`; purely visual in this task, no click handler yet - User Story 2
      wires that), the epic label (`epic-<N>`) immediately to its right, and the action
      text - each element rendered only when its bound field is non-`null` (FR-008); an
      empty-state message when `actionItems` is empty (FR-012); depends on T006
- [X] T008 [US1] Restructure `web/src/components/SprintStatusView.tsx`'s layout: wrap the
      Summary tile and the new `<ActionItemsTile>` in one row (`display: flex`, default
      `alignItems: stretch` so they share height, **and `width: "100%"`** - the row is a
      new direct child of the outer container's existing `alignItems: "flex-start"`, the
      same override the epic-tile stack already needed from that container and for the
      same reason, research.md § 4), `ActionItemsTile` taking the rest of the row's width
      with `minHeight: 0` on its inner scroll container; the existing epic-tile stack
      (feature 007) renders below this row, unchanged; depends on T007
- [X] T009 [US1] Add integration test cases to `tests/integration/web-server.test.ts` for
      `GET /api/navigator/sprint-status`'s response now including `actionItems` (a
      fixture with a couple of items, asserting the parsed shape and a correctly resolved
      `resolvedPath`); depends on T005

**Checkpoint**: At this point, User Story 1 should be fully functional and testable
independently (quickstart.md Scenarios 1, 2, and 4)

---

## Phase 4: User Story 2 - Jump to an action item's referenced document (Priority: P2)

**Goal**: Clicking an action item's jump icon opens its referenced file in the existing
file viewer dialog, with identical close/back behavior to the Infra/Output tabs.

**Independent Test**: Click the jump icon on an action item whose `ref` points to a real,
readable file; confirm the same file viewer dialog used by the Infra/Output tabs opens
showing that file, and that closing it via the "X", Escape, and browser Back all work
identically to how they already do there.

### Implementation for User Story 2

- [X] T010 [US2] Generalize `web/src/App.tsx`'s `openFileDialog`/`loadFileContent`:
      `openFileDialog` now takes an explicit `(tab: TabId, currentPath: string, path:
      string)` - callers supply the current path directly, since the Navigator tab has no
      `tabStates` entry to look it up from (update the existing Infra/Output
      `ContentsTable` call site to pass `tabStates[activeTab].selectedPath ?? ""`
      explicitly too); `loadFileContent` maps `tab === "navigator"` to `"output"` when
      calling `fetchFileContent` (research.md § 3), while the `NavigationState` it pushes
      keeps `tab: "navigator"` so Back/X/Escape return to Sprint Status, not the Output tab
- [X] T011 [US2] Thread an `onOpenFile: (path: string) => void` callback from `App.tsx`
      (calling `openFileDialog("navigator", navigatorSelectedItemId ?? "", path)`) down
      through `web/src/components/NavigatorView.tsx` and
      `web/src/components/NavigatorDetailPane.tsx` to `SprintStatusView`; depends on T010
- [X] T012 [US2] Wire `ActionItemsTile.tsx`'s jump icon (from T007) to call
      `onOpenFile(item.resolvedPath)` when clicked, rendering it as clickable only when
      `resolvedPath !== null`; depends on T011

**Checkpoint**: Both user stories should now be independently functional (all of
quickstart.md's scenarios)

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verification that spans both stories

- [X] T013 Run `npm test` (the full automated suite) and confirm everything passes: the
      new `tests/unit/navigator/action-items.test.ts`, the updated
      `tests/unit/navigator/sprint-status.test.ts`, the extended
      `tests/integration/web-server.test.ts`, and every untouched existing suite
- [X] T014 [P] Run `npm run typecheck` and resolve any strict-mode type errors introduced
      by the change
- [X] T015 Execute `quickstart.md` Scenarios 1–4 in a real desktop browser and confirm
      each matches its expected outcome - a headless Chromium is available via Playwright
      in this environment (used for features 006/007's own quickstart verification);
      prefer actually driving the app with it over only disclosing that manual
      verification wasn't performed

---

## Phase 6: Post-Implementation Design Feedback (2026-09-08)

**Context**: User feedback after T001–T015 landed, corrected in the same session per
feature 007's precedent - fix now, spec/data-model/contracts updated to match
(spec.md's new Clarifications session, FR-002/FR-004/FR-009/FR-014).

- [X] T016 [US1] Add a failing-first unit test to
      `tests/unit/navigator/action-items.test.ts` for the new sort rule (every non-`"done"`
      item before every `"done"` item, file order preserved within each group), then
      implement it in `parseActionItems()` (`src/navigator/action-items.ts`) - genuine
      derivation logic per constitution Principle V, same as the rest of this module
- [X] T017 [US1] Restructure `ActionItemsTile.tsx`'s row rendering: header line (owner
      icon, tick-box, jump icon, epic label) with the action text on its own line below it
      (FR-004); swap the jump icon's glyph from the bending-arrow to a magnifying-glass
      (`SearchIcon`, FR-007/Clarifications); alternate each row's background shading
      ("candy stripe", FR-014)
- [X] T018 [US1] Give the Action Items tile its own fixed height (instead of stretching to
      whatever height the Summary tile's content produces) so it establishes the shared row
      height and the Summary tile stretches to match it (FR-002); the item list continues
      to scroll internally past that height (FR-003, unchanged)
- [X] T019 Re-run `npm test`/`npm run typecheck` and re-verify `quickstart.md`'s scenarios
      in a real browser after T016–T018
- [X] T020 [US1] Fix T018's height mechanism: an explicit `height` on *only* the Action
      Items tile doesn't reliably make it dictate the shared row height - with flexbox's
      default `alignItems: stretch`, the Summary tile's own auto-height content still wins
      the row's cross size whenever it's naturally taller than that fixed value (e.g. a
      long `story_location`/`tracking_system` value in real data), leaving Action Items
      visibly shorter. Move the fixed height onto the row itself
      (`SprintStatusView.tsx`'s row `Box`, not `ActionItemsTile.tsx`'s `Paper`) so both
      tiles stretch to fill it regardless of either one's own content; add `overflow:
      "auto"` to the Summary tile as a safety net for the (now possible) case where its
      content exceeds that fixed height
- [X] T021 [US1] Fix T020's safety net: a fixed `height` on the row forced the Summary tile
      to scroll internally whenever its real content (e.g. a long `story_location` value)
      exceeded it - which the tile was never meant to do. Change the row's `height` to
      `minHeight` instead: Action Items still gets its usual ~360px default whenever
      Summary's content is shorter (the common case, `alignItems: "stretch"` fills both to
      that floor), but if Summary's content is ever taller, the row now grows to fit it
      instead of clipping it, and Action Items stretches to match the larger height too -
      remove the now-unnecessary `overflow: "auto"` safety net from the Summary tile
- [X] T022 [US1] Fix T021's remaining gap: `minHeight` on the row still let Action Items'
      own unbounded item count inflate the row (and drag Summary along with it) instead of
      scrolling, once there were enough items - pure CSS can't cap one flex sibling's
      content without also risking a mismatch against the other (FR-002 round 3,
      research.md § 4's rejected-approaches list). Replace the CSS-only approach with a
      `ResizeObserver` in `SprintStatusView.tsx` (`useLayoutEffect`) that measures the
      Summary tile's real rendered height and passes it to `ActionItemsTile` as an explicit
      `height` prop; pin the measured wrapper to `alignSelf: "flex-start"` to avoid the
      measurement feedback loop noted in research.md § 4
- [X] T023 Re-run `npm test`/`npm run typecheck`, and re-verify in a real browser: a
      short-Summary case, a long-Summary case (both tiles must match exactly, Summary must
      never scroll), and a many-action-items case (must scroll inside a tile that stays
      exactly Summary's height, not grow)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Empty for this feature - no dependencies, no work
- **Foundational (Phase 2)**: Empty for this feature - no cross-story blocking work exists
- **User Story 1 (Phase 3)**: No dependency on Setup/Foundational completing anything; no
  dependency on User Story 2
- **User Story 2 (Phase 4)**: Depends on User Story 1 - its jump icon (T012) extends the
  row `ActionItemsTile.tsx` (T007) already renders, and its plumbing (T010/T011) exists
  specifically to serve that jump icon
- **Polish (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independently testable; no dependency on User Story 2
- **User Story 2 (P2)**: Independently testable once implemented, but sequenced after
  User Story 1 since it extends files User Story 1 creates

### Within Each User Story

- Tests MUST be written (and confirmed failing) before implementation
- `parseActionItems` (T002) before `parseSprintStatus`'s extension that calls it (T004)
- The existing `parseSprintStatus` tests are updated (T003) before that function's own
  signature actually changes (T004), confirming they fail against the *old* signature first
- `ActionItemsTile.tsx` (T007) before `SprintStatusView.tsx`'s layout restructure that
  renders it (T008)
- `App.tsx`'s generalized file-opening plumbing (T010) before it's threaded down (T011)
  before the jump icon actually calls it (T012)

### Parallel Opportunities

- T001 (`parseActionItems` tests) and T006 (the frontend type mirror in `web/src/api.ts`)
  can run in parallel - different files, no dependency between them
- T014 (typecheck) can run in parallel with T013 (test suite) and T015 (manual
  quickstart) in Polish

---

## Parallel Example: User Story 1

```bash
Task: "Unit tests for parseActionItems() in tests/unit/navigator/action-items.test.ts"
Task: "Add ActionItem/actionItems to SprintStatusResult in web/src/api.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1 (Phases 1/2 are empty for this feature)
2. **STOP and VALIDATE**: Run quickstart.md Scenarios 1, 2, and 4 in a real browser
3. This is the smallest usable slice: every action item is fully visible and readable,
   just without the jump-to-file shortcut yet

### Incremental Delivery

1. Add User Story 1 → validate independently (MVP - the tile itself, fully readable)
2. Add User Story 2 → validate independently (jump-to-file, atop the same rows)
3. Each story adds value without breaking the previous one

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- `parseActionItems`'s correctness (T001/T002), including its path-resolution rule,
  matters as much as any backend test task in earlier features - it's genuine derivation
  logic, not UI-adjacent pure logic
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
