# Quickstart: Refresh Control

Manual validation guide for this feature's UI/rendering behavior — the carve-out under
constitution Principle V. The new server-side route handler has its own unit test
(`npm test`), not covered by this guide.

## Prerequisites

1. A fixture project with all three tabs available (`_bmad`, `_bmad-output` with at least
   one PRD leaf folder and a `sprint-status.yaml`).
2. Build and run the CLI against it: `npx tsx src/cli.ts <fixture-project-path>`, then open
   the printed localhost URL.

## Scenario 1 — Placement and appearance

1. Load the tool. **Expect**: a refresh control (circular-arrows icon) appears in the
   top-right corner, on the same row as the Navigator/Infra/Output tabs, vertically
   centered against them so it reads as part of that row rather than a separate element.

## Scenario 2 — Picking up an added file (Infra/Output tabs)

1. Select the Output tab; select a folder several levels deep.
2. Outside the browser, add a new file directly inside that same folder on disk.
3. Click the refresh control, noting the time. **Expect**: the control's icon rotates
   briefly, then stops; the contents table now shows the newly added file within a couple
   of seconds, without navigating away or restarting the tool (SC-003).
4. Repeat for the Infra tab.

## Scenario 3 — Falling back when the selected folder disappears

1. Select a folder in the Output tab.
2. Outside the browser, delete that folder from disk.
3. Click refresh. **Expect**: the view falls back to the tab's own root folder rather than
   erroring or showing a blank pane.

## Scenario 4 — Navigator: PRD detail view survives a refresh

1. Select a PRD leaf node in the Navigator tab; confirm its `prd.md` content and tile
   states render (per feature 012/013).
2. Outside the browser, add a new `review-*.md` file to that same PRD folder.
3. Click refresh. **Expect**: the reviews tile updates to include the newly added file —
   confirming `PrdDetailView`'s own fetch effect re-ran after the detail pane remounted —
   and the same PRD leaf remains selected in the tree.

## Scenario 5 — Navigator: Sprint Status survives a refresh

1. Select "Sprint Status" in the Navigator tab; confirm it renders.
2. Outside the browser, change `sprint-status.yaml` (e.g. an epic's status).
3. Click refresh. **Expect**: Sprint Status re-renders with the updated value, without
   needing to re-select it manually.

## Scenario 6 — Navigator: selection reset when the item is gone

1. Select a PRD leaf node.
2. Outside the browser, delete that PRD leaf folder entirely.
3. Click refresh. **Expect**: the Navigator falls back to its default "Select an item on
   the left" state rather than erroring or showing stale content for a folder that no
   longer exists.

## Scenario 7 — No overlapping refreshes; failure feedback

1. Click refresh, and immediately click it again before the first completes. **Expect**:
   the second click has no additional effect (the control is disabled while
   `refreshing`).
2. (If feasible to simulate, e.g. by briefly renaming the project root mid-refresh) trigger
   a failed refresh. **Expect**: the icon briefly tints red, then reverts, without altering
   any already-displayed content.
3. (Partial failure) If feasible to simulate a failure in only one part of the refresh
   (e.g. the Navigator tree re-fetch failing while Infra/Output succeed) — confirm
   whichever re-fetches already completed keep their updated state visible (no rollback);
   only the shared `refreshing`/error-tint signal reflects the failure. This is intentional
   (contracts/ui-behavior.md), not a bug, since each re-fetch applies its own result
   independently as it resolves.

## Regression pass (FR-011)

Confirm every other established behavior is unaffected: an open file-viewer dialog stays
open and unchanged through a refresh; history (back/forward) still works; the
requirement-code index column (feature 012) and the reviews/addendum/memory-log tiles
(feature 013) still behave exactly as before. Also confirm no file anywhere under the
project root is created, modified, or deleted by triggering a refresh (FR-007) — e.g. by
comparing a full directory listing (or its modification times) from before and after a
refresh and confirming it's unchanged.
