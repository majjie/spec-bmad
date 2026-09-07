# Feature Specification: CSV Spreadsheet View

**Feature Branch**: `005-csv-spreadsheet-view`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "We need to support a more sophisticated rendering for CSV
files. I want them to look like a read-only Excel spreadsheet in dark mode."

## Clarifications

### Session 2026-09-07

- Q: Should the CSV's own first row be treated as a header (shown distinguished from the data below it, and frozen in place like the column letters), or should every row — including the first — be treated identically as plain numbered data rows? → A: Treat the first row as a header: shown with distinguished styling, frozen alongside the column letters; row numbers 1, 2, 3... label the data rows that follow it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View a CSV file as a spreadsheet grid (Priority: P1)

A user double-clicks a `.csv` file. Instead of the plain-text view every other file type
gets, it opens showing its data arranged in a grid: lettered column headers (A, B, C, ...)
across the top, the CSV's own first row shown as a distinguished, frozen header beneath
them, numbered row headers (1, 2, 3, ...) labeling the data rows that follow, and each
field from the file in its own cell — matching the familiar look of a read-only
spreadsheet, in the application's existing dark theme.

**Why this priority**: This is the entire feature — seeing CSV data arranged like a
spreadsheet instead of as raw comma-separated text. Every other story is a refinement of
this grid's behavior.

**Independent Test**: Double-click a `.csv` file containing a header row plus a few data
rows and columns, including at least one data field with a comma inside quotes (e.g.
`"Smith, John"`); confirm the grid shows lettered columns, the header row visually
distinguished from the data, numbered data rows starting at 1, that the quoted field
appears intact in a single cell (not split at its internal comma), and that the whole view
uses the dark theme.

**Acceptance Scenarios**:

1. **Given** a `.csv` file with a header row plus multiple data rows and columns, **When**
   the user double-clicks it, **Then** the dialog shows a grid with column headers labeled
   A, B, C, ... across the top, the CSV's first row shown immediately below them with
   distinguished styling (e.g. bold), and the data rows below that labeled 1, 2, 3... down
   the left, with one CSV field per cell.
2. **Given** a CSV data field is wrapped in quotes and contains a comma (e.g.
   `"Smith, John"`), **When** the grid renders that row, **Then** the entire quoted value
   appears in a single cell, not split into two cells at the internal comma.
3. **Given** a CSV data field is wrapped in quotes and contains a line break, **When** the
   grid renders that row, **Then** the entire quoted value appears in a single cell within
   a single grid row, not split across two grid rows.
4. **Given** the CSV grid is open, **When** it renders, **Then** it uses the same dark
   theme as the rest of the application — no light/white background.
5. **Given** the CSV grid is open, **When** the user looks for a way to edit a cell or add/
   remove rows or columns, **Then** no such control exists — the grid is strictly
   view-only.

---

### User Story 2 - Column and row headers stay visible while scrolling (Priority: P2)

While viewing a CSV larger than fits on screen, a user scrolls down or across. The lettered
column headers, the CSV's own header row, and the numbered row headers all stay put (like
a spreadsheet's frozen header rows/column), so the user never loses track of which column
or row they're looking at, or what each column means.

**Why this priority**: A real usability improvement for anything but a tiny CSV, but the
grid from User Story 1 is already fully readable without it — a user can still scroll back
up to check a header.

**Independent Test**: Open a CSV with enough rows and columns to require both vertical and
horizontal scrolling; scroll in each direction and confirm the column-letter row, the
CSV's own header row, and the row-number column all remain visible throughout.

**Acceptance Scenarios**:

1. **Given** a CSV with more data rows than fit vertically, **When** the user scrolls down,
   **Then** both the column-letter row and the CSV's own header row remain visible at the
   top.
2. **Given** a CSV with more columns than fit horizontally, **When** the user scrolls
   right, **Then** the row-number column remains visible on the left.

---

### Edge Cases

- What happens when a CSV data row has fewer fields than the widest row in the file? Its
  missing cells are shown empty; the grid is not broken or misaligned (FR-010).
- What happens when the CSV file has no lines at all (completely empty file)? The dialog
  shows an empty-state message rather than a broken or blank grid (FR-011).
- What happens when a CSV has only a header row and no data rows below it? The header row
  still renders as usual; the data area shows an empty-state message instead of zero
  numbered rows (FR-012).
- What happens when a `.csv` file's content can't actually be read as text (e.g. it's
  secretly a binary file)? The existing unreadable/binary-file handling from the File
  Content Viewer feature applies before this feature's rendering is ever reached — see
  Assumptions.
- What happens with a CSV that has an unusually large number of columns? The grid scrolls
  horizontally like any other overflowing content; no special handling beyond User Story
  2's frozen headers is required.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a file with a `.csv` extension is opened in the file viewer, it MUST be
  rendered as a spreadsheet-style grid instead of plain text.
- **FR-002**: The grid MUST show spreadsheet-style column headers (A, B, C, ... Z, AA,
  AB, ...) across the top.
- **FR-003**: The CSV's own first row (its header line) MUST render as its own row
  immediately below the column-letter headers, with styling that visually distinguishes
  it from data rows (e.g. bold).
- **FR-004**: The grid MUST show sequential row numbers (1, 2, 3, ...) down the left side,
  one per CSV data row (the rows after the header line) — the header line itself is not
  assigned a data row number.
- **FR-005**: Each field from the CSV — both the header row's and every data row's — MUST
  appear in its own grid cell, at the intersection of its row and column letter.
- **FR-006**: The system MUST correctly parse standard CSV quoting/escaping rules —
  quoted fields containing commas, escaped quote characters, and quoted fields spanning
  multiple lines — so a quoted field's contents are never split across multiple cells or
  multiple grid rows.
- **FR-007**: The grid MUST be rendered in a dark theme consistent with the rest of the
  application (File Content Viewer feature, FR-017).
- **FR-008**: The grid MUST be strictly read-only — no cell may be edited, and no control
  may add, remove, or reorder rows or columns, consistent with the project's read-only
  principle.
- **FR-009**: The column-letter header row, the CSV's own header row, and the row-number
  column MUST all remain visible while the user scrolls through a CSV that doesn't fully
  fit on screen, and MUST visually occlude (not merely coexist with) any data row
  scrolling behind them — found necessary during user review, after an implementation gap
  (a padding inset between the scroll container's own clip boundary and the point where
  the frozen header actually became stuck) let scrolled-past rows stay briefly visible
  above the header instead of being fully hidden by it.
- **FR-010**: When a CSV data row has fewer fields than the widest row in the file, its
  missing cells MUST be shown empty rather than causing an error or a misaligned grid.
- **FR-011**: A CSV file with no lines at all MUST show an empty-state message rather than
  a broken or blank grid.
- **FR-012**: A CSV file with a header row but no data rows below it MUST still render its
  header row, with an empty-state message shown in the data area instead of zero numbered
  rows.
- **FR-013**: This rendering change applies only to files with a `.csv` extension; every
  other file type's existing rendering (plain text, Markdown, syntax-highlighted) is
  unaffected.
- **FR-014**: Grid cells MUST have a visible border separating adjacent columns (a vertical
  gridline), consistent with a real spreadsheet's appearance — found necessary during user
  review; the original design left cell borders unspecified and the grid rendered
  borderless.
- **FR-015**: Hovering over a data row MUST highlight it using a distinct accent color,
  rather than a grayscale lightening or darkening of its existing shade, so the hover state
  stays visually distinguishable from the grid's alternating row-striping regardless of
  whether the hovered row is a striped or non-striped row — found necessary during user
  review, after a grayscale hover treatment was shown to make a hovered row converge toward
  the same shade regardless of its striping.
- **FR-016**: The file viewer dialog's close ("X") icon (File Content Viewer feature,
  FR-012) MUST remain visually on top of a CSV grid's frozen header cells, regardless of
  any stacking layers the grid's own sticky positioning introduces — found necessary
  during user review, after the CSV grid's frozen cells were found to render above the
  close icon.

### Key Entities

- **Spreadsheet Grid**: The rendered view of one CSV file's contents; composed of Column
  Headers (spreadsheet-style letters), the CSV's own Header Row (its first line,
  distinguished from data), Row Headers (sequential numbers labeling data rows), and Cells
  (one per CSV field, addressed by its row and column).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user opening any CSV file sees its data arranged in a labeled grid
  (lettered columns, a distinguished header row, numbered data rows) rather than as raw
  comma-separated text.
- **SC-002**: A field containing a comma or line break inside quotes is always shown as a
  single, unsplit cell — never separated into extra cells or rows.
- **SC-003**: A user can scroll through a CSV larger than the visible area while always
  being able to see which column and row they're looking at.
- **SC-004**: The spreadsheet view is visually consistent with the application's dark
  theme — no light/white background at any point.
- **SC-005**: A user can tell at a glance which row their pointer is over, and which column
  a value belongs to, without it being confused with the grid's other visual cues (row
  striping, adjacent columns).

## Assumptions

- No cell-selection, copying, or other spreadsheet-app interactivity is included beyond
  scrolling and a passive row-hover highlight (FR-015) — this is a purely visual, read-only
  grid, not an interactive spreadsheet (no formulas, no persisted selection state). A future
  feature could add that.
- No virtualization or pagination is required — full CSVs are rendered in full, consistent
  with the precedent already set for the folder contents table (Web Artifact Explorer
  feature's clarification). Performance handling for extremely large CSVs, if ever needed,
  is future work.
- Column widths are sized reasonably to fit typical content, with unusually long values
  truncated rather than wrapped, keeping row heights uniform like a real spreadsheet.
- A `.csv` file whose content can't be read as text at all (e.g., it's actually binary) is
  handled entirely by the File Content Viewer feature's existing unreadable-file error
  path, which runs before any rendering-mode decision is made — this feature only changes
  how successfully-read CSV text is displayed.
- This feature only changes the rendering mode used for `.csv` files; the plain-text
  fallback used for `.txt` and any other unrecognized file type is unchanged.
- The CSV's first line is always treated as its header, unconditionally — there is no
  attempt to detect whether a given file actually has a semantic header row versus data
  starting on line one; this keeps the rule simple and predictable rather than relying on
  guesswork.
