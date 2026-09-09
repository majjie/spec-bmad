# Research: Refresh Control

## 1. Exposing cache invalidation without touching the GET-only HTTP layer

**Decision**: A new `GET /api/refresh` route, wired into `api-router.ts` alongside the
other `GET /api/*` routes, calling `cache.invalidate(root)` and returning `{ status: 200 }`
with no body.

**Rationale**: `HierarchyCache.invalidate(root: ProjectRoot)`
(`src/artifacts/cache.ts`) already exists, is already unit-tested
(`tests/unit/artifacts/cache.test.ts`), and already invalidates *both* of a project's
underlying root folder paths (`bmadFolderPath` and `bmadOutputFolderPath`) in one call —
it was built and specified back in feature 001 (FR-005: "The system MUST provide a
mechanism to invalidate a project's cached hierarchy") in direct anticipation of a future
refresh trigger, but has had zero callers until now. This means the confirmed Clarification
("every tab refreshes at once") is already the *only* behavior `invalidate()` offers — no
new per-tab scoping logic is needed at all.

The one real constraint: `src/server/http-server.ts`'s `handleRequest` currently rejects
any non-`GET` method with a bare 405, and every existing route in this codebase is `GET`.
Introducing `POST` support to accommodate one action-triggering endpoint would touch a
small, foundational, already-tested module purely for this feature's sake.

**Alternatives considered**: `POST /api/refresh` — more conventionally RESTful for an
action with a side effect, but rejected here: this tool is bound to `127.0.0.1` only, has
no reverse proxy or shared-cache layer in front of it, and every other route is already
GET — a GET-triggered, side-effect-bearing action is a well-understood, low-risk
simplification for a single-user local tool, and avoids being the first thing to need
method-based branching in `http-server.ts`. If a second action-style endpoint is ever
needed later, that would be the point to revisit adding real method support.

## 2. What "currently displayed" means for Infra/Output tabs

**Decision**: `App.tsx`'s refresh handler re-fetches, for each folder tab
(`infra`/`output`) whose root exists: `fetchTree(tabId)` (a fresh tree) and
`fetchContents(tabId, tabStates[tabId].selectedPath)`. If that `fetchContents` call fails
(the previously selected folder no longer exists post-refresh — the same 404 the contents
route already returns for a missing path), the handler falls back to selecting the tab's
own root path instead (fetching *its* contents), mirroring the exact fallback the mount-time
initial-load effect already performs. `expandedPaths` is left untouched either way — a
stale entry for a since-removed folder simply has nothing to expand into; `FolderTree`
already renders whatever currently exists without erroring on a stale expansion entry.

**Rationale**: This state already lives directly in `App.tsx` (`tabStates`), so refreshing
it is a plain re-fetch-and-`setState`, reusing the identical fetch functions and fallback
logic the mount effect already established — no new derivation logic, no new component.

**Alternatives considered**: A dedicated "does this path still exist" pre-check before
deciding whether to keep or reset the selection — rejected; attempting the fetch and
catching failure is simpler and reuses the server's own authoritative answer instead of
duplicating that check on the client.

## 3. What "currently displayed" means for the Navigator tab

**Decision**: Two parts.

- **The tree itself**: re-fetch `fetchNavigatorTree()`. If `navigatorSelectedItemId` is a
  PRD leaf path, check whether it still resolves in the fresh tree via a shared
  `findPrdFolderEntry(tree, itemId)` lookup (extracted from `NavigatorDetailPane.tsx`,
  where it already existed as an unexported local function, into `navigatorApi.ts` so both
  that component and `App.tsx`'s refresh handler use the identical definition). If it no
  longer resolves, reset `navigatorSelectedItemId` to `null` (FR-006's fallback). If
  `navigatorSelectedItemId === "sprint-status"` and the fresh tree's
  `sprintStatusAvailable` is now `false`, the same reset applies.
- **The detail pane's own fetched data** (Sprint Status's epics/action items, or a PRD
  leaf's `prd.md`/folder-contents listing): both already live as local state inside
  `NavigatorDetailPane.tsx` / `PrdDetailView.tsx`, each fetched in a `useEffect` keyed on
  data that a refresh doesn't change (`selectedItemId`, `entry.path`) — so neither effect
  would naturally re-run just because the button was clicked. `NavigatorView.tsx` gains a
  new `refreshToken` prop, applied as `key={refreshToken}` on `NavigatorDetailPane` only
  (not on the tree sidebar next to it). Incrementing that counter in the refresh handler
  makes React discard the old `NavigatorDetailPane` instance and mount a fresh one,
  re-running whichever fetch effect it owns (Sprint Status's or `PrdDetailView`'s) from
  scratch — with no changes needed inside either component.

**Rationale**: A `key`-driven remount is a well-established React idiom for "force this
subtree to reset and re-fetch," and is far smaller than threading a new prop into both
`NavigatorDetailPane.tsx` and `PrdDetailView.tsx` and editing each one's effect dependency
array. The only trade-off is that any purely-presentational internal state those
components hold (e.g. `SprintStatusView`'s own set of expanded epic keys) also resets —
judged acceptable, since the spec's own selection-preservation requirement (FR-006) is
about the Navigator's selected item and expanded *tree* state, both of which live in
`App.tsx` and are untouched by this remount, not about a rendered view's own incidental
internal UI state.

**Alternatives considered**: Lifting Sprint Status's and PrdDetailView's fetched data up
into `App.tsx` so it could be explicitly re-fetched like `tabStates` is — rejected as a
much larger, riskier refactor of two already-shipped, tested components, for no benefit
this feature actually needs.

## 4. Refreshing tab availability itself

**Decision**: Also re-fetch `fetchTabs()` as part of a refresh, updating `availability`.

**Rationale**: If a whole tab's root folder (e.g. `_bmad`) was added or removed on disk
since load, a comprehensive refresh should let a newly-appeared tab become visible (or a
now-missing one disappear) too — cheap to include, and keeps "every tab's folder
structure" genuinely comprehensive rather than assuming the set of tabs itself is static.

**Alternatives considered**: Skipping this (assume tab availability is fixed for the
process lifetime) — rejected; it's a one-line addition to a refresh that already re-fetches
everything else, and leaving it out would be a surprising gap given how thorough the rest
of the refresh already is.

## 5. The control's placement, sizing, and icon

**Decision**: Wrap the existing `<Tabs>` element and a new `IconButton` in a shared flex
row (`display: "flex", alignItems: "center", justifyContent: "space-between"`), with the
`IconButton` on the right. Height-matching is achieved by vertical centering within that
shared row (`alignItems: "center"`) against the Tabs' own intrinsic height, rather than a
hardcoded pixel value that could drift from the theme's own tab sizing. Icon:
`@mui/icons-material/Refresh` — the standard, universally-recognized circular-arrows
reload icon.

**Rationale**: Centering within a shared flex row is robust to the theme's own tab height
(already established once at `typography.fontSize: 15`, feature 011) without hardcoding a
number that could silently drift out of alignment if that theme value ever changes again.
`RefreshIcon` needs no justification beyond being the standard icon for this exact action.

**Alternatives considered**: A fixed pixel height copied from the Tabs' current rendered
size — rejected; brittle against future theme changes, and unnecessary when simple
flex-centering already achieves the same visual result robustly.

## 6. In-progress and failure feedback

**Decision**: While a refresh is in flight, the `IconButton` is `disabled` (structurally
preventing an overlapping second refresh, FR-008) and its icon rotates via a CSS `sx`
keyframe animation — a widely recognized "working" convention for a refresh icon
specifically, needing no new component. On failure, the icon briefly renders with
`color="error"` for a couple of seconds before reverting, surfacing the failure (FR-009)
without introducing a new toast/snackbar UI paradigm this app has never used elsewhere.

**Rationale**: A rotating icon is the de facto standard "refreshing" indicator and reuses
only `sx`, no new dependency. A brief error tint keeps the failure signal local to the
control itself, consistent with this app's existing preference for inline, contextual
feedback (e.g. `FileViewerDialog`'s inline error text) over app-wide notification
mechanisms.

**Alternatives considered**: A `CircularProgress` spinner replacing the icon — rejected;
it would be the first spinner-style loading indicator introduced anywhere in this app
(every other loading state today is textual, "Loading…"), whereas a rotating refresh icon
is both simpler to implement and a more universally-understood convention for this
specific action.
