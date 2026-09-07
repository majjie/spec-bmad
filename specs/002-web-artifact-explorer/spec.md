# Feature Specification: Web Artifact Explorer

**Feature Branch**: `002-web-artifact-explorer`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "Desktop-only web UI (no mobile view), built on an off-the-shelf
web framework rather than a bespoke renderer. Root layout is two tabs — '_bmad' aliased as
'Infra' and '_bmad-output' aliased as 'Output'. Each tab shows a Windows-Explorer-like
folder tree on the left, bound to that tab's folder; folders expand/collapse and are
clickable. The right-hand side shows the selected folder's contents as a table sortable by
clicking column headers: Name, Created, Updated, Size. Later features will add virtual
(non-filesystem) folders to the tree. Visual style: dark-themed, clean, information-dense,
material-like."

## Clarifications

### Session 2026-09-07

- Q: Should folders always be listed before files in the contents table regardless of which column is sorted, or should sorting mix files and folders together purely by the sorted value? → A: Folders always listed before files, sorted among themselves by the active column; files follow, sorted the same way.
- Q: Does the folder contents table need to comfortably handle folders with hundreds or thousands of entries (requiring a virtualized/paginated list), or is a plain render-everything table acceptable? → A: Plain render is fine — no virtualization/pagination required, consistent with feature 001's expected project scale (tens to low thousands of entries).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse the Infra tab's folder tree (Priority: P1)

A user opens BMAD Browser in a desktop browser and lands on the "Infra" tab, which shows
the project's `_bmad` folder as an expandable/collapsible tree on the left. Clicking a
folder in the tree selects it and shows its direct contents — files and subfolders — as a
table on the right.

**Why this priority**: This is the smallest slice that makes the web UI useful at all:
seeing and navigating one of the two artifact trees. Without it, there's no way to view
anything the access layer (feature 001) has cached.

**Independent Test**: Open the UI against a project with a populated `_bmad` folder;
expand/collapse tree nodes, click into a nested folder, and confirm the right-hand table
shows exactly that folder's direct children.

**Acceptance Scenarios**:

1. **Given** the UI has just loaded, **When** it finishes loading, **Then** the "Infra" tab
   is selected by default and its tree shows the `_bmad` folder's top-level contents.
2. **Given** a tree folder with children, **When** the user clicks it, **Then** it expands
   to show its child folders, and if it was already expanded, clicking it again collapses
   it.
3. **Given** a tree folder is expanded/collapsed or selected, **When** the user clicks a
   different folder in the tree, **Then** the right-hand table updates to show that
   folder's direct children (files and subfolders), replacing the previous contents.
4. **Given** a folder entry is shown in the right-hand table, **When** the user clicks that
   entry, **Then** the tool navigates into it exactly as if it had been clicked in the tree
   (the tree's selection updates and the table now shows its contents).

---

### User Story 2 - Browse the Output tab independently (Priority: P2)

A user switches to the "Output" tab, which shows the project's `_bmad-output` folder as its
own independent tree and contents table, using the same interaction pattern as the Infra
tab.

**Why this priority**: Many users will care primarily about generated outputs rather than
process/config artifacts. This story reuses Infra's interaction pattern against a second,
independent data source, and proves the two tabs don't interfere with each other.

**Independent Test**: With the Infra tab showing some folder's contents, switch to the
Output tab, navigate to a different nested folder there, then switch back to Infra and
confirm its tree state and selected folder were unaffected by browsing Output.

**Acceptance Scenarios**:

1. **Given** the user is on the Infra tab, **When** they click the "Output" tab, **Then**
   the tree and table switch to show the `_bmad-output` folder's contents instead.
2. **Given** the user has expanded folders and selected a folder on one tab, **When** they
   switch to the other tab and back, **Then** the first tab's expanded/collapsed state and
   selected folder are unchanged.
3. **Given** a project whose resolved folder has no `_bmad-output` folder (only `_bmad`),
   **When** the user opens the Output tab, **Then** it shows a message that no output
   folder was found, rather than an empty or broken tree.

---

### User Story 3 - Sort folder contents by column (Priority: P3)

While viewing a folder's contents on either tab, the user clicks a column header (Name,
Created, Updated, or Size) to sort the visible entries by that column, and clicks it again
to reverse the sort direction.

**Why this priority**: Sorting adds real value once there's something to browse (US1/US2),
but a small/unsorted list is still usable without it — this is a refinement, not a
blocker for the tool being useful.

**Independent Test**: Open a folder with several mixed files and subfolders; click each
column header in turn and confirm the row order changes to match that column, ascending;
click the same header again and confirm the order reverses.

**Acceptance Scenarios**:

1. **Given** a folder's contents are displayed in whatever default order they arrived in,
   **When** the user clicks the "Name" column header, **Then** the rows are sorted
   alphabetically by name, with all folder entries appearing before all file entries.
2. **Given** the contents are already sorted by a column, **When** the user clicks that same
   column header again, **Then** the sort direction reverses within each group (folders
   still appear before files, but each group's internal order flips).
3. **Given** the contents are sorted by one column, **When** the user clicks a different
   column header, **Then** the rows are re-sorted by the newly clicked column instead,
   still with folders before files.
4. **Given** the user switches tabs or navigates to a different folder, **When** the new
   folder's contents are shown, **Then** they appear using that view's own default order
   (sort choice does not need to persist across a folder change), still grouped with
   folders before files.

---

### Edge Cases

- What happens when the resolved project has neither `_bmad` nor `_bmad-output` at all?
  This UI is only reachable once the CLI has already resolved a valid project folder
  (feature 001's FR-006–FR-011), so this case does not arise here.
- What happens when only one of `_bmad` / `_bmad-output` exists? The tab for the missing
  folder still appears (so the two tabs are always in the same place) but shows an
  empty-state message instead of a tree, per User Story 2's Acceptance Scenario 3.
- What happens when a selected folder has no children? The right-hand table shows an
  empty-state message rather than an empty or missing table.
- What happens when the user clicks a file (not a folder) entry in the right-hand table?
  Nothing is navigated to — files cannot be browsed into, and viewing file contents is out
  of scope for this feature (consistent with feature 001 never reading file contents).
- What happens if the underlying project's artifact hierarchy changes while the UI is
  open? Reflecting live changes is out of scope for this feature; the UI shows whatever
  the access layer's cache currently holds (see Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST present a web UI with two top-level tabs labeled "Infra" and
  "Output", corresponding to the project's `_bmad` and `_bmad-output` folders
  respectively.
- **FR-002**: The system MUST select the "Infra" tab by default when the UI first loads.
- **FR-003**: Each tab MUST show a folder tree, in a left-hand pane, rooted at that tab's
  corresponding folder.
- **FR-004**: Tree folder nodes MUST be independently expandable and collapsible by
  clicking them.
- **FR-005**: Clicking a tree folder node MUST select it and show its direct children
  (files and subfolders) in a right-hand pane table.
- **FR-006**: The right-hand pane table MUST show, for each entry: Name, Created (date),
  Updated (date), and Size.
- **FR-007**: Clicking a folder entry within the right-hand pane table MUST navigate into
  it, updating both the tree's selection and the right-hand pane's contents to match.
- **FR-008**: Clicking a file entry within the right-hand pane table MUST NOT navigate
  anywhere (files have no further contents to browse into within this feature).
- **FR-009**: Clicking a column header (Name, Created, Updated, or Size) in the right-hand
  pane MUST sort the currently displayed entries by that column, ascending, with folder
  entries grouped before file entries regardless of which column is sorted.
- **FR-010**: Clicking the same column header again MUST reverse the current sort
  direction within each group (folders still precede files, but each group's order
  flips).
- **FR-011**: Each tab's tree expand/collapse state and currently selected folder MUST be
  preserved independently when the user switches to the other tab and back.
- **FR-012**: When a tab's corresponding folder (`_bmad` or `_bmad-output`) is not present
  for the current project, that tab MUST still appear but show an empty-state message
  instead of a tree.
- **FR-013**: When a selected folder has no children, the right-hand pane MUST show an
  empty-state message rather than an empty or missing table.
- **FR-014**: The UI MUST be designed for full-size desktop browsers only; no
  mobile-specific layout is required.
- **FR-015**: The UI MUST use a dark, clean, information-dense visual style, consistent
  across both tabs.
- **FR-016**: The system MUST NOT provide any way to create, rename, move, or delete files
  or folders through this UI — it remains strictly read-only, per the project
  constitution.
- **FR-017**: The system is NOT required to virtualize or paginate the contents table —
  rendering all of a selected folder's direct children at once is acceptable, consistent
  with feature 001's expected project scale (tens to low thousands of entries).

### Key Entities

- **Tab**: One of the two top-level views ("Infra" or "Output"); holds its own tree
  expand/collapse state and currently selected folder, independent of the other tab.
- **Tree Node**: A visual entry in the left-hand folder tree; represents a folder and
  whether it is currently expanded or collapsed. (Later features will introduce tree nodes
  that don't correspond to a real filesystem folder — see Assumptions.)
- **Folder Contents Entry**: A single row in the right-hand table for one direct child of
  the selected folder; carries Name, Created, Updated, Size, and whether it is a file or a
  folder (which determines whether clicking it navigates further, per FR-007/FR-008).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from the Infra tab's root to any nested folder shown in the
  tree, and see that folder's contents, using only mouse clicks — no typed paths or prior
  knowledge of the folder structure required.
- **SC-002**: Sorting a folder's contents by any of the four columns changes the visible
  row order immediately, without a full page reload.
- **SC-003**: Switching between the Infra and Output tabs never loses or mixes up either
  tab's navigation state — each tab's expanded folders and selection are exactly as the
  user left them when they return to it.
- **SC-004**: Every file and folder shown in a tab's tree or table matches what feature
  001's access layer currently has cached for the corresponding `_bmad`/`_bmad-output`
  folder — nothing is shown that isn't in the cache, and nothing cached is missing from
  view.
- **SC-005**: A reviewer can distinguish and read individual tree entries and table rows
  at a glance in the dark theme, even when a folder contains many entries, without needing
  to zoom in or change display settings.

## Assumptions

- This feature renders whatever feature 001's access layer currently has cached; it does
  not add live-refresh, polling, or file-system-watching behavior — reflecting changes made
  on disk while the UI is open is out of scope here (consistent with feature 001 leaving
  "when to refresh" to the layer's consumer).
- "Created" and "Updated" require filesystem timestamp metadata, and "Size" requires byte
  size — neither is captured by feature 001's Artifact Node today (which deliberately holds
  only name/path/type/children). Sourcing this additional metadata (whether by extending
  the access layer or reading it separately when rendering) is a planning-phase decision
  for this feature, not a scope change to feature 001.
- The tree and table are designed so that a future feature can introduce "virtual" tree
  nodes that don't correspond to a real filesystem folder, without needing to redesign the
  navigation/selection model — but building any such virtual folder is explicitly out of
  scope for this feature.
- Rendering is built on an existing, off-the-shelf web UI framework/library rather than a
  bespoke renderer, accepting a larger one-time package size in exchange for not building
  UI primitives (tabs, trees, sortable tables) from scratch. Which specific framework is a
  planning-phase decision, not a specification concern.
- No search, filter, multi-select, or bulk actions are included — only the tree/table
  browsing and column sorting described above.
- This UI is only reached after feature 001's CLI has already resolved a valid project
  folder; handling an invalid folder is entirely feature 001's responsibility, not this
  feature's.
