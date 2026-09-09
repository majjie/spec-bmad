# Feature Specification: Architecture Tree

**Feature Branch**: `015-architecture-tree`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "The architecture artifacts somewhat mirrors that of the PRD
artifacts. An example architect folder looks like
'_bmad-output/planning-artifacts/architecture/architecture-bmad-2026-08-28'. Note that it
shares the same slug followed by date format. I want it to mirror that structure in the
navigator tree. Let's do so. Pressing on the leaf node will just result in the name of the
folder being shown in the right hand pane for now."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse architecture artifacts grouped by project and date (Priority: P1)

A user viewing the Navigator tab sees an "Architecture" grouping, alongside the existing
"PRD" grouping, organizing every architecture folder by project and date exactly the same
way PRD folders already are — so finding a specific architecture run is just as easy as
finding a specific PRD run already is today.

**Why this priority**: This is the entire value of this feature — without it, architecture
artifacts remain invisible to the Navigator tab, unlike every other artifact type it
already surfaces.

**Independent Test**: Open a project whose `_bmad-output/planning-artifacts/architecture/`
folder contains two or more folders following the `<project>-<date>` naming pattern (e.g.
`architecture-bmad-2026-08-28`); confirm the Navigator tree shows an "Architecture"
grouping with those folders organized by project and date, matching the PRD grouping's own
established structure.

**Acceptance Scenarios**:

1. **Given** a project whose architecture folder contains one or more subfolders matching
   the `<project>-<date>` naming pattern, **When** the Navigator tab renders, **Then** an
   "Architecture" grouping appears in the tree, organizing those subfolders by project and
   then by date — the same two-level grouping the "PRD" tree already uses.
2. **Given** an architecture subfolder whose name does not match the `<project>-<date>`
   pattern, **When** the tree renders, **Then** that folder still appears (in a
   non-conforming bucket), exactly as a similarly-shaped PRD folder already does today —
   never silently hidden.
3. **Given** a project whose architecture folder has no subfolders at all (or doesn't
   exist), **When** the Navigator tab renders, **Then** no "Architecture" grouping appears
   at all — the same behavior already established for an empty/missing PRD folder.
4. **Given** the "Architecture" root or a project-level grouping node under it, **When**
   the user selects it, **Then** nothing in the right-hand pane changes — only a specific
   date/leaf folder is selectable, exactly as "PRD" and its own project nodes already
   behave.

---

### User Story 2 - See which architecture folder is selected (Priority: P1)

A user selects a specific architecture folder in the tree and sees that folder's own name
displayed in the right-hand pane — a plain, minimal placeholder for now, standing in for
richer content a later feature will add (the same way the PRD tree's own leaf view started
this way before being built out further).

**Why this priority**: Without this, selecting an architecture leaf would show nothing at
all, leaving the new tree feeling broken or incomplete even though User Story 1 alone
already delivers real navigational value.

**Independent Test**: Select an architecture leaf folder in the tree; confirm its folder
name renders in the right-hand pane, and confirm selecting any other existing Navigator
item (PRD, Sprint Status, a different architecture folder) continues to work exactly as
before.

**Acceptance Scenarios**:

1. **Given** an architecture leaf folder is selected, **When** the pane renders, **Then**
   it shows that folder's own name as plain text — nothing else.
2. **Given** an architecture leaf is selected, **When** the user selects a different
   Navigator item instead, **Then** the pane updates to that item's own established
   behavior, unaffected by this feature.

---

### Edge Cases

- What happens when an architecture folder name matches the `<project>-<date>` pattern but
  the "date" portion isn't a real calendar date (e.g. day 32)? It's still grouped by that
  literal digit string, exactly as the PRD tree's own pattern-matching already does —
  matching is purely textual (`YYYY-MM-DD`-shaped digits), not calendar-validated.
- What happens when two architecture folders share the same project and date? Both appear
  as separate entries under that same project/date grouping, exactly as PRD folders in the
  same situation already do.
- What happens when a folder inside the architecture directory is itself a file, not a
  folder? It's ignored — only subfolders are considered, matching the PRD tree's own
  behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Navigator tree MUST show an "Architecture" grouping whenever
  `_bmad-output/planning-artifacts/architecture/` contains at least one subfolder; it MUST
  be entirely absent when that folder has no subfolders or doesn't exist.
- **FR-002**: Subfolders whose name matches a `<project>-<date>` pattern (a non-empty
  project prefix followed by a `YYYY-MM-DD`-shaped date) MUST be grouped first by project,
  then by date within each project — mirroring the PRD grouping's own established
  behavior exactly.
- **FR-003**: A subfolder whose name does not match that pattern MUST still appear, in a
  clearly separate, non-conforming section of the grouping — never silently omitted.
- **FR-004**: The "Architecture" root, and each project-level grouping node beneath it,
  MUST be structural only — selecting either MUST NOT change what's shown in the
  right-hand pane. Only a specific date/leaf folder is selectable.
- **FR-005**: Selecting an architecture leaf folder MUST display that folder's own name as
  plain text in the right-hand pane, with no other content.
- **FR-006**: None of this feature's changes MUST alter any other existing Navigator
  behavior — PRD grouping, Sprint Status, and every other established selection continue
  to work exactly as before.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can locate a specific architecture run by project and date at a
  glance, without opening folders one at a time to search for it.
- **SC-002**: A user can tell, from the tree structure alone, which architecture folders
  follow the expected naming convention and which don't, without opening any of them.
- **SC-003**: Every existing Navigator behavior (PRD grouping, Sprint Status, tree
  selection generally) continues to work exactly as it did before this feature.

## Assumptions

- The "Architecture" grouping appears in the tree alongside "PRD" and "Sprint Status" —
  positioned after "PRD" and before "Sprint Status", grouping the two artifact-browsing
  trees together ahead of the different, execution-tracking Sprint Status view. Exact
  visual ordering is a low-stakes presentation detail with no functional impact.
- This feature deliberately does not build a real detail view for a selected architecture
  folder — showing its bare name is an intentional, minimal first step, the same way the
  PRD tree originally shipped before a later feature built out its own full detail view.
  A future feature is expected to do the same for architecture.
- The underlying project/date grouping logic already built for PRD folders applies
  identically here — same pattern, same tolerance for non-conforming names, same
  ordering — since the feature description explicitly says architecture folders "mirror"
  the PRD folder structure.
- This feature is read-only, consistent with this tool's existing principle — nothing
  about an architecture folder's own content, or any other artifact, is written, edited,
  or reordered by viewing or navigating it.
