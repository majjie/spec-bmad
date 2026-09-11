# Feature Specification: Output Navigator Tab

**Feature Branch**: `006-output-navigator`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "A new tab is to be added to the UI, it is to come before infra
and output. It will be a tab that is used to make navigating of the output easier. It will
only show if '_bmad-output' is present. Like the 'explorer' tabs, it will have a left hand
pane with a tree of nodes, however it will have multiple roots representing curated views
rather than folders: a PRD view (grouping planning-artifacts/prds folders by project slug,
then by date, newest first, with non-conforming folders listed by their literal name) and a
Sprint Status view (shown only when implementation-artifacts/sprint-status.yaml exists,
rendering a Summary tile of its top-level fields plus one Status tile per epic showing the
epic's own status, its numbered child stories, and its retrospective status)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse PRDs by project and date (Priority: P1)

A user opens the new tab and, instead of scrolling through a flat, alphabetically-sorted
folder listing, sees PRD folders organized into a tree: one node per distinct project, and
under each project, its PRD folders ordered from most recent to oldest. Folders that don't
follow the project-and-date naming pattern still show up, listed by their own folder name,
so nothing is hidden - it's just not grouped.

**Why this priority**: This is the concrete, explicit ask behind the whole feature - making
PRDs easier to navigate than the existing raw folder tree.

**Independent Test**: With a project containing several PRD folders spanning at least two
projects and multiple dates each, plus one folder that doesn't follow the naming pattern,
open the new tab and confirm: one node per distinct project, each expandable to reveal its
dates newest-first, the non-conforming folder appearing as its own node, and selecting any
folder-level node shows that folder's name in the right-hand pane.

**Acceptance Scenarios**:

1. **Given** the folders `prd-foo-2028-08-28`, `prd-foo-2028-08-29`, `prd-foo-2028-08-30`,
   `prd-bar-2028-08-30`, `prd-bar-2028-09-01`, `prd-bar-2028-09-14`, and
   `not-following-convention` all exist under the prds folder, **When** the user expands the
   PRD node, **Then** it shows a `prd-foo` node (containing `2028-08-30`, `2028-08-29`,
   `2028-08-28`, in that order), a `prd-bar` node (containing `2028-09-14`, `2028-09-01`,
   `2028-08-30`, in that order), and a `not-following-convention` node.
2. **Given** two PRD folders whose names differ only by the case of their project portion
   (e.g. `prd-foo-2028-08-28` and `PRD-foo-2028-08-28`), **When** the PRD node is expanded,
   **Then** they appear as two separate project nodes, not merged into one.
3. **Given** the PRD tree is expanded, **When** the user selects a date node or a
   non-conforming folder's node, **Then** the right-hand pane shows that folder's name as
   placeholder text (richer detail is future work).
4. **Given** the PRD tree is expanded, **When** the user selects the "PRD" root node or a
   project node itself (not a date leaf), **Then** it only expands or collapses - the
   right-hand pane's content does not change.

---

### User Story 2 - View sprint status at a glance (Priority: P2)

A user opens the Sprint Status view and sees, at a glance, a summary of the project's
tracking metadata plus one tile per epic showing that epic's own status, the status of each
of its stories, and whether its retrospective is done.

**Why this priority**: A valuable secondary insight, but User Story 1 already delivers the
feature's core navigation value on its own - a project can have PRDs without sprint
tracking, or vice versa.

**Independent Test**: With a project containing a valid sprint-status file matching the
described shape, open the Sprint Status node and confirm the Summary tile shows all six of
its fields correctly, and one Status tile appears per epic, correctly grouping that epic's
numbered stories and showing its retrospective's status.

**Acceptance Scenarios**:

1. **Given** a project with a sprint-status file present, **When** the user views the tab,
   **Then** a "Sprint Status" node appears in the tree; **given** no such file exists,
   **then** no such node appears (other views in the tab are unaffected).
2. **Given** a sprint-status file, **When** the user selects the Sprint Status node,
   **Then** the right-hand pane shows a Summary tile with the file's `generated`,
   `last_updated`, `project`, `project_key`, `tracking_system`, and `story_location` values.
3. **Given** a sprint-status file whose tracked data declares `epic-1` as `done` with several
   numbered stories beneath it (e.g. `1-1-...`, `1-2-...`) and an `epic-1-retrospective`
   entry, **When** the user selects the Sprint Status node, **Then** a Status tile for
   epic 1 shows the epic's own status, each of those stories with its own status, and the
   retrospective's status.
4. **Given** a sprint-status file that cannot be parsed, **When** the user selects the
   Sprint Status node, **Then** the right-hand pane shows an error message instead of a
   broken or blank view.

---

### Edge Cases

- What happens when `_bmad-output` exists but has neither a `prds` folder with any
  subfolders nor a sprint-status file? The tab still appears (its only visibility condition
  is `_bmad-output`'s own presence), but its tree has no root nodes to show.
- What happens when the `prds` folder exists but is empty (no subfolders at all)? The "PRD"
  root node itself does not appear (FR-008).
- What happens when a folder's trailing date-like segments aren't validly formatted digits
  (e.g. a single-digit month, or a bare date with no project text before it)? It's treated
  as not following the convention and listed by its literal folder name (FR-007).
- What happens when a `development_status` entry doesn't match any epic's own key or any
  epic's numbered-story grouping? It's left out of the Status tiles rather than guessed at
  or shown as an error (FR-015).
- What happens when a sprint-status file parses successfully but declares no epics at all
  (`development_status` absent or empty)? The Summary tile still shows (it doesn't depend on
  `development_status`); zero Status tiles are shown, rather than an error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A new tab MUST appear in the navigation, positioned before the existing
  "Infra" and "Output" tabs.
- **FR-002**: This tab MUST appear only when a `_bmad-output` folder is present in the
  project; if absent, the tab MUST NOT appear at all.
- **FR-003**: The tab MUST present a left-hand tree pane and a right-hand detail pane,
  matching the two-pane layout already used by the existing tabs.
- **FR-004**: Unlike the existing tabs' trees (which mirror a real folder hierarchy), this
  tab's tree MUST support multiple independent root nodes, each representing a curated view
  rather than a literal folder.
- **FR-005**: Folders directly under `_bmad-output/planning-artifacts/prds` whose name
  matches the pattern `<project>-<YYYY>-<MM>-<DD>` MUST be grouped under a "PRD" root node,
  one child node per unique, case-sensitive project value.
- **FR-006**: Each project node MUST contain one child node per matching date folder for
  that project, labeled with the extracted date, ordered from most recent to oldest.
- **FR-007**: A folder under the prds directory whose name does NOT match the
  project-and-date convention MUST appear as its own node directly under the "PRD" root,
  labeled with the folder's own literal name.
- **FR-008**: The "PRD" root node MUST NOT appear at all when the prds folder is absent or
  contains no subfolders.
- **FR-009**: Selecting a date node or a non-conforming-folder node under "PRD" MUST show,
  in the right-hand pane, placeholder text naming that folder; richer detail is explicitly
  deferred to a future feature.
- **FR-010**: Selecting the "PRD" root node or a project node MUST only expand or collapse
  it - the right-hand pane's content MUST NOT change.
- **FR-011**: A "Sprint Status" root node MUST appear only when
  `_bmad-output/implementation-artifacts/sprint-status.yaml` exists.
- **FR-012**: Selecting the "Sprint Status" node MUST show, in the right-hand pane, a
  Summary tile displaying that file's `generated`, `last_updated`, `project`,
  `project_key`, `tracking_system`, and `story_location` values.
- **FR-013**: The right-hand pane MUST also show one Status tile per epic declared in the
  file's `development_status` data, in the order the file declares them. Each tile MUST
  show: the epic's own status; its numbered child stories, each with its own status,
  matched only when a story's key starts with that epic's number followed immediately by a
  hyphen (e.g. epic `1`'s stories start with `1-`) - this distinguishes epic `1`'s stories
  from epic `10`'s or `11`'s, whose keys start with `10-`/`11-` instead; and the epic's own
  retrospective status. Stories within a tile MUST appear in the order the file declares
  them, not a numeric re-sort, since story keys (e.g. `1-6a`) aren't purely numeric.
- **FR-014**: If the sprint-status file cannot be parsed, the right-hand pane MUST show an
  error message rather than a broken or blank view.
- **FR-015**: A `development_status` entry that matches neither an epic's own key nor any
  epic's numbered-story grouping MUST be left out of the Status tiles rather than causing an
  error.

### Key Entities

- **PRD Project**: A distinct project identified by a case-sensitive value shared by one or
  more PRD folder names; has one or more dated PRD folders.
- **PRD Folder**: A single dated snapshot of a PRD - its extracted date and the path to its
  backing folder.
- **Non-conforming PRD Folder**: A folder under the prds directory whose name doesn't match
  the project-and-date convention; shown by its own literal folder name.
- **Sprint Status Summary**: The top-level tracking metadata (generated, last_updated,
  project, project_key, tracking_system, story_location) read from the sprint-status file.
- **Epic Status Group**: One epic's own status, its ordered list of child stories (each with
  a status), and its retrospective's status, all derived from `development_status`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with PRD folders spanning multiple projects and dates can locate any
  specific project's most recent PRD without scanning a flat, alphabetically-ordered folder
  list.
- **SC-002**: A user can tell which epic is currently in progress, and how many of its
  stories are done versus remaining, within a few seconds of opening the Sprint Status view.
- **SC-003**: Users of a project without a `_bmad-output` folder never see this tab, so
  there's no dead or confusing navigation entry to encounter.
- **SC-004**: PRD folders that don't follow the naming convention remain discoverable -
  never silently hidden - even though they aren't grouped with the rest.

## Assumptions

- The tab is labeled "Navigator" (a placeholder name capturing its purpose; easy to rename
  without affecting behavior).
- The "PRD" root node's top-level children (project nodes and non-conforming-folder nodes)
  are ordered alphabetically by their displayed label, case-sensitive - consistent with the
  case-sensitive project grouping itself, and with the plain alphabetical ordering already
  used elsewhere in this app's trees.
- A folder name matches the project-and-date convention only when its final three
  dash-separated segments are exactly 4, 2, and 2 digits (e.g. `-2026-08-28`); those digits
  don't need to form a calendar-valid date (no month/day range checking) - this keeps the
  rule about naming shape, not calendar correctness. A folder name that's only a bare date
  with no project text before it doesn't match either (an empty project isn't meaningful),
  so it's treated as non-conforming.
- Surfacing `action_items` from the sprint-status file is out of scope for this feature -
  the description names only a Summary tile and per-epic Status tiles. This may be a future
  enhancement.
- Both new root views (PRD and Sprint Status) start expanded by default when the tab is
  first opened, consistent with this app's existing "root starts expanded" convention.
- This feature only introduces read-only viewing of PRD and sprint-status data - no
  editing, reordering, or writing of any kind, consistent with the project's read-only
  principle.
- The right-hand pane's placeholder text for a PRD folder (FR-009) is exactly the folder's
  own name, not its full path.
- `_bmad-output/planning-artifacts/prds` and
  `_bmad-output/implementation-artifacts/sprint-status.yaml` are the only two data sources
  this feature reads; no other `_bmad-output` content is shown in this new tab.
- Browser back/forward history integration for this tab's node selection follows the same
  pattern already used by the existing tabs; no new interaction model is introduced.
