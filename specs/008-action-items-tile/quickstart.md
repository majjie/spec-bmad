# Quickstart: Validating the Action Items Tile

Manual end-to-end validation once implemented. Automated coverage for `parseActionItems`
lives in `tests/unit/navigator/action-items.test.ts`; the tile's layout, icons, and
jump-to-file behavior are validated manually here, per constitution Principle V's
UI-rendering carve-out.

## Prerequisites

- Built and running per prior features' quickstarts: `npm install`, `npm run build:web`.
- Reuse feature 006/007's own fixture project, adding an `action_items` list to
  `sprint-status.yaml` and a real target file for at least one `ref` to point at:

  ```bash
  mkdir -p /tmp/bmad-action-items/project/_bmad-output/implementation-artifacts
  cd /tmp/bmad-action-items/project/_bmad-output

  cat > implementation-artifacts/retro.md <<'EOF'
  # Epic 1 retrospective
  Some real content here.
  EOF

  cat > implementation-artifacts/sprint-status.yaml <<'EOF'
  generated: today
  project: bmad-dash
  development_status:
    epic-1: done
    1-1-a: done
  action_items:
    - id: "item-1-full"
      epic: 1
      action: "A fully-populated action item, owned by the dev loop, done, with a real ref"
      owner: "dev loop"
      status: done
      ref: "_bmad-output/implementation-artifacts/retro.md"
    - id: "item-2-human"
      epic: 1
      action: "An open item owned by a person"
      owner: "Jamie"
      status: open
      ref: "_bmad-output/implementation-artifacts/retro.md"
    - id: "item-3-missing-ref"
      epic: 1
      action: "An item with no ref at all"
      owner: "dev loop"
      status: open
    - id: "item-4-missing-owner"
      epic: 1
      action: "An item with no owner"
      status: open
      ref: "_bmad-output/implementation-artifacts/retro.md"
    - id: "item-5-broken-ref"
      epic: 1
      action: "An item whose ref points nowhere real"
      owner: "dev loop"
      status: open
      ref: "_bmad-output/implementation-artifacts/does-not-exist.md"
  EOF
  ```

- Start the CLI against `/tmp/bmad-action-items/project` and open the printed URL in a
  full-size desktop browser.

## Scenario 1 — Tile appears beside Summary, same height (FR-001/FR-002)

Open the Navigator tab, select "Sprint Status". **Expected**: an "Action Items" tile
appears immediately to the right of the Summary tile, matching its height, filling the
rest of that row's width; the epic tile(s) still render as a full-width stack below this
row (feature 007, unaffected).

## Scenario 2 — Per-item icons and hiding (FR-004–FR-008)

**Expected**, reading top to bottom:
- `item-1-full`: computer-like owner icon (tooltip "dev loop"), a filled tick-box, a jump
  icon (tooltip is the ref path), "epic-1", and its action text.
- `item-2-human`: human-outline owner icon (tooltip "Jamie"), an unfilled tick-box, a jump
  icon, "epic-1", its action text.
- `item-3-missing-ref`: same as item-2 but **no jump icon at all**.
- `item-4-missing-owner`: **no owner icon at all**; tick-box, jump icon, epic, and action
  text all still show normally.

## Scenario 3 — Jump icon opens the file viewer, same close behavior (FR-010/FR-011)

Click `item-1-full`'s jump icon. **Expected**: the same full-screen file viewer used by
the Infra/Output tabs opens, showing `retro.md`'s contents. Close it via the "X" icon;
confirm it closes and the Navigator tab (Sprint Status still selected) is what's left
showing. Reopen it and close it via Escape, then again via the browser's Back button —
both should behave identically to closing a file opened from the Infra/Output tabs.

Click `item-5-broken-ref`'s jump icon. **Expected**: the dialog still opens, showing an
error message in place of file contents (the same error state already used for any other
unreadable file) — not a broken view, not nothing happening.

## Scenario 4 — No action items (FR-012)

Remove the `action_items` key entirely from `sprint-status.yaml` and reselect "Sprint
Status". **Expected**: the Action Items tile still appears, beside the Summary tile, at
the same height, showing an empty-state message instead of any rows.
