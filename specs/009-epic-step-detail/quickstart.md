# Quickstart: Validating Epic Step Detail

Manual end-to-end validation once implemented. Automated coverage for
`deriveStepDisplay`/`matchSpecFileName`/`buildStepDetails` lives in
`tests/unit/navigator/step-detail.test.ts`; the tile's collapse/expand behavior, row
layout, and candy stripe are validated manually here, per constitution Principle V's
UI-rendering carve-out.

## Prerequisites

- Built and running per prior features' quickstarts: `npm install`, `npm run build:web`.
- A fixture project with a `sprint-status.yaml` whose steps cover every case this feature
  handles, plus a handful of `spec-*.md` files under the same
  `implementation-artifacts` folder:

  ```bash
  mkdir -p /tmp/bmad-step-detail/project/_bmad-output/implementation-artifacts
  cd /tmp/bmad-step-detail/project/_bmad-output/implementation-artifacts

  cat > spec-1-1-run-the-command-and-reach-a-served-page.md <<'EOF'
  # Spec 1-1
  Run the command and reach a served page.
  EOF

  # Two matches for the same index ("1-6a"), to exercise the alphabetical tie-break —
  # the "-v1" file must win.
  cat > spec-1-6a-walk-the-artifact-tree-safely-v1.md <<'EOF'
  # Spec 1-6a (v1 — should win the tie-break)
  EOF
  cat > spec-1-6a-walk-the-artifact-tree-safely-v2.md <<'EOF'
  # Spec 1-6a (v2 — should NOT be picked)
  EOF

  # Deliberately no spec-1-2-*.md file, and no spec-2-1-*.md file.

  cat > sprint-status.yaml <<'EOF'
  generated: today
  project: bmad-dash
  development_status:
    epic-1: in-progress
    1-1-run-the-command-and-reach-a-served-page: done
    1-2-establish-the-visual-foundation: done
    1-6a-walk-the-artifact-tree-safely: open
    1-fix-a-thing-with-no-story-number: open
    epic-2: backlog
    2-1-serve-a-second-page: backlog
  EOF
  ```

- Start the CLI against `/tmp/bmad-step-detail/project` and open the printed URL in a
  full-size desktop browser.

## Scenario 1 — Epic tiles collapse by default (FR-001/FR-002)

Open the Navigator tab, select "Sprint Status". **Expected**: both epic-1 and epic-2 tiles
show only their key and overall status ("epic-1 — in-progress", "epic-2 — backlog") — no
steps, no retrospective line.

## Scenario 2 — Expand/collapse is per-tile (FR-002/FR-003)

Click epic-1's expand control (top-right of its tile). **Expected**: epic-1 reveals its
four steps plus its retrospective status line; epic-2 remains collapsed, unaffected. Click
epic-1's control again — it collapses back to just its header. Expand epic-2 instead —
epic-1 stays exactly as it was left.

## Scenario 3 — Readable step rows (FR-004/FR-005/FR-006)

With epic-1 expanded, reading top to bottom: **Expected**:

- `1-1-run-the-command-and-reach-a-served-page` → index "1-1", title "run the command and
  reach a served page", status "done".
- `1-2-establish-the-visual-foundation` → index "1-2", title "establish the visual
  foundation", status "done".
- `1-6a-walk-the-artifact-tree-safely` → index "1-6a", title "walk the artifact tree
  safely", status "open".
- `1-fix-a-thing-with-no-story-number` → index and title both read the full raw key
  unchanged (FR-013 — no recognizable `<epic>-<story>` index).

Rows alternate background shading top to bottom (FR-011).

## Scenario 4 — Jump to a step's spec, including the tie-break (FR-007/FR-008/FR-009/FR-012)

**Expected**: `1-1-...`'s row shows a magnifying-glass control; clicking it opens
`spec-1-1-run-the-command-and-reach-a-served-page.md`'s contents in the file viewer. Close
it via the "X" icon — confirm Sprint Status (epic-1 still expanded) is what's left showing.

`1-6a-...`'s row also shows a magnifying-glass control; clicking it opens
`spec-1-6a-walk-the-artifact-tree-safely-v1.md` specifically (the alphabetically-first of
the two matches) — never the `-v2` file.

`1-2-...`'s row shows **no** magnifying-glass control at all (no `spec-1-2-*` file exists).

Expand epic-2 and confirm `2-1-serve-a-second-page` also shows no magnifying-glass control
(no `spec-2-1-*` file exists either).

## Scenario 5 — Unreadable spec document (Edge Cases)

Delete `spec-1-1-run-the-command-and-reach-a-served-page.md` from disk without reloading
the page, then click `1-1-...`'s magnifying-glass control again. **Expected**: the dialog
still opens, showing the same error state already used elsewhere for an unreadable file —
not a broken view, not nothing happening.
