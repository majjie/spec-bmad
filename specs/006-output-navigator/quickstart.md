# Quickstart: Validating the Output Navigator Tab

Manual end-to-end validation once implemented. Automated coverage for `groupPrdFolders` and
`parseSprintStatus` lives in `tests/unit/navigator/`; the tree/tile rendering itself is
validated manually here, per constitution Principle V's UI-rendering carve-out.

## Prerequisites

- Built and running per prior features' quickstarts: `npm install`, `npm run build:web`.
- A sample project exercising every branch this feature handles:

  ```bash
  mkdir -p /tmp/bmad-navigator/project/_bmad-output/planning-artifacts/prds
  mkdir -p /tmp/bmad-navigator/project/_bmad-output/implementation-artifacts
  cd /tmp/bmad-navigator/project/_bmad-output

  # PRD folders: two projects, several dates each, one non-conforming folder
  mkdir -p planning-artifacts/prds/prd-foo-2028-08-28
  mkdir -p planning-artifacts/prds/prd-foo-2028-08-29
  mkdir -p planning-artifacts/prds/prd-foo-2028-08-30
  mkdir -p planning-artifacts/prds/prd-bar-2028-08-30
  mkdir -p planning-artifacts/prds/prd-bar-2028-09-01
  mkdir -p planning-artifacts/prds/prd-bar-2028-09-14
  mkdir -p planning-artifacts/prds/not-following-convention

  # A minimal but real sprint-status.yaml, covering epic-1 (done, with a non-numeric
  # story suffix), epic-2 (in-progress, with an orphaned/unmatched entry to exercise
  # FR-015), and epic-10 (to prove epic 1's stories don't leak into it)
  cat > implementation-artifacts/sprint-status.yaml <<'EOF'
  generated: 08-28-2026 20:15
  last_updated: 09-04-2026 10:02
  project: bmad-dash
  project_key: NOKEY
  tracking_system: file-system
  story_location: _bmad-output/implementation-artifacts
  development_status:
    epic-1: done
    1-1-run-the-command: done
    1-6a-walk-safely: done
    epic-1-retrospective: done
    epic-2: in-progress
    2-1-serve-every-response: review
    orphan-entry-not-numbered: done
    epic-10: backlog
    10-1-something: backlog
  EOF
  ```

- Start the CLI against `/tmp/bmad-navigator/project` and open the printed URL in a
  full-size desktop browser.

## Scenario 1 — Tab appears only when `_bmad-output` exists (FR-002)

With the fixture above, confirm a "Navigator" tab appears first, before "Infra" and
"Output". Then point the CLI at a project with no `_bmad-output` folder at all and confirm
no "Navigator" tab appears.

## Scenario 2 — PRDs grouped by project, newest date first (FR-005–FR-007)

Open the Navigator tab and expand "PRD". Confirm: a `prd-foo` node containing
`2028-08-30`, `2028-08-29`, `2028-08-28` in that order; a `prd-bar` node containing
`2028-09-14`, `2028-09-01`, `2028-08-30` in that order; and a `not-following-convention`
node as its own sibling.

## Scenario 3 — Selecting a PRD folder shows its name (FR-009, FR-010)

Select the `2028-08-30` node under `prd-foo`. **Expected**: the right-hand pane shows
`prd-foo-2028-08-30` (the folder's full name, not just the date). Then click the "PRD"
root and the `prd-foo` node themselves. **Expected**: each only expands/collapses — the
right-hand pane's content doesn't change.

## Scenario 4 — Sprint Status Summary and epic disambiguation (FR-011–FR-013)

Select "Sprint Status". **Expected**: a Summary tile shows all six fields from the
fixture's YAML. A Status tile for epic 1 shows status `done`, stories `1-1-run-the-command`
and `1-6a-walk-safely` (both `done`), and retrospective `done`. A Status tile for epic 2
shows status `in-progress`, one story `2-1-serve-every-response` (`review`), and no
retrospective (no `epic-2-retrospective` key exists). A Status tile for epic 10 shows only
`10-1-something` — **not** `1-1-run-the-command` or `1-6a-walk-safely` — proving the
delimiter-based match keeps epic 1 and epic 10 separate. `orphan-entry-not-numbered`
appears in none of the tiles (FR-015).

## Scenario 5 — Malformed sprint-status file (FR-014)

Replace `sprint-status.yaml`'s content with `key: [unclosed` and reselect "Sprint Status".
**Expected**: the right-hand pane shows an error message, not a broken or blank view.

## Scenario 6 — No epics declared

Replace `development_status:` with nothing (remove the whole key, keeping the six summary
fields). **Expected**: the Summary tile still renders correctly; an empty-state message
stands in for Status tiles, not an error.

## Scenario 7 — Empty Navigator (edge case)

Point the CLI at a project whose `_bmad-output` folder exists but is otherwise empty (no
`prds` subfolders, no `sprint-status.yaml`). **Expected**: the "Navigator" tab still
appears (per Scenario 1's condition), but its tree has neither a "PRD" nor a "Sprint
Status" root node.
