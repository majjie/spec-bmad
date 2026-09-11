---

description: "Task list template for feature implementation"
---

# Tasks: Instrumental Console Redesign

**Input**: Design documents from `/specs/018-instrumental-console/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-behavior.md, quickstart.md

**Tests**: Unit tests ARE required here, but only for the DOM-free derivation modules -
`web/src/shell.ts` and `web/src/onboarding/onboarding.ts` - per constitution Principle IV
(logic must be testable without a browser) and Principle V. The rendering layer falls under
Principle V's manual-browser carve-out and is covered by `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

> **Retrospective task list.** Tasks T001-T036 reconstruct the work already delivered on
> `ux-polish-console` and are marked `[X]` because the code implementing them is present and
> verified. They are recorded so the feature is traceable, not because they were worked from.
> **Phase 8 is different**: those items were surfaced *by* writing these artifacts. T036a and
> T037 were fixed in the course of the retrospective; T038-T041 remain open.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project with a bundled web frontend (per plan.md): frontend code lives under
`web/src/`, its unit tests under `tests/unit/web/`.

---

## Phase 1: Setup

**Purpose**: Confirm the feature needs no new dependency before touching any code.

- [X] T001 Verify `package.json` already provides React, MUI, and the test runner, and that
      this feature adds **no** new runtime dependency - the token layer is plain CSS custom
      properties and the theme uses MUI's existing `createTheme` (plan.md, Principle III).
      (T037 later added two *build-time* font packages; they bundle into the built assets and
      are not on the `npx` cold-start path the principle constrains.)

**Checkpoint**: No dependency work needed - proceed to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The token layer and the derivation modules that every user story consumes.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Create `web/src/tokens.css` with the three-tier layer from data-model.md § 8:
      primitives (neutral ramp, accent ramp, status hues, shadow), then a semantic tier
      naming roles (`--color-bg-*`, `--color-border-*`, `--color-text-*`, `--color-accent*`,
      `--color-status-*`, `--color-focus-ring`, plus spacing, radius, duration and easing).
      Include the `prefers-reduced-motion` block that neutralises the duration tokens at
      source, so FR-029 is not each component's job.
- [X] T003 Map the semantic tier into the MUI theme in `web/src/theme.ts` via
      `createAppTheme(mode)`, so library chrome and hand-written `sx` resolve to one source
      of truth (FR-025).
- [X] T004 Import `tokens.css` from `web/src/main.tsx` so the layer is present before first
      paint.
- [X] T005 Create the DOM-free shell derivation module `web/src/shell.ts` with the
      `ShellSection` / `ShellSelection` types from data-model.md § 1, mapped onto the
      existing backend tab identifiers rather than renaming them.

**Checkpoint**: Token layer and shell vocabulary exist - user stories can begin.

---

## Phase 3: User Story 1 - Orient without knowing BMAD (Priority: P1) 🎯 MVP

**Goal**: A newcomer sees a named product header, a plain-language sidebar, and a populated
Overview on first paint.

**Independent Test**: Open the tool against `examples/sample-project` and confirm, without
touching a control, that the stage is populated and every sidebar label reads without BMAD
knowledge (quickstart.md § B).

### Tests for User Story 1

- [X] T006 [P] [US1] Unit-test the project-identity derivation in
      `tests/unit/web/shell.test.ts`: `normalizeProjectKey` merges requirements and
      architecture lineages, `buildProjectNav` groups a multi-slug fixture, and a
      single-lineage fixture yields exactly one named group (FR-006).
- [X] T007 [P] [US1] Unit-test `workspaceProjectName` in `tests/unit/web/shell.test.ts`:
      prefers the sprint project, falls back to a sole named lineage, and returns null when
      neither resolves - so the header omits rather than guesses (contract § Header).
- [X] T008 [P] [US1] Unit-test `formatStatusLabel` and `countOpenActionItems` in
      `tests/unit/web/shell.test.ts`, including that any status other than `done` counts as
      open (data-model.md § 7).

### Implementation for User Story 1

- [X] T009 [US1] Implement `buildProjectNav`, `normalizeProjectKey`, `titleCaseProject` and
      `humanizeProjectSlug` in `web/src/shell.ts` per data-model.md § 2, including the
      reserved `_other` group that always sorts last and de-duplicates by path.
- [X] T010 [US1] Implement `workspaceProjectName`, `formatStatusLabel` and
      `countOpenActionItems` in `web/src/shell.ts`.
- [X] T011 [P] [US1] Create `web/src/components/shell/BrandMark.tsx`.
- [X] T012 [US1] Create `web/src/components/shell/AppHeader.tsx`: product identity, the
      detected project name when resolvable, and the Help / appearance / reload icon
      controls, each with a tooltip and an accessible name; the reload control's name states
      that it re-reads from disk (FR-001, FR-019, FR-027).
- [X] T013 [US1] Create `web/src/components/shell/sidebarNav.tsx` with the shared row and
      label presentation - full-bleed selection, depth-based indentation, and the
      `aria-expanded` accordion affordance. Presentation only; no decisions about *what* to
      render (plan.md, Structure Decision).
- [X] T014 [US1] Create `web/src/components/shell/AppSidebar.tsx` rendering the three
      labelled groups - workspace views, curated documents, raw folders - with the sprint
      entry present only when sprint data exists and each raw-folder entry captioned with the
      folder it maps to (FR-002, FR-003, FR-004).
- [X] T015 [P] [US1] Create the shared stage primitives in
      `web/src/components/stage/Stage.tsx` (frame, header, panel, stat strip, list row) so
      Overview, sprint and the detail views share one layout vocabulary.
- [X] T016 [P] [US1] Create `web/src/components/shell/OverviewPanels.tsx` with the panel and
      list primitives Overview composes, each stating its own empty case in words.
- [X] T017 [US1] Create `web/src/components/shell/OverviewView.tsx`: the stat row (project,
      latest requirements, latest architecture, active epic, open action items) and the
      sprint / requirements / architecture panels, with a neutral placeholder for any value
      that cannot be derived so the row's shape stays stable (FR-011, FR-012).
- [X] T018 [US1] Rewire `web/src/App.tsx` from tab state to `ShellSelection`, defaulting to
      Overview whenever navigator data is available so the stage is never an empty-selection
      prompt (FR-005, SC-002).

**Checkpoint**: A newcomer can orient on first paint. US1 is independently demonstrable.

---

## Phase 4: User Story 2 - Welcome once, skip freely (Priority: P1)

**Goal**: A first-time visitor gets an explanation and an escapable tour; the choice sticks,
and Help replays it.

**Independent Test**: Load in a fresh browser profile, skip, reload, confirm it does not
return, then replay from Help (quickstart.md § A).

### Tests for User Story 2

- [X] T019 [P] [US2] Unit-test onboarding persistence in `tests/unit/web/onboarding.test.ts`:
      absence reads as `pending`, `skipped` and `completed` round-trip, an unrecognised stored
      string reads as `pending`, and a throwing storage backend yields `pending` on read and
      is a silent no-op on write (FR-020, data-model.md § 5).
- [X] T020 [P] [US2] Unit-test the tour step config in `tests/unit/web/onboarding.test.ts`:
      every step has a non-empty anchor, and the steps cover the five concerns FR-016 names.

### Implementation for User Story 2

- [X] T021 [US2] Create `web/src/onboarding/onboarding.ts`: the versioned storage key, the
      tri-state type, fallible read/write/clear helpers, `shouldShowWelcome`, and the
      `TOUR_STEPS` data (data-model.md §§ 5-6).
- [X] T022 [US2] Create `web/src/components/shell/WelcomeModal.tsx` explaining the three
      document types, stating plainly that the tool never writes to the project, and offering
      exactly two paths - start the tour, or dismiss (FR-013, FR-014).
- [X] T023 [US2] Create `web/src/components/shell/GuidedTour.tsx`: steps anchored to
      `data-tour` attributes, highlighting the element each describes, exitable at every step
      by a single action including Escape (FR-016, FR-017).
- [X] T024 [US2] Wire welcome and tour into `web/src/App.tsx`, add the `data-tour` anchors to
      the sidebar, Overview nav row, stage, reload and Help, and make Help replay the tour
      without re-presenting the welcome (FR-018).

**Checkpoint**: Onboarding works and is escapable. US1 and US2 both stand alone.

---

## Phase 5: User Story 3 - One project, many document types (Priority: P2)

**Goal**: Requirements and architecture for one product read as one project identity, with
runs labelled and the accordion state machine respecting the user's collapses.

**Independent Test**: quickstart.md § C, plus § G for the multi-project path.

### Tests for User Story 3

- [X] T025 [P] [US3] Unit-test run labelling in `tests/unit/web/shell.test.ts`:
      `formatRunDate` produces a short human date and returns an unparseable value unchanged;
      `formatArtifactLeafLabel` names the document type on the latest run only (FR-007).
- [X] T026 [P] [US3] Unit-test the nesting predicate in `tests/unit/web/shell.test.ts`: a
      harbor-only tree is a single named lineage needing no nest, a multi-slug tree does, and
      the non-conforming group never counts toward the decision (FR-008, SC-009).
- [X] T027 [P] [US3] Unit-test the expansion state machine in `tests/unit/web/shell.test.ts`:
      `toggleExpandedKey` closes an open accordion, `seedExpandedIfNeeded` seeds once and
      retries against an empty tree, and `expandForDocSelection` does **not** reopen a section
      the user collapsed (FR-010, SC-008) - the highest-risk behavior in the feature.

### Implementation for User Story 3

- [X] T028 [US3] Implement `formatRunDate` and `formatArtifactLeafLabel` in
      `web/src/shell.ts`, deriving `isLatest` from position rather than by comparing dates
      (data-model.md § 3).
- [X] T029 [US3] Implement the sidebar structure helpers in `web/src/shell.ts` -
      `hasMultipleNamedSlugs`, `namedSlugGroups`, `sectionHasLeaves`, `slugKeyForSelection`,
      `keysForDocSelection`, `expandKeyForSlug`, `slugNavSummary` (data-model.md § 4).
- [X] T030 [US3] Implement the expansion state machine in `web/src/shell.ts` -
      `toggleExpandedKey`, `ensureExpandedForSelection`, `expandForDocSelection`,
      `seedExpandedIfNeeded` - with the invariant that only `toggleExpandedKey` ever removes
      a key.
- [X] T031 [US3] Render the conditional per-project nest and the non-conforming group in
      `web/src/components/shell/AppSidebar.tsx`, and hold the expansion state in
      `web/src/App.tsx` (FR-008, FR-009).

**Checkpoint**: Navigation is coherent and never fights the user's collapses.

---

## Phase 6: User Story 4 - Read sprint status at a glance (Priority: P2)

**Goal**: Status is legible in greyscale, the active epic is open, metadata is out of the way.

**Independent Test**: quickstart.md § D.

- [X] T032 [P] [US4] Create `web/src/components/stage/StatusChip.tsx` pairing an icon with a
      human label for each known status and degrading to plain text for an unrecognised one -
      forward-compatibility with newer BMAD tooling, not a fallback (FR-021, FR-022,
      research § 8).
- [X] T033 [US4] Restructure `web/src/components/SprintStatusView.tsx` onto the shared stage
      primitives, expanding the in-progress epic by default and collapsing project metadata
      behind a disclosure (FR-023, FR-024).

**Checkpoint**: Sprint status is scannable.

---

## Phase 7: User Story 5 - Navigate without a mouse or fine colour vision (Priority: P3)

**Goal**: Keyboard reachability, named controls, visible focus, honoured reduced motion.

**Independent Test**: quickstart.md § E.

- [X] T034 [US5] Add the skip-to-main-content control and expose header, navigation and main
      as landmarks with accessible names in `web/src/App.tsx` and the shell components
      (FR-026).
- [X] T035 [US5] Ensure every icon-only control has a tooltip and an accessible name
      (FR-027), and that focus-visible styling uses the focus token throughout (FR-028).
- [X] T036 [P] [US5] Move the remaining ad-hoc colours in
      `web/src/components/FrontmatterInfoControl.tsx`, `NavigatorDetailPane.tsx`,
      `NavigatorTree.tsx`, `NavigatorView.tsx`, `PrdDetailView.tsx` and
      `ArchitectureDetailView.tsx` onto semantic tokens - in particular the label/value pairs
      that were borrowing the component library's `info`/`warning` slots to mean something
      they do not (FR-025).
- [X] T036a [US5] **Completed during this retrospective, not in the original delivery.** The
      cross-artifact analysis found T036 had missed two call sites, so FR-025 was not actually
      satisfied when it was marked done: `web/src/components/MemoryLogDialog.tsx` still used
      `info.light` to mean "this is a link" - the exact borrowed-slot anti-pattern FR-025
      names - and `web/src/components/shell/AppHeader.tsx` used `error.main` for the reload
      control's failure state while `--color-status-error` already existed. Both now resolve
      through semantic tokens; a search for raw colour literals and borrowed palette slots
      across `web/src/components/` and `App.tsx` returns zero results.
      **Note the visible change**: the memory-log reference link was a pale blue and is now
      the accent colour, which is the appearance FR-025 intends but is a deliberate visual
      difference worth confirming in `quickstart.md`.

**Checkpoint**: The console is usable by keyboard, in greyscale, and with motion disabled.

---

## Phase 8: Surfaced by this retrospective

Identified while reconstructing the artifacts above; each cites its evidence. **T037 is
done** - it was a constitution violation serious enough to fix immediately rather than
schedule. The rest are genuinely outstanding, and T041 needs a decision before it is work.

- [X] T037 **[CRITICAL - constitution Principle III] - DONE during this retrospective.**
      Removed the third-party font dependency. The typeface was fetched from a remote font CDN
      at page load, so the tool did not render as designed offline and the browser contacted an
      external host every time a user opened their own private project documents on localhost -
      the exact risk the principle's rationale names. The intent had been to bundle the fonts
      at build time, but no such step existed: there was no font dependency, no font file in
      the repository, and the built `web/dist/index.html` still carried the live CDN links,
      because a remote `<link href>` is passed through the build untouched by design.
      Resolved by research § 6 option A - the font packages are now build-time dependencies and
      `web/src/main.tsx` imports the **latin subset** of exactly the six weights `theme.ts`
      maps. Built output now contains zero references to the CDN hosts and ~128 KB of bundled
      woff2. Verified per `quickstart.md` § H.
- [ ] T038 Restore a second project lineage and a non-conforming folder to
      `examples/sample-project` so the shipped demo exercises FR-008, FR-009 and SC-009. They
      were present in an earlier revision and removed when the sample was narrowed to one
      project; the multi-project path is now unit-tested but unreachable in the demo without
      hand-building a corpus (quickstart.md § G).
- [ ] T039 Reconcile the guided tour's copy with the delivered information architecture in
      `web/src/onboarding/onboarding.ts`. The sidebar step still describes sprint status as
      sitting "under Workspace", wording that dates from an information architecture this
      branch replaced. Verify every step's description against `contracts/ui-behavior.md`.
- [ ] T040 Finish the punctuation sweep across the shell's own copy. Fourteen em dashes
      remain in code added by this feature - including user-visible copy in
      `web/src/components/shell/WelcomeModal.tsx` and a literal dash constant in
      `web/src/components/shell/OverviewView.tsx` - so the sweep that rewrote the rest of the
      repository never covered the code landing alongside it. Cosmetic, but it leaves the
      codebase internally inconsistent.
- [ ] T041 Decide the fate of the Action Items tile removed during this redesign. Feature
      008 specified `web/src/components/ActionItemsTile.tsx`; it was deleted on this branch
      and its role absorbed into Overview's open-item count, but nothing in feature 008 or
      this feature authorises retiring it. Either amend feature 008 to record it as
      superseded, or restore it. **Requires a decision, not just implementation.**

---

## Dependencies

- **Phase 2 blocks everything.** The token layer and `ShellSection` vocabulary are consumed
  by every story.
- **US1 (Phase 3) is the MVP** and blocks nothing else logically, but US2's tour anchors
  attach to elements US1 creates, so US2 is most easily verified after it.
- **US3 (Phase 5) depends on US1's** `buildProjectNav` (T009) and the sidebar (T014).
- **US4 (Phase 6) depends on** the shared stage primitives (T015) and `formatStatusLabel`
  (T010).
- **US5 (Phase 7) touches components from every prior phase** and is therefore sequenced last.
- **Phase 8 is independent** of the rest and can be worked in any order - except T041, which
  is a decision before it is a task.

## Parallel opportunities

Within each phase, tasks marked `[P]` touch different files and can run together - notably the
test tasks T006/T007/T008, T019/T020, and T025/T026/T027, and the independent component
creations T011/T015/T016 and T032/T036.
