# Feature Specification: Explorer UI Polish

**Feature Branch**: `003-explorer-ui-polish`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "The UI needs some uplifts before proceeding. The root node in
the left hand side is initially rendered as expanded (but not its children). Navigating
through folders and across tabs needs to go on the browser stack, because using back/
shortcut buttons on mice leaves the page altogether. A folder icon for folders in the
list. Remove the lines between entries and use candy striped entries in the right hand
side pane."

## Clarifications

### Session 2026-09-07

- Q: After the user navigates to just one folder (their first in-app action) and then presses Back, should that return them to the initial default view (Infra tab, root selected), or leave the application? → A: The app establishes a baseline history entry for its initial view on load, so Back after any number of navigations (including just one) always returns to a previous in-app state first, and only leaves the app once that baseline itself is reached.
- Q: If the user reloads the browser tab while several folders deep, should the app restore that last-viewed folder/tab, or reset to the initial default view? → A: Reset to the initial default view (Infra tab, root selected) — a reload is treated the same as a fresh page load, consistent with this feature not requiring bookmarkable/shareable URLs.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Back/forward navigates within the app, not away from it (Priority: P1)

While browsing either tab, a user selects several different folders and switches tabs a
few times. When they then use the browser's Back action (a keyboard shortcut, an on-screen
back button, or a mouse's back button), they expect to land on whichever folder/tab they
were just looking at, not to leave BMAD Browser entirely.

**Why this priority**: Today, no in-app navigation is recorded on the browser's history
stack, so the very first Back press exits the application — a surprising, disruptive
failure for anyone using a standard navigation habit (mouse back button, Alt+Left, etc.).
This is the most user-visible problem being fixed.

**Independent Test**: Select folder A, then folder B, then switch tabs, then select folder
C. Press Back three times and confirm each press returns to the immediately preceding
folder/tab selection, in reverse order, without the browser ever leaving the page. Press
Forward and confirm it re-applies the selection that Back had just undone.

**Acceptance Scenarios**:

1. **Given** the user has selected folder A and then folder B, **When** they press Back,
   **Then** folder A's contents are shown again (tree selection and table both revert),
   and the browser remains on the application.
2. **Given** the user is on the Infra tab and switches to the Output tab, **When** they
   press Back, **Then** the Infra tab (with whatever folder was selected there) is shown
   again.
3. **Given** the user has pressed Back at least once, **When** they press Forward,
   **Then** the folder/tab selection that was undone by Back is shown again.
4. **Given** the app has just loaded and the user has made exactly one navigation (e.g.,
   selected folder A), **When** they press Back, **Then** they return to the app's initial
   default view (Infra tab, root selected) — not out of the application — because the
   initial view itself was recorded as a baseline history entry when the app loaded.
5. **Given** the user is already at the app's initial default view with no further
   in-app history behind it, **When** they press Back, **Then** standard browser behavior
   applies (there is nothing further of the app's own to return to).
6. **Given** the user expands or collapses a tree folder without changing which folder is
   selected, **When** they press Back, **Then** that expand/collapse action is not treated
   as a separate step — Back moves to the previous *selection*, not the previous tree
   expand/collapse state.

---

### User Story 2 - A tab's tree opens with its root already expanded (Priority: P2)

When a tab is shown for the first time, its root folder's immediate child folders are
already visible in the tree, without the user needing to click the root node first.

**Why this priority**: A small orientation improvement — it saves one click and shows
users there's something to explore — but the tool is still fully usable without it, since
one extra click reveals the same thing.

**Independent Test**: Load the app against a project with at least one subfolder under
`_bmad`; confirm the Infra tab's tree already shows that subfolder listed under the root,
with no click needed. Switch to Output and confirm the same for `_bmad-output`.

**Acceptance Scenarios**:

1. **Given** a tab is populated with its tree for the first time, **When** it renders,
   **Then** the root folder node is shown expanded, with its immediate child folders
   visible.
2. **Given** the root node is expanded by default, **When** the tree renders, **Then** none
   of the root's child folders are themselves expanded — only one level of expansion is
   applied automatically.
3. **Given** the user manually collapses the root node, **When** they switch to the other
   tab and back, **Then** the root remains exactly as the user left it (collapsed) — the
   automatic expansion only applies the first time a tab's tree is populated, not on every
   return visit.

---

### User Story 3 - Folders are marked with an icon (Priority: P3)

Folder entries — in both the left-hand tree and the right-hand contents table — are shown
with a folder icon, so they're visually distinguishable from files at a glance.

**Why this priority**: A clarity improvement for an information-dense view; useful but not
blocking, since folders and files are already distinguishable by their behavior (folders
navigate further, files don't) and, in the table, by column values like Size.

**Independent Test**: Open a folder containing both files and subfolders; confirm every
subfolder entry (in the tree and in the table) shows a folder icon that file entries do
not.

**Acceptance Scenarios**:

1. **Given** the right-hand table shows a mix of files and folders, **When** it renders,
   **Then** every folder row shows a folder icon next to its name and no file row does.
2. **Given** the left-hand tree (which only ever shows folders), **When** it renders,
   **Then** every node shows a folder icon.

---

### User Story 4 - Contents table uses alternating row shading instead of divider lines (Priority: P4)

The right-hand contents table drops its row divider lines and instead shades alternating
rows (a "candy stripe"/zebra pattern) so adjacent entries are still easy to tell apart.

**Why this priority**: A purely visual refinement to an already-functional table; lowest
risk and lowest urgency of the four.

**Independent Test**: Open a folder with several entries; confirm there are no divider
lines between rows and that adjacent rows alternate between two background shades.

**Acceptance Scenarios**:

1. **Given** the contents table has more than one row, **When** it renders, **Then** no
   divider line is visible between any two rows.
2. **Given** the contents table has more than one row, **When** it renders, **Then** rows
   alternate between two background shades in order (odd/even), consistent with the
   existing dark theme (FR-015 of the Web Artifact Explorer feature).

---

### Edge Cases

- What happens on a Back press once the user is back at the app's own initial default
  view (baseline entry), with no further in-app history behind it? Standard browser
  behavior applies — there is nothing further of the app's own to return to (User Story 1,
  Acceptance Scenario 5).
- What happens if the user navigates to a new folder after having pressed Back one or more
  times? The now-obsolete "forward" history (from before the Back presses) is discarded,
  per standard browser history behavior — pressing Forward no longer has anything past the
  newly-visited folder to go to.
- What happens to a folder's icon display for an empty folder (User Story 3)? It still
  shows the folder icon — having no children doesn't change its type.
- What happens to row striping (User Story 4) when the table shows only one row, or is
  empty? A single row uses its designated shade; the pre-existing empty-state message
  (from the Web Artifact Explorer feature) is shown instead of a table when there are no
  rows.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Selecting a different folder (in the tree or in the contents table) MUST
  push a new entry onto the browser's history stack.
- **FR-002**: Switching the active tab MUST push a new entry onto the browser's history
  stack.
- **FR-003**: Activating the browser's Back action MUST return the UI to the immediately
  preceding folder/tab selection recorded by FR-001/FR-002, without navigating away from
  the application.
- **FR-004**: Activating the browser's Forward action MUST re-apply whatever folder/tab
  selection was undone by the most recent Back action.
- **FR-005**: Expanding or collapsing a tree folder node, when it does not change which
  folder is currently selected, MUST NOT push a new history entry.
- **FR-006**: The first time a tab's tree is populated, the tab's root folder node MUST be
  rendered expanded, showing its immediate child folders.
- **FR-007**: Automatic root expansion (FR-006) MUST apply only the first time a tab's
  tree is populated — if the user subsequently collapses the root, that state MUST persist
  across tab switches for the remainder of the session.
- **FR-008**: Folders below the root MUST NOT be automatically expanded — only the root's
  immediate children are revealed by FR-006.
- **FR-009**: Every folder entry shown in the left-hand tree or the right-hand contents
  table MUST display a folder icon; file entries MUST NOT display that icon.
- **FR-010**: The right-hand contents table MUST NOT display divider lines between rows.
- **FR-011**: The right-hand contents table MUST shade alternating rows with two distinct
  background shades so adjacent rows remain visually distinguishable without divider
  lines.
- **FR-012**: When the app first loads, it MUST record its initial view (Infra tab, root
  selected) as a baseline history entry, so that a single subsequent navigation can still
  be undone by Back — leaving the application only happens once the user is already back
  at this baseline with no further in-app history behind it.

### Key Entities

- **Navigation History Entry**: One step on the browser's history stack, capturing which
  tab was active and which folder was selected at that point (FR-001/FR-002); used to
  restore the UI on Back/Forward (FR-003/FR-004).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can navigate through multiple folders and tabs, then use the
  browser's Back action repeatedly to retrace every step in reverse, without the
  application ever being left/closed as a result.
- **SC-002**: After using Back, using Forward restores the exact folder/tab selection that
  Back had just undone, every time.
- **SC-003**: When a tab is opened for the first time, its root folder's immediate child
  folders are visible in the tree with zero clicks.
- **SC-004**: A user can distinguish a folder entry from a file entry at a glance, without
  reading its name or clicking it, in both the tree and the contents table.
- **SC-005**: A user can tell adjacent rows in the contents table apart at a glance, with
  no divider lines present.

## Assumptions

- Only actions that change *which folder is selected* or *which tab is active* create a
  history entry; expanding/collapsing a tree node on its own does not (User Story 1,
  Acceptance Scenario 6; FR-005).
- Back/Forward restore which tab is active and which folder is selected; they do not
  restore a full snapshot of tree expand/collapse state at that past moment — expand/
  collapse state simply reflects however the user currently has it, independent of
  Back/Forward navigation.
- This feature does not require the app's URL to be independently bookmarkable or
  shareable (e.g., pasting a copied URL into a new tab reconstructing the same view) —
  only that the browser's own Back/Forward actions work correctly during a single
  session. Deeper URL/deep-linking support is out of scope here.
- Reloading the page (e.g., pressing F5) is treated the same as a fresh page load: it
  resets to the initial default view (Infra tab, root selected) rather than restoring
  whatever folder/tab was last active before the reload.
- The automatic root-expansion behavior (User Story 2) is scoped to the root node only;
  it does not change how any other folder's expand/collapse state behaves.
- Which specific icon represents a folder, and the exact two shades used for row
  striping, are visual-design decisions for the planning phase, not specification
  concerns — this spec only requires that a folder icon exists and is visually distinct
  from files, and that alternating shading (not divider lines) is used.
