# Phase 1 Data Model: CSV Spreadsheet View

Derived from `spec.md` § Key Entities. Nothing here is persisted - parsing happens
client-side, fresh, each time a `.csv` file is opened (research.md § 1).

## ParsedCsv

The concrete shape `parseCsvGrid(text: string)` (in `web/src/csvGrid.ts`) returns.

```ts
interface ParsedCsv {
  header: string[] | null;
  rows: string[][];
}
```

**Derivation rules** (research.md § 5):

| Input | `header` | `rows` |
|---|---|---|
| No lines at all (FR-011) | `null` | `[]` |
| A header line, no data lines (FR-012) | The header line's fields | `[]` |
| A header line plus *n* data lines | The header line's fields | *n* arrays, one per data line |

**Validation rules**:
- A data row's array length MAY be less than the widest row's - `parseCsvGrid` does not
  pad; padding for display is `CsvGrid.tsx`'s job at render time (FR-010).
- Quoted fields (commas, escaped quotes, embedded newlines) are always resolved to a
  single string per field, never split across array entries or across two `rows` entries
  (FR-006) - this is `papaparse`'s responsibility, exercised through `parseCsvGrid`.

## FileRenderMode (extended)

Feature 004's `FileRenderMode` gains one new variant:

```ts
type FileRenderMode =
  | { kind: "markdown" }
  | { kind: "syntax"; language: "yaml" | "toml" | "python" }
  | { kind: "csv-grid" }
  | { kind: "plain" };
```

`.csv` now maps to `{ kind: "csv-grid" }` instead of `{ kind: "plain" }` - the only change
to `getFileRenderMode`'s derivation table (research.md § 4).

## Spreadsheet Grid (rendering-time shape, not a stored entity)

The **Spreadsheet Grid** entity from spec.md, as `CsvGrid.tsx` actually lays it out from a
`ParsedCsv`:

| Concept | Derived from |
|---|---|
| Column Headers | `columnLetter(i)` for `i` in `0..widestRowLength-1`, where `widestRowLength = max(header?.length ?? 0, ...rows.map(r => r.length))` |
| Header Row | `header` (rendered distinguished/frozen), or omitted entirely if `header === null` (FR-011's empty-file case) |
| Row Headers | `1..rows.length`, one per entry in `rows` |
| Cells | `rows[i][j]`, or an empty cell when `j >= rows[i].length` (FR-010) |
