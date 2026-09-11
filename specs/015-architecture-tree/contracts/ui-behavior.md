# Contracts: Architecture Tree

## API contract: `GET /api/navigator/tree` (modified)

No new route - the existing response body gains one field.

| | Before | After |
|---|---|---|
| Response body | `{ prd, sprintStatusAvailable }` | `{ prd, architecture, sprintStatusAvailable }` |
| `architecture` | - | `PrdGroupingResult \| null` - `null` when `planning-artifacts/architecture` has no subfolders or doesn't exist; otherwise the same grouped shape `prd` already has (FR-001/FR-002/FR-003). |

Every other aspect of this route (404 when `_bmad-output` doesn't exist, reusing the
cached "output" tab tree rather than re-scanning) is unchanged.

## UI behavior contract

### Tree rendering (FR-001–FR-004)

`NavigatorTree.tsx` renders, in order: the existing "PRD" root (if `tree.prd` is non-null);
a new "Architecture" root (itemId `"architecture"`, if `tree.architecture` is non-null),
structured identically to "PRD"'s own JSX - one `TreeItem` per project group (itemId
`` `architecture:${project}` ``, label the project string) containing one `TreeItem` per
date entry (itemId the entry's own absolute `path`, label its `date`), followed by one
`TreeItem` per non-conforming entry (itemId its `path`, label its `folderName`); then the
existing "Sprint Status" root (if `tree.sprintStatusAvailable`).

`NavigatorView.tsx`'s `isStructuralOnly(itemId)` also treats `itemId === "architecture"` and
any `itemId` starting with `"architecture:"` as structural-only - selecting either reports
the click upward (per `NavigatorTree`'s existing uniform reporting) but must not change
`selectedItemId`/the detail pane (FR-004), exactly mirroring `"prd"`/`"prd:*"`.

On initial load, `App.tsx`'s mount effect auto-expands `"architecture"` whenever
`tree.architecture` is non-null, alongside its existing auto-expansion of `"prd"` and
`"sprint-status"` (Assumptions).

### Leaf selection (FR-005)

`NavigatorDetailPane.tsx` gains a new branch: after its existing `"sprint-status"` check
and its existing PRD-leaf check (`findFolderEntry(tree?.prd ?? null, selectedItemId)`), it
now also checks `findFolderEntry(tree?.architecture ?? null, selectedItemId)`; when that
resolves to an entry, it renders that entry's bare `folderName` as plain text - the exact
same minimal `<Typography>` placeholder the PRD leaf view used before feature 012 replaced
it, not the richer `PrdDetailView`.

### Regression guard, including the feature-014 integration (FR-006)

`App.tsx`'s refresh handler (feature 014) currently validates a Navigator selection after a
refresh via `findPrdFolderEntry(tree, current)` alone. This plan updates that check to:

```text
findFolderEntry(tree.prd, current) || findFolderEntry(tree.architecture, current)
  ? current
  : null
```

so that refreshing while an architecture leaf is selected preserves that selection (when
the folder still exists) exactly as a PRD leaf selection already does, rather than
incorrectly resetting it every time (research.md § 3).

Every other existing Navigator/Infra/Output behavior - PRD grouping, Sprint Status, the
PRD detail view and its own tiles/index column (features 012/013), the refresh control's
own placement and every other one of its established behaviors (feature 014) - must
continue to work exactly as before.
