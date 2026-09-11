# Feature Specification: Navigator Tab Uplift

**Feature Branch**: `007-navigator-uplift`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "This step will be navigator tab uplift. The navigator tab
should be the default selected tab on load. The sprint status epic tiles should have
relevant icons for step and epic status, covering done/review/backlog/in-progress. The
epic tiles look messy in their current arrangement - have them the full width of the pane,
stacked in order of appearance. Add a new calculated field in the summary, 'Active epic':
all epics done → 'All complete'; all epics backlog → 'Not started'; otherwise the first
epic whose status is in-progress; otherwise 'unknown'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Land on the Navigator tab (Priority: P1)

A user opens the tool against a project that has a `_bmad-output` folder, and immediately
sees the Navigator tab's tree and detail pane - not "Infra" - without needing to click
anything first.

**Why this priority**: The Navigator tab is this tool's curated, easier-to-scan entry
point (feature 006); defaulting to it removes a click every single session and is the
most visible of this batch of changes.

**Independent Test**: Open the tool against a project with `_bmad-output` present;
confirm the Navigator tab is already selected, with its tree visible, before any click.
Open it again against a project without `_bmad-output`; confirm it falls back to the
Infra tab exactly as it did before this feature.

**Acceptance Scenarios**:

1. **Given** a project with `_bmad-output` present, **When** the tool loads, **Then** the
   Navigator tab is the active tab, and its tree is visible without any user action.
2. **Given** a project without `_bmad-output`, **When** the tool loads, **Then** the
   Infra tab is the active tab (the Navigator tab isn't shown at all, per feature 006).

---

### User Story 2 - See status at a glance via icons (Priority: P2)

A user viewing the Sprint Status tiles sees a small icon next to every epic's status and
every one of its stories' statuses, so the overall picture (what's done, what's in
review, what hasn't started, what's actively being worked) is readable without reading
every word.

**Why this priority**: A meaningful scan-ability improvement to the tiles this tool
already shows, but the tiles are already fully usable (as text) without it.

**Independent Test**: Open a Sprint Status view containing epics and stories covering
all of "done", "review", "backlog", and "in-progress"; confirm each shows a distinct icon
next to its existing text label, and that the same status always shows the same icon.

**Acceptance Scenarios**:

1. **Given** an epic whose own status is one of "done", "review", "backlog", or
   "in-progress", **When** its tile renders, **Then** the epic's status shows a
   distinct icon alongside its existing text label.
2. **Given** a story whose status is one of those same four values, **When** its epic's
   tile renders, **Then** that story's status also shows a distinct icon alongside its
   text label, using the same icon for the same status as epics use.
3. **Given** a story whose status is something else (e.g. "ready-for-dev"), **When** its
   epic's tile renders, **Then** that story's status still shows its text label, with no
   icon (and no error).

---

### User Story 3 - Read epic tiles as a single stacked list (Priority: P3)

A user viewing the Sprint Status tiles sees the epic tiles arranged as one full-width
column, one below another in the same order they already appear in, instead of a
wrapping grid of narrower tiles.

**Why this priority**: A visual tidiness fix for the epic tiles specifically; the
Summary tile and the tiles' own content are unaffected either way.

**Independent Test**: Open a Sprint Status view with at least three epics; confirm each
epic tile spans the full width of the detail pane and that they stack top-to-bottom in
the same order as before, with the Summary tile's own position and appearance unchanged.

**Acceptance Scenarios**:

1. **Given** a Sprint Status view with multiple epics, **When** it renders, **Then**
   every epic tile spans the full width of the detail pane, stacked vertically in the
   same order the epics already appear in.
2. **Given** the same view, **When** it renders, **Then** the Summary tile's own
   appearance and position are unchanged.

---

### User Story 4 - See which epic is active at a glance (Priority: P4)

A user viewing the Summary tile sees a new "Active Epic" field that tells them, without
reading every tile, whether everything is done, nothing has started, or which specific
epic is currently being worked on.

**Why this priority**: A convenience summary of information the tiles already show
individually; valuable on its own, and independent of the icon and layout changes above.

**Independent Test**: Open Sprint Status views for each of: all epics done, all epics
backlog, a mix with one epic in-progress, and a mix with no epic in-progress; confirm the
Summary tile's "Active Epic" field shows the expected value in each case.

**Acceptance Scenarios**:

1. **Given** every epic's status is "done", **When** the Summary tile renders, **Then**
   "Active Epic" shows "All complete".
2. **Given** every epic's status is "backlog", **When** the Summary tile renders,
   **Then** "Active Epic" shows "Not started".
3. **Given** a mix of statuses where at least one epic is "in-progress", **When** the
   Summary tile renders, **Then** "Active Epic" shows the epic key of the first such
   epic, in the epics' existing file-declared order.
4. **Given** a mix of statuses where no epic is "done"-only or "backlog"-only and none is
   "in-progress" (e.g. one "done" and one "backlog", nothing "in-progress"), **When** the
   Summary tile renders, **Then** "Active Epic" shows "unknown".

---

### Edge Cases

- What happens when the Navigator tab isn't available (no `_bmad-output`)? The tool falls
  back to the Infra tab, exactly as it did before this feature (FR-002).
- What happens when a status (epic or story) isn't one of the four icon-mapped values?
  Its text label still shows; no icon is shown, and nothing errors (FR-005).
- What happens when a sprint-status file declares no epics at all? "Active Epic" shows
  "unknown" - it is not evaluated against the "all done"/"all backlog" rules, both of
  which would otherwise be vacuously true for an empty list (FR-010).
- What happens to the Infra or Output tab when *their* backing folder is absent? Same as
  the Navigator tab (FR-002): the tab itself doesn't appear at all, not just its content
  (FR-011).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST show the Navigator tab as the active tab as soon as
  the tool loads, provided the Navigator tab is available for the current project (i.e.
  `_bmad-output` exists).
- **FR-002**: If the Navigator tab is not available, the application MUST fall back to
  the Infra tab as the active tab on load, matching this tool's behavior before this
  feature.
- **FR-003**: Each epic tile's own status MUST show a distinct icon, in addition to its
  existing text label, when that status is one of "done", "review", "backlog", or
  "in-progress".
- **FR-004**: Each story listed within an epic tile MUST show its own status with a
  distinct icon, in addition to its existing text label, when that status is one of the
  same four values in FR-003 - using the same icon for a given status value that epics
  use for that same value.
- **FR-005**: A status value (epic or story) outside those four MUST still show as text,
  with no icon and no error.
- **FR-006**: Epic tiles MUST render at the full width of the detail pane, stacked
  vertically in a single column, instead of the wrapping multi-column arrangement used
  before this feature.
- **FR-007**: Epic tiles MUST remain in the same order they already appear in (the
  sprint-status file's own epic-declaration order, per feature 006's FR-013) - this
  feature changes only their arrangement, not their order.
- **FR-008**: The Summary tile MUST keep its existing appearance and MUST remain the
  first tile shown, above the epic-tile stack - FR-006's full-width rearrangement of the
  epic tiles MUST NOT otherwise reposition, resize, or restyle it.
- **FR-009**: The Summary tile MUST include a new "Active Epic" field, calculated as:
  if every epic's status is "done", its value is "All complete"; otherwise if every
  epic's status is "backlog", its value is "Not started"; otherwise, if any epic's status
  is "in-progress", its value is the epic key of the first such epic in the epics'
  existing file-declared order; otherwise its value is "unknown".
- **FR-010**: When a sprint-status file declares no epics at all, "Active Epic" MUST show
  "unknown" rather than being evaluated against FR-009's "all done"/"all backlog" rules.
- **FR-011**: A tab whose backing folder is absent MUST NOT appear in the tab bar at all
  (not merely be unselected/inactive) - found necessary during user review while
  verifying FR-002's fallback: the tab bar was rendering all three tabs unconditionally
  regardless of availability, a latent defect from the tab bar's original implementation
  (feature 002/003) that both this feature's FR-002 and feature 006's FR-002 had already
  assumed was true.

### Key Entities

- **Epic Status Group** (feature 006, extended): each status value (its own and each
  story's) is now also associated with one of the four icons in FR-003, when applicable.
- **Sprint Status Summary** (feature 006, extended): gains one new calculated field,
  "Active Epic", per FR-009/FR-010.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user opening the tool against a project with `_bmad-output` reaches the
  Navigator tab's content in zero clicks.
- **SC-002**: A user scanning a Sprint Status view can identify every "in-progress" item
  (epic or story) by icon alone, without reading its text label.
- **SC-003**: A user can identify what to work on next - or that everything is done, or
  that nothing has started - by reading a single Summary field, without opening or
  reading every epic tile individually.
- **SC-004**: A user scanning epic tiles never needs to look in more than one column to
  find a specific epic.

## Assumptions

- The exact icon glyph used for each of the four statuses (done/review/backlog/
  in-progress) is a visual design choice left to implementation; this spec only requires
  that each status is distinctly and consistently represented.
- The user's own description said "three types" but then listed four (done, review,
  backlog, in-progress); the explicit list is treated as authoritative, and this feature
  covers all four.
- Icons apply only to epic and story ("step") statuses, per the user's own scope - a
  retrospective's status (already shown as text, e.g. "not started") is unchanged by this
  feature.
- "Active Epic"'s value for the "first in-progress epic" case is that epic's own key
  (e.g. "epic-2"), matching how epic tiles already identify epics elsewhere in this view
  - not a paraphrase or a friendlier label.
- This feature only changes which tab is active and how the Sprint Status view renders;
  it does not change what data is fetched, when, or from where - every tab's data
  continues to load the same way it already does on mount.
- No new interactivity is introduced anywhere (no clickable icons, no way to change a
  status) - this remains a strictly read-only view, consistent with the project's
  read-only principle.
