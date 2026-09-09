# Feature Specification: PRD Tile Actions

**Feature Branch**: `013-prd-tile-actions`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "We're going to wire up the tiles in the PRD view. When I
talk about files, unless explicitly stated, I'm referring to them within the context of
the prd sub-folder that is being viewed. Reviews Tile: This will be bound to markdown
files that bear the prefix 'review-'. Some examples: review-adversarial.md,
review-edge-cases.md, review-rubric.md. If there are no such files in the folder, grey out
the tile. Hovering over the reviews tile will invoke a tool tip in the fashion of the
requirement code lists. The review files will be listed in alphabetical order. However,
they will be formatted to be more friendly. The 'review-' prefix will be removed, all
dashes replaced with a space, and the text capitalized. Clicking on a review will invoke a
file viewer dialog displaying the contents of the relevant review. Addendum Tile: This
targets a file in the folder called 'addendum.md'. If it is not present, this tile should
be greyed out. Clicking the tile invokes a file viewer dialog with the contents of the
addendum.md file. Memory Log Tile: This targets the '.memlog.md' file. If it is not
present, this tile should be greyed out. This is a little different. Although the content
is markdown, it follows a bullet-point format with a YAML preamble, which we shall handle
in the usual way. Rather than rendering the content markdown in the normal way in the file
viewer, a bespoke viewing format for the dialog is wanted. Each bullet point will be
rendered as a candy striped item. The decision/change/assumption/whatever prefix in
parentheses will be broken out into a header, with the text capitalized and in a different
colour. Sometimes the content will contain requirement codes (e.g. FR-76). If such a code
is present in the PRD, it should be rendered as a link; clicking it will close the file
viewer dialog for the memlog and make the PRD jump to that requirement code."

## Clarifications

### Session 2026-09-09

- Q: The friendly review names strip the "review-" prefix and replace dashes with spaces
  — should the result be capitalized as Title Case (every word capitalized, e.g. "Edge
  Cases") or Sentence case (only the first letter, e.g. "Edge cases")? → A: Title Case —
  every word capitalized (e.g. "Edge Cases").
- Q: Should a memory log bullet's body text support inline Markdown formatting (bold,
  italic, code spans) alongside the requirement-code-to-link substitution, or should it
  render as plain text with only that substitution applied? → A: Plain text only — the
  requirement-code-to-link substitution is the only transformation applied; any literal
  Markdown syntax in the source text renders as-is, unparsed.
- Q: When a single memory log bullet mentions more than one requirement code, should every
  one of them become a clickable link, or only the first one found in that bullet? → A:
  Every matching requirement code within a bullet becomes its own independent clickable
  link — not just the first one found.

### Session 2026-09-09 (post-implementation feedback)

- Q: The reviews tooltip felt too small on viewing — should it be widened? → A: Yes — the
  tooltip's width now matches the reviews tile's own rendered width exactly, rather than
  shrinking to fit its narrowest listed name.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and open review documents from the PRD view (Priority: P1)

A user viewing a PRD whose folder contains one or more `review-*.md` files hovers the
"reviews" tile and sees a tooltip listing each review by a friendly, readable name, sorted
alphabetically. Selecting one opens that review's full content in a file-viewer dialog —
without leaving the PRD view or hunting for the file in the Output tab.

**Why this priority**: This is the first of the three placeholder tiles (feature 012) to
gain real behavior, and the most representative of the pattern the other two tiles reuse —
delivering it first de-risks the rest of the feature.

**Independent Test**: Open a PRD folder containing at least two `review-*.md` files (e.g.
`review-adversarial.md`, `review-edge-cases.md`); confirm hovering the reviews tile shows
both, alphabetically ordered, in a friendly readable form; confirm selecting one opens its
content in a file-viewer dialog.

**Acceptance Scenarios**:

1. **Given** a PRD folder containing one or more `review-*.md` files, **When** the user
   hovers (or activates) the reviews tile, **Then** a tooltip lists each file's friendly
   name — the `review-` prefix removed, every dash replaced with a space, and the result
   capitalized — sorted alphabetically.
2. **Given** that tooltip, **When** the user selects one of the listed reviews, **Then** a
   file-viewer dialog opens showing that file's full content, exactly as already
   established for any other Markdown file opened elsewhere in this tool.
3. **Given** a PRD folder with no `review-*.md` files, **When** it renders, **Then** the
   reviews tile appears visually disabled and produces no tooltip or dialog on hover or
   click.

---

### User Story 2 - Open the addendum document from the PRD view (Priority: P1)

A user viewing a PRD whose folder contains an `addendum.md` file clicks the "addendum"
tile and sees that file's full content in a file-viewer dialog.

**Why this priority**: The simplest of the three tiles to wire up, and independently
valuable on its own — a quick, low-risk win alongside User Story 1.

**Independent Test**: Open a PRD folder containing `addendum.md`; confirm clicking the
addendum tile opens its content in a file-viewer dialog. Open a different PRD folder with
no `addendum.md`; confirm the tile appears visually disabled and does nothing when
clicked.

**Acceptance Scenarios**:

1. **Given** a PRD folder containing `addendum.md`, **When** the user clicks the addendum
   tile, **Then** a file-viewer dialog opens showing that file's full content.
2. **Given** a PRD folder with no `addendum.md`, **When** it renders, **Then** the
   addendum tile appears visually disabled and produces no dialog on click.

---

### User Story 3 - Review the memory log with jump-enabled requirement codes (Priority: P2)

A user viewing a PRD whose folder contains a `.memlog.md` file clicks the "memory log"
tile and sees its content rendered in a bespoke, readable format — each entry shown as a
candy-striped row with its category (decision/change/assumption/etc.) broken out into a
distinctly colored header. Where an entry mentions a requirement code that also appears in
the PRD currently open, that code is a clickable link; selecting it closes the memory log
dialog and jumps the PRD straight to that code's location.

**Why this priority**: The most novel and complex of the three tiles — a genuinely bespoke
rendering format, not a reuse of the standard Markdown viewer — so it can reasonably ship
after the simpler, more standard Reviews and Addendum tiles.

**Independent Test**: Open a PRD folder containing a `.memlog.md` file with at least one
entry mentioning a requirement code that also exists in that PRD; confirm the memory log
dialog renders each entry as a candy-striped row with its category as a distinct header,
confirm the mentioned code renders as a link, and confirm selecting it closes the dialog
and jumps the PRD to that code's location.

**Acceptance Scenarios**:

1. **Given** a PRD folder containing `.memlog.md`, **When** the user clicks the memory log
   tile, **Then** a dialog opens rendering its content as a sequence of candy-striped rows,
   one per top-level bullet in the source file.
2. **Given** a bullet whose text begins with a single parenthetical word (e.g.
   "(decision)"), **When** it renders, **Then** that word is broken out into its own
   header, shown capitalized and in a color distinct from the row's body text.
3. **Given** a bullet's body text mentioning a requirement code that also appears in the
   currently-open PRD's own detected requirement codes, **When** it renders, **Then** that
   code is shown as a clickable link.
4. **Given** that link, **When** the user selects it, **Then** the memory log dialog
   closes and the PRD view jumps to that code's location, exactly as already established
   for the requirement-code index column (feature 012).
5. **Given** a bullet's body text mentioning a requirement-code-shaped substring that does
   NOT appear anywhere in the currently-open PRD, **When** it renders, **Then** that
   substring is shown as plain text, not a link.
6. **Given** a PRD folder with no `.memlog.md` file, **When** it renders, **Then** the
   memory log tile appears visually disabled and produces no dialog on click.
7. **Given** `.memlog.md`'s own YAML frontmatter preamble, **When** the dialog renders,
   **Then** that preamble is excluded from the bespoke view and surfaced via the same
   informational control already established for Markdown files elsewhere in this tool.

---

### Edge Cases

- What happens when a filename doesn't match the exact, case-sensitive `review-` prefix
  (e.g. `Review-Something.md` or `REVIEW-x.md`)? It is not treated as a review file —
  matching is case-sensitive, consistent with this tool's other exact filename-pattern
  conventions (e.g. `prd.md`, `.memlog.md`).
- What happens when a memory log bullet's leading text doesn't match the single
  parenthetical-word shape (e.g. no parentheses at all, or multiple words inside them)? It
  renders as a plain candy-striped row with no separated header — the same
  tolerate-and-degrade-gracefully approach this tool already applies to unexpected content
  shapes elsewhere.
- What happens when `addendum.md` or `.memlog.md` exists but is empty or fails to parse as
  expected? The tile remains enabled (its gate is the file's existence, not whether its
  content is well-formed); the dialog itself falls back to whatever this tool's existing
  tolerant rendering already does for that shape of content.
- What happens when a requirement code mentioned in the memory log matches more than one
  location in the currently-open PRD (e.g. a duplicated code, or a code that appears in
  both the bullet and header styles there)? The link jumps to that code's first occurrence
  in the PRD's own document order — the same "first appearance" convention this tool
  already applies to ordering the requirement-code index's own prefix tiles (feature 012).
- What happens when a single memory log bullet mentions more than one requirement code
  (e.g. both `FR-76` and `FR-56` in the same entry, as in the feature description's own
  example)? Every matching code becomes its own independent clickable link — not only the
  first one found in that bullet (Clarifications).
- What happens if a review file is removed from disk between when the tooltip listed it
  and when the user selects it? Out of scope — this tool reads a snapshot at selection
  time and has no live file-watching anywhere else either.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The reviews tile MUST detect every file directly inside the currently-viewed
  PRD folder whose name starts with `review-` and ends with `.md`.
- **FR-002**: When one or more such files exist, the reviews tile MUST NOT appear visually
  disabled, and hovering (or otherwise activating) it MUST reveal a tooltip listing each
  matching file. That tooltip's width MUST match the reviews tile's own rendered width
  (Clarifications), rather than shrinking to fit its narrowest listed name.
- **FR-003**: Each listed file's display name MUST be derived by removing the `review-`
  prefix, replacing every dash with a space, and rendering the result in Title Case —
  every word capitalized (e.g. "review-edge-cases.md" → "Edge Cases") (Clarifications).
- **FR-004**: The tooltip's list MUST be sorted alphabetically by each file's derived
  display name.
- **FR-005**: Selecting a listed review MUST open a file-viewer dialog showing that file's
  full content, using the same established file-viewing behavior already used elsewhere in
  this tool.
- **FR-006**: When no `review-*.md` files exist in the folder, the reviews tile MUST
  appear visually disabled and produce no tooltip or dialog on hover or click.
- **FR-007**: The addendum tile MUST detect whether a file named exactly `addendum.md`
  exists directly inside the currently-viewed PRD folder.
- **FR-008**: When `addendum.md` exists, clicking the addendum tile MUST open a
  file-viewer dialog showing its full content; when it does not exist, the tile MUST
  appear visually disabled and produce no dialog on click.
- **FR-009**: The memory log tile MUST detect whether a file named exactly `.memlog.md`
  exists directly inside the currently-viewed PRD folder.
- **FR-010**: When `.memlog.md` exists, clicking the memory log tile MUST open a dialog
  rendering its content in the bespoke format described below; when it does not exist, the
  tile MUST appear visually disabled and produce no dialog on click.
- **FR-011**: That dialog MUST exclude `.memlog.md`'s YAML frontmatter preamble from the
  rendered view and surface it via the same informational control already established for
  Markdown files elsewhere in this tool.
- **FR-012**: The dialog MUST render the remaining content as a sequence of candy-striped
  rows, one per top-level bullet point in the source file.
- **FR-013**: When a bullet's text begins with a single parenthetical word (e.g.
  "(decision)"), that word MUST be broken out into its own header, shown capitalized and
  in a color visually distinct from the row's body text.
- **FR-014**: Bullet body text MUST render as plain text, with only the
  requirement-code-to-link substitution (FR-015) applied — no other Markdown formatting
  (bold, italic, code spans, etc.) is parsed; any such literal syntax in the source text
  renders unparsed, as-is (Clarifications).
- **FR-015**: Within a bullet's body text, every substring matching a requirement code
  that is also present in the currently-open PRD's own detected requirement-code index
  MUST be rendered as a clickable link — independently, when a single bullet mentions more
  than one such code, not just the first one found in it (Clarifications).
- **FR-016**: Selecting that link MUST close the memory log dialog and move the PRD view
  to that code's location — its first occurrence in document order when the code matches
  more than one location there — using the same jump behavior already established for the
  requirement-code index column (feature 012).
- **FR-017**: A requirement-code-shaped substring in the memory log that does not match
  any code detected in the currently-open PRD MUST render as plain text, not a link.
- **FR-018**: None of this feature's changes MUST alter any other existing Navigator or
  PRD-viewer behavior.

### Key Entities

- **Review File Reference**: One detected `review-*.md` file within the currently-viewed
  PRD folder — its raw filename and its derived friendly display name. Not persisted;
  derived fresh each time the PRD is viewed.
- **Memory Log Entry**: One top-level bullet point from `.memlog.md` — its category label
  (if its leading text matched the single-parenthetical-word shape), its body text, and
  any requirement-code links detected within that body text. Not persisted; derived fresh
  each time the memory log dialog is opened.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can locate and open any review document for the PRD they're viewing
  without leaving the PRD view or navigating the Output/Infra tabs by hand.
- **SC-002**: A user can open the addendum document, when one exists, in a single click
  from the PRD view.
- **SC-003**: A user reading the memory log can jump directly to a mentioned requirement's
  location in the PRD in a single click, without manually scrolling or searching for it.
- **SC-004**: A user can tell, without hovering or clicking, whether a given tile (reviews,
  addendum, memory log) has any content behind it at all.
- **SC-005**: Every existing PRD-viewer and Navigator behavior continues to work exactly
  as it did before this feature.

## Assumptions

- "Within the context of the PRD sub-folder being viewed" scopes every file lookup in this
  feature (`review-*.md`, `addendum.md`, `.memlog.md`) to that one folder only — no
  parent or sibling folder is ever searched, and only files directly inside it are
  considered (not nested subfolders).
- Filename matching (the `review-` prefix, `addendum.md`, `.memlog.md`) is case-sensitive,
  consistent with this tool's other exact filename-pattern conventions.
- Opening a review or the addendum reuses this tool's existing file-viewer dialog exactly
  as already used elsewhere in this app (Output/Infra tabs and every other "open this
  file" affordance) — no new viewer component is introduced for these two tiles.
- The memory log's bespoke renderer applies only to `.memlog.md`; it does not change how
  any other Markdown file (including reviews and the addendum) is rendered.
- The memory log dialog is a normal, closeable dialog like any other file-viewer dialog in
  this tool (unlike the main non-modal PRD pane) — selecting a requirement-code link is
  simply one additional way to close it, alongside its regular close control.
- Requirement-code detection within the memory log's body text reuses the exact same
  code-shape pattern already established for the PRD's own requirement-code index
  (feature 012) — no new code format is introduced.
- A file's mere existence (not whether its content is well-formed) is what determines
  whether its tile is enabled.
