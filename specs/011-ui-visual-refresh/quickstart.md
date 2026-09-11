# Quickstart: Validating the UI Visual Refresh

This entire feature is UI/rendering - per constitution Principle V's carve-out, it's
validated manually in a running browser, not via `node:test`. There is no new automated
test file for this feature (plan.md's Technical Context).

## Prerequisites

- Built and running per prior features' quickstarts: `npm install`, `npm run build:web`.
- A fixture project covering every status value and both row types in one place:

  ```bash
  mkdir -p /tmp/bmad-visual-refresh/project/_bmad-output/implementation-artifacts
  cd /tmp/bmad-visual-refresh/project/_bmad-output/implementation-artifacts

  cat > sprint-status.yaml <<'EOF'
  generated: today
  project: bmad-dash
  development_status:
    epic-1: in-progress
    1-1-done-step: done
    1-2-review-step: review
    1-3-backlog-step: backlog
    1-4-in-progress-step: in-progress
  action_items:
    - id: item-1
      epic: 1
      action: "An item with an owner, a status, and a jump target"
      owner: dev loop
      status: open
      ref: "_bmad-output/implementation-artifacts/spec-1-1-done-step.md"
  EOF

  cat > spec-1-1-done-step.md <<'EOF'
  ---
  title: "Done step"
  status: 'done'
  ---

  # Done step

  Body text.
  EOF
  ```

- Start the CLI against `/tmp/bmad-visual-refresh/project` and open the printed URL in a
  full-size desktop browser.

## Scenario 1 - Icon-header spacing looks even (FR-001)

Open the Navigator tab, select "Sprint Status", expand epic-1. **Expected**: in the
Action Items tile's row, the gap between the owner icon and the status checkbox visually
matches the gap between the status checkbox and the jump (magnifying-glass) control. In
epic-1's own expanded step rows, the gap between each step's index text and its status
visually matches the gap between the status and its jump control (present on
`1-1-done-step` only, since that's the only step with a matching spec file).

## Scenario 2 - Summary tile colors match the frontmatter tooltip (FR-002/FR-003)

With Sprint Status still open, note the Summary tile's field label/value colors. Then
open `spec-1-1-done-step.md` (via the Output tab, or the step row's jump control) and
hover its info control. **Expected**: the Summary tile's labels use the exact same color
as the tooltip's keys, and the Summary tile's values use the exact same color as the
tooltip's values.

## Scenario 3 - Base text is visibly larger (FR-004)

Compare this view against a screenshot from any prior feature's own quickstart in this
project (e.g. feature 009's). **Expected**: body text throughout is visibly larger; no
view shows clipped or overlapping text as a result.

## Scenario 4 - Blue accent on tile headings (FR-005)

**Expected**: the Summary tile's "Summary" heading, the Action Items tile's "Action
Items" heading, "epic-1" (the key portion only, not its "in-progress" status text), and
each step's index text (e.g. "1-1") all render in the same blue as the active tab
indicator at the top of the page.

## Scenario 5 - Semantic status-icon colors (FR-006)

With all four steps visible (from the fixture above: done, review, backlog, in-progress),
**expected**: each status icon renders in a distinct color - `done` green, `review`
amber, `in-progress` blue, `backlog` a muted/de-emphasized tone - and epic-1's own
"in-progress" status icon (in its heading) uses that same blue, distinguishable from the
tile-heading accent color next to it.

## Scenario 6 - No behavior regression (FR-007/SC-005)

Spot-check a handful of interactions from prior features still work exactly as before:
expand/collapse an epic tile, click an action item's jump control to open its document,
close the file viewer via Escape. **Expected**: every one of these behaves identically to
how it did before this feature - only appearance changed.
