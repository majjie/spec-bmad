# Quickstart: Validating Explorer UI Polish

Manual end-to-end validation for this feature, once implemented. Automated coverage for the
new pure decision logic lives in `tests/unit/web/navigationHistory.test.ts`; everything else
here is browser-only per constitution Principle V's UI-rendering carve-out.

## Prerequisites

- Built and running per feature 002's quickstart: `npm install`, `npm run build:web`,
  `chmod +x src/cli.ts`, then `./src/cli.ts <a project folder with both _bmad and
  _bmad-output populated, ideally with a few nested subfolders>`. Open the printed URL in a
  full-size desktop browser.

## Scenario 1 — Back/Forward navigates within the app (User Story 1)

1. On the Infra tab, select a nested folder (folder A).
2. Select a different folder (folder B).
3. Switch to the Output tab.
4. Select a folder there (folder C).

**Expected**: Press the browser's Back button (or Alt+Left / a mouse back button) four
times in a row. Each press should return to, in order: folder B on Infra, folder A on
Infra, the app's initial default view (Infra/root) — and only on a fifth Back press does
the browser leave the application (per FR-012's baseline entry). Then press Forward four
times and confirm it retraces the same four states forward, ending back on folder C on
Output.

## Scenario 2 — Expand/collapse doesn't add history steps (User Story 1)

With a folder selected, expand and collapse a few different tree nodes without clicking
any node to select it.

**Expected**: Pressing Back afterward skips over all that expand/collapse activity and
goes straight to whatever selection preceded it — per FR-005.

## Scenario 3 — Reload resets to the default view (Clarifications session)

Navigate a few folders deep, then reload the page (F5 / Cmd+R).

**Expected**: The app shows its initial default view (Infra tab, root selected) — it does
not restore the folder you were just viewing.

## Scenario 4 — Root node is expanded on first load (User Story 2)

Load the app fresh (or reload) against a project whose `_bmad` folder has at least one
subfolder.

**Expected**: The Infra tab's tree already shows that subfolder listed under the root —
no click needed. None of the root's children are themselves pre-expanded. Switch to
Output and confirm the same for `_bmad-output`.

## Scenario 5 — Root expansion doesn't reapply on every tab switch (User Story 2)

Collapse the Infra tab's root node. Switch to Output, then back to Infra.

**Expected**: Infra's root is still collapsed — the automatic expansion only happened the
first time, per FR-007.

## Scenario 6 — Folder icons (User Story 3)

Open a folder containing both files and subfolders.

**Expected**: Every subfolder — in the tree and in the contents table — shows a folder
icon; file rows in the table do not.

## Scenario 7 — No divider lines, alternating row shading (User Story 4)

Open a folder with several entries (at least 3-4).

**Expected**: No line is visible between rows; instead, rows alternate between two
background shades, still legible against the existing dark theme.
