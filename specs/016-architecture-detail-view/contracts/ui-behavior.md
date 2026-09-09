# UI Behavior Contract: Architecture Detail View

This is a UI-behavior contract, not a network API — this feature adds no new HTTP route.
It documents the observable behavior of the new `ArchitectureDetailView.tsx`, traced to
`spec.md`'s functional requirements.

## Dispatch (`NavigatorDetailPane.tsx`)

Unchanged order of checks, with the architecture branch's rendered output replaced:

1. `"sprint-status"` → `SprintStatusView`.
2. `findFolderEntry(tree?.prd ?? null, selectedItemId)` → `PrdDetailView` (unchanged).
3. `findFolderEntry(tree?.architecture ?? null, selectedItemId)` → **`ArchitectureDetailView`**
   (previously a bare `<Typography>{architectureEntry.folderName}</Typography>`, feature
   015) — FR-001.
4. Otherwise, the existing default "select an item" message (unchanged).

## Data fetched once per architecture leaf selection

Three independent fetches, none blocking the others' own loading state:

- `fetchFileContentOrNull("output", `${entry.path}/ARCHITECTURE-SPINE.md`)` — the main
  document (FR-001, FR-004).
- `fetchContents("output", entry.path)` — the leaf folder's own direct contents, used only
  to gate the memory log tile (a file named exactly `.memlog.md`, FR-015/FR-016). **Not**
  used for the reviews tile — see the next line.
- `fetchContents("output", `${entry.path}/reviews`)` — the folder's `reviews` subfolder's
  own contents, used to gate and populate the reviews tile (FR-011). A rejected fetch here
  (subfolder absent) is treated identically to an empty listing (FR-012), the same
  catch-and-default-to-`[]` pattern `PrdDetailView` already applies to its own single
  folder-contents fetch.

## Main document rendering

- Frontmatter stripped via the existing `stripFrontmatter()`; when a non-empty preamble
  remains, `FrontmatterInfoControl` renders fixed top-right, as a sibling of the scrolling
  content — never a descendant of it (FR-002/FR-003).
- `ReactMarkdown` renders the body with **only** an `h3` custom-renderer override (assigning
  a scroll-anchor `id` to each heading matched by `HEADING_CODE_PATTERN`,
  `^([A-Z]{2,})-(\d+)\s—`). There is deliberately **no** `strong` override — architecture
  never detects bullet-style codes at all (FR-005), so no anchor target for that style is
  ever needed.
- When `ARCHITECTURE-SPINE.md` is absent, the pane shows a clear "no such document" message
  instead of an error or blank pane (FR-004).

## Requirement-code index column

- Built via `buildRequirementCodeIndex(body, ["header"])` → `groupByPrefix(...)` — the
  exact same `PrefixTile` hover/click/scroll behavior already established for PRD
  (FR-006–FR-010), just fed a style-restricted reference array. No tiles render at all when
  the array is empty.

## Reviews tile

- **Disabled** (FR-012) when the `reviews` subfolder is absent, or present but contains no
  `review-*.md` files.
- **Enabled** (FR-013) otherwise: hovering or clicking opens the same controlled Tooltip
  shape already established for PRD's own reviews tile (`open`/`onOpen`/`onClose`,
  `leaveDelay={400}`, width matched to the tile's own rendered width), listing each
  detected file's friendly name, sorted alphabetically.
- Selecting a listed review calls `onOpenFile(`${entry.path}/reviews/${review.fileName}`)`
  — reusing `ReviewFileReference.path`, which already carries the file's full path from its
  own `ContentsEntry` (no manual path reconstruction) — the same app-wide
  `onOpenFile`/`FileViewerDialog` mechanism PRD's own reviews tile uses (FR-014).

## Memory log tile

- **Disabled** (FR-016) when the leaf folder has no `.memlog.md`.
- **Enabled** otherwise: clicking fetches `${entry.path}/.memlog.md` and opens the existing
  `MemoryLogDialog`, passing `prdReferences={[]}` (always empty) instead of a real
  detected-codes array (FR-019). The dialog's own frontmatter handling (FR-018) and
  candy-striped/category-header rendering (FR-017) are otherwise identical to PRD's own use
  of it.
- Because `prdReferences` is always empty, `MemoryLogDialog`'s `onSelectReference` callback
  is never actually invokable from architecture's own dialog (every segment renders as
  plain text, never a clickable button) — `ArchitectureDetailView` still passes a callback
  matching the prop's required shape (a no-op closing the dialog, for type-shape parity
  with `PrdDetailView`'s own usage), but it is never called in practice.

## No addendum tile

- `ArchitectureDetailView`'s tile row renders exactly two tiles (reviews, memory log) — no
  third tile, no `addendum.md` existence check anywhere (FR-020).

## Non-goals (explicitly out of scope, per Assumptions)

- No cross-document linking or shared state between an architecture document's index and a
  PRD's own — each view's `references` array is computed independently, scoped to
  whichever document is currently open.
- Opening `.memlog.md` or any review file directly from the Output/Infra tabs' own generic
  file browser is untouched — both still render as plain Markdown there.

## Regression guard (FR-021)

Every existing PRD-viewer, Navigator, Infra, and Output behavior — including PRD's own
reviews/addendum/memory-log tiles and their requirement-code links — must continue to work
exactly as established in features 006–015.
