# Phase 0 Research: CSV Spreadsheet View

No `NEEDS CLARIFICATION` markers remain — the spec's clarification session already
resolved the one architecturally significant decision (header-row treatment).

## 1. CSV parsing: `papaparse`

**Decision**: Use `papaparse` (browser-first, zero-dependency, RFC-4180-aware CSV parser)
to parse the file's raw text into rows of string arrays, configured with `header: false`
(we split header vs. data ourselves per the spec's own rule) and `skipEmptyLines: true`
(so a trailing blank line from a file's final newline doesn't appear as a phantom empty
data row).

**Rationale**: Correct handling of quoted commas, escaped quote characters, and quoted
fields spanning multiple lines (FR-006) is exactly the kind of "everyone gets subtly wrong
by hand" parsing problem this project has consistently chosen not to reinvent (e.g.
feature 001 rejected a hand-rolled path-safety walker; feature 004 chose `react-markdown`
over hand-built Markdown-to-HTML). `papaparse` is the most widely used browser CSV parser
for exactly this reason.

**Alternatives considered**:
- Hand-rolled comma-split parsing: rejected — cannot correctly handle a quoted field
  containing a comma or an embedded newline without effectively re-implementing what
  `papaparse` already does correctly.
- `csv-parse` (part of the `node-csv` family): rejected — more Node/stream-oriented; less
  idiomatic for parsing a string already in the browser than `papaparse`'s synchronous
  string-in/array-out API.

## 2. Grid layout: MUI `Table` + native CSS `position: sticky`, no data-grid library

**Decision**: Render the grid with MUI's `Table`/`TableRow`/`TableCell` primitives (same
components `ContentsTable.tsx` already uses, for visual/theme consistency), with `position:
sticky` applied via `sx`: `top: 0` for the column-letter row, `top: <row height>` for the
CSV's own header row, and `left: 0` for the row-number column — including the corner cells
(e.g. the row-number column's header cells), which need `position: sticky` on *both* axes
to stay pinned in the top-left corner while scrolling in either direction.

**Rationale**: Per spec.md's Assumptions, no virtualization or interactivity beyond
scrolling is required — native CSS sticky positioning fully satisfies FR-009's frozen-
header requirement with zero additional dependency, reusing the same MUI primitives
already styled consistently with the rest of the app.

**Alternatives considered**:
- A dedicated data-grid library (e.g. MUI X `DataGrid`, `ag-grid`, `react-window`):
  rejected — these are built around row virtualization, sorting/filtering, and often
  editable cells, none of which this spec asks for; adopting one would be meaningfully
  heavier than a sticky-positioned `<table>` for a feature explicitly scoped to "no
  interactivity beyond scrolling."

## 3. Column-letter generation: bijective base-26, no library

**Decision**: A small pure function `columnLetter(index: number): string` (0 → "A", 25 →
"Z", 26 → "AA", ...) implementing the standard spreadsheet column-naming algorithm
(bijective base-26 — note this is *not* the same as ordinary base-26, since there's no
"zero" letter).

**Rationale**: A well-known ~10-line algorithm; not worth a dependency.

**Alternatives considered**: None seriously considered — this is too small to warrant
comparing library options.

## 4. Where CSV grid rendering plugs into the existing dispatch

**Decision**: Extend `FileRenderMode` (feature 004) with a new `{ kind: "csv-grid" }`
variant. `.csv` now maps to this instead of `{ kind: "plain" }` — the one-line change
feature 004's own spec.md explicitly anticipated ("a later step will render `.csv` as a
table instead"). `FileViewerDialog.tsx` renders `CsvGrid` for this kind, alongside its
existing Markdown/syntax/plain branches.

**Rationale**: Reuses the exact extension point feature 004 was designed to support,
rather than introducing a second, parallel render-mode mechanism.

**Alternatives considered**: A separate "is this a CSV?" check bypassing
`getFileRenderMode` entirely: rejected — would duplicate rendering-mode dispatch logic
that already exists and is already tested.

## 5. Ragged rows and empty-file semantics

**Decision**: `parseCsvGrid` returns `{ header: string[] | null, rows: string[][] }`. A
row shorter than the widest row parsed is left as-is (not padded) — `CsvGrid.tsx` pads at
render time when laying out cells, so the data model stays a faithful record of what
`papaparse` actually returned. `header` is `null` only when the file has no lines at all
(FR-011); a file with a header line and zero data rows produces `header: [...], rows: []`
(FR-012), which `CsvGrid.tsx` renders as the header plus an empty-state message in the
data area.

**Rationale**: Keeps the empty-file vs. header-only distinction unambiguous and testable
at the pure-function level, independent of how the component chooses to render either
case.

**Alternatives considered**: Padding ragged rows inside `parseCsvGrid` itself: rejected —
column count depends on the *rendered* grid's widest row, which is a presentation concern;
keeping `parseCsvGrid`'s output an unpadded, faithful parse keeps the function simpler and
its tests more direct.
