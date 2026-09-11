# Quickstart: Markdown Render Polish

Manual validation guide for this feature's UI/rendering behavior - the carve-out under
constitution Principle V.

## Prerequisites

1. A fixture Markdown document (e.g. a PRD's `prd.md`, an architecture's
   `ARCHITECTURE-SPINE.md`, or any `.md` file reachable from the Output/Infra tabs)
   containing:
   - A GFM table with at least 2 columns and 2 rows.
   - An inline, single-backtick code span in ordinary prose (e.g. `` `npm install` ``).
   - A fenced code block with **no** declared language.
   - A fenced code block declaring a recognized language (e.g. "```typescript" with a
     few lines of real TypeScript, including a keyword, a string, and a comment).
   - A fenced code block declaring a language string this tool's syntax highlighter won't
     recognize (e.g. "```not-a-real-language").
   - A fenced code block with at least one line long enough to require horizontal
     scrolling at normal pane width.
2. Build and run the CLI against a project containing that fixture:
   `npx tsx src/cli.ts <fixture-project-path>`, then open the printed localhost URL.

## Scenario 1 - Table borders

1. Open the fixture document containing the table, in each of the three surfaces it can
   render in: a PRD leaf, an architecture leaf, and the same file opened directly via the
   Output/Infra tabs' file browser.
2. **Expect** (in all three): every header and body cell shows a visible border on all
   sides, forming a complete grid; adjacent cells share a single line, not a doubled one
   (FR-001, FR-002).

## Scenario 2 - Fenced code block background

1. In the same document, locate the inline code span and the no-language fenced block.
2. **Expect**: the inline span shows its own small, pill-shaped background, unchanged from
   today.
3. **Expect**: the fenced block shows a full-width background clearly distinct from
   surrounding prose, with rounded corners and its own padding - and the inline span's own
   background style is *not* also applied inside it (FR-003, FR-004).

## Scenario 3 - Syntax highlighting

1. Locate the fenced block declaring a recognized language (e.g. `typescript`).
2. **Expect**: its contents render with syntax coloring - keywords, strings, and comments
   each visually distinct - matching how the same file type looks when opened directly
   from the Output/Infra tabs (FR-005).
3. Locate the fenced block declaring an unrecognized language.
4. **Expect**: it still shows Scenario 2's plain background, with no syntax coloring and
   no error or missing content (FR-006).

## Scenario 4 - Wide content

1. Locate the fenced block with an overly long line.
2. **Expect**: the block scrolls horizontally within itself; the surrounding pane layout
   does not widen or otherwise break (FR-007).

## Regression pass (FR-009)

1. In a PRD or architecture document containing requirement codes, confirm the
   requirement-code index column still lists prefixes and jumps to the correct anchor on
   selection - unaffected by this feature's `MarkdownContent` extraction.
2. Open a `.csv` file and a recognized whole-file code file (e.g. `.yaml`/`.py`) directly
   from the Output/Infra tabs - confirm `FileViewerDialog`'s `csv-grid` and `syntax` modes
   still render exactly as before, untouched by this feature.
3. Confirm Sprint Status and every other existing Navigator selection still renders
   exactly as before.
