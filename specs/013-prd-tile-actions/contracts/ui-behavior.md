# UI Behavior Contract: PRD Tile Actions

This is a UI-behavior contract, not a network API — this feature adds no new HTTP route.
It documents the observable behavior of `PrdDetailView.tsx`'s three tiles and the new
`MemoryLogDialog.tsx`, traced to `spec.md`'s functional requirements.

## Data fetched once per PRD selection

Alongside the existing `prd.md` fetch, `PrdDetailView` now also calls
`fetchContents("output", entry.path)` to list the folder's direct children. From that
list: `buildReviewFileList()` (research.md § 3) produces the reviews tile's alphabetical,
friendly-named list; a file named exactly `addendum.md` gates the addendum tile; a file
named exactly `.memlog.md` gates the memory log tile. A fetch failure here is treated the
same as "no matching files" for gating purposes — every tile renders disabled rather than
surfacing a separate error state, since the tiles are a minor affordance, not this pane's
primary content (`prd.md`'s own fetch already owns the pane's error/loading states).

## Reviews tile

- **Disabled** (FR-006) when the folder has no `review-*.md` files: `"disabled"`-colored
  icon and label, no `onClick`, no tooltip.
- **Enabled** (FR-002) otherwise: hovering or clicking opens a controlled `Tooltip`
  (matching `PrefixTile`'s own `open`/`onOpen`/`onClose`/`leaveDelay={400}`/opaque,
  scrollable `sx` configuration, research.md § 4) listing every review's `displayName`,
  alphabetically (FR-004). The tooltip's own `width` is set to match the tile's rendered
  width (its `offsetWidth`, tracked live via `ResizeObserver`, since the tile's width is
  itself dynamic — a `flex: 1` sibling in the tile row, not a fixed pixel value), rather
  than shrinking to fit its narrowest listed name (FR-002, Clarifications).
- Selecting a listed review calls `onOpenFile(review.path)` (FR-005) — the same app-wide
  mechanism Action Items/Epic Step Detail already use — and closes the tooltip.

## Addendum tile

- **Disabled** (FR-008) when the folder has no `addendum.md`.
- **Enabled** otherwise: clicking calls `onOpenFile(`${entry.path}/addendum.md`)` directly
  (no tooltip — a single file needs no list).

## Memory log tile

- **Disabled** (FR-010) when the folder has no `.memlog.md`.
- **Enabled** otherwise: clicking fetches `${entry.path}/.memlog.md`'s content (via
  `fetchFileContentOrNull("output", ...)`, `PrdDetailView`'s own local state — *not* the
  app-wide `openFile` mechanism, research.md § 6) and opens `MemoryLogDialog`.

### `MemoryLogDialog` rendered structure

- A `Dialog` shell identical in structure to `FileViewerDialog`'s own (margin/sizing,
  `position: absolute` top-right controls as a sibling of the scrolling content, never a
  descendant of it — research.md § 6).
- When the file's YAML frontmatter preamble is present, `FrontmatterInfoControl` renders
  in the top-right corner (FR-011), alongside the dialog's own Close button — this *is* a
  normal, closeable dialog (Assumptions), unlike the main non-modal PRD pane.
- The body renders `parseMemlogEntries(strippedBody, prdReferences)`'s output as a
  sequence of candy-striped rows (alternating background by index, matching
  `SprintStatusView.tsx`'s `StepRow` convention) (FR-012):
  - When an entry's `category` is non-null, it renders as its own header — capitalized,
    `primary.light` (FR-013).
  - Each `MemlogSegment` renders in order: `"text"` segments as plain text (FR-014); a
    `"code"` segment with a non-null `referenceId` renders as a clickable inline link
    showing its `text` (FR-015); a `"code"` segment with `referenceId === null` renders as
    plain text (FR-017).
  - Selecting a link calls `onSelectReference(referenceId)` (FR-016) — implemented by
    `PrdDetailView` as: call its existing `handleSelectReference` (scrolls the PRD to that
    anchor) *and* close this dialog, in that order.

## Non-goals (explicitly out of scope, per Assumptions)

- Opening `.memlog.md` from the Output/Infra tabs' own generic file browser is untouched —
  it still renders as plain Markdown there; the bespoke view is scoped to this tile's own
  interaction (research.md § 6).
- No new dialog component for reviews or the addendum — both reuse the existing
  `FileViewerDialog` via `onOpenFile`.
- Multi-line bullet continuation in `.memlog.md` is not specially handled — each such
  continuation line renders as its own, headerless entry (research.md § 5).

## Regression guard (FR-018)

Every existing Navigator/PRD-viewer behavior — tree selection, Sprint Status, the modal
`FileViewerDialog`'s own behavior (Output/Infra tabs and the reviews/addendum tiles alike),
the requirement-code index column's own jump behavior — must continue to work exactly as
established in features 006–012.
