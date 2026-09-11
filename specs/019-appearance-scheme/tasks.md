---

description: "Task list template for feature implementation"
---

# Tasks: Light and Dark Appearance

**Input**: Design documents from `/specs/019-appearance-scheme/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-behavior.md, quickstart.md

**Tests**: Required for the DOM-free resolution and persistence logic in
`web/src/colorScheme.ts` (constitution Principles IV and V). The visual result is verified
manually per `quickstart.md` - nothing in this project can assert contrast automatically.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

> **Retrospective task list.** T001-T014 reconstruct delivered work and are marked `[X]`.
> T015-T017 were done **during** this retrospective, fixing a defect it found. Phase 6 is
> genuinely outstanding.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Path Conventions

Frontend code under `web/src/`, unit tests under `tests/unit/web/`.

---

## Phase 1: Setup

- [X] T001 Confirm no new dependency is required - the appearance is CSS custom properties
      plus the existing theme factory (plan.md, Principle III).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The preference vocabulary every story depends on.

- [X] T002 Create `web/src/colorScheme.ts` with `ColorSchemePreference`, `ColorScheme`, and
      the storage key `bmad-browser:color-scheme` (data-model.md § 1).
- [X] T003 Implement `resolveColorScheme` in `web/src/colorScheme.ts` - the table in
      data-model.md § 2, whose first two rows are what makes an override outrank the system.

**Checkpoint**: The vocabulary exists; stories can begin.

---

## Phase 3: User Story 1 - Match the room I am working in (Priority: P1) 🎯 MVP

**Goal**: The tool follows the operating system with no configuration.

**Independent Test**: quickstart.md § A.

- [X] T004 [P] [US1] Unit-test `resolveColorScheme` in `tests/unit/web/colorScheme.test.ts`,
      including that it never returns `"system"` (FR-002).
- [X] T005 [US1] Add the light semantic block to `web/src/tokens.css` under
      `:root[data-color-scheme="light"]`, remapping **only** the semantic tier onto new sand /
      mist / ink / slate-blue primitives, with its own softer shadow definitions (FR-009,
      FR-010).
- [X] T006 [US1] Extend `createAppTheme(mode)` in `web/src/theme.ts` to build either palette
      from the same semantic names, sharing one typography and component-defaults block.
- [X] T007 [US1] Create `web/src/components/shell/ColorSchemeProvider.tsx` owning preference
      state, applying the resolved appearance, and providing the toggle through context.
- [X] T008 [US1] Subscribe to the system appearance query in the provider so a
      system-following reader updates without a reload (FR-003).
- [X] T009 [P] [US1] Add `tests/unit/web/lightThemeTokens.test.ts` asserting the light block's
      mapping and that the brand mark uses the brand token. Note its limits: this guards
      against accidental deletion, not against illegibility (research § 7).

**Checkpoint**: The tool follows the system correctly.

---

## Phase 4: User Story 2 - Override and have it remembered (Priority: P1)

**Goal**: A reader's explicit choice sticks and outranks the system.

**Independent Test**: quickstart.md § B.

- [X] T010 [P] [US2] Unit-test persistence in `tests/unit/web/colorScheme.test.ts`: values
      round-trip, an unrecognised value reads as `"system"` (FR-006), and a throwing backend
      neither throws nor loses the session (FR-008).
- [X] T011 [P] [US2] Unit-test `nextColorSchemePreference` in
      `tests/unit/web/colorScheme.test.ts`, especially that toggling while following the
      system produces an explicit override (data-model.md § 5).
- [X] T012 [US2] Implement `readColorSchemePreference`, `writeColorSchemePreference`,
      `clearColorSchemePreference` and `nextColorSchemePreference` in
      `web/src/colorScheme.ts`, every storage access wrapped.
- [X] T013 [US2] Add the appearance control to `web/src/components/shell/AppHeader.tsx`,
      labelled with the appearance it switches **to** (FR-004).

**Checkpoint**: Override works and persists.

---

## Phase 5: User Story 3 - No flash of the wrong appearance (Priority: P2)

**Goal**: The first painted frame is already correct.

**Independent Test**: quickstart.md § C.

- [X] T014 [US3] Add the synchronous pre-paint script to `web/index.html`: read the stored
      preference, fall back to the system query, stamp `data-color-scheme` and the native
      colour-scheme style on the document element, and fall back to a defined appearance if
      storage throws (FR-007, FR-008).

**Checkpoint**: No flash at any network speed.

---

## Phase 5b: Principle IV remediation - done during this retrospective

**These were NOT part of the original delivery.** Reconstructing the plan revealed that
`web/src/colorScheme.ts` referenced `window`, `document` and `HTMLElement` directly, which
broke `npm run typecheck` for the entire project and left both DOM-touching functions
untested. Fixed here rather than merely recorded.

- [X] T015 Change `readSystemColorScheme` in `web/src/colorScheme.ts` to take the media query
      by injection as a structural `{ matches: boolean } | null`, and `applyColorSchemeToDocument`
      to take an element-shaped `ColorSchemeRoot` instead of defaulting to
      `document.documentElement` (data-model.md §§ 3-4).
- [X] T016 Move the corresponding DOM access into
      `web/src/components/shell/ColorSchemeProvider.tsx`, which compiles against the DOM
      library, so the provider supplies `window.matchMedia(...)` and `document.documentElement`.
- [X] T017 Add tests for both functions in `tests/unit/web/colorScheme.test.ts` - the media
      query's two outcomes and its null fallback, and that the applier writes **both** the
      data attribute and the native colour-scheme style.

**Checkpoint**: `npm run typecheck` clean; Principle IV genuinely satisfied.

---

## Phase 6: Outstanding

- [ ] T018 Decide whether "follow the system" should be reachable from the interface. Today
      it is not: once the reader uses the control they hold an explicit preference until they
      clear site data by hand (`contracts/ui-behavior.md`, Known limitation). The trade was
      deliberate - a predictable two-state control over a reachable third state - but it was
      never a recorded decision, and the fix if it matters is a menu, not a longer cycle.
      **Requires a decision, not just implementation.**
- [ ] T019 Consider automating the contrast check behind SC-004. Nothing in the suite verifies
      it, and `lightThemeTokens.test.ts` is easy to mistake for coverage that it does not
      provide. research § 7 sets out the cost - a browser-based harness, weighed against
      Principle III - and recommends revisiting if a third appearance is ever added.
- [ ] T020 Guard the pre-paint script in `web/index.html` against silent removal. It is the
      entirety of FR-007, it duplicates a little resolution logic by necessity, and no
      automated test in this project would notice if it disappeared - a build-time assertion
      that the key and the attribute still appear in the built HTML would be cheap insurance.

---

## Dependencies

- **Phase 2 blocks everything** - every story consumes the preference vocabulary.
- **US1 (Phase 3) is the MVP.** US2 depends on its provider (T007) and theme mapping (T006).
- **US3 (Phase 5) is independent** of the provider - deliberately, since its whole point is to
  run before any of it exists.
- **US4's requirements** (legibility in both appearances) are satisfied by T005's palette work
  and verified in quickstart § D; it has no implementation task of its own.
- **Phase 6** is independent, and T018 is a decision before it is a task.

## Parallel opportunities

T004/T009, T010/T011 touch different files or different regions and can run together.
