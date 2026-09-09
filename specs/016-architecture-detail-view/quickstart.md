# Quickstart: Architecture Detail View

Manual validation guide for this feature's UI/rendering behavior — the carve-out under
constitution Principle V. `prdIndex.ts`'s new `styles` parameter is covered by its own
extended unit tests (`npm test`), not by this guide.

## Prerequisites

1. A fixture project with an architecture leaf folder
   (`_bmad-output/planning-artifacts/architecture/<folder>/`) containing:
   - `ARCHITECTURE-SPINE.md` with a YAML frontmatter block, at least two heading-style
     requirement codes across at least two different prefixes (e.g. `### AD-1 — Some
     decision` and `### AD-2 — Another decision`, plus `### NFR-1 — A constraint`), and
     somewhere in its body text a bullet-style occurrence shaped like a code (e.g.
     `**AD-1**`) to confirm it is never indexed.
   - A `reviews/` subfolder containing at least two `review-*.md` files, e.g.
     `review-rubric.md` and `review-adversarial-seams.md`, to exercise
     alphabetical-by-friendly-name ordering ("Adversarial Seams" sorts before "Rubric").
   - `.memlog.md` with a YAML frontmatter block and at least one bullet mentioning a
     requirement code that *does* exist in `ARCHITECTURE-SPINE.md` (e.g. `AD-1`).
2. A second architecture leaf folder with no `reviews` subfolder and no `.memlog.md`
   present, to exercise the grey-out states.
3. Build and run the CLI against this fixture project:
   `npx tsx src/cli.ts <fixture-project-path>`, then open the printed localhost URL.

## Scenario 1 — Main document rendering

1. Select the architecture leaf folder containing `ARCHITECTURE-SPINE.md`.
2. **Expect**: its content renders as formatted Markdown, filling the entire right-hand
   pane — replacing the bare folder name (FR-001).
3. **Expect**: the YAML frontmatter is excluded from view, with the same established (i)
   info control fixed top-right, showing its key/value pairs on hover/click, no close
   control (FR-002/FR-003).
4. Select an architecture leaf folder with no `ARCHITECTURE-SPINE.md`. **Expect**: a clear
   "no such document" message, not an error or blank pane (FR-004).

## Scenario 2 — Requirement-code index (header-only)

1. Return to the folder from Scenario 1.
2. **Expect**: one small tile per unique prefix (`AD`, `NFR`), in their own column,
   structurally separate from the document (FR-006).
3. Hover the `AD` tile. **Expect**: a tooltip lists `AD-1` and `AD-2`, sorted numerically
   (FR-007).
4. Select `AD-2` from the tooltip. **Expect**: the document scrolls to that heading
   (FR-009).
5. Confirm the `**AD-1**` bullet-style occurrence in the body text is *not* reflected as a
   duplicate entry in the `AD` tile's tooltip — only the heading-style `AD-1` appears
   (FR-005).
6. Select an architecture leaf folder whose document has no heading-style codes at all
   (or the "no document" folder from Scenario 1). **Expect**: no index column appears
   (FR-006).

## Scenario 3 — Reviews tile (subfolder-sourced)

1. Return to the folder from Scenario 1.
2. **Expect**: the "reviews" tile appears enabled.
3. Hover it. **Expect**: a tooltip lists "Adversarial Seams" before "Rubric" (alphabetical
   by friendly name) — sourced from the `reviews/` subfolder, not the leaf folder directly
   (FR-011, FR-013).
4. Select "Rubric". **Expect**: a file-viewer dialog opens showing `review-rubric.md`'s
   content (FR-014).
5. Close it, then select the second (empty) architecture leaf folder. **Expect**: the
   reviews tile now appears visually disabled, and hovering/clicking it does nothing
   (FR-012).

## Scenario 4 — Memory log tile (no links)

1. Return to the folder from Scenario 1. **Expect**: the "memory log" tile appears
   enabled. Click it.
2. **Expect**: the same bespoke dialog format already established for PRD's own memory
   log — candy-striped rows, category headers, frontmatter excluded and reachable via the
   (i) control (FR-017/FR-018).
3. **Expect**: the bullet mentioning `AD-1` — a code that genuinely exists in
   `ARCHITECTURE-SPINE.md` — still renders as plain text, **not** a clickable link,
   confirming FR-019 (contrast with PRD's own memory log, where an existing code *does*
   render as a link).
4. Select the second (empty) architecture leaf folder. **Expect**: the memory log tile
   appears disabled and does nothing on click (FR-016).

## Scenario 5 — No addendum tile

1. Return to the folder from Scenario 1.
2. **Expect**: the tile row contains exactly two tiles (reviews, memory log) — no third,
   addendum-shaped tile anywhere, regardless of what files exist in the folder (FR-020).

## Regression pass (FR-021)

1. Select a PRD leaf folder. **Expect**: its own reviews/addendum/memory-log tiles and
   requirement-code index (features 012/013) still work exactly as before, including
   memory-log links to codes that exist in that PRD.
2. Confirm Sprint Status and every other existing Navigator selection still renders
   exactly as before.
3. Confirm the Infra/Output tabs' own file browser is untouched — opening
   `ARCHITECTURE-SPINE.md` or `.memlog.md` directly from there still shows plain Markdown,
   unaffected by this feature's tile-driven bespoke rendering.
