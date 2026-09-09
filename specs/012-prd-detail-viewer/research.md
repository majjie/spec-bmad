# Research: PRD Detail Viewer

## 1. Where does `prd.md`'s content come from?

**Decision**: Reuse the existing `GET /api/file/output` route, calling it with the plain
string `` `${entry.path}/prd.md` `` — `entry.path` is the absolute folder path already
present on the selected Navigator tree node (`PrdDateEntry.path` /
`PrdNonConformingEntry.path`, `web/src/api.ts`), and it's already a normalized absolute
POSIX path (server-constructed), so no path-joining utility is needed; none exists
anywhere in `web/src/` today, and Node's `path` module isn't guaranteed to run in this
Vite-bundled browser code without a polyfill.

Add one new export, `fetchFileContentOrNull(tab, path): Promise<string | null>`, alongside
the existing `fetchFileContent` in `web/src/api.ts` — identical to it, except it resolves
to `null` on a 404 response instead of throwing. `PrdDetailView.tsx` calls this new
function (not `fetchFileContent`) so it can distinguish "no `prd.md` at this folder"
(`null`, → FR-004's message) from a genuine fetch failure (still thrown, → the existing
error-message treatment) — see § 7 below for why this is needed and why `fetchFileContent`
itself is left untouched.

**Rationale**: `NavigatorDetailPane.tsx`'s `findPrdFolderName` already resolves
`selectedItemId` to the matching tree entry by its `path` field — it just discards
everything but `folderName`. Changing it to return the whole entry (or just also return
`path`) gives this feature everything it needs to build the file path itself, client-side,
with zero backend involvement. This exactly mirrors how feature 008 (Action Items) and
feature 009 (Epic Step Detail) jump to a spec document: they already know an absolute path
from previously-fetched data and pass it straight to the existing Output file route.

**Alternatives considered**: A new dedicated `/api/prd/:path` route — rejected as pure
duplication; the generic file-content route already serves any absolute path under
`_bmad-output`, and `prd.md` is nothing but another file under that tree.

## 2. Reusing the frontmatter-tooltip control without duplicating it

**Decision**: Extract `FileViewerDialog.tsx`'s inline (i)-icon + controlled `Tooltip` +
`PreambleReadout` block into a new `web/src/components/FrontmatterInfoControl.tsx`,
parameterized only by `preamble: Record<string, unknown>`. `FileViewerDialog.tsx` renders
it alongside its own Close button (unchanged behavior); the new `PrdDetailView.tsx` renders
it alone, with no Close button beside it (FR-003).

**Rationale**: This is the first time this exact block is needed by a second, real call
site — not a hypothetical one. Feature 010 built it once; feature 012 needs the identical
hover/click/opaque/scroll-none behavior in a second place. Extracting now (rather than
copy-pasting the ~30-line block) keeps both call sites' info-icon behavior identical by
construction, matching this project's own stated style of avoiding premature abstraction
until a genuine second consumer appears.

**Alternatives considered**: Copy the block into `PrdDetailView.tsx` — rejected; any future
tweak (e.g. another opacity/font-size follow-up like feature 010's) would then need to be
applied twice, and the two copies could silently drift.

## 3. Detecting requirement codes without breaking Markdown rendering

**Decision**: A two-pass design.

- **Pass 1 — pure derivation** (`web/src/prdIndex.ts`, test-first per constitution
  Principle V): scan the raw, already frontmatter-stripped Markdown text left-to-right with
  two regexes —
  - bullet style: `/\*\*([A-Z]{2,}-\d+)\*\*/g`
  - header style: `/^###\s+([A-Z]{2,}-\d+)\s+—/gm`

  producing an ordered `RequirementCodeReference[]`, each with a sequential anchor id
  (`prd-ref-0`, `prd-ref-1`, …) assigned strictly by order of appearance in the raw text —
  this order is exactly the order `ReactMarkdown` will later render the matching elements
  in, since Markdown is parsed top-to-bottom with no reordering.
- **Pass 2 — rendering** (`PrdDetailView.tsx`, manually verified only): pass
  `components={{ strong: ..., h3: ... }}` to `ReactMarkdown`. Each custom renderer checks
  whether its own element's full text content matches the corresponding code pattern
  exactly; if so, it consumes the next not-yet-assigned reference from Pass 1's array (via
  a `useRef` counter reset once per render pass, since renderer calls happen in document
  order within a single synchronous render) and attaches that reference's `id` to the
  rendered DOM node.

**Rationale**: A single-pass approach — collecting matches into a mutable array as a side
effect of the custom renderers, then reading that same array afterward to build the
sibling index column in one render — cannot work: the parent component's render function
body returns and finishes executing *before* React descends into `ReactMarkdown`'s own
tree and invokes the custom renderer callbacks for `strong`/`h3`. The index column would
therefore always see last render's data (or none, on the first render), one render behind.
Splitting into a pure, upfront pre-scan (Pass 1, computed via `useMemo` on the raw content,
independent of React's render tree) removes this ordering hazard entirely, and has the
added benefit of being fully unit-testable with no DOM/React involvement — the exact kind
of module this project's constitution requires test-first coverage for (paralleling
`frontmatter.ts`'s `stripFrontmatter`).

Matching each renderer call's own element to "the next reference in order" (rather than
re-matching by code value) is what correctly keeps duplicate codes (Edge Cases: same code
twice, or the same code in both styles) as distinct, individually-anchored occurrences,
since a value-based lookup couldn't distinguish them.

**Alternatives considered**: Regex-replacing the raw Markdown string to inject
`<a id="...">` spans before handing it to `ReactMarkdown` — rejected; it would require
hand-rolling Markdown-safe escaping/positioning for an inline HTML anchor inside bold text
and heading text, which `remark`/`react-markdown`'s AST-based rendering already handles
correctly via the `components` override mechanism instead.

## 4. Layout: making the index column "structurally separate," not just visually pinned

**Decision**: `PrdDetailView.tsx`'s root is a column flexbox: row 1 is the placeholder
tiles (fixed, small height); row 2 (`flex: 1`, `minHeight: 0`) is itself a row flexbox with
two children — a `flex: 1` file-viewer wrapper (`position: relative`, its own
`overflow: auto` scroll container, holding the (i) control `position: absolute` within
just that wrapper) and a fixed-width index column (`overflow: auto` on its own, matching
FR-013's "scrolls internally... too tall for the screen" for the *tooltip*, and naturally
for the column itself if it ever holds more prefix tiles than fit).

**Rationale**: The Clarification is explicit that the index column is "outside the file
viewer altogether... in a column to the right" — a distinct sibling region, not a
`position: sticky` trick layered inside the same scrolling container as the document. Two
independent `overflow: auto` regions side-by-side (a well-established flex pattern already
used across this app — e.g. Sprint Status's Summary/Action Items row) achieves exactly
that: scrolling the PRD's own content can never move the index column, because it isn't
inside that scroll container at all.

**Alternatives considered**: `position: sticky` on the index column inside the same
scrollable ancestor as the document — rejected outright per the Clarification's explicit
wording; it would still count as "inside the file viewer's scrollable content" in spirit,
even if visually similar.

## 5. Tooltip hover-through and internal scrolling

**Decision**: Reuse the exact controlled-Tooltip pattern from feature 010
(`open`/`onOpen`/`onClose` state), with `slotProps.tooltip.sx` adding
`maxHeight: "80vh", overflowY: "auto"` for FR-013. MUI's `Tooltip` is interactive
(`disableInteractive` is `false` by default) — the pointer moving from the trigger tile
onto the tooltip's own popper content already keeps it open with no extra listener wiring,
which is what FR-011 requires.

**Rationale**: This is the same mechanism already proven correct in feature 010 (and its
opacity/font-size follow-up) — reusing it needs no new interaction design, just a
different trigger element (a prefix tile) and a different content (the sorted code list
with click handlers) inside the tooltip's `title`.

**Alternatives considered**: A custom popper/portal built by hand — rejected; MUI's
`Tooltip` already satisfies every stated requirement (hover-through, click-to-open,
internal scroll via `sx`) with no new library and no new interaction logic to test.

**Implementation note**: FR-011 depends entirely on `disableInteractive` staying unset
(MUI's own default) — no other code enforces this, so the prefix tile's `Tooltip` should
never set that prop, and a code comment at the call site should say so to guard against a
future edit accidentally regressing it.

## 6. Icons for the three placeholder tiles

**Decision**: `RateReviewIcon` (`@mui/icons-material/RateReview`, already used elsewhere in
this app for a "review" status) for "reviews"; `PostAddIcon`
(`@mui/icons-material/PostAdd`) for "addendum"; `HistoryIcon`
(`@mui/icons-material/History`) for "memory log". All three already exist in
`node_modules/@mui/icons-material/`, so no new dependency is introduced.

**Rationale**: Each is a reasonably literal match for its label's meaning, and reusing
`RateReviewIcon` for "reviews" (rather than picking an unrelated new icon) keeps the same
icon meaning the same thing everywhere in the app it appears.

**Alternatives considered**: None seriously — this is a purely cosmetic, low-stakes choice
per FR-005, and the spec places no constraint on which specific icon is used beyond "an
icon to the left of its title."

## 7. Distinguishing "no `prd.md`" from a genuine fetch error (FR-004)

**Decision**: `fetchFileContent` (`web/src/api.ts`) discards the HTTP response status into
an opaque `Error` message string (e.g. `"GET /api/file/output failed with 404"`) — every
existing caller only ever displays that message verbatim, so none of them needed to
distinguish a 404 from any other failure. FR-004 needs exactly that distinction: "no
`prd.md` here" must show a clear, purpose-built message, not the fetch route's raw failure
text. Rather than changing `fetchFileContent`'s existing contract (which every other call
site, including `FileViewerDialog.tsx`, still relies on), add a second, narrowly-scoped
export in the same file: `fetchFileContentOrNull(tab: TabId, path: string): Promise<string
| null>` — identical to `fetchFileContent`, except it resolves to `null` on a 404 instead
of throwing. `PrdDetailView.tsx` calls this new function; a `null` result renders FR-004's
message, while any other thrown error still renders as a generic fetch-error message
(contracts/ui-behavior.md's "File-viewer region" states).

**Rationale**: The server side already makes this distinction cleanly — `getFileResponse`
(`src/server/routes/file.ts`) returns a plain `404` specifically when the file doesn't
exist (as opposed to `400`/`403`/`415` for other failure modes) — so the missing piece is
purely a client-side one: giving `PrdDetailView` a way to read that status without either
fragile string-matching on an already-formatted error message, or changing what every
existing caller of `fetchFileContent` sees. A second, small export keeps both behaviors
independently simple and correct.

**Alternatives considered**: Parsing the 404 out of the existing thrown `Error`'s message
text (e.g. `error.message.endsWith("404")`) — rejected as brittle string-matching with no
compiler-checked link to the actual status code. Changing `fetchFileContent` itself to
return `null` on 404 for every caller — rejected; `FileViewerDialog.tsx`'s existing
behavior (showing a generic error for any failed fetch, 404 included) is correct as-is and
shouldn't change meaning as a side effect of this feature.
