# Quickstart: PRD Detail Viewer

Manual validation guide for this feature's UI/rendering behavior — the carve-out under
constitution Principle V. The derivation logic in `web/src/prdIndex.ts` is covered by its
own unit tests (`npm test`), not by this guide.

## Prerequisites

1. A fixture project directory with `_bmad-output/planning-artifacts/prds/<folder>/prd.md`
   containing:
   - A YAML frontmatter block at the top (to exercise FR-003).
   - At least two bullet-style codes under one prefix and one under another, e.g.
     `**FR-25**`, `**FR-9**`, `**UJ-1**` — deliberately including `FR-9`/`FR-25` to prove
     numeric (not lexical) sort.
   - At least one header-style code, e.g. `### UJ-2 — Some scenario title`.
   - One duplicated code (e.g. a second, separate `**FR-25**` elsewhere in the document) to
     exercise the Edge Case of non-unique codes.
   - A plain `### Overview` heading that does **not** match the code pattern, to confirm it
     renders untouched.
   - Enough body text that the file-viewer region visibly scrolls independently of the
     index column.
2. A second PRD leaf folder with no `prd.md` file at all (to exercise FR-004).
3. Build and run the CLI against this fixture project:
   `npx tsx src/cli.ts <fixture-project-path>`, then open the printed localhost URL.

## Scenario 1 — Full-pane rendering, no dialog (User Story 1)

1. In the Navigator tree, select the PRD leaf node with a `prd.md` file.
2. **Expect**: the right-hand pane fills with the rendered Markdown — no modal dialog
   opens, no "X" close control appears anywhere in the pane.
3. **Expect**: the YAML frontmatter block is not visible in the rendered body.
4. **Expect**: an (i) icon appears in the pane's top-right corner. Hover it — the
   frontmatter's key/value pairs appear in a tooltip, opaque background, no close button
   next to it.
5. Select the PRD leaf node with no `prd.md` file.
6. **Expect**: a clear "no PRD document" message, not a raw error and not a blank pane.
7. Select the Sprint Status item, then re-select a PRD leaf node.
8. **Expect**: Sprint Status still renders correctly on its own selection — unaffected by
   this feature (FR-014).

## Scenario 2 — Requirement-code index (User Story 2)

1. With the fixture PRD open, confirm a column of small tiles appears to the right of the
   document — one per unique prefix ("FR", "UJ"), not one per code.
2. Scroll the PRD content down. **Expect**: the index column does not move or scroll away
   — it stays exactly where it was, confirming it's structurally separate, not an overlay
   inside the scrolling document (per the Clarification).
3. Hover the "FR" tile. **Expect**: a tooltip lists every FR code in numerical order —
   `FR-9` before `FR-25`, proving numeric (not lexical) sort — including both occurrences
   of the duplicated code as separate rows.
4. Move the pointer from the tile onto the tooltip's own list. **Expect**: the tooltip
   stays open (FR-011).
5. Click one of the two duplicate-code rows. **Expect**: the document scrolls to that
   specific occurrence's location — repeat for the other occurrence and confirm it lands
   at the other location, not the same one both times.
6. Confirm the `### Overview` heading in the fixture renders as a normal heading, with no
   anchor behavior and no tile referencing it.
7. Open a PRD fixture with zero requirement codes of either style (or temporarily edit the
   fixture to remove them). **Expect**: no index column and no prefix tiles render at all
   — the document still renders in full (Acceptance Scenario 6).

## Scenario 3 — Placeholder tiles (User Story 3)

1. With any PRD open, confirm three small tiles render along the top of the pane, in
   order: "reviews," "addendum," "memory log" — each with its icon to the left of its
   title.
2. Confirm their combined height is visibly small relative to the pane, leaving the
   majority of it for the PRD content below.
3. Click each tile. **Expect**: nothing happens — no dialog, no state change, no console
   error.

## Regression pass (FR-014 / SC-005)

Open the Output/Infra tabs' own file viewer (the existing modal `FileViewerDialog`) on an
unrelated Markdown file with frontmatter. **Expect**: identical behavior to before this
feature — (i) icon, tooltip, and Close button all still present and working, confirming
the `FrontmatterInfoControl` extraction introduced no regression.
