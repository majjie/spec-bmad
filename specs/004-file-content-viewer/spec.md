# Feature Specification: File Content Viewer

**Feature Branch**: `004-file-content-viewer`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "When a file is double clicked in the right hand side I want
a modal dialog to fill the screen and render out the contents. The view will be rendered
according to the file extension primarily. All files render in monospace font with line
numbering, except: `.md` renders into HTML from markdown (no line numbers needed); `.yaml`,
`.toml`, and `.py` get syntax highlighting; `.txt` and `.csv` just render as text (a later
step will render `.csv` as a table); some known extensionless files (starting with
`.gitignore`) render as text too. The modal fills the screen with a 20px border. Browser
Back, Escape, or an 'X' icon in the top right all close the dialog."

## Clarifications

### Session 2026-09-07

- Q: When the dialog is closed via the "X" icon or the Escape key (as opposed to the browser's Back action), should that also step the browser's history back to keep it in sync, or should it just close the dialog visually and leave the history stack as-is? → A: Closing via X or Escape also steps history back (equivalent to Back), so history always matches what's visible and Forward never reopens a file the user explicitly closed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View a file's contents in a full-screen dialog (Priority: P1)

A user double-clicks a file row in the contents table. A dialog opens, filling almost the
entire browser window (with a 20px border around it), showing that file's contents in a
monospace font with line numbers down the side. Clicking an "X" in the dialog's top-right
corner closes it and returns to the folder view underneath.

**Why this priority**: This is the entire feature in its simplest form — being able to see
inside a file at all. Every other story is a refinement of how a specific file type is
rendered, or an additional way to close the same dialog.

**Independent Test**: Double-click a plain-text file (e.g. one with a `.txt` extension, or
no recognized extension); confirm a full-screen dialog opens showing its contents in
monospace with line numbers, and confirm clicking the "X" closes it and the previously
visible folder contents are unchanged underneath.

**Acceptance Scenarios**:

1. **Given** the contents table is showing a folder with at least one file, **When** the
   user double-clicks a file row, **Then** a dialog opens covering the browser viewport
   except for a 20px border, showing that file's contents.
2. **Given** the file being viewed has no special rendering rule (Assumptions/Edge Cases),
   **When** the dialog renders it, **Then** the content is shown in a monospace font with
   a line number beside each line.
3. **Given** the dialog is open, **When** the user clicks the "X" icon in its top-right
   corner, **Then** the dialog closes and the folder view underneath is exactly as it was
   before the file was opened.
4. **Given** the contents table is showing a folder, **When** the user double-clicks a
   *folder* row instead of a file row, **Then** no dialog opens (folders keep navigating
   via a single click, as before).
5. **Given** a file can no longer be read (e.g. it was deleted from disk after the folder
   was listed, or it can't be accessed), **When** the user double-clicks it, **Then** the
   dialog opens showing an error message instead of file contents.

---

### User Story 2 - Close the dialog with Escape or the browser's Back action (Priority: P2)

While the dialog is open, a user presses the Escape key, or uses the browser's Back
action, and the dialog closes the same way clicking "X" would.

**Why this priority**: These are the navigation habits established by the "Explorer UI
Polish" feature (Escape being a standard modal convention, Back being how this tool's own
navigation history already works) — valuable, but the dialog is already fully usable via
the "X" button alone without them.

**Independent Test**: Open the dialog, press Escape, and confirm it closes. Open it again,
use the browser's Back action, and confirm it closes the same way — without navigating the
underlying folder/tab view, and without leaving the application.

**Acceptance Scenarios**:

1. **Given** the dialog is open, **When** the user presses the Escape key, **Then** the
   dialog closes.
2. **Given** the dialog is open, **When** the user activates the browser's Back action,
   **Then** the dialog closes, and the folder/tab view underneath is exactly as it was
   before the file was opened.
3. **Given** the dialog was closed via Back, **When** the user then activates the
   browser's Forward action, **Then** the dialog reopens showing the same file.
4. **Given** the dialog was closed via the "X" icon or Escape (not via Back), **When**
   the user then activates the browser's Forward action, **Then** nothing reopens — the
   history stack was already stepped back when the dialog closed, so there is no
   "forward" step left to reopen the file the user just closed.

---

### User Story 3 - Markdown files render as formatted content (Priority: P3)

A user double-clicks a file with a `.md` extension. Instead of showing the raw Markdown
text, the dialog renders it as formatted HTML — headings, lists, tables, and other
Markdown structure all appear as they're meant to look, not as literal `#`/`-`/`|`
characters. No line numbers are shown for this file type.

**Why this priority**: Most of this tool's own artifacts (specs, plans, tasks) are
Markdown, so this materially improves the tool's usefulness — but the file is still
viewable as raw text via User Story 1 without it.

**Independent Test**: Double-click a `.md` file containing at least a heading, a list, and
a table; confirm each renders as formatted HTML (a real heading, a real bulleted/numbered
list, a real table) rather than showing raw Markdown syntax, and confirm no line numbers
are shown.

**Acceptance Scenarios**:

1. **Given** a file with a `.md` extension, **When** the user double-clicks it, **Then**
   the dialog renders its Markdown content as formatted HTML.
2. **Given** a `.md` file is open in the dialog, **When** it renders, **Then** no line
   numbers are shown, unlike every other file type.

---

### User Story 4 - Recognized code/config files get syntax highlighting (Priority: P4)

A user double-clicks a file with a `.yaml`, `.toml`, or `.py` extension. The dialog shows
its contents in monospace with line numbers, same as any plain-text file, but with
syntax-appropriate coloring (keys, strings, comments, keywords, etc. visually
distinguished) matching that file type's language.

**Why this priority**: A readability improvement for structured/code files; the file's
content is already fully visible and correct without it (via User Story 1's plain
monospace rendering), so this is the most dispensable of the four stories.

**Independent Test**: Double-click a `.yaml` file, a `.toml` file, and a `.py` file in
turn; confirm each shows line numbers plus coloring appropriate to that file type (e.g.
YAML keys colored differently from their values, Python keywords colored differently from
identifiers).

**Acceptance Scenarios**:

1. **Given** a file with a `.yaml` extension, **When** the user double-clicks it, **Then**
   the dialog shows its contents with YAML syntax highlighting and line numbers.
2. **Given** a file with a `.toml` extension, **When** the user double-clicks it, **Then**
   the dialog shows its contents with TOML syntax highlighting and line numbers.
3. **Given** a file with a `.py` extension, **When** the user double-clicks it, **Then**
   the dialog shows its contents with Python syntax highlighting and line numbers.

---

### Edge Cases

- What happens when a `.txt` or `.csv` file is double-clicked? It renders exactly like any
  other file with no special rule — plain monospace text with line numbers (FR-007); a
  future feature will render `.csv` as a table instead.
- What happens when a known extensionless file (currently: `.gitignore`) is double-clicked?
  It renders as plain monospace text with line numbers, the same as `.txt` (FR-008).
- What happens when a file's extension isn't in any rule listed above? It falls back to
  the default: plain monospace text with line numbers (FR-009).
- What happens when the file's contents don't look like readable text at all (e.g. a
  binary file)? The dialog shows an error/unsupported-file message rather than dumping
  unreadable characters (see Assumptions).
- What happens when the user double-clicks a different file while the dialog is already
  open? Out of scope for this feature — the dialog only opens from the contents table,
  which isn't visible/interactive while the dialog covers the screen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Double-clicking a file row in the contents table MUST open a modal dialog
  showing that file's contents.
- **FR-002**: The dialog MUST occupy the full browser viewport except for a 20px border on
  all sides.
- **FR-003**: Every file rendering MUST use a monospace font, except where FR-005
  overrides it.
- **FR-004**: Every file rendering MUST show a line number for each line, except where
  FR-005 overrides it.
- **FR-005**: A file with a `.md` extension MUST be rendered as formatted HTML produced
  from its Markdown content, with no line numbers.
- **FR-006**: Files with a `.yaml`, `.toml`, or `.py` extension MUST be rendered with
  syntax highlighting appropriate to that file type, in addition to monospace font and
  line numbers.
- **FR-007**: Files with a `.txt` or `.csv` extension MUST be rendered as plain monospace
  text with line numbers, with no syntax highlighting.
- **FR-008**: Files whose full name (not extension) matches a known list — currently just
  `.gitignore` — MUST be rendered as plain monospace text with line numbers, the same as
  FR-007.
- **FR-009**: A file that matches none of FR-005–FR-008 MUST fall back to plain monospace
  text with line numbers.
- **FR-010**: The dialog MUST close when the user presses the Escape key, and this MUST
  also step the browser's history back by one (equivalent to Back), so the history stack
  stays in sync with what's visible (Clarifications session).
- **FR-011**: The dialog MUST close when the user activates the browser's Back action, and
  MUST reopen showing the same file if the user then activates Forward — consistent with
  this tool's existing in-app browser-history navigation.
- **FR-012**: The dialog MUST close when the user clicks a close ("X") icon in its
  top-right corner, and this MUST also step the browser's history back by one (equivalent
  to Back), so a subsequent Forward does not reopen a file the user just closed
  (Clarifications session). The icon MUST remain visually distinguishable regardless of
  the file content rendered behind it (e.g., via a background treatment behind the icon),
  since that content can be any color.
- **FR-013**: Closing the dialog, by any of the methods in FR-010–FR-012, MUST return the
  user to the exact folder/tab view they had open before the file was double-clicked.
- **FR-014**: Double-clicking a folder row MUST NOT open this dialog — folders continue to
  navigate on a single click, unchanged from existing behavior.
- **FR-015**: If a file's contents cannot be read, the dialog MUST show an error message in
  place of file contents rather than failing silently or showing a broken/empty view.
- **FR-016**: The dialog MUST NOT provide any way to edit or save changes to the file being
  viewed — it is view-only, consistent with the project's read-only principle.
- **FR-017**: All three rendering modes (plain, syntax-highlighted, and Markdown) MUST
  render using colors consistent with the application's existing dark theme (Web Artifact
  Explorer feature, FR-015) — none may render with a light/white background or
  default dark-on-light text, regardless of the underlying rendering library's own
  default styling.

### Key Entities

- **File Content View**: The dialog's rendering of one file's contents; has a rendering
  mode (plain monospace text with line numbers, Markdown-as-HTML, or syntax-highlighted)
  determined by the file's extension or, for known extensionless files, its full name.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can view the full contents of any text-based file in the current
  project by double-clicking it, without losing their place in the folder they were
  browsing.
- **SC-002**: Markdown files are read as formatted documents (headings, lists, tables
  rendered as such), not as raw Markdown source.
- **SC-003**: Recognized code/config file types (YAML, TOML, Python) are visually easier to
  scan than plain text, via consistent syntax coloring.
- **SC-004**: The dialog can be closed by any of three independent methods — the close
  icon, Escape, or the browser's Back action — and each returns the user to precisely the
  view they had before opening it.
- **SC-005**: A user viewing any file, in any rendering mode, sees a dark-themed view
  consistent with the rest of the application — never a light/white background.

## Assumptions

- Only files reachable within the currently-resolved project's `_bmad`/`_bmad-output` tree
  can be opened this way; the same server-side path-containment check already established
  for the contents table applies to reading a file's contents.
- If a file's contents can't be confidently read as text (e.g. it appears to be binary, or
  reading it otherwise fails), the dialog shows an error/unsupported message instead of
  attempting to display it — exact detection heuristics are a planning-phase concern.
- No size or length limit is imposed on what's displayed in this feature; a very large
  file is rendered in full. Performance handling for extremely large files, if ever needed,
  is future work.
- Markdown rendering covers common GitHub-flavored Markdown constructs (headings, lists,
  tables, checkboxes, code fences) since this tool's own artifacts (specs, plans, tasks)
  use them.
- `.yml` (as opposed to `.yaml`) is not included in the syntax-highlighting rule for this
  feature — it falls back to the FR-009 default (plain text) unless a future feature adds
  it. Only `.gitignore` is in the known-extensionless-file list for now; more can be added
  later without a spec change.
- Double-clicking a folder row has no behavior beyond whatever single-clicking it already
  does (FR-014) — this feature adds no new folder interaction.
- The dialog closing via the browser's Back action builds directly on the navigation
  history mechanism introduced by the "Explorer UI Polish" feature — opening the dialog is
  itself a navigable step in that same history stack.
- Clicking outside the dialog (the 20px border area) is accepted as a fourth, unlisted way
  to close it, since it uses the same modal component and the same `history.back()` path
  as the "X" icon and Escape (FR-010/FR-012) — it is not a distinct behavior to build, just
  a natural consequence of using a standard modal dialog.
- The exact close-icon background treatment (FR-012) and the exact dark color palette used
  by each rendering mode (FR-017 — e.g. which specific dark syntax-highlighting theme) are
  visual-design decisions for the planning/implementation phase, not specification
  concerns — this spec only requires that the icon stays visible against arbitrary content
  and that no rendering mode reverts to a light theme.
