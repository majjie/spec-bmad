# Research: PRD Tile Actions

## 1. Detecting which files exist in the PRD folder

**Decision**: Call the existing `fetchContents("output", entry.path)` (`web/src/api.ts`,
already wrapping `GET /api/contents/:tab`) to list the PRD folder's own direct children,
then filter client-side: files whose `name` starts with `review-` and ends with `.md` →
the reviews list; a file named exactly `addendum.md` → the addendum tile's gate; a file
named exactly `.memlog.md` → the memory log tile's gate.

**Rationale**: This route is exactly what the Output/Infra tabs' own file browser already
uses to list a folder's contents, and it was directly exercised against this feature's own
fixture data during feature 012's regression testing — that session's Playwright run
navigated into `planning-artifacts/prds/prd-bmad-2026-08-28` via the Output tab and
confirmed `.memlog.md`, `addendum.md`, `prd.md`, and every `review-*.md` file all appear in
that listing, proving dotfiles are not filtered out of the underlying artifact-tree scan.
No new backend route, no new scanning logic — this is a plain read of data the server
already exposes.

**Alternatives considered**: A new dedicated `/api/prd/:path/tile-files` route returning
just the three booleans/list — rejected as pure duplication; the generic contents route
already returns everything needed in one call, fetched once per PRD selection alongside
`prd.md` itself.

## 2. Opening a review or the addendum

**Decision**: Reuse the app-wide `onOpenFile(path: string)` callback / shared
`FileViewerDialog` mechanism (`App.tsx`'s `openFileDialog`/`openFile` state) — the exact
same one Action Items and Epic Step Detail already use to jump to a spec document.
`PrdDetailView` gains a new `onOpenFile` prop, threaded down from `NavigatorDetailPane`
(which already receives its own `onOpenFile` prop today, just doesn't pass it further).
Clicking a listed review, or the addendum tile, calls
`onOpenFile(`${entry.path}/${fileName}`)`.

**Rationale**: Every existing "open this file" interaction in this tool already funnels
through this one shared dialog and its history integration (back/forward, Escape-to-close)
— reusing it here means zero new dialog component, zero new state machinery, and identical
behavior (including keyboard/history handling) to every other file-opening affordance in
the app. `App.tsx`'s own `loadFileContent` already translates a `"navigator"`-sourced
open into an `"output"`-tab fetch under the hood — the exact same translation this
feature's own `prd.md` fetch (feature 012) already relies on.

**Alternatives considered**: A dedicated dialog owned by `PrdDetailView` for reviews too
(mirroring the memory log's bespoke one) — rejected; reviews and the addendum need no
bespoke rendering at all (plain Markdown is exactly right), so reusing the shared,
already-tested mechanism is strictly simpler and avoids a second, redundant Dialog shell.

## 3. Friendly review-file display names

**Decision**: A small pure module, `web/src/reviewFiles.ts`, exporting
`buildReviewFileList(entries: ContentsEntry[]): ReviewFileReference[]` — filters for
`review-*.md` files, derives each one's display name (strip the `review-` prefix, replace
every `-` with a space, Title Case the result — Clarifications), and sorts the returned
list alphabetically by that derived name.

**Rationale**: This is genuine derivation logic (a filename transform plus a sort), not
rendering — it belongs in its own test-first module, mirroring `prdIndex.ts`'s own
precedent for small, focused derivation pieces. Keeping it separate from the tooltip's
rendering code (a new local component in `PrdDetailView.tsx`, § 5 below) keeps the
transform itself trivially unit-testable without a browser.

**Alternatives considered**: Deriving the friendly name inline inside the tooltip's render
function — rejected; it's exactly the kind of logic constitution Principle V requires
test-first coverage for, and inlining it would leave it untested (the UI-rendering
carve-out only covers rendering, not the string transform feeding it).

## 4. Reusing (or not) the requirement-code index's own hover-tooltip tile

**Decision**: A new, separate local component (`ReviewsTile`, defined inside
`PrdDetailView.tsx` next to the existing `PrefixTile`) — not a refactor of `PrefixTile`
itself into something more generic.

**Rationale**: `PrefixTile`'s Tooltip configuration (the `leaveDelay={400}`, the opaque/
scrollable `slotProps.tooltip.sx`, the controlled `open`/`onOpen`/`onClose` wiring) is
exactly what the reviews tile also needs, but `PrefixTile` itself is tightly shaped around
`RequirementCodeReference` (numeric sort, scroll-to-anchor selection) — genuinely
different from a review file (alphabetic sort, opens a dialog rather than scrolling).
Rather than force both through one generalized component (adding indirection to
already-shipped, tested code from feature 012 for a saving of a handful of duplicated
`sx`/`leaveDelay` lines), this plan accepts that small, explicit duplication as the lower
risk option — consistent with this project's demonstrated preference for small, targeted
changes over premature abstraction.

**Alternatives considered**: Extracting a shared `HoverListTile` wrapping the common
Tooltip configuration — a reasonable alternative, noted here in case a *third* consumer of
this exact pattern appears later, at which point extracting it would clear this project's
own established bar ("extract on a genuine second/third consumer," feature 012 § 2) more
comfortably than it does today.

## 5. Parsing `.memlog.md`'s bullet format

**Decision**: A new pure module, `web/src/memlogParser.ts`, exporting
`parseMemlogEntries(body: string, prdReferences: RequirementCodeReference[]): MemlogEntry[]`.
Each `MemlogEntry` carries an optional `category` (the parenthetical word, capitalized, or
`null` if the bullet's leading text didn't match that shape) and a `segments` array — the
bullet's body text already split into `{ kind: "text"; value: string }` and
`{ kind: "code"; text: string; referenceId: string | null }` pieces, where `referenceId` is
the matching `RequirementCodeReference.id` from `prdReferences` (its *first* match in
document order, since `Array.prototype.find` naturally returns the first hit against an
already-ordered array — Clarifications) when the mentioned code exists there, or `null`
when it doesn't (Clarifications: renders as plain text, not a link).

Bullet-splitting itself is line-based: every non-blank line starting with `- ` at column
zero begins a new entry; nothing in the given example content wraps a single bullet across
multiple lines, so no continuation-line logic is implemented — a future multi-line bullet
would simply render as two separate entries (the second with no category header), which is
this tool's usual tolerate-and-degrade-gracefully behavior for unexpected shapes rather
than a hard failure.

The requirement-code shape itself (`[A-Z]{2,}-\d+`, matched with word boundaries so a
trailing possessive like `FR-56's` doesn't swallow the apostrophe-s) is exported as a
shared constant from `prdIndex.ts` — the module that already owns this exact definition
for the PRD's own bullet/header detection — so this feature's *bare* inline-mention
detection (no `**bold**` or `### heading` wrapping required this time) reuses the same
"what does a code look like" definition rather than a second, potentially-drifting copy.

**Rationale**: Splitting cross-referencing into the *pure* parsing function (rather than
resolving links at render time) keeps the one genuinely complex piece of this feature —
"which of these mentioned codes actually exist in the currently-open PRD, and where do
they jump to" — fully unit-testable without any DOM/React involvement, exactly the kind of
module constitution Principle V requires test-first coverage for. Rendering `MemlogEntry[]`
is then a thin, mechanical map over already-resolved segments — no cross-referencing logic
left in the render path to manually verify instead of test.

**Alternatives considered**: Passing the raw memlog body through `ReactMarkdown` with
custom component overrides (the same technique feature 012 uses for the PRD's own
in-place code anchors) — rejected per the Clarifications answer that memlog bullets render
as plain text, not parsed Markdown; there is no inline emphasis/code-span syntax to hand
off to a Markdown parser at all in this feature, only a bespoke bullet/category/link shape
of this module's own design.

## 6. The memory log's bespoke dialog

**Decision**: A new component, `web/src/components/MemoryLogDialog.tsx`, structurally
modeled on `FileViewerDialog.tsx`'s own shell — the same `Dialog`, the same
`position: absolute` top-right controls rendered as a *sibling* of the scrolling content
`div` (never nested inside it), and the same `FrontmatterInfoControl` reuse for its own
YAML preamble — but with `DialogBody`'s Markdown pass-through replaced by a thin renderer
over `parseMemlogEntries`'s output: one candy-striped row per entry (alternating
background by index, matching `SprintStatusView.tsx`'s own `StepRow` convention), each
row's `category` (if present) shown as its own header in `primary.light` — this app's
already-established accent color for tile/section headings (feature 011) — and each
segment rendered as plain text or, for a resolved code, a clickable inline link.

Selecting a link calls a single `onSelectReference(id: string)` prop, owned by
`PrdDetailView` — its implementation both scrolls the PRD to that anchor (reusing the
exact `handleSelectReference` function the requirement-code index column already calls)
*and* closes this dialog, satisfying "clicking it will close the file viewer dialog for
the memlog and make the PRD jump to that requirement code" as one combined action from the
parent's perspective, keeping the dialog itself a "dumb" reporter of user intent.

**Rationale**: `MemoryLogDialog` is owned by `PrdDetailView`, not threaded through
`App.tsx`'s global `openFile` state, precisely because it needs privileged access to data
(`prdReferences`) and behavior (`handleSelectReference`) that only exist while a specific
PRD is open — data the globally-shared, decoupled `FileViewerDialog` has no channel to
receive without a much larger, awkward lift of PRD-specific state up through
`NavigatorDetailPane`/`NavigatorView`/`App.tsx`. Reusing `FileViewerDialog.tsx`'s own
proven shell structure (rather than inventing a new one) sidesteps re-discovering the
"controls must be a sibling of the scrolling content, not nested inside it" lesson feature
012 already had to fix once.

**Alternatives considered**: Extending `getFileRenderMode`/`FileViewerDialog` to recognize
`.memlog.md` by filename and render it bespoke *everywhere* it's opened (including
directly from the Output tab's own file browser) — rejected; the feature description
frames this bespoke view purely in terms of the PRD tile's own interaction, and the
requirement-code jump behavior has no meaning at all outside a currently-open PRD's
context, so extending the global dialog would either need an awkward optional
PRD-context prop threaded everywhere, or silently do nothing useful when opened from a
context with no PRD open — neither is better than a small, separately-owned dialog scoped
to exactly where this behavior actually applies (FR-018, Assumptions).

## 7. Grey-out styling

**Decision**: When a tile's underlying condition (matching review files present /
`addendum.md` present / `.memlog.md` present) is false, its icon gets `color="disabled"`
and its label gets `color="text.disabled"` — two different palette tokens, not the same
string reused on both — and the tile carries no `onClick` at all. Otherwise, both render
identically to the tile's enabled appearance.

**Rationale**: MUI's icon components (`SvgIcon`, and every `@mui/icons-material` icon
built on it) accept `"disabled"` as a named `color` value, resolving to
`theme.palette.action.disabled` — this app already relies on that exact value (feature
011's backlog-status icon). `Typography`'s own `color` prop has no such named value; its
resolvable tokens are `primary`/`secondary`/`success`/`error`/`info`/`warning`/`text*`, or
a literal theme dot-path like `"text.disabled"` — the same dot-path style this app already
uses everywhere else for text color (`color="text.secondary"` throughout
`NavigatorDetailPane.tsx`, `CsvGrid.tsx`, and elsewhere). Writing `color="disabled"` on a
`Typography` would silently fail to resolve to any real color, leaving the label
un-greyed and undercutting SC-004. Omitting `onClick` entirely (rather than attaching a
no-op handler) is the simplest way to guarantee a disabled tile truly does nothing on
click.
