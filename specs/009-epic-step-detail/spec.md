# Feature Specification: Epic Step Detail

**Feature Branch**: `009-epic-step-detail`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Each step in the sprint status potentially has a corresponding
spec. For example, a step in the sprint-status.yaml has a step called
'1-1-run-the-command-and-reach-a-served-page'. It has a corresponding spec at
'_bmad-output/implementation-artifacts/spec-1-1-run-the-command-and-reach-a-served-page.md'.
While it might be tempting to match the two using the entirety of the string
'1-1-run-the-command-and-reach-a-served-page' in a file under
'_bmad-output/implementation-artifacts', I wouldn't do that. It's potentially brittle. I
would match by looking for the step index in implementation artifacts. Examples: for
'1-1-run-the-command-and-reach-a-served-page', go looking for a file that starts with
'spec-1-1-'; for '1-2-establish-the-visual-foundation', go looking for a file that starts
with 'spec-1-2-'; for '1-6a-walk-the-artifact-tree-safely', go looking for a file that
starts with 'spec-1-6a-'. I want to extend the way the epic steps are listed. The tiles
should be collapsed by default and have an expand/collapse button in the top right hand of
the tile. The individual steps will be a bit like the action items. The items will look as
follows: a header with the index of the step (e.g. 1-1, 2-1, 1-6a), the status of the step,
and an optional magnifying glass button (opens the corresponding spec in the file viewer;
absent if no spec exists yet); and a text body extracted from the name of the step, with
dashes and the step index removed (so '1-2-establish-the-visual-foundation' becomes
'establish the visual foundation'). The items should be candy striped."

## Clarifications

### Session 2026-09-08 (post-implementation feedback)

- Q: Should only the chevron icon toggle an epic tile, or the whole header? → A: The
  whole header — clicking anywhere in it (not only the small chevron) toggles
  collapsed/expanded.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Epic tiles collapse by default (Priority: P1)

A user viewing the Sprint Status view sees every epic tile collapsed to just its key and
overall status, and can expand any one of them via a control in its top-right corner to
see its full step list and retrospective status, collapsing it again the same way.

**Why this priority**: Today every epic tile always shows its full step list, which gets
increasingly cluttered as a sprint's epics and steps grow. Collapsing by default is the
foundation this feature's other value (readable step rows, jump-to-spec) sits on top of.

**Independent Test**: Open a Sprint Status view for a file with multiple epics, each with
several steps; confirm every tile starts collapsed (header only), expand one, confirm its
steps and retrospective status appear, collapse it again, confirm they disappear — all
without affecting any other tile's collapsed/expanded state.

**Acceptance Scenarios**:

1. **Given** a Sprint Status view with one or more epics, **When** the view first renders,
   **Then** every epic tile shows only its key and overall status — no steps, no
   retrospective status.
2. **Given** a collapsed epic tile, **When** the user selects its expand/collapse control,
   **Then** the tile reveals its full step list and retrospective status.
3. **Given** an expanded epic tile, **When** the user selects its expand/collapse control
   again, **Then** the tile collapses back to just its header.
4. **Given** two epic tiles, **When** the user expands one, **Then** the other remains
   exactly as it was (collapsed or expanded, independently).

---

### User Story 2 - Readable step rows (Priority: P1)

A user viewing an expanded epic tile sees each step as a row showing its index, its
status, and a plain-language title — not the raw, dash-separated key the sprint-status
file stores it under.

**Why this priority**: This is the core payload of the feature — today a step renders as
its raw key (e.g. "1-6a-walk-the-artifact-tree-safely"), which is harder to scan than a
short index plus a readable phrase.

**Independent Test**: Expand an epic tile whose steps include at least one two-segment
index (e.g. "2-1") and one with a letter suffix (e.g. "1-6a"); confirm each step's index,
status, and title render correctly and match the expected transformation of its raw key.

**Acceptance Scenarios**:

1. **Given** a step declared as "1-1-run-the-command-and-reach-a-served-page", **When** it
   renders, **Then** its index reads "1-1" and its title reads "run the command and reach
   a served page".
2. **Given** a step declared as "1-6a-walk-the-artifact-tree-safely", **When** it renders,
   **Then** its index reads "1-6a" and its title reads "walk the artifact tree safely".
3. **Given** a step's status, **When** it renders, **Then** it appears in the row's header
   alongside the index, using the same status presentation already used elsewhere in the
   Sprint Status view.
4. **Given** adjacent step rows, **When** an epic tile is expanded, **Then** the rows
   alternate background shading, matching the Action Items tile's existing pattern.

---

### User Story 3 - Jump to a step's spec document (Priority: P2)

A user viewing an expanded epic tile clicks a step's magnifying-glass control and the
spec document that corresponds to that step opens in the same file viewer used elsewhere
in this tool — and the control simply isn't there for a step that has no such document yet.

**Why this priority**: A valuable shortcut once steps are visible and readable (User
Stories 1 and 2) — every step is already fully identifiable without it.

**Independent Test**: Expand an epic tile containing a step whose index has a matching
`spec-<index>-*` file under the project's implementation artifacts, and one whose index has
no such file; confirm the first shows a magnifying-glass control that opens that document,
and the second shows no such control at all.

**Acceptance Scenarios**:

1. **Given** a step whose index has exactly one matching spec document, **When** it
   renders, **Then** a magnifying-glass control appears; selecting it opens that document
   in the file viewer, with the same close behavior already used throughout this tool.
2. **Given** a step whose index has no matching spec document, **When** it renders,
   **Then** no magnifying-glass control appears for that step.
3. **Given** a step's index happens to be a prefix of another step's index (e.g. "1-1"
   next to "1-10"), **When** matching spec documents, **Then** each step's control (if any)
   opens only the document matching its own full index, never the other step's.

---

### Edge Cases

- What happens when an epic has no steps at all? Expanding it shows no step rows and the
  existing retrospective status line, unchanged from today's behavior.
- What happens when a step's key doesn't have a recognizable `<epic>-<story>` index (an
  unusual, malformed entry)? The step still renders — its raw key stands in for both the
  index and the title — rather than being hidden or causing an error (FR-013).
- What happens when more than one spec document matches the same step's index? Exactly one
  is used, chosen deterministically, rather than showing more than one control or an
  unstable choice from render to render (FR-012).
- What happens when a step's index is a prefix of a different step's or spec file's index
  (e.g. "1-1" vs. "1-10")? Matching requires the index's own trailing separator, so "1-1"
  never matches a "1-10" or "1-1a" document (FR-008).
- What happens when a step's spec document existed at render time but can't be read when
  the user actually selects the control (deleted or moved in between)? The file viewer
  opens anyway and shows the same error state it already shows for any other unreadable
  document — not a broken view, not nothing happening (consistent with FR-009's reuse of
  the existing dialog).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every epic tile MUST default to a collapsed state, showing only its key and
  overall status.
- **FR-002**: Every epic tile MUST provide a control that toggles it between collapsed and
  expanded. The entire header (not only the chevron shown in its top-right corner) MUST be
  clickable — the chevron is a visual indicator of the current state, not the only way to
  toggle it (post-implementation Clarifications).
- **FR-003**: An expanded epic tile MUST show its full step list and its retrospective
  status, in addition to its header — its existing content, unchanged.
- **FR-004**: Each step MUST render as a row with a header line (its index and its status)
  followed by a body line (its human-readable title), matching the header-then-body
  pattern already used by the Action Items tile.
- **FR-005**: A step's displayed index MUST be the leading `<epic>-<story>` portion of its
  declared key (e.g. "1-1", "2-1", "1-6a" — the story segment may carry a trailing letter),
  not the key's full text.
- **FR-006**: A step's displayed title MUST be derived by removing its leading index (and
  the dash immediately following it) from its declared key, then replacing every remaining
  dash with a space (e.g. "1-2-establish-the-visual-foundation" → "establish the visual
  foundation").
- **FR-007**: A step MUST show a magnifying-glass control if and only if a spec document
  matching its index exists; the control MUST be entirely absent otherwise (not shown
  disabled).
- **FR-008**: A spec document MUST be considered a match for a step when its filename
  starts with `spec-<index>-` (index plus its own trailing dash), never by matching the
  step's full descriptive text — this prevents index "1-1" from matching a document meant
  for index "1-10" or "1-1a".
- **FR-009**: Selecting a step's magnifying-glass control MUST open its matched spec
  document in the same file-viewing dialog already used elsewhere in this tool (the Infra
  and Output tabs, and the existing Action Items tile), with the same close behavior.
- **FR-010**: Steps MUST continue to render in the same order they do today (file-declared
  order within their epic) — this feature changes how each step is displayed, not its
  order.
- **FR-011**: Step rows MUST alternate background shading ("candy stripe"), matching the
  Action Items tile's existing per-row pattern.
- **FR-012**: When more than one spec document matches a step's index, exactly one MUST be
  selected deterministically (the alphabetically-first matching filename).
- **FR-013**: A step whose key has no recognizable `<epic>-<story>` index MUST still
  render, using its raw key as both its index and its title, rather than being hidden or
  causing an error.

### Key Entities

- **Step Detail**: An extension of an epic's existing per-step data — a declared key (already
  present), plus a derived index, a derived human-readable title, and an optional resolved
  spec document path (present only when a match exists).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can see every epic's overall status at a glance, without expanding
  any of them.
- **SC-002**: Once an epic tile is expanded, a user can tell what each of its steps is
  about by reading its title alone, without needing to interpret a raw, dash-separated key.
- **SC-003**: A user can open a step's underlying spec document in a single click,
  whenever one exists, without knowing its exact filename.
- **SC-004**: A step whose spec document doesn't exist never shows a control that would
  open nothing or fail.

## Assumptions

- Each epic tile's collapsed/expanded state is independent of every other tile's, and is
  not persisted across page reloads — consistent with this tool's existing read-only,
  session-local view state.
- The step-index pattern already established elsewhere in this tool's sprint-status
  parsing (an epic number, a dash, a story number optionally followed by a single letter)
  is the same pattern this feature matches against — real sprint-status data already
  follows it (e.g. "1-1", "2-1", "1-6a", "10-1").
- Spec documents live under the same implementation-artifacts location already used for
  the sprint-status file itself, matched by filename prefix only (not by folder scanning
  beyond that single location).
- This feature only adds a new read path over data already present in the sprint-status
  file and its sibling implementation-artifacts documents — no editing, checking off, or
  reordering of any kind, consistent with this tool's read-only principle.
