# Feature Specification: Markdown Render Polish

**Feature Branch**: `017-markdown-render-polish`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: "The tables in the markdown rendering have no borders for the
cells. It makes them a little hard to see. Also, the preformatted blocks have no background
highlighting. It would also be nice if the preformatted blocks had syntax highlighting where
the syntax type is given at the start of the block. e.g ```typescript"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See table structure clearly (Priority: P1)

A user viewing a rendered Markdown document containing a table can see each cell's
boundaries as a visible grid, instead of the table's rows and columns blurring together
with no visual separation.

**Why this priority**: Tables are currently rendered with no visible structure at all,
making them hard to read correctly — a basic legibility problem affecting every document
that contains one.

**Independent Test**: Open a Markdown document containing a table with at least two columns
and two rows; confirm every cell shows a visible border on all sides, forming a clear grid,
in whichever view rendered it.

**Acceptance Scenarios**:

1. **Given** a Markdown document containing a table, **When** it renders, **Then** every
   header and body cell shows a visible border, forming a complete grid the reader can
   follow by eye.
2. **Given** that same table, **When** the tool's light or dark theme is active, **Then**
   the border color fits that theme, matching the neutral divider color already used
   elsewhere in this tool.

---

### User Story 2 - See code blocks as distinct blocks (Priority: P1)

A user viewing a rendered Markdown document containing a fenced (multi-line) code block
sees that block set apart from the surrounding prose by a distinct background, instead of
it blending into ordinary paragraph text.

**Why this priority**: A code block that looks identical to surrounding prose is easy to
misread as regular text, which is a basic legibility problem just like User Story 1's.

**Independent Test**: Open a Markdown document containing a fenced code block with no
declared language; confirm it renders with a visible background distinct from the
surrounding text, while an inline, single-backtick code span elsewhere in the same document
keeps its own already-established, smaller inline background unaffected.

**Acceptance Scenarios**:

1. **Given** a Markdown document containing a fenced code block, **When** it renders,
   **Then** the block shows a background clearly distinct from the surrounding prose,
   spanning its full width.
2. **Given** that same document also contains inline, single-backtick code spans, **When**
   it renders, **Then** those spans keep their own existing, smaller inline background,
   visually distinct from a fenced block's own full-width background.

---

### User Story 3 - See syntax-highlighted code blocks (Priority: P2)

A user viewing a rendered Markdown document containing a fenced code block whose opening
fence declares a language (e.g. "```typescript") sees that code's syntax colored the same
way it already looks when opening a file of that type directly in this tool.

**Why this priority**: This builds on User Story 2's plain background with richer detail —
valuable, but a smaller step once the block is already visually set apart.

**Independent Test**: Open a Markdown document containing a fenced code block whose opening
fence declares a recognized language; confirm its contents render with syntax coloring
matching how this tool already colors that same language when a file of that type is opened
directly.

**Acceptance Scenarios**:

1. **Given** a fenced code block whose opening fence declares a recognized language,
   **When** it renders, **Then** its contents show the same syntax-coloring scheme this
   tool already uses when that file type is opened directly (e.g. keywords, strings, and
   comments each colored distinctly).
2. **Given** a fenced code block whose opening fence declares no language, **When** it
   renders, **Then** its content still shows User Story 2's background but with no syntax
   coloring applied.
3. **Given** a fenced code block whose opening fence declares a language this tool's
   syntax highlighter doesn't recognize, **When** it renders, **Then** its content still
   shows User Story 2's background but with no syntax coloring applied, rather than an
   error or missing content.

---

### Edge Cases

- What happens when a code block's content is wider than the pane? It scrolls horizontally
  within its own block, without wrapping lines in a way that would break the code's
  structure — matching how this tool already handles a whole code file that's too wide.
- What happens when a fenced code block sits inside a list item or a blockquote? It still
  receives the same background (and syntax coloring, if applicable) as any other fenced
  code block.
- What happens when a table's rows don't all have the same number of cells? Whatever cells
  this tool's existing table rendering actually produces each still show the same visible
  border; this feature doesn't change how mismatched rows are parsed, only how every
  resulting cell is bordered.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every table rendered from Markdown content anywhere in this tool MUST display
  a visible border around each header and body cell, forming a complete grid.
- **FR-002**: That border color MUST reuse this tool's existing neutral divider color
  (the same one already used for other visual separators in this tool), not a new,
  hardcoded color — so it continues to fit whichever theme (light or dark) is active.
- **FR-003**: Every fenced (multi-line, triple-backtick) code block rendered from Markdown
  content anywhere in this tool MUST display a background visibly distinct from the
  surrounding prose, spanning the block's full width.
- **FR-004**: Inline, single-backtick code spans MUST keep their own existing, smaller
  inline background exactly as already established — unaffected by FR-003.
- **FR-005**: When a fenced code block's opening fence declares a language, its contents
  MUST render with syntax highlighting for that language, using the same established
  syntax-coloring scheme this tool already uses when a file of that type is opened
  directly.
- **FR-006**: When a fenced code block's opening fence declares no language, or a language
  this tool's syntax highlighter doesn't recognize, its content MUST still receive FR-003's
  background, with no syntax coloring applied — never an error, and never missing content.
- **FR-007**: A code block's content MUST remain fully readable when wider than the pane,
  scrolling horizontally within the block itself rather than wrapping in a way that breaks
  the code's structure — matching this tool's existing behavior for a whole code file
  that's too wide.
- **FR-008**: FR-001 through FR-007 MUST apply consistently everywhere this tool renders
  Markdown content for a user to read — including PRD documents, Architecture documents,
  and any Markdown file opened through this tool's general file-viewer — not just one
  specific view.
- **FR-009**: None of these changes MUST alter this tool's read-only behavior, or any other
  Navigator, PRD, Architecture, Output, or Infra behavior unrelated to how a table or a
  fenced code block is rendered.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user viewing any table in a rendered Markdown document can identify every
  cell's boundaries at a glance, without needing to infer column or row alignment from
  spacing alone.
- **SC-002**: A user viewing a fenced code block can tell where it starts and ends without
  reading its content, in every place this tool renders Markdown.
- **SC-003**: A user viewing a fenced code block with a declared, recognized language sees
  its syntax visually differentiated the same way it already looks when that file type is
  opened directly in this tool.
- **SC-004**: Every existing Navigator, PRD, Architecture, Output, and Infra behavior
  continues to work exactly as it did before this feature.

## Assumptions

- This tool already provides syntax-highlighted rendering for viewing a whole code file
  directly (e.g. opening a `.py` or `.yaml` file from the Output/Infra tabs) — this feature
  reuses that same existing color scheme for fenced code blocks found *inside* rendered
  Markdown, rather than introducing a second, differently-colored scheme.
- "Markdown rendering" in this feature's scope covers every place this tool turns Markdown
  content into a formatted view for a user to read: PRD documents, Architecture documents,
  and any Markdown file opened through this tool's general file-viewer — not a new,
  separate renderer of its own.
- Table and fenced-code-block parsing itself (how rows/columns or a fence's language tag
  are recognized) is already handled by this tool's existing Markdown rendering and is out
  of scope — this feature only changes how the resulting cells and code blocks are
  visually styled, not how they're parsed.
- This feature is read-only, consistent with this tool's existing principle — nothing
  about a document's own content is written, edited, or reordered by viewing it.
