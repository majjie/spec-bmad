# Phase 1 Data Model: Explorer UI Polish

Derived from `spec.md` § Key Entities. This feature adds one new frontend-only concept;
nothing here is transmitted over the API or persisted anywhere (research.md § 3 — reload
always resets to the default view).

## NavigationState

The **Navigation History Entry** entity from spec.md, as the concrete object stored in
each `history` entry's `state`.

| Field | Type | Notes |
|---|---|---|
| `tab` | `TabId` (`"infra" \| "output"`) | Which tab was active |
| `path` | `string` | Which folder was selected within that tab |

**Validation rules**:
- Every pushed or replaced history entry's `state` is a `NavigationState` — never `null`,
  except for whatever entry existed in the browser's history before the app itself loaded
  (outside this app's control, per spec.md's Edge Cases — going back past the app's own
  baseline entry is standard browser behavior).
- The baseline entry (research.md § 2) is always `{ tab: "infra", path: <infra's root
  path> }` — the app's hardcoded default view, never derived from a previous session.

## Pure decision logic (`web/src/navigationHistory.ts`)

Two small, DOM-independent functions extracted for test-first coverage per constitution
Principle V, mirroring feature 002's `sortEntries.ts`:

| Function | Signature | Purpose |
|---|---|---|
| `createBaselineState` | `(infraRootPath: string) => NavigationState` | Builds the FR-012 baseline state object |
| `statesEqual` | `(a: NavigationState, b: NavigationState) => boolean` | Used to detect a *redundant* navigation — e.g. re-clicking the tab or folder that's already active/selected (MUI's `Tabs onChange` fires even for the already-active tab) — so it doesn't push a no-op duplicate entry (FR-001/FR-002's "a *different* folder"/"*switching* tabs" wording). Expand/collapse never reaches this check at all: `FolderTree.tsx`'s `onExpandedItemsChange` is a separate callback from `onSelectedItemsChange` and never calls `navigate()`, which is what actually satisfies FR-005. |

Everything else — calling `history.pushState`/`replaceState`, subscribing to `popstate`,
and applying a restored `NavigationState` back into React state — lives directly in
`App.tsx` and is validated manually (research.md's Testing note; `quickstart.md`).
