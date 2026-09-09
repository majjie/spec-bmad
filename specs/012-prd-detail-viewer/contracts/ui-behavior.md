# UI Behavior Contract: PRD Detail Viewer

This is a UI-behavior contract, not a network API — this feature adds no new HTTP route.
It documents the observable behavior `PrdDetailView.tsx` and its Navigator integration
must satisfy, traced to `spec.md`'s functional requirements.

## Entry condition

`NavigatorDetailPane.tsx` renders `PrdDetailView` when `selectedItemId` matches a PRD leaf
entry's `path` (a date entry or non-conforming entry from `NavigatorTree.prd`) — the same
condition that today renders the bare-folder-name placeholder. Every other selection
(`"sprint-status"`, `null`, or a value matching neither) is unaffected by this feature
(FR-014).

## Rendered structure (top to bottom, left to right)

1. **Placeholder tile row** (FR-005/FR-006): three `Paper`-style tiles, small fixed
   height, left to right — "reviews" (`RateReviewIcon`), "addendum" (`PostAddIcon`),
   "memory log" (`HistoryIcon`) — each icon left of its title text. Clicking any of them
   has no effect (no `onClick` handler at all). A `borderBottom` divider separates this row
   from the content row below it (FR-015, Clarifications).
2. **Content row** (remaining pane height), split horizontally:
   - **File-viewer region** (`flex: 1`, its own `overflow: auto` scroll container):
     - Loading: "Loading…" text, same wording/style as `NavigatorDetailPane`'s existing
       Sprint Status loading state.
     - No `prd.md` at that folder: a clear message that no PRD document exists there
       (FR-004) — not a raw fetch error, not a blank pane. Detected via
       `fetchFileContentOrNull` (`web/src/api.ts`, research.md § 7) resolving to `null`
       specifically on a 404, rather than by inspecting a thrown error's message text.
     - Fetch error (any other failure status from the file route): the error message, same
       treatment as `FileViewerDialog`'s existing error state — this path still goes
       through the thrown-`Error` branch, unchanged from every other caller's behavior.
     - Success: the file's content, frontmatter-stripped via the existing
       `stripFrontmatter()` (FR-002), rendered as Markdown via `ReactMarkdown` with
       `remarkGfm`, using custom `strong`/`h3` renderers that attach a
       `RequirementCodeReference.id` anchor to any element whose own text matches the
       corresponding code pattern.
     - When a frontmatter preamble was present, `FrontmatterInfoControl` renders
       `position: absolute` in this region's top-right corner, as a sibling of the
       scrolling content rather than a descendant of it, so it stays fixed regardless of
       how far the document is scrolled (FR-003, Clarifications) — the same
       hover-or-click, opaque, larger-font tooltip established in feature 010, but with
       **no** accompanying close control, since this is not a dismissible dialog.
   - **Requirement-code index column** (fixed width, its own `overflow: auto`,
     structurally separate from the file-viewer region — a sibling flex child, not an
     overlay inside it) (FR-009), with a `borderLeft` divider separating it from the
     file-viewer region (FR-015, Clarifications):
     - Rendered only when at least one `RequirementCodeReference` was detected; entirely
       absent (no empty column, no placeholder) when none were (Acceptance Scenario 6).
     - One small tile per unique prefix, ordered by first appearance in the document.
     - Hovering (or clicking) a tile opens a controlled `Tooltip` (`open`/`onOpen`/
       `onClose` state, matching feature 010's pattern) listing every reference under that
       prefix, sorted ascending by `number`, each shown by its full `code` text (FR-010).
     - The tooltip's own `sx` sets `maxHeight`/`overflowY: auto` so an overlong list
       scrolls internally rather than clipping or extending off-screen (FR-013).
     - Because MUI's `Tooltip` is interactive by default, moving the pointer from the
       tile onto the tooltip's own content keeps it open (FR-011) — no extra listener
       code needed beyond the existing controlled-open state. `leaveDelay={400}` gives a
       400ms grace period after the pointer leaves both the tile and the tooltip before it
       closes (FR-011, Clarifications) — MUI's own default is 0ms (closes instantly).
     - Selecting a code in the tooltip's list calls
       `document.getElementById(reference.id)?.scrollIntoView({ block: "start" })`
       against the file-viewer region's own scroll container, moving the document to that
       code's location (FR-012), and closes the tooltip.

## Non-goals (explicitly out of scope, per Assumptions)

- No browser-history entry or shareable URL is created when jumping to a code.
- The three placeholder tiles carry no state, storage, or click behavior of any kind.
- Lowercase or mixed-case requirement-code prefixes are not specially handled — the regex
  match requires uppercase letters, per the Assumptions.

## Regression guard (FR-014)

Every existing Navigator behavior — tree selection, Sprint Status rendering, the Output/
Infra tabs, `FileViewerDialog`'s own modal behavior — must continue to work identically.
None of `FileViewerDialog.tsx`'s externally-observable behavior changes as a result of
extracting `FrontmatterInfoControl.tsx` out of it (SC-005).
