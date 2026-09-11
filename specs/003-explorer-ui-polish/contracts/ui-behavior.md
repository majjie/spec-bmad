# Contract: UI Behavior (frontend)

Translates spec.md's Acceptance Scenarios into concrete widget/browser behavior. This is
the reference `quickstart.md`'s manual verification checks against, per constitution
Principle V's UI-rendering carve-out. No HTTP API changes are introduced by this feature -
see feature 002's `contracts/http-api.md` for the (unchanged) endpoints this UI still
calls.

## Browser history

- On initial load, once the Infra tab's root is selected and its contents shown, the app
  calls `history.replaceState` with the baseline `NavigationState` (`{tab: "infra", path:
  <infra root>}`) - FR-012.
- Selecting a different folder (tree click or table row click) or switching tabs calls
  `history.pushState` with the new `NavigationState` - FR-001/FR-002.
- Expanding/collapsing a tree node, when it doesn't also change the selected folder, does
  **not** call `history.pushState` or `replaceState` - FR-005.
- A `popstate` event applies its `event.state` (a `NavigationState`) to the active tab and
  that tab's selection, re-fetching contents for the restored path - WITHOUT pushing a new
  history entry (research.md § 4) - FR-003/FR-004.
- Reaching the app's baseline entry and pressing Back again is standard browser behavior
  (leaves the app) - there is no lower entry this app controls.
- A page reload does not read any prior `history.state` - it always starts at the default
  view (Infra, root) and re-establishes the baseline entry as in initial load - per the
  Clarifications session.

## Folder tree (left pane)

- Every rendered node shows a folder icon next to its name (FR-009).
- The first time a tab's tree data is loaded, the root node's `expandedItems` state
  includes the root's own path (so it renders expanded) but no other path - FR-006/FR-008.
- If the user collapses the root and then switches tabs and back, the root's
  expanded/collapsed state is whatever the user last left it as - the automatic expansion
  in the previous bullet only applies to that first population, never re-applied on
  subsequent tab activations (FR-007).

## Contents table (right pane)

- Every folder row shows a folder icon next to its name; file rows do not (FR-009).
- No cell in the table shows a bottom border/divider line (FR-010).
- Rows alternate between two background shades in row order, using the theme's existing
  dark-mode hover/contrast tokens rather than new hardcoded colors (FR-011).
