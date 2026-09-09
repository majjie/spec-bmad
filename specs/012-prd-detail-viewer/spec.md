# Feature Specification: PRD Detail Viewer

**Feature Branch**: `012-prd-detail-viewer`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "We're going to populate the right hand pane shown when the
user selects the leaf node in the PRD branch. At present, the leaf node is implicitly
bound to a subfolder under the '_bmad-output/planning-artifacts/prds' folder. Within that
folder should be file called 'prd.md'. This is the main product requirements document. It
is usually quite large. It is very cumbersome to navigate. We are looking to solve that.
The content will be dominated by a file viewer component, showing the content of the
'prd.md' file. This will not be in a modal dialog but fill the whole right-hand pane aside
from some extra bits I will be describing next. As the PRD typically has a YAML block at
the top, I still want the (i) icon in the top right hand corner, but not the 'X' to close.
Along the top, from left to right, we will lay out some tiles. These are placeholders for
now and will be fleshed out in a later step. They will have the title next to an
appropriate icon. The icon will be on the left of the title text. All of them will be
pretty small in height as we don't want to overly encroach on the space the PRD will
require. A tile entitled 'reviews'; a tile entitled 'addendum'; a tile entitled 'memory
log'. The content of the markdown is populated with certain bullet points and headers that
describe heading requirements — functional requirements, non-functional requirements,
user-journeys etc, in two flavours. Bullet-pointed requirements follow the pattern: two
stars, two or more letters, a dash, one or more digits, two stars (e.g. '**FR-25** Documents
are navigable...'). Headered requirements follow the pattern: three hashes, two or more
letters, a dash, one or more digits, a space, an em-dash (e.g. '### UJ-1 — Verifying a
completed stage...'). We're interested in just the 'UJ-1' or 'FR-25' names of these
requirements. To the right hand side of the document, a column of small tiles will list
the unique letter portion of the requirement codes (e.g. FR, UJ, NFR). Hovering over these
invokes a tooltip listing all codes under that prefix, in numerical order, each shown by
its full code (not just the number). Clicking one jumps the PRD to that point. The tooltip
must stay active if the pointer moves over it, and must scroll internally if it's too
large for the screen."

## Clarifications

### Session 2026-09-09

- Q: Should the requirement-code index column stay fixed in place as the user scrolls
  through the PRD, or scroll away with the document? → A: It's a structurally separate
  column, laid out outside the file-viewer area entirely — not an overlay inside the
  scrolling document, and not scrolling with its content. It sits to the right of the
  file viewer as its own distinct region of the pane.

### Session 2026-09-09 (post-implementation feedback)

- Q: Must the frontmatter (i) info control stay fixed in place while the PRD content
  scrolls, rather than scrolling away with it? → A: Yes — it stays in the pane's top-right
  corner (the originally specified placement), remaining fixed there regardless of how far
  the document is scrolled, exactly like the index column's own fixed placement.

### Session 2026-09-09 (post-implementation feedback, requirement-code tooltip)

- Q: The requirement-code tooltip closes as soon as the pointer leaves — should it stay
  open a little longer? → A: Yes — double the effective timeout, giving a 400ms grace
  period after the pointer leaves both the tile and the tooltip before it closes.

### Session 2026-09-09 (post-implementation feedback, visual partitioning)

- Q: The pane's three regions (placeholder tiles, PRD content, requirement-code index)
  need clearer visual separation — where should a border go? → A: A divider line beneath
  the placeholder tiles row, and another to the left of the requirement-code index column
  — partitioning the pane into its three visually distinct regions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View the PRD in a full-pane viewer (Priority: P1)

A user selects a PRD leaf node in the Navigator tree and sees that folder's `prd.md`
rendered as formatted Markdown, filling the entire right-hand pane — not a dialog the user
has to close, just what's shown for that selection, the same way selecting any other
Navigator item shows something in that pane today.

**Why this priority**: This is the foundation everything else in this feature sits on —
without it, there's nothing to index or navigate.

**Independent Test**: Select a PRD leaf node whose folder contains a `prd.md` file;
confirm its content renders as formatted Markdown filling the pane, with no dialog, no
close control, and its YAML frontmatter excluded from the rendered view exactly as already
happens for any other Markdown file opened in this tool.

**Acceptance Scenarios**:

1. **Given** a PRD leaf node whose folder contains a `prd.md` file, **When** the user
   selects it, **Then** that file's content renders as formatted Markdown, filling the
   entire right-hand pane.
2. **Given** that rendered content, **When** it includes a YAML frontmatter preamble at
   the top, **Then** that preamble is excluded from the rendered view, and an
   informational control appears fixed in the pane's top-right corner, staying in place
   regardless of how far the document is scrolled, showing its key/value pairs on hover or
   click — exactly as already established for Markdown files opened elsewhere in this tool
   — but with no accompanying close control, since this pane isn't a dismissible dialog.
3. **Given** a PRD leaf node whose folder has no `prd.md` file, **When** the user selects
   it, **Then** the pane shows a clear message that no PRD document exists there, rather
   than an error or a blank pane.
4. **Given** any other Navigator selection (Sprint Status, a different PRD leaf, no
   selection at all), **When** the user makes it, **Then** this feature has no effect on
   what already renders for it.

---

### User Story 2 - Navigate the PRD via its requirement-code index (Priority: P1)

A user viewing a large PRD sees a column of small tiles down the right side of the
document, one per unique requirement-code prefix found in it (e.g. "FR", "UJ", "NFR").
Hovering one reveals every code under that prefix, in numerical order; clicking one jumps
the document straight to it — without having to scroll through the whole document by hand.

**Why this priority**: This is the actual "cumbersome to navigate" problem this feature
exists to solve — viewing the document alone (User Story 1) doesn't yet make a
~24,000-word PRD any easier to find things in.

**Independent Test**: Open a PRD containing both bullet-style codes (e.g. `**FR-25**`)
and header-style codes (e.g. `### UJ-1 — ...`) across at least two different prefixes;
confirm one tile appears per unique prefix, hovering one lists every code under it in
numerical order by full code text, and clicking a code scrolls the document to its
location.

**Acceptance Scenarios**:

1. **Given** a PRD whose content contains bullet-style codes like `**FR-25**` and
   header-style codes like `### UJ-1 — Verifying a completed stage`, **When** it renders,
   **Then** one small tile appears for each unique prefix found (here, "FR" and "UJ") —
   not one tile per individual code — laid out in their own column outside the file
   viewer, so scrolling the PRD content never scrolls the index away with it.
2. **Given** a prefix tile, **When** the user hovers it, **Then** a tooltip appears
   listing every code found under that prefix, sorted numerically by its digit portion,
   each shown as its full code (e.g. "FR-25", not just "25").
3. **Given** that tooltip, **When** the user moves the pointer from the tile onto the
   tooltip's own content, **Then** the tooltip stays visible rather than closing.
4. **Given** that tooltip, **When** the user selects one of its listed codes, **Then**
   the PRD content scrolls to that code's location in the document.
5. **Given** a tooltip whose list of codes is taller than the available screen space,
   **When** it renders, **Then** it scrolls internally rather than being clipped or
   pushed off-screen.
6. **Given** a PRD with no detected requirement codes of either style, **When** it
   renders, **Then** no prefix tiles or index column appear at all — the document still
   renders in full.

---

### User Story 3 - Placeholder tiles for future PRD-related content (Priority: P2)

A user viewing a PRD sees three small tiles laid out along the top of the pane — "reviews,"
"addendum," and "memory log," each with an icon to the left of its title — reserving space
for functionality this feature doesn't yet build.

**Why this priority**: Explicitly deferred scaffolding, not required for the PRD to be
readable or navigable — the two prior stories already deliver this feature's full value on
their own.

**Independent Test**: Open any PRD leaf node; confirm three small tiles render along the
top of the pane, left to right, titled "reviews," "addendum," and "memory log," each with
an icon to the title's left, occupying only a small portion of the pane's height; confirm
none of them do anything when selected.

**Acceptance Scenarios**:

1. **Given** a PRD leaf node, **When** it renders, **Then** three tiles appear along the
   top of the pane, in this order: "reviews," "addendum," "memory log."
2. **Given** any one of those tiles, **When** it renders, **Then** it shows an icon to the
   left of its title, and its own height is small relative to the pane, leaving the
   majority of the pane's height for the PRD content below it.
3. **Given** any one of those tiles, **When** the user selects it, **Then** nothing
   happens — no functionality is implemented for them in this feature.

---

### Edge Cases

- What happens when a requirement code (of either style) is duplicated in the same
  document (e.g. two occurrences of `FR-25`)? Both occurrences are indexed and individually
  selectable in the tooltip — this feature never assumes codes are unique, and never
  silently merges or drops a duplicate.
- What happens when the same code appears in both the bullet style and the header style
  within the same document? Both occurrences are indexed separately, since they represent
  two distinct locations in the document, even though their code text is identical.
- What happens when a selected PRD leaf node doesn't follow this tool's usual
  `<project>-<date>` naming convention (an already-supported "non-conforming" entry from
  the existing Navigator tree)? This feature applies the same way regardless — any PRD
  leaf node's folder is checked for a `prd.md` file, conforming or not.
- What happens when a `###` heading exists in the PRD but doesn't match the exact
  header-style code pattern (e.g. an ordinary section heading like "### Overview")? It's
  left alone — not indexed, not altered, rendered exactly as any other heading.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Selecting a PRD leaf node in the Navigator tree MUST render that folder's
  `prd.md` file as formatted Markdown, filling the entire right-hand detail pane — not in
  a dialog.
- **FR-002**: That rendered content MUST have its YAML frontmatter preamble (and marker
  element, if present) excluded from view, exactly as already established for Markdown
  files opened elsewhere in this tool.
- **FR-003**: An informational control MUST appear fixed in the pane's top-right corner
  whenever the PRD has a frontmatter preamble, staying in place regardless of how far the
  document is scrolled (Clarifications), revealing its key/value pairs on hover or
  click — the same established behavior used elsewhere in this tool — but with no
  accompanying close control.
- **FR-004**: When the selected PRD leaf node's folder has no `prd.md` file, the pane
  MUST show a clear message that no PRD document exists there, rather than an error or a
  blank pane.
- **FR-005**: Three placeholder tiles MUST render along the top of the pane, left to
  right: "reviews," "addendum," "memory log" — each showing an icon to the left of its
  title, and none of them carrying any functionality in this feature.
- **FR-006**: These placeholder tiles MUST each be small enough in height that the PRD
  content below them still receives the majority of the pane's available height.
- **FR-007**: The tool MUST detect every bullet-style requirement code in the PRD's
  content — text matching two-or-more letters, a dash, and one-or-more digits, wrapped in
  double-asterisks (e.g. `**FR-25**`) — recording each occurrence's location in the
  document.
- **FR-008**: The tool MUST detect every header-style requirement code in the PRD's
  content — a level-3 heading beginning with two-or-more letters, a dash, one-or-more
  digits, a space, and an em dash (e.g. `### UJ-1 — Verifying a completed stage`) —
  recording each occurrence's location in the document.
- **FR-009**: One small tile MUST appear per unique letter-prefix found across both
  detected code styles (e.g. "FR", "UJ", "NFR") — not one tile per individual code, and no
  tiles at all when no codes are detected. These tiles MUST render in their own column,
  structurally separate from the file viewer — outside its scrollable content, not
  overlaid on it — so the index never scrolls away with the document (Clarifications).
- **FR-010**: Hovering (or otherwise activating) a prefix tile MUST reveal a tooltip
  listing every code found under that prefix, sorted numerically by the code's digit
  portion, each shown by its full code text (e.g. "FR-25," not "25").
- **FR-011**: That tooltip MUST remain visible while the pointer moves onto the tooltip's
  own content, not only while over the triggering tile, and MUST allow a brief grace period
  (400ms) after the pointer leaves both the tile and the tooltip before closing, so it
  doesn't feel like it disappears too abruptly (Clarifications).
- **FR-012**: Selecting a code listed in that tooltip MUST move the PRD view to that
  code's location in the document.
- **FR-013**: A tooltip whose content is taller than the available screen space MUST
  scroll internally rather than being clipped or extending off-screen.
- **FR-014**: None of this feature's changes MUST alter any other existing Navigator
  behavior — every other selectable item's own rendering is unaffected.
- **FR-015**: The pane's three regions — the placeholder tiles row, the PRD content, and
  the requirement-code index column — MUST be visually partitioned from one another by a
  divider line, so their boundaries are clear rather than blending together
  (Clarifications).

### Key Entities

- **Requirement Code Reference**: One detected occurrence of a requirement code within a
  PRD document — its full code text (e.g. "FR-25"), its letter prefix (e.g. "FR"), which
  of the two detected styles it came from, and its location within the document (used to
  jump to it). Not persisted — derived fresh each time a PRD is viewed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user selecting a PRD leaf node sees its full document immediately, without
  opening or dismissing any additional dialog.
- **SC-002**: A user can find every occurrence of a given requirement-code prefix (e.g.
  every "FR") without manually scrolling through the document to look for them.
- **SC-003**: A user can move from "looking at the index" to "reading a specific
  requirement" in a single click on its code.
- **SC-004**: A user can still view a PRD's frontmatter values the same way they already
  do for any other Markdown file in this tool.
- **SC-005**: Every existing Navigator behavior (tree selection, Sprint Status, other
  tabs) continues to work exactly as it did before this feature.

## Assumptions

- "The leaf node in the PRD branch" refers to the Navigator tree's existing PRD date
  entries and non-conforming entries (feature 006) — both already resolve to a specific
  folder path under `_bmad-output/planning-artifacts/prds`; this feature looks for
  `prd.md` directly inside whichever folder that selection resolves to.
- The three placeholder tiles (User Story 3) require no interaction handling, storage, or
  future-proofing beyond rendering their icon and title — their eventual functionality is
  explicitly out of scope for this feature, to be specified separately later.
- Both letters in a requirement-code prefix are expected to be uppercase (matching every
  example given — "FR," "UJ," "NFR"); this feature does not need to handle lowercase or
  mixed-case requirement codes.
- The "location" a detected requirement code needs for jump-to-navigation is scoped to
  scrolling within the currently-rendered PRD document — this feature does not add
  browser-history entries or a shareable URL for a specific requirement code's position.
- Requirement-code prefix tiles are ordered by when their prefix first appears in the
  document (top to bottom) — this feature doesn't need a specific alternate ordering
  (e.g. alphabetical) called out.
- This feature is read-only, consistent with this tool's existing principle — nothing
  about a PRD's own content, or any other artifact, is written, edited, or reordered by
  viewing or navigating it.
