# Quickstart: Architecture Tree

Manual validation guide for this feature's UI/rendering behavior - the carve-out under
constitution Principle V. The reused `groupPrdFolders` logic already has its own unit
tests (unchanged); the route's own new wiring has its own integration test
(`npm test`) - neither is re-covered here.

## Prerequisites

1. A fixture project with `_bmad-output/planning-artifacts/architecture/` containing:
   - Two or more subfolders for the same project, following the
     `<project>-YYYY-MM-DD` pattern (e.g. `architecture-bmad-2026-08-28`,
     `architecture-bmad-2026-09-01`).
   - At least one subfolder that does *not* match that pattern.
2. The same project should already have PRD folders and a `sprint-status.yaml` (reusing
   the existing fixture from features 012–014 is sufficient).
3. Build and run the CLI against it: `npx tsx src/cli.ts <fixture-project-path>`, then open
   the printed localhost URL.

## Scenario 1 - Architecture grouping renders correctly

1. Load the tool; open the Navigator tab.
2. **Expect**: an "Architecture" root appears in the tree, positioned after "PRD" and
   before "Sprint Status".
3. Expand it. **Expect**: one project node per unique project prefix, each containing its
   dated folders sorted newest-first - the same structure "PRD" already shows.
4. **Expect**: the non-conforming architecture folder also appears (in its own
   non-conforming section), not silently hidden.
5. Select the "Architecture" root itself, then a project node beneath it. **Expect**:
   neither changes what's shown in the right-hand pane (FR-004).

## Scenario 2 - Selecting a leaf shows its folder name

1. Select one of the dated architecture folders.
2. **Expect**: the right-hand pane shows that folder's own name as plain text, and nothing
   else.
3. Select a PRD leaf, then Sprint Status, then back to the same architecture leaf.
   **Expect**: each transition renders correctly, confirming this feature didn't disturb
   any existing dispatch behavior.

## Scenario 3 - No architecture folders

1. Open a project (or temporarily rename the fixture's architecture folder) with no
   `planning-artifacts/architecture` subfolders at all.
2. **Expect**: no "Architecture" root appears in the tree - "PRD" and "Sprint Status" (when
   present) render exactly as before, unaffected.

## Scenario 3b - Architecture folders present, but no PRD folders and no Sprint Status

1. Open (or temporarily arrange) a project whose architecture folder has subfolders, but
   whose `planning-artifacts/prds` folder is empty/absent and whose
   `implementation-artifacts/sprint-status.yaml` doesn't exist.
2. **Expect**: the Navigator tree still shows the "Architecture" grouping - it must *not*
   fall into the tree's own "Nothing to show yet" empty state, which previously only
   checked for PRD folders and Sprint Status, not architecture folders.

## Scenario 4 - Refresh preserves an architecture selection (feature 014 integration)

1. Select an architecture leaf folder.
2. Outside the browser, add a new, unrelated file inside that same folder (or anywhere
   else in the project - the point is only to have a reason to refresh).
3. Click the refresh control (feature 014).
4. **Expect**: the same architecture leaf remains selected in the tree afterward - this is
   the concrete fix for the gap research.md § 3 identifies in feature 014's own refresh
   handler, which previously only re-validated a selected *PRD* leaf.
5. Now delete that same architecture folder from disk entirely, and click refresh again.
   **Expect**: the Navigator falls back to its default "Select an item on the left" state,
   the same fallback a deleted PRD leaf already triggers.

## Regression pass (FR-006)

Confirm every other established Navigator behavior is unaffected: PRD grouping and its own
leaf's full detail view (features 012/013) still render correctly; Sprint Status still
renders; the refresh control's own placement, rotation, and disabled-while-refreshing
behavior (feature 014) are unchanged; Infra/Output tabs are untouched.
