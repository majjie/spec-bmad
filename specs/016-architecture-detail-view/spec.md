# Feature Specification: Architecture Detail View

**Feature Branch**: `016-architecture-detail-view`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "Just like PRD, architecture needs a similar layout. A column
of requirement codes, although these are extracted only in markdown headings, not bullet
points. A reviews tile. A memory log tile. No addendum tile. These will be bound in the
same way as the equivalent PRD tiles. Except: Reviews sit under a 'reviews' sub folder. No
need to put links in the memlog."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View the architecture document in a full-pane viewer (Priority: P1)

A user selects an architecture leaf node in the Navigator tree and sees that folder's main
architecture document rendered as formatted Markdown, filling the entire right-hand pane -
replacing the bare folder name the tree currently shows, the same way selecting a PRD leaf
already shows its own full document.

**Why this priority**: This is the foundation everything else in this feature sits on, and
directly supersedes the deliberately minimal placeholder the architecture tree shipped
with - exactly the evolution its own spec anticipated.

**Independent Test**: Select an architecture leaf node whose folder contains its main
architecture document; confirm its content renders as formatted Markdown filling the pane,
with its YAML frontmatter excluded from view and reachable via the same established
informational control used for PRD and every other Markdown file in this tool.

**Acceptance Scenarios**:

1. **Given** an architecture leaf node whose folder contains its main architecture
   document, **When** the user selects it, **Then** that document's content renders as
   formatted Markdown, filling the entire right-hand pane.
2. **Given** that rendered content, **When** it includes a YAML frontmatter preamble,
   **Then** that preamble is excluded from the rendered view, and the same established
   informational control appears, showing its key/value pairs on hover or click, with no
   close control.
3. **Given** an architecture leaf node whose folder has no main architecture document,
   **When** the user selects it, **Then** the pane shows a clear message that no such
   document exists there, rather than an error or a blank pane.

---

### User Story 2 - Navigate the architecture document via its requirement-code index (Priority: P1)

A user viewing an architecture document sees a column of small tiles down the right side,
one per unique requirement-code prefix found in it - but only codes that appear as their
own heading, since architecture documents never use the bullet-pointed style PRDs
sometimes do. Hovering one reveals every code under that prefix; clicking one jumps the
document to it.

**Why this priority**: This is the same "cumbersome to navigate" problem already solved
for PRD, applying equally to architecture documents, which are similarly long and
structured around numbered decisions.

**Independent Test**: Open an architecture document containing several heading-style
requirement codes (e.g. `### AD-1 - Some decision`) across at least two different
prefixes; confirm one tile appears per unique prefix, hovering one lists every code under
it in numerical order, and clicking a code scrolls the document to its location.

**Acceptance Scenarios**:

1. **Given** an architecture document whose content contains heading-style codes like
   `### AD-1 - Some decision`, **When** it renders, **Then** one small tile appears for
   each unique prefix found, in their own column, structurally separate from the document
   so it never scrolls away with it.
2. **Given** an architecture document that happens to contain text shaped like a
   bullet-pointed code (e.g. `**AD-1**`) somewhere in its body, **When** it renders,
   **Then** that occurrence is not indexed - only codes appearing as their own heading are.
3. **Given** a prefix tile, **When** the user hovers it, **Then** a tooltip lists every
   code found under that prefix, sorted numerically, each shown by its full code text.
4. **Given** that tooltip, **When** the user selects one of its listed codes, **Then** the
   document scrolls to that code's location.
5. **Given** an architecture document with no heading-style requirement codes at all,
   **When** it renders, **Then** no index column appears - the document still renders in
   full.

---

### User Story 3 - Browse and open review documents for the architecture (Priority: P1)

A user viewing an architecture document hovers a "reviews" tile and sees a tooltip listing
review documents found in that folder's own "reviews" subfolder, by friendly name,
alphabetically. Selecting one opens its content in a file-viewer dialog.

**Why this priority**: The same value already delivered for PRD reviews, applying equally
to architecture review documents.

**Independent Test**: Open an architecture folder containing a "reviews" subfolder with
two or more review files in it; confirm hovering the reviews tile lists them by friendly
name, alphabetically, and selecting one opens its content in a file-viewer dialog.

**Acceptance Scenarios**:

1. **Given** an architecture folder whose "reviews" subfolder contains one or more review
   files, **When** the user hovers the reviews tile, **Then** a tooltip lists each one by
   friendly name, alphabetically - the same friendly-name transform already established
   for PRD reviews.
2. **Given** that tooltip, **When** the user selects one of the listed reviews, **Then** a
   file-viewer dialog opens showing that file's full content.
3. **Given** an architecture folder with no "reviews" subfolder, or one with no matching
   files in it, **When** it renders, **Then** the reviews tile appears visually disabled
   and produces no tooltip or dialog on hover or click.

---

### User Story 4 - Review the architecture's memory log (Priority: P2)

A user viewing an architecture document clicks a "memory log" tile and sees that folder's
memory log rendered in the same bespoke, readable format already established for PRD's own
memory log - candy-striped rows, each entry's category broken into its own header - but
without any requirement code being turned into a clickable link.

**Why this priority**: The same readability value already delivered for PRD's memory log,
applying equally here - the most novel piece of this feature, reasonably sequenced last.

**Independent Test**: Open an architecture folder containing a memory log file with
several categorized entries, including one mentioning a requirement code; confirm the
dialog renders candy-striped rows with category headers, and confirm the mentioned code
renders as plain text, not a link.

**Acceptance Scenarios**:

1. **Given** an architecture folder containing its memory log file, **When** the user
   clicks the memory log tile, **Then** a dialog opens rendering its content as a sequence
   of candy-striped rows, one per top-level bullet, with each entry's category (when
   present) broken into its own distinctly-colored header - the same established format
   used for PRD's memory log.
2. **Given** a bullet mentioning a requirement code, **When** it renders, **Then** that
   code appears as plain text - never as a clickable link, regardless of whether that
   exact code also appears in the architecture document being viewed.
3. **Given** an architecture folder with no memory log file, **When** it renders, **Then**
   the memory log tile appears visually disabled and produces no dialog on click.

---

### Edge Cases

- What happens when an architecture folder has no "addendum" file at all? Nothing - this
  feature deliberately adds no addendum tile for architecture, unlike PRD.
- What happens when the "reviews" subfolder itself doesn't exist? The reviews tile is
  treated exactly as if it had no matching files - visually disabled, not an error.
- What happens when a memory log bullet mentions a requirement-code-shaped substring that
  doesn't actually exist anywhere in the architecture document? It still renders as plain
  text - this feature never resolves or links any code in the memory log, regardless of
  whether a matching code exists.
- What happens when the same requirement code prefix appears in both an architecture
  document and a PRD document open at different times? Each document's index is entirely
  its own - no cross-document linking or shared state of any kind.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Selecting an architecture leaf node MUST render that folder's main
  architecture document as formatted Markdown, filling the entire right-hand pane -
  superseding the bare folder-name placeholder currently shown there.
- **FR-002**: That rendered content MUST have its YAML frontmatter preamble excluded from
  view, exactly as already established for Markdown files elsewhere in this tool.
- **FR-003**: An informational control MUST appear, fixed in place regardless of
  scrolling, whenever the architecture document has a frontmatter preamble, revealing its
  key/value pairs on hover or click, with no accompanying close control - the same
  established behavior as PRD's own equivalent control.
- **FR-004**: When the selected architecture leaf node's folder has no main architecture
  document, the pane MUST show a clear message that no such document exists there, rather
  than an error or a blank pane.
- **FR-005**: The tool MUST detect every heading-style requirement code in the
  architecture document - a level-3 heading beginning with two-or-more letters, a dash,
  one-or-more digits, a space, and an em dash or hyphen (e.g. `### AD-1 - Some decision`) - recording
  each occurrence's location. Bullet-pointed codes (e.g. `**AD-1**`) MUST NOT be detected
  in an architecture document, even though PRD documents do detect that style.
- **FR-006**: One small tile MUST appear per unique letter-prefix found among detected
  codes, rendered in their own column, structurally separate from the document so the
  index never scrolls away with it - no tiles at all when no codes are detected.
- **FR-007**: Hovering a prefix tile MUST reveal a tooltip listing every code found under
  that prefix, sorted numerically, each shown by its full code text.
- **FR-008**: That tooltip MUST remain visible while the pointer moves onto its own
  content.
- **FR-009**: Selecting a code listed in that tooltip MUST move the document view to that
  code's location.
- **FR-010**: A tooltip whose content is taller than the available screen space MUST
  scroll internally rather than being clipped or extending off-screen.
- **FR-011**: A "reviews" tile MUST detect every review file inside the architecture
  folder's own "reviews" subfolder - not the architecture folder directly, unlike PRD's
  own reviews tile.
- **FR-012**: When that subfolder is absent, or contains no matching files, the reviews
  tile MUST appear visually disabled and produce no tooltip or dialog on hover or click.
- **FR-013**: When one or more matching files exist, hovering (or activating) the reviews
  tile MUST reveal a tooltip listing each one by friendly name, sorted alphabetically -
  the same friendly-name transform already established for PRD reviews.
- **FR-014**: Selecting a listed review MUST open a file-viewer dialog showing that file's
  full content, using the same established file-viewing behavior used elsewhere in this
  tool.
- **FR-015**: A "memory log" tile MUST detect whether the architecture folder contains its
  memory log file, directly inside that folder (matching PRD's own convention, not a
  subfolder).
- **FR-016**: When that file is absent, the memory log tile MUST appear visually disabled
  and produce no dialog on click.
- **FR-017**: When present, clicking the memory log tile MUST open a dialog rendering its
  content as a sequence of candy-striped rows, each entry's category (when its leading
  text matches that shape) broken into its own distinctly-colored header - the same
  bespoke format already established for PRD's own memory log.
- **FR-018**: That dialog MUST exclude the memory log file's own YAML frontmatter from the
  rendered view and surface it via the same informational control already established
  elsewhere in this tool.
- **FR-019**: Within that dialog, no requirement code mentioned in the memory log's body
  text MUST ever be rendered as a clickable link - every such mention renders as plain
  text, regardless of whether a matching code exists in the architecture document.
- **FR-020**: No "addendum" tile MUST be added for architecture - this feature adds only
  the reviews and memory log tiles alongside the requirement-code index.
- **FR-021**: None of this feature's changes MUST alter any other existing PRD, Navigator,
  Infra, or Output behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user selecting an architecture leaf node sees its full document
  immediately, without opening or dismissing any additional dialog.
- **SC-002**: A user can find every occurrence of a given requirement-code prefix in an
  architecture document without manually scrolling through it.
- **SC-003**: A user can move from "looking at the index" to "reading a specific decision"
  in a single click.
- **SC-004**: A user can locate and open any review document for the architecture they're
  viewing without leaving that view.
- **SC-005**: A user reading an architecture's memory log can follow its categorized
  entries as easily as they already can for a PRD's own memory log.
- **SC-006**: Every existing PRD-viewer, Navigator, Infra, and Output behavior continues
  to work exactly as it did before this feature.

## Assumptions

- The architecture folder's main document has a fixed, conventional filename (mirroring
  how `prd.md` is PRD's own fixed filename) - confirmed by inspecting this tool's own
  reference project's architecture folder.
- Files inside the "reviews" subfolder still follow the same `review-`-prefixed naming
  convention PRD reviews already use - confirmed by the same inspection; only their
  *location* differs from PRD's own reviews tile, not their naming or friendly-name
  transform.
- This feature supersedes the architecture tree's own deliberately minimal leaf
  placeholder (bare folder name), completing the evolution that feature's own
  specification already anticipated - the same evolution PRD itself went through.
- The reviews and memory-log tiles, the file-viewer dialog, and the requirement-code
  tooltip mechanics all reuse the exact interaction patterns already established for PRD -
  no new interaction design is introduced by this feature, only a narrower scope (heading
  codes only, a different reviews location, no memory-log links, no addendum tile).
- This feature is read-only, consistent with this tool's existing principle - nothing
  about an architecture folder's own content is written, edited, or reordered by viewing
  or navigating it.
