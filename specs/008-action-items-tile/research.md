# Phase 0 Research: Action Items Tile

## 1. Where `ref` gets resolved to an absolute path

**Decision**: Server-side, in `parseActionItems` - given the project's root path (already
known to the route calling `parseSprintStatus`), compute each item's absolute path via
`join(projectRootPath, ref)` at parse time, and include it in the response as a
pre-resolved field (`resolvedPath`) alongside the raw `ref` string.

**Rationale**: The alternative - resolving `ref` client-side - would require the browser
to know the project's absolute root path, which isn't otherwise exposed to it (the closest
thing, `tabStates.output.tree.path`, is the `_bmad-output` folder's own absolute path, and
depends on the Output tab's tree having already loaded, an unnecessary and race-prone
dependency). The server always knows `root.path` already; resolving there is simpler, has
no race condition, and needs no client-side string surgery on a hardcoded `_bmad-output/`
prefix.

**Alternatives considered**: Client-side resolution by stripping a known `_bmad-output/`
prefix from `ref` and joining with the Output tab's already-fetched tree path - rejected
per the race condition above, and because it would only work when `ref` happens to start
with that exact prefix, whereas server-side `join(root.path, ref)` works for any
root-relative path without assuming its shape.

## 2. Security: does pre-resolving `ref` need its own containment check?

**Decision**: No new check is needed - `join(root.path, ref)` may compute a path outside
`_bmad-output` (or even outside the project entirely, for a malicious/malformed `ref`),
but the *existing* `GET /api/file/output` route (feature 004) already runs its own
`isWithinRoot` containment check against every path it's asked to serve, rejecting
anything outside the Output tab's own root with a 403. `parseActionItems` itself never
reads the filesystem - it only computes a candidate string.

**Rationale**: This is the same defense-in-depth this app already relies on everywhere
else a path reaches a file-serving route - re-validating containment a second time inside
`parseActionItems` would duplicate logic the download route already owns, without closing
any gap it doesn't already close.

## 3. Reusing the existing file viewer from the Navigator tab

**Decision**: Generalize `App.tsx`'s `openFileDialog`/`loadFileContent` to accept any
`TabId` (not just the Infra/Output `FolderTabId`), with the caller passing the *current*
path explicitly (Infra/Output already have one - `tabStates[tab].selectedPath`; Navigator
uses `navigatorSelectedItemId`, e.g. `"sprint-status"`). The `NavigationState` pushed when
opening a file from Navigator uses `{ tab: "navigator", path: navigatorSelectedItemId,
openFile: resolvedPath }` - the exact same shape Infra/Output already use, just with
Navigator's own tab/path values, so closing (its "X", Escape, or browser Back) needs no
new logic at all (FR-010).

The one real wrinkle: fetching the file's *content* still has to go through
`GET /api/file/:tab`, which only recognizes `"infra"`/`"output"` as valid tabs (feature
004) - `"navigator"` isn't a folder tab and never will be. So the content fetch itself
maps `"navigator"` to `"output"` (the resolved path is already an absolute path under
`_bmad-output`, per decision 1), while the *history* state keeps `"navigator"` as the tab,
since that's where the user actually is and should return to.

**Rationale**: This reuses 100% of the existing dialog component, its rendering-mode
dispatch, and its close/history behavior (feature 004) - exactly what FR-010 requires -
without inventing a parallel "Navigator can also open files" mechanism. The
history-tab-vs-fetch-tab distinction is a small, explicit mapping (`tab === "navigator" ?
"output" : tab`), not a new abstraction.

**Alternatives considered**: Adding `"navigator"` as a recognized tab to
`GET /api/file/:tab` itself - rejected; that route's `:tab` parameter is specifically
about *which folder root* to contain the path within (`isWithinRoot`), and Navigator isn't
a folder root - it has no `bmadFolderPath`-equivalent of its own. Every action item's
resolved path is already an Output-tab path by construction (decision 1), so mapping at
the call site is both correct and simpler than teaching the route a tab that isn't real.

## 4. Layout: two tiles sharing a row, one scrolling internally

**Decision (round 3, final)**: Wrap the Summary tile and the new Action Items tile in
their own row (`display: flex`), with `width: "100%"` on the row for the same reason as
below. The Summary tile's wrapper is measured with a `ResizeObserver` (`useLayoutEffect` in
`SprintStatusView.tsx`), and the resulting pixel height is passed to `ActionItemsTile` as
an explicit `height` prop, applied directly to its outer `Paper` - not derived from CSS
`alignItems: stretch`. The Summary tile's own wrapper uses `alignSelf: "flex-start"` so it
is never itself stretched by the row (see the pitfall below). Action Items' inner list
keeps `flex: 1` + `minHeight: 0` + `overflow: auto` so it scrolls within that fixed height
regardless of item count.

This row wrapper itself also needs `width: "100%"` - it becomes a new direct child of
`SprintStatusView.tsx`'s existing outer container, which sets `alignItems: "flex-start"`
specifically so non-full-width children (like the Summary tile) don't stretch to the full
pane width. Without that override, the row itself would size to its own content's natural
width, and "fills remaining width" would fail despite `flex: 1` being correct *within* an
already-too-narrow row. This is the exact same override the epic-tile stack already needed
from that same outer container, for the identical reason (feature 007).

**Rationale**: FR-002 (round 3) requires the Action Items tile to match the Summary tile's
height *exactly*, for *any* number of action items, while the Summary tile itself must
never be constrained below (or forced to scroll past) its own natural content height. Pure
CSS cannot satisfy both simultaneously: per the flexbox spec, every flex item's own
max-content ("hypothetical") cross size contributes to the shared row's height computation
regardless of `overflow`, so an unbounded action-items list - if given no height of its own
- eventually becomes the tallest sibling and inflates the whole row (dragging the Summary
tile up with it, with no scrolling ever occurring, since nothing is ever actually
constrained). Only an *explicit* height on Action Items prevents that, and the only way to
make that explicit height always exactly equal the Summary tile's real rendered height
(not a guessed constant that's wrong whenever real field values are unusually long or
short) is to measure it.

**Rejected approaches (rounds 1–3, in order)**:
1. `alignItems: stretch` with neither tile given an explicit height - whichever tile's own
   content is naturally taller wins the row's height. Works by coincidence for a short
   action-items list (fewer, smaller rows than the Summary tile's 7 fields), but an
   unbounded list eventually makes Action Items the taller sibling, defeating "the Summary
   tile must never grow to accommodate more items."
2. A fixed pixel `height` on the Action Items tile alone, relying on `alignItems: stretch`
   to pull the (shorter) Summary tile up to match - failed because the *Summary* tile's own
   auto-height content still wins the hypothetical-size contest whenever it's naturally
   taller than that fixed value (e.g. a long `story_location`/`tracking_system` value),
   leaving Action Items visibly shorter than Summary.
3. A fixed `height` on the row itself (not either tile) - guaranteed equal heights, but a
   *fixed* height forced the Summary tile to scroll internally whenever its real content
   exceeded that value, which FR-002 (round 3) explicitly forbids.
4. `minHeight` on the row instead of `height` - let the row grow to fit Summary's content
   when it's taller than the floor (no more forced scrolling on Summary), but this still
   didn't bound Action Items' *own* hypothetical size: with enough items, Action Items'
   natural content height (uncapped) still won the contest and inflated the row (and
   Summary along with it) rather than scrolling - this is the exact bug FR-002 (round 3)
   was written to rule out.

**Pitfall hit during implementation**: the Summary tile's measurement `ref` must sit on an
element with `alignSelf: "flex-start"` (not the row's default `stretch`). Without it, the
row's own `alignItems: stretch` stretches the *measured* wrapper to match whatever height
Action Items currently has (initially a fallback constant) - so the `ResizeObserver`
reports that stretched size right back, not the Summary tile's true natural content height,
producing a stable-but-wrong feedback loop that never corrects itself.
