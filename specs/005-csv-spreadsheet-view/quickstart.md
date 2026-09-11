# Quickstart: Validating the CSV Spreadsheet View

Manual end-to-end validation for this feature, once implemented. Automated coverage for
`parseCsvGrid` and `columnLetter` lives in `tests/unit/web/csvGrid.test.ts`; the grid's
visual layout, sticky headers, and dark theme are validated manually here, per constitution
Principle V's UI-rendering carve-out.

This **supersedes** feature 004's own quickstart.md Scenario 8, which described `.csv`
falling back to plain text - that's exactly the "later step" this feature implements.

## Prerequisites

- Built and running per prior features' quickstarts: `npm install`, `npm run build:web`,
  `chmod +x src/cli.ts`.
- A sample project with a few different CSV shapes:

  ```bash
  mkdir -p /tmp/bmad-csv-view/project/_bmad
  cd /tmp/bmad-csv-view/project/_bmad

  # A typical CSV: header + a few data rows, one quoted field with a comma
  printf 'Name,Age,City\n"Smith, John",34,Springfield\nJane Doe,29,Anytown\n' > people.csv

  # A CSV with a quoted field containing an embedded newline
  printf 'Name,Notes\nAlice,"Line one\nLine two"\n' > multiline.csv

  # A ragged CSV: one row has fewer fields than the header
  printf 'A,B,C\n1,2,3\n4,5\n' > ragged.csv

  # Header only, no data rows
  printf 'OnlyHeader,Col2\n' > header-only.csv

  # Completely empty file
  : > empty.csv
  ```

- Start the CLI against `/tmp/bmad-csv-view/project` and open the printed URL in a
  full-size desktop browser.

## Scenario 1 - Typical CSV renders as a grid with a distinguished header (User Story 1)

Double-click `people.csv`.

**Expected**: the dialog shows a grid with column letters A, B, C across the top; the
header row (`Name`, `Age`, `City`) shown immediately below in bold (or otherwise visually
distinguished); then two numbered data rows (1, 2) with `Smith, John` appearing intact in
a single cell (not split at its internal comma) in row 1. The whole view is dark-themed.

## Scenario 2 - Quoted field with an embedded newline (User Story 1)

Double-click `multiline.csv`.

**Expected**: row 1's "Notes" cell contains both "Line one" and "Line two" together in one
cell - the grid does not create an extra row for the second line.

## Scenario 3 - Ragged row shows an empty cell (Edge Cases)

Double-click `ragged.csv`.

**Expected**: row 2 (`4,5`) shows an empty cell in column C rather than any error or a
misaligned grid.

## Scenario 4 - Header-only CSV (Edge Cases)

Double-click `header-only.csv`.

**Expected**: the header row (`OnlyHeader`, `Col2`) still renders normally; the data area
below it shows an empty-state message instead of any numbered rows.

## Scenario 5 - Completely empty CSV (Edge Cases)

Double-click `empty.csv`.

**Expected**: the dialog shows an empty-state message; no grid, no header row, no error.

## Scenario 6 - No editing affordances (User Story 1)

With any CSV open, look for any way to edit a cell or add/remove a row or column.

**Expected**: none exists anywhere in the dialog.

## Scenario 7 - Sticky headers while scrolling (User Story 2)

Create a larger CSV and open it:

```bash
{ printf 'Col1,Col2,Col3,Col4,Col5,Col6,Col7,Col8,Col9,Col10\n'; for i in $(seq 1 100); do printf "r${i}c1,r${i}c2,r${i}c3,r${i}c4,r${i}c5,r${i}c6,r${i}c7,r${i}c8,r${i}c9,r${i}c10\n"; done; } > /tmp/bmad-csv-view/project/_bmad/big.csv
```

Double-click `big.csv`, then scroll down and right within the grid.

**Expected**: scrolling down keeps both the column-letter row and the CSV's own header row
(`Col1`, `Col2`, ...) visible at the top; scrolling right keeps the row-number column
visible on the left; the top-left corner (row-number column's header cells) stays pinned
throughout.
