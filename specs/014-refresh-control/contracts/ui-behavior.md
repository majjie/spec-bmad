# Contracts: Refresh Control

## API contract: `GET /api/refresh`

The one new network interface this feature adds.

| | |
|---|---|
| Method | `GET` (research.md § 1 — kept GET, not POST, to avoid extending `http-server.ts`'s GET-only handling for one endpoint) |
| Path | `/api/refresh` |
| Query params | None |
| Request body | None |
| **Success** | `200`, no body. Calls `cache.invalidate(root)` — invalidates *every* cached root for this project (both `bmadFolderPath` and `bmadOutputFolderPath`), per feature 001's `HierarchyCache.invalidate()`. Idempotent: calling it again before any `get()` has re-scanned is a harmless no-op re-mark. |
| **Failure** | Not expected in normal operation — `invalidate()` is a synchronous, non-throwing, in-memory operation. No specific failure branch is modeled; an unexpected server-side error would surface the same way any other route's unexpected error would. |

This route does **not** itself re-scan anything — it only marks the cache stale. The next
call to any route that goes through `cache.get()` (tree, contents, navigator/tree) performs
the actual re-scan lazily, exactly as `HierarchyCache` already does today for any other
cause of staleness.

## UI behavior contract

### Placement (FR-001–FR-003)

`App.tsx`'s `<Tabs>` and a new `IconButton` (containing `RefreshIcon`) are both children of
one shared flex row, `IconButton` on the right, vertically centered against the tabs'
own height (research.md § 5) — not a separately positioned, absolutely-placed element.

### Triggering a refresh (FR-004–FR-011)

Selecting the control, while not already `refreshing`:

1. Sets `refreshing = true` (disables the control; its icon begins rotating).
2. Calls `fetchRefresh()` (`GET /api/refresh`, `web/src/api.ts`).
3. On success, concurrently:
   - Re-fetches `fetchTabs()` → updates `availability` (research.md § 4).
   - For each folder tab (`infra`/`output`) currently available: re-fetches
     `fetchTree(tabId)`; then attempts `fetchContents(tabId,
     tabStates[tabId].selectedPath)` — on failure (the selected folder no longer exists),
     falls back to the freshly-fetched tree's own root path instead (research.md § 2).
     `expandedPaths` is left as-is either way.
   - Re-fetches `fetchNavigatorTree()` → updates `navigatorTree`. If
     `navigatorSelectedItemId` no longer resolves in the fresh tree (a PRD leaf path via
     the shared `findPrdFolderEntry`, or `"sprint-status"` when
     `sprintStatusAvailable` has become `false`), resets it to `null` (FR-006's fallback).
   - Increments `refreshToken` — remounting `NavigatorDetailPane` (research.md § 3), which
     re-runs whichever fetch effect it currently owns (Sprint Status's or
     `PrdDetailView`'s) from scratch, picking up fresh data with zero changes to either
     component's own internals.
4. Once every directly-awaited re-fetch above has settled, sets `refreshing = false`.
5. On failure (the `GET /api/refresh` call itself, or any of the re-fetches, rejects): sets
   `refreshing = false` and briefly renders the icon with `color="error"` before reverting
   (research.md § 6) — no other visible content changes beyond what already landed (see
   below); whatever was already displayed before the refresh, and wasn't otherwise updated,
   stays as-is (FR-009).

**Partial-failure semantics**: each of the re-fetches in step 3 applies its own state
update independently, as soon as it individually resolves — there is no rollback. If, for
example, `fetchTabs()` and the Output tab's re-fetch both succeed but
`fetchNavigatorTree()` then rejects, the Output tab's refreshed tree/contents remain
visible; only the shared `refreshing` flag and the brief error tint reflect that the
overall operation didn't fully complete. This is intentional — treating the whole refresh
as all-or-nothing would mean discarding real, already-fetched, correct data just because a
sibling fetch happened to fail.

### Non-goals (explicitly out of scope, per Assumptions)

- An already-open file-viewer dialog's own content is untouched by a refresh (FR-010) —
  neither `fetchRefresh()` nor any of the re-fetches above touch `openFile` state at all.
- No new toast/snackbar/notification mechanism is introduced.
- No keyboard shortcut is added for triggering a refresh — click-only.

## Regression guard (FR-011)

Every existing Navigator/Infra/Output tab behavior — tree selection, history
(back/forward), Sprint Status rendering, the PRD detail view and its own tiles/index
column, the modal `FileViewerDialog` — must continue to work exactly as before. None of
this feature's changes alter any existing route's behavior for callers other than the new
one.
