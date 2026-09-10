# UI Behavior Contract: Markdown Render Polish

This is a UI-behavior contract, not a network API — this feature adds no new HTTP route.
It documents the observable rendering behavior of the new `MarkdownContent.tsx` and its
three call sites, traced to `spec.md`'s functional requirements.

## Where this applies

Every place this tool renders Markdown content for reading now goes through
`MarkdownContent`:

- `FileViewerDialog.tsx`'s `"markdown"` render mode (any `.md` file opened via the general
  file-viewer — Output/Infra tabs, reviews, addenda, or any other Markdown file).
- `PrdDetailView.tsx`'s document region (a PRD leaf's `prd.md`).
- `ArchitectureDetailView.tsx`'s document region (an architecture leaf's
  `ARCHITECTURE-SPINE.md`).

`MemoryLogDialog.tsx` is explicitly untouched — it never passes its content through
`ReactMarkdown` at all (its own bespoke bullet/category renderer, features 013/016), so
none of this feature's changes apply there (Assumptions, spec.md).

## Table rendering (FR-001, FR-002)

- Every `<table>`, `<th>`, and `<td>` rendered from Markdown content shows a `1px solid`
  border using this tool's existing `divider` theme color — the same color already used
  for other separators in this tool (e.g. the tile-row divider in `PrdDetailView.tsx`/
  `ArchitectureDetailView.tsx`).
- The table itself collapses adjacent borders (`border-collapse: collapse`) so shared
  edges render as a single line, not a doubled one.

## Fenced code block background (FR-003, FR-004, FR-006)

- Every fenced (multi-line) code block — regardless of whether its opening fence declares
  a language — renders inside a `<pre>` with a background visibly distinct from
  surrounding prose (this tool's existing `action.hover` token), rounded corners, its own
  padding, and horizontal scrolling when its content is wider than the pane (FR-007).
- An inline, single-backtick code span keeps its own existing, smaller pill-shaped
  background (`action.hover`, unchanged) — never the fenced block's own full-width
  background, since a `<pre>`-nested `<code>`'s own inline-style background is explicitly
  canceled.

## Syntax highlighting (FR-005, FR-006)

- When a fenced block's opening fence declares a language (e.g. "```typescript"), its
  contents render via this tool's existing `react-syntax-highlighter` `Prism`/
  `vscDarkPlus` pairing — the same one already used when a file of that type is opened
  directly through this tool's general file-viewer.
- When no language is declared, or a declared language isn't recognized, the block still
  receives the plain background above, with no syntax coloring and no error — indistin-
  guishable, from the reader's perspective, from an undeclared-language block.

## `MarkdownContent` merge behavior (data-model.md)

- `PrdDetailView.tsx` and `ArchitectureDetailView.tsx` continue to pass their own
  `strong`/`h3` (or `h3`-only) requirement-code anchor-id overrides through
  `MarkdownContent`'s `components` prop — their own existing behavior (scrolling to a
  requirement code from the index column) is unaffected by this feature.
- `FileViewerDialog.tsx` passes no `components` override at all — nothing beyond this
  feature's own table/code-block changes applies there.

## Non-goals (explicitly out of scope, per Assumptions)

- No change to how a table's rows/columns are parsed, or how a fence's language tag is
  recognized — both remain whatever `remark-gfm`/`react-markdown` already produce.
- No change to `MemoryLogDialog.tsx`'s own bespoke rendering.
- No new dependency, no new color scheme beyond what this tool's theme and
  `react-syntax-highlighter`'s existing `vscDarkPlus` style already provide.

## Regression guard (FR-009)

Every existing Navigator, PRD, Architecture, Output, and Infra behavior — including the
requirement-code index's own anchor-jump behavior in both `PrdDetailView.tsx` and
`ArchitectureDetailView.tsx`, and `FileViewerDialog.tsx`'s other render modes
(`csv-grid`, `syntax`, `plain`) — must continue to work exactly as before.
