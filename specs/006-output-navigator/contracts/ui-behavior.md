# Contract: UI Behavior (frontend) - Navigator tab

## Tab bar

- A "Navigator" tab appears first, before "Infra" and "Output" (FR-001), only when
  `TabAvailability.navigator` is `true` (FR-002) - same conditional-tab-visibility pattern
  the existing tabs already use, just extended to a third tab.

## Left pane - `NavigatorTree.tsx`

- Renders `NavigatorTree`'s data as a multi-root `SimpleTreeView` (the same
  `@mui/x-tree-view` primitives `FolderTree.tsx` already uses):
  - A "PRD" root item (only rendered when `prd !== null`, FR-008), itemId `"prd"`.
    - One item per `PrdProjectGroup`, itemId `` `prd:${project}` `` - expand/collapse only
      (FR-010): its `onSelectedItemsChange` handler ignores this id.
    - One item per that project's `PrdDateEntry`, itemId = its `path` (already a globally
      unique string) - label is `date`; selectable (FR-009).
    - One item per `PrdNonConformingEntry`, itemId = its `path` - label is `folderName`;
      selectable (FR-009).
  - A "Sprint Status" root item (only rendered when `sprintStatusAvailable`, FR-011),
    itemId `"sprint-status"` - selectable, no children.
- Both root items start expanded by default (spec.md's Assumptions).

## Right pane - `NavigatorDetailPane.tsx`

Dispatches purely on which itemId is currently selected:

- Nothing selected yet: an empty/prompt state (no FR governs its exact wording - pick
  something consistent with `ContentsTable`'s existing "This folder is empty." tone).
- A PRD date or non-conforming itemId selected: plain text showing that entry's
  `folderName` (FR-009) - the tree already has this value locally; no network request.
- `"sprint-status"` selected: fetch `GET /api/navigator/sprint-status` (once per selection,
  cached in `NavigatorView`'s own state so re-selecting doesn't re-fetch) and render
  `<SprintStatusView>`; on a 422, render the `error` message in place of the tiles (FR-014).

## `SprintStatusView.tsx`

- One Summary tile: the six `SprintStatusSummary` fields, each labeled with its own name
  (FR-012).
- One Status tile per `EpicStatusGroup`, in array order (already file-declared order):
  epic key + its status, its `stories` list each with its own status, and its
  `retrospectiveStatus` (shown as e.g. "not started" when `null` - no FR mandates exact
  wording, just that a retrospective's status is shown, so a placeholder for the absent
  case is reasonable).
- Zero epics (`epics: []`): the Summary tile still renders; an empty-state message stands
  in for the Status tiles, not an error (matches spec.md's own added edge case).

## History integration

- Reuses the existing `NavigationState`/`statesEqual`/`pushState`/`popstate` mechanism
  unchanged (spec.md's own Assumption) - the Navigator tab's `navigate`-equivalent pushes
  `{ tab: "navigator", path: <itemId> }`, treating the opaque itemId string exactly the way
  the existing tabs treat a folder path: just a selection identifier round-tripped through
  history, not interpreted by the history mechanism itself.
- `openFile`/`FileViewerDialog` integration is unaffected - nothing in this feature opens
  that dialog.

## Scope boundary

No control anywhere in this tab edits, adds, removes, or reorders anything (constitution
Principle II) - every interaction is tree expand/collapse or selection.
