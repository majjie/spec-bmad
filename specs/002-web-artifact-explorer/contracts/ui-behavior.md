# Contract: UI Behavior (frontend)

Translates spec.md's Acceptance Scenarios into concrete widget behavior. This is the
reference `quickstart.md`'s manual verification checks against, per constitution
Principle V's UI-rendering carve-out (no automated component tests required).

## Tabs root

- Two tabs, labeled exactly "Infra" and "Output" (FR-001), in that order.
- "Infra" is selected on first load (FR-002).
- Switching tabs swaps the tree + table for that tab's own state (`expandedPaths` /
  `selectedPath` from data-model.md) - never resets or mixes the other tab's state
  (FR-011).

## Folder tree (left pane)

- Built from `GET /api/tree/:tab` (folders only - files never appear here).
- A folder with children shows an expand/collapse affordance; clicking it toggles
  `expandedPaths` for that path (FR-004).
- Clicking a folder node (not just its expand affordance) sets `selectedPath` to that
  folder and triggers `GET /api/contents/:tab?path=...` for the table (FR-005).
- If `TabAvailability` for this tab is `false` (or `/api/tree/:tab` returns 404), the tree
  is replaced with an empty-state message (FR-012) - no tree, no error page.

## Contents table (right pane)

- Columns, in order: Name, Created, Updated, Size (FR-006).
- Rows are grouped folders-first, then files, each group sorted by the current
  column/direction (Clarifications session); default order (before any header click) still
  respects this grouping.
- Clicking a folder row navigates into it exactly like clicking it in the tree: updates
  `selectedPath` and the tree's selection (FR-007).
- Clicking a file row does nothing (FR-008).
- Clicking a column header sorts by that column, ascending, within each group (FR-009);
  clicking the same header again reverses direction within each group (FR-010); clicking a
  different header switches the sorted column, still grouped (User Story 3, Acceptance
  Scenario 3).
- Sort column/direction resets to each view's default when `selectedPath` or the active tab
  changes (User Story 3, Acceptance Scenario 4) - it is not preserved across a folder
  change.
- An empty folder (zero entries returned) shows an empty-state message instead of an empty
  table (FR-013).
- `size` is rendered as an em dash ("—") for folder rows (research.md § 4), and a
  human-readable byte size for file rows.
- `createdAt`/`updatedAt` are rendered as localized dates, not raw ISO strings.

## Visual style

- Dark theme (MUI `mode: 'dark'`) applied consistently across both tabs (FR-015).
- Layout assumes a full-size desktop viewport; no responsive/mobile breakpoints are
  required (FR-014).
- No control anywhere creates, renames, moves, or deletes a file or folder (FR-016) - the
  UI has no such affordances to begin with.
