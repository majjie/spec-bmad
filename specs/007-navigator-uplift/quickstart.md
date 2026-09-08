# Quickstart: Validating the Navigator Tab Uplift

Manual end-to-end validation once implemented. Automated coverage for
`calculateActiveEpic` lives in `tests/unit/navigator/sprint-status.test.ts`; the icons,
tile layout, and default-tab behavior are validated manually here, per constitution
Principle V's UI-rendering carve-out.

## Prerequisites

- Built and running per prior features' quickstarts: `npm install`, `npm run build:web`.
- Reuse feature 006's own fixture-generation script (`specs/006-output-navigator/
  quickstart.md`) for the PRD folders and a base `sprint-status.yaml`, then adjust
  `development_status` per scenario below.

## Scenario 1 — Navigator opens by default (FR-001/FR-002)

Start the CLI against a project with `_bmad-output` present. **Expected**: the Navigator
tab is already active and its tree visible, with no click needed.

Start the CLI again against a project **without** `_bmad-output`. **Expected**: the Infra
tab is active instead (the Navigator tab isn't shown at all, per feature 006).

## Scenario 2 — Status icons (FR-003/FR-004/FR-005)

Using a `development_status` block covering an epic of each status
(`done`/`review`/`backlog`/`in-progress` — note epics can't naturally be `review`, so
use stories for that one) and at least one story with an unrelated status (e.g.
`ready-for-dev`):

```yaml
development_status:
  epic-1: done
  1-1-a: done
  epic-2: in-progress
  2-1-a: review
  2-2-b: ready-for-dev
  epic-3: backlog
```

**Expected**: epic-1 and its story show the "done" icon; epic-2 shows the "in-progress"
icon, its `2-1-a` story shows the "review" icon, and `2-2-b` shows only its text label
(no icon, no error); epic-3 shows the "backlog" icon.

## Scenario 3 — Epic tiles as a full-width stack (FR-006/FR-007/FR-008)

Open the Sprint Status view from Scenario 2 (three epics). **Expected**: each epic tile
spans the full width of the detail pane; epic-1, epic-2, epic-3 appear stacked
top-to-bottom in that order; the Summary tile's own appearance and position look
unchanged from feature 006.

## Scenario 4 — Active Epic (FR-009/FR-010)

Using the fixture from Scenario 2 (one epic in-progress): confirm the Summary tile shows
an "Active Epic" field with value `epic-2`.

Change `development_status` to make every epic `done`: confirm "Active Epic" shows
`All complete`.

Change every epic to `backlog`: confirm "Active Epic" shows `Not started`.

Set one epic `done` and another `backlog`, with none `in-progress`: confirm "Active
Epic" shows `unknown`.

Remove `development_status` entirely (or leave it empty): confirm "Active Epic" shows
`unknown` and the rest of the Summary tile still renders normally.
