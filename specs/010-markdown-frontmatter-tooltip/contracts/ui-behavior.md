# Contract: UI Behavior - Markdown Frontmatter Tooltip

Extends the existing `FileViewerDialog` (feature 004) and its Markdown render mode. No new
routes, no change to `GET /api/file/:tab`'s response - this is purely how the dialog
displays already-fetched content for files rendered in Markdown mode.

## Rendering

- A Markdown file's YAML preamble (delimited by `---` lines at the very start of its
  content) is never shown in the rendered view (FR-001).
- When that preamble is immediately followed by a marker element, both its opening and
  closing tag lines are also excluded - wherever the closing tag falls in the document,
  including at the very end - while the content between and after them still renders
  exactly where it appears in the source (FR-002).
- A file that merely starts with `---` for an unrelated reason (a horizontal rule, YAML
  that isn't a mapping, an unterminated block) renders completely unaffected - nothing is
  stripped (FR-003/FR-004).
- Every other render mode (`syntax`, `csv-grid`, `plain`) is entirely unaffected - this
  feature only ever activates for the `"markdown"` render mode (FR-003).

## Info control

- Appears inside the dialog's existing floating close-button container, only when the
  current Markdown file had a non-empty preamble stripped from it (FR-005/FR-006).
- Absent entirely for a Markdown file with no preamble, an empty preamble, or any
  non-Markdown file - never shown disabled or empty (FR-006).
- Hovering it, or clicking it, reveals a readout of every preamble key/value pair
  (FR-007) - both interaction paths produce the same readout.
- In that readout, keys and values render in two different, consistent colors from each
  other (FR-008).
- The readout's background is fully opaque, and its text renders larger than this tool's
  default tooltip text, so it stays legible over whatever Markdown content is showing
  underneath it (FR-011).
- The marker element's own tag lines/attributes are never shown in this readout, or
  anywhere else - only the YAML mapping's own keys/values ever appear (FR-009).

## Scope boundary

Nothing in this feature edits, copies-as-data, or persists a preamble's values, and
nothing about the underlying file changes - the file `GET /api/file/:tab` serves is
identical before and after this feature; only what the dialog chooses to render from it
changes (FR-010). Constitution Principle II is unaffected.
