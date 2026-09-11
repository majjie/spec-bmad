# Feature Specification: Refresh Control

**Feature Branch**: `014-refresh-control`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "As the folder structure is cached, I would like a refresh
button in the top right hand corner of the screen on the same level as the main tabs. It
needs to be around the same height as the tabs, too. I would also like a suitable icon,
too."

## Clarifications

### Session 2026-09-09

- Q: When the refresh control is used, should it refresh the cached folder structure for
  every tab, or only for the tab that's currently active? → A: Every tab at once
  (Navigator, Infra, and Output) - a single global refresh, not scoped to whichever tab
  happens to be active.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A visible, well-placed refresh control (Priority: P1)

A user looking at the screen sees a refresh control in the top-right corner, sitting on
the same row as the main Navigator/Infra/Output tabs and sized to match their height, with
a conventional refresh icon - so it reads as part of that header row rather than an
unrelated, oddly-placed element.

**Why this priority**: This is the concrete placement/appearance the user asked for, and a
prerequisite for the control being discoverable at all.

**Independent Test**: Load the tool in a browser; confirm a refresh control renders in the
top-right corner, vertically aligned with the tab row and close to its height, showing a
recognizable refresh icon - independently checkable by inspection, even before its click
behavior (User Story 2) is wired up.

**Acceptance Scenarios**:

1. **Given** the tool is open in a browser, **When** the page renders, **Then** a refresh
   control appears in the top-right corner of the screen, on the same horizontal row as
   the Navigator/Infra/Output tabs.
2. **Given** that control, **When** it renders, **Then** its height is close to the tabs'
   own height, so it reads as belonging to that same row rather than a mismatched element.
3. **Given** that control, **When** it renders, **Then** it shows a conventional
   refresh/reload icon (not a text-only label), recognizable at a glance.

---

### User Story 2 - Refreshing stale cached folder structure (Priority: P1)

A user who knows files have changed on disk since the tool started selects the refresh
control and sees the currently displayed tree, listing, or derived view update to reflect
the current on-disk state - without restarting the tool or losing their place if the item
they had selected still exists.

**Why this priority**: This is the actual value behind the request - the folder structure
is cached, so without this, a user has no way to pick up on-disk changes short of
restarting the whole tool.

**Independent Test**: With the tool already running against a project, add a new file on
disk, select the refresh control, and confirm the new file becomes visible in the
currently displayed tree/listing without restarting the tool.

**Acceptance Scenarios**:

1. **Given** the tool has already cached a project's folder structure, **When** the user
   selects the refresh control, **Then** the tool re-reads that structure from disk rather
   than continuing to serve the previously cached scan.
2. **Given** a refresh completes, **When** the currently active tab shows a tree, a
   folder's contents listing, or (for Navigator) its PRD grouping or Sprint Status view,
   **Then** that view updates to reflect the freshly re-read structure without the user
   needing to manually re-select or navigate away and back.
3. **Given** a refresh completes, **When** the user's previously selected item (or
   expanded tree state) still exists in the refreshed structure, **Then** that selection
   and expansion state is preserved rather than being reset.
4. **Given** a refresh completes, **When** the user's previously selected item no longer
   exists in the refreshed structure, **Then** the view falls back to its default
   unselected state rather than erroring.
5. **Given** a refresh is already in progress, **When** the user selects the control
   again, **Then** the second selection has no additional effect (no overlapping
   refreshes).
6. **Given** a refresh fails (e.g., the target project folder becomes inaccessible),
   **When** that happens, **Then** the tool surfaces a clear indication of the failure
   rather than silently leaving stale content displayed with no explanation.

---

### Edge Cases

- What happens if the user clicks the control while a refresh is already running? The
  second click has no additional effect - no overlapping refreshes are triggered.
- What happens if the target project folder no longer exists or becomes inaccessible at
  refresh time? A clear error is surfaced rather than silently showing stale or blank
  content.
- What happens to an already-open file-viewer dialog when a refresh occurs? It is
  unaffected - refresh only applies to tree/listing/derived views, not content already
  open in a dialog.
- What happens when Sprint Status is the active view during a refresh? Its own derived
  data (epics, action items) is re-read too, since it's itself derived from an on-disk
  file this feature's refresh applies to.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST display a refresh control in the top-right corner of
  the screen, on the same horizontal row as the main Navigator/Infra/Output tabs.
- **FR-002**: That control MUST be sized to closely match the tabs' own height, so it
  visually belongs to that same row.
- **FR-003**: That control MUST use a conventional refresh/reload icon, not a text-only
  label.
- **FR-004**: Selecting the control MUST cause the tool to re-read the target project's
  on-disk folder structure for every tab at once (Navigator, Infra, and Output) - not
  scoped to whichever tab is currently active - rather than continuing to serve a
  previously cached scan (Clarifications).
- **FR-005**: After a refresh, whatever is currently displayed - the active tab's tree,
  its open folder's contents listing, and (when Navigator is active) its PRD grouping
  and/or Sprint Status view - MUST update to reflect the freshly re-read structure,
  without the user manually re-selecting or navigating away and back.
- **FR-006**: A refresh MUST preserve the user's current selection and expanded tree state
  when the same item still exists afterward, and MUST fall back to the default unselected
  state when it no longer exists.
- **FR-007**: A refresh MUST NOT alter any file on disk - it only re-reads existing state.
- **FR-008**: While a refresh is in progress, the control MUST show a visible indication
  that it is working, and MUST NOT trigger an additional overlapping refresh if selected
  again before the current one completes.
- **FR-009**: If a refresh fails, the tool MUST surface a clear indication of the failure
  rather than silently leaving stale content displayed with no explanation.
- **FR-010**: An already-open file-viewer dialog's own content MUST be unaffected by a
  refresh triggered while it's open.
- **FR-011**: None of this feature's changes MUST alter any other existing tab or
  Navigator behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can pick up a newly added, changed, or removed file on disk in a
  single click, without restarting the tool.
- **SC-002**: A user can identify the refresh control at a glance, without instructions,
  due to its conventional icon and position.
- **SC-003**: A refresh completes and the visible update appears within a couple of
  seconds for a typical project.
- **SC-004**: A user's existing selection and navigation state survives a refresh whenever
  the selected item still exists afterward.
- **SC-005**: Every existing Navigator/Infra/Output tab behavior continues to work exactly
  as it did before this feature.

## Assumptions

- Currently selected item and expanded tree state are preserved across a refresh whenever
  the same path still exists afterward, matching the common "refresh" convention in
  comparable file-browsing tools; when it no longer exists, the view resets to its default
  unselected state rather than erroring.
- An already-open file-viewer dialog's own content is intentionally left untouched by a
  refresh - only tree/listing/derived views are in scope.
- A "suitable icon" means a conventional refresh/reload icon (e.g. circular arrows),
  matching this tool's existing use of recognizable Material icons elsewhere.
- No new persisted or derived data entity is introduced by this feature - it is a UI
  control plus a cache-invalidation behavior layered over structures this tool already
  reads.
- This feature remains read-only, consistent with this tool's existing principle -
  refreshing re-reads on-disk state; it never writes, reorders, or alters anything.
