# Contract: UI Behavior (frontend) - File Viewer Dialog

Extends feature 002/003's own `contracts/ui-behavior.md` files (unchanged). This is the
reference `quickstart.md`'s manual verification checks against for this feature.

## Opening

- Double-clicking a *file* row in the contents table calls `openFileDialog(path)`: pushes
  a `NavigationState` with the same `tab`/`path` as now, plus `openFile: path`
  (FR-001/FR-002, research.md § 6), and fetches `GET /api/file/:tab?path=...`.
- Double-clicking a *folder* row does not open the dialog - it behaves exactly as a single
  click already does (FR-014), unchanged from feature 002.
- While content is loading, the dialog is already open and visible, showing a loading
  state until the fetch resolves.

## Rendering

- `getFileRenderMode(filename)` (data-model.md) decides how the fetched content is shown:
  - `{ kind: "markdown" }` → rendered via `react-markdown` + `remark-gfm`, no line numbers
    (FR-005).
  - `{ kind: "syntax", language }` → rendered via `react-syntax-highlighter` with that
    `language`, line numbers on (FR-006).
  - `{ kind: "plain" }` → rendered via `react-syntax-highlighter` with a non-highlighting
    language, line numbers on (FR-007/FR-008/FR-009).
- If the `GET /api/file/:tab` response was not 200 (data-model.md's `FileContentResponse`
  outcomes), the dialog shows an error message instead of any of the above (FR-015).

## Sizing and closing

- The dialog's paper fills the viewport minus a 20px margin on every side (FR-002,
  research.md § 5).
- An "X" `IconButton` in the dialog's top-right corner, pressing Escape, or activating the
  browser's Back action all close the dialog (FR-010/FR-011/FR-012).
- Closing by *any* of those three methods calls (or results from) `window.history.back()`
  - the "X" icon and Escape handlers call it directly; Back triggers it natively. This
  keeps the history stack always in sync with what's visible (Clarifications session):
  pressing Forward after an X/Escape close finds nothing to reopen (User Story 2,
  Acceptance Scenario 4), while pressing Forward after a Back close correctly reopens the
  same file (User Story 2, Acceptance Scenario 3).
- Closing, by any method, leaves the underlying folder/tab view exactly as it was before
  the file was opened (FR-013) - nothing about the dialog's open/close cycle touches
  `tab`/`path`, only `openFile`.
