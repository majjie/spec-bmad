# Quickstart: Validating the Web Artifact Explorer

Manual end-to-end validation for this feature, once implemented. Automated coverage for
the server/API layer lives in `tests/unit/server/` and `tests/integration/web-server.test.ts`
(see `plan.md` § Project Structure); the frontend itself is validated manually here, per
constitution Principle V's UI-rendering carve-out.

## Prerequisites

- Node.js ≥20 LTS installed; this repo's dependencies installed (`npm install`).
- The frontend built: `npm run build:web` (produces `web/dist/`).
- `src/cli.ts` executable (`chmod +x src/cli.ts`), as established in feature 001.
- A sample project directory with enough content to exercise the tree/table/sort:

  ```bash
  mkdir -p /tmp/bmad-explorer/project/_bmad/specs/checklists
  mkdir -p /tmp/bmad-explorer/project/_bmad-output/reports
  touch /tmp/bmad-explorer/project/_bmad/specs/spec.md
  touch /tmp/bmad-explorer/project/_bmad/specs/plan.md
  touch /tmp/bmad-explorer/project/_bmad/specs/checklists/requirements.md
  touch /tmp/bmad-explorer/project/_bmad-output/reports/summary.md
  ```

- Start the server: `/home/jamie/code/scratch/spec-bmad/src/cli.ts /tmp/bmad-explorer/project`
  - it should print a `http://127.0.0.1:<port>` URL and keep running (Ctrl+C to stop).
  Open that URL in a full-size desktop browser window.

## Scenario 1 - Infra tab loads by default (User Story 1)

**Expected**: the "Infra" tab is already selected; the left tree shows `_bmad`'s top-level
folders (`specs`); the right table already shows `_bmad`'s direct contents (just the
`specs` folder row) without clicking anything - per FR-002.

## Scenario 2 - Expand, collapse, and navigate the tree (User Story 1)

Click the `specs` folder in the tree.

**Expected**: it expands to show `checklists`; the right table now shows `specs`'s direct
children (`plan.md`, `checklists`, `spec.md`). Click `specs` again: it collapses (children
hidden), but the table's contents are unaffected by collapsing (per FR-004/FR-005 - expand
state and selection are independent).

## Scenario 3 - Navigate via a table row (User Story 1)

With `specs`'s contents showing, click the `checklists` folder row in the table.

**Expected**: the tree's selection moves to `checklists`, and the table now shows
`checklists`'s contents (`requirements.md`) - per FR-007. Click `requirements.md` (a file
row): nothing happens - per FR-008.

## Scenario 4 - Output tab is independent (User Story 2)

Switch to the "Output" tab.

**Expected**: tree/table switch to `_bmad-output`'s `reports` folder. Navigate into
`reports`, then switch back to "Infra".

**Expected**: Infra's tree/selection is exactly as left in Scenario 3 (`checklists`
selected, `specs` still expanded) - per FR-011/SC-003.

## Scenario 5 - Missing folder shows an empty state (User Story 2)

Stop the server, remove the sample's `_bmad-output` folder entirely
(`rm -rf /tmp/bmad-explorer/project/_bmad-output`), and restart the CLI against the same
project.

**Expected**: the "Output" tab still appears, but shows an empty-state message instead of a
tree or an error - per FR-012.

## Scenario 6 - Sorting groups folders before files (User Story 3)

Restore `_bmad-output` and restart. On the Infra tab, select `_bmad`'s root so the table
shows both a folder (`specs`) and, after adding one, a file at the same level:

```bash
touch /tmp/bmad-explorer/project/_bmad/top-level.md
```

Refresh the page, select `_bmad`'s root again.

**Expected**: `specs` (folder) appears before `top-level.md` (file) regardless of which
column is the current sort. Click "Name": both groups sort alphabetically within
themselves, folders still first. Click "Name" again: order reverses within each group,
folders still first - per FR-009/FR-010 and the Clarifications session.

## Scenario 7 - Empty folder shows an empty state (Edge Cases)

```bash
mkdir -p /tmp/bmad-explorer/project/_bmad/empty-folder
```

Refresh, expand `_bmad`, click `empty-folder`.

**Expected**: the table shows an empty-state message, not a blank/missing table - per
FR-013.

## Scenario 8 - Visual style (FR-014/FR-015)

**Expected**: the whole UI renders in a dark, Material-styled theme; text and row
boundaries stay legible with all the entries from the scenarios above visible at once
(per SC-005); resizing the browser window narrower than a typical desktop width is not
expected to produce a mobile-optimized layout (per FR-014 - this is a non-goal, not a bug).
