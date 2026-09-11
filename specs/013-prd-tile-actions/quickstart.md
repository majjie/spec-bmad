# Quickstart: PRD Tile Actions

Manual validation guide for this feature's UI/rendering behavior - the carve-out under
constitution Principle V. `reviewFiles.ts` and `memlogParser.ts` are covered by their own
unit tests (`npm test`), not by this guide.

## Prerequisites

1. A fixture project with a PRD leaf folder
   (`_bmad-output/planning-artifacts/prds/<folder>/`) containing:
   - `prd.md` with at least two requirement codes, e.g. `**FR-76**` and `**FR-56**`
     (matching this feature's own worked example).
   - At least two `review-*.md` files, e.g. `review-adversarial.md` and
     `review-edge-cases.md`, to exercise alphabetical-by-friendly-name ordering (note:
     "Adversarial" sorts before "Edge Cases").
   - `addendum.md` with any content.
   - `.memlog.md` with a YAML frontmatter block, at least one bullet matching the
     `(category)` shape (e.g. `- (decision) ...`), at least one bullet whose leading text
     does *not* match that shape (no parentheses at all), one bullet mentioning a
     requirement code that *does* exist in `prd.md` (e.g. `FR-76`), one mentioning a code
     that does *not* exist there (e.g. `FR-999`), and one bullet mentioning *two* codes
     that both exist in `prd.md` (e.g. both `FR-76` and `FR-56`, per the feature
     description's own example).
2. A second PRD leaf folder with none of `review-*.md`, `addendum.md`, or `.memlog.md`
   present, to exercise the grey-out states.
3. Build and run the CLI against this fixture project:
   `npx tsx src/cli.ts <fixture-project-path>`, then open the printed localhost URL.

## Scenario 1 - Reviews tile

1. Select the PRD leaf folder containing the two `review-*.md` files.
2. **Expect**: the "reviews" tile appears enabled (not greyed out).
3. Hover it. **Expect**: a tooltip lists "Adversarial" before "Edge Cases" (alphabetical by
   friendly name).
4. Select "Edge Cases". **Expect**: a file-viewer dialog opens showing
   `review-edge-cases.md`'s content, with a Close button - the same established modal
   behavior as any other file opened in this tool.
5. Close it, then select the second (empty) PRD leaf folder. **Expect**: the reviews tile
   now appears visually disabled, and hovering/clicking it does nothing.

## Scenario 2 - Addendum tile

1. Select the PRD leaf folder containing `addendum.md`.
2. **Expect**: the "addendum" tile appears enabled. Click it. **Expect**: a file-viewer
   dialog opens showing `addendum.md`'s content.
3. Select the empty PRD leaf folder. **Expect**: the addendum tile appears disabled and
   does nothing on click.

## Scenario 3 - Memory log tile

1. Select the PRD leaf folder containing `.memlog.md`. **Expect**: the "memory log" tile
   appears enabled. Click it.
2. **Expect**: a bespoke dialog opens (not the standard Markdown viewer) - its YAML
   frontmatter is excluded from the body and reachable via the (i) icon, exactly as
   established for any other Markdown file.
3. **Expect**: each bullet renders as its own row, with alternating row backgrounds
   (candy-striping).
4. **Expect**: the bullet with a `(decision)`-style prefix shows "Decision" as its own
   distinctly-colored header, separate from the row's body text.
5. **Expect**: the bullet with no parenthetical prefix renders as a plain row with no
   separate header.
6. **Expect**: the mentioned code that exists in `prd.md` (e.g. `FR-76`) renders as a
   clickable link; the one that doesn't (e.g. `FR-999`) renders as plain text.
7. **Expect**: the bullet mentioning two existing codes (`FR-76` and `FR-56`) shows *both*
   as independent clickable links.
8. Click the `FR-76` link. **Expect**: the memory log dialog closes, and the PRD view
   (visible underneath) has scrolled to `FR-76`'s location.
9. Reopen the memory log dialog and click the `FR-56` link from the same bullet used in
   step 7. **Expect**: the dialog closes and the PRD scrolls to `FR-56`'s own location -
   confirming both links in that bullet jump independently, not just the first.
10. Select the empty PRD leaf folder. **Expect**: the memory log tile appears disabled and
    does nothing on click.

## Regression pass (FR-018)

1. Confirm the requirement-code index column (feature 012) still lists prefixes and jumps
   correctly on the PRD containing `prd.md`'s codes.
2. Open a Markdown file directly from the Output tab's own file browser (not through a
   tile) that happens to be named `.memlog.md` (or any other file) - confirm it still
   renders as plain Markdown in the standard `FileViewerDialog`, unaffected by this
   feature's bespoke memory-log rendering.
3. Confirm Sprint Status and every other existing Navigator selection still renders
   exactly as before.
