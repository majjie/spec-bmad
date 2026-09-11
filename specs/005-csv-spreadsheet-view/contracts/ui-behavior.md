# Contract: UI Behavior (frontend) - CSV Spreadsheet Grid

Extends feature 004's own `contracts/ui-behavior.md` (unchanged for every other file
type). No HTTP API changes - this feature only adds a new rendering branch inside
`FileViewerDialog.tsx` for files `getFileRenderMode` classifies as `{ kind: "csv-grid" }`.

## Rendering

- `CsvGrid.tsx` receives the file's raw text (already fetched by feature 004's existing
  `fetchFileContent`) and calls `parseCsvGrid` (data-model.md) to get `{ header, rows }`.
- If `header === null` (file has no lines at all), the dialog shows an empty-state message
  instead of a grid (FR-011).
- Otherwise, it renders:
  - A top row of column-letter headers (`columnLetter(0)`, `columnLetter(1)`, ...), sticky
    at `top: 0` (FR-009).
  - The CSV's own header row immediately below, styled distinguished (e.g. bold), sticky
    at the next `top` offset (FR-003, FR-009).
  - If `rows.length === 0` (header-only file), an empty-state message in place of numbered
    data rows (FR-012), while the header row above still renders normally.
  - Otherwise, one row per entry in `rows`, each prefixed with a sticky, left-pinned row
    number (`1`, `2`, `3`, ...) (FR-004, FR-009).
  - Every cell (header or data) is one field from its row array, or empty when that row is
    shorter than the widest row (FR-010).
- The whole grid uses the application's existing dark theme (File Content Viewer feature,
  FR-017) - no light/white background at any point (FR-007).
- No cell, row, or column has any control for editing, adding, or removing data (FR-008) -
  the grid has no such affordances to begin with.

## Scope boundary

- This rendering applies only when `getFileRenderMode` returns `{ kind: "csv-grid" }` -
  i.e. only for `.csv` files (FR-013). Every other file type's existing rendering path in
  `FileViewerDialog.tsx` (Markdown, syntax-highlighted, plain) is untouched.
