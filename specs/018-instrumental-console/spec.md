# Feature Specification: Instrumental Console Redesign

**Feature Branch**: `018-instrumental-console`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Redesign BMAD Browser as a polished instrumental developer console: token-driven
visual system, product shell with clearer IA (Overview / Requirements / Architecture /
Sprint / Method files / Generated files), Overview as default first paint, and a first-run
welcome modal with a skippable guided tour — aimed at developers who may not know BMAD.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Orient without knowing BMAD (Priority: P1)

A developer opens the tool against a project with `_bmad-output` and immediately sees a
named product header, a sidebar with human labels (not Infra/Output jargon), and an
Overview that shows what is in progress and which requirement/architecture documents exist
— without an empty “select something” void.

**Acceptance Scenarios**:

1. **Given** a project with navigator data, **When** the app loads, **Then** Overview is
   the active sidebar item and the main pane is not blank.
2. **Given** sprint status exists, **When** Overview renders, **Then** Active Epic is the
   primary insight and open action items are visible.
3. **Given** Method files / Generated files, **When** the sidebar renders, **Then** labels
   explain “BMAD install” vs “What the method produced”.

---

### User Story 2 - Welcome once, skip freely (Priority: P1)

A first-time visitor sees a branded welcome modal that explains the three document types
and offers **Start the tour** or **Skip, take me to the project**. Skipping never blocks
later use; Help can replay the tour.

**Acceptance Scenarios**:

1. **Given** no `localStorage` onboarding key, **When** the app loads, **Then** the welcome
   modal appears.
2. **Given** the user chooses Skip, **When** they reload, **Then** the modal does not
   reappear.
3. **Given** the user chooses Start the tour, **When** the tour runs, **Then** 4–5 anchored
   steps explain sidebar, Overview, document stage, refresh, and Help — with Esc/Skip
   always available.

---

### User Story 3 - Instrumental visual system (Priority: P2)

The UI uses cool-tinted charcoal surfaces, amber accent sparingly, IBM Plex Sans/Mono, and
semantic tokens — not default MUI dark + Roboto + cyan accent.

**Acceptance Scenarios**:

1. **Given** any screen, **When** inspected, **Then** colours come from semantic tokens /
   theme mapping — not ad-hoc `#90caf9` or `info.light`/`warning.light` for label/value.
2. **Given** status chips, **When** rendered, **Then** status is icon + human label (Done /
   In review / In progress / Backlog), not colour alone.

---

### User Story 4 - Readable documents (Priority: P2)

PRD and Architecture detail views use a ~65ch reading column, a compact requirement-code
rail, and a toolbar for Reviews / Addendum / Memory log (Title Case), with disabled actions
clearly labelled.

## Edge Cases

- No `_bmad-output`: Overview and curated sections omit; Method files remain if `_bmad` exists.
- No sprint file: Overview explains how to open Requirements instead.
- `prefers-reduced-motion`: tour spotlight and refresh spin are instant / non-spinning.
- Tour replay after Skip: Help starts the tour without showing welcome again.

## Requirements

- **FR-001** Product shell: header (mark, title, project name when known, Help, Refresh) +
  sidebar sections replacing equal-weight tabs.
- **FR-002** Overview is default when navigator is available; auto-surfaces sprint and/or
  latest PRD/architecture cards.
- **FR-003** First-run welcome + skippable tour persisted in `localStorage`.
- **FR-004** Semantic token layer mapped into MUI theme; IBM Plex Sans + Mono.
- **FR-005** Sprint: status chips; metadata collapsed under “Project details”; in-progress
  epic expanded by default.
- **FR-006** Skip link, landmarks, labelled icon buttons with tooltips, focus-visible rings.
- **FR-007** Read-only trust copy appears on welcome; Refresh communicates “reload from disk”.

## Success Criteria

- A BMAD-novice can open sample-project and identify Active Epic and a PRD within one minute.
- Tour is skippable; Help replays it.
- No WCAG AA regressions on contrast for body text and focus rings.
