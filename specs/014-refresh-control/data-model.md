# Data Model: Refresh Control

This feature introduces no new persisted or derived data entity. It is a UI trigger over
data structures this tool already reads and already models:

- **`HierarchyCache` / `CacheEntry`** (`src/artifacts/types.ts`, feature 001) - unchanged.
  This feature adds the first caller of the already-existing `invalidate(root)` method;
  no new field, no new state shape.
- **`ProjectRoot`** (`src/artifacts/types.ts`) - unchanged; passed through to the new route
  exactly as it already is to every existing route.
- **Client-side state** - no new entity; existing state (`App.tsx`'s `tabStates`,
  `navigatorTree`, `navigatorSelectedItemId`, `availability`) is re-populated by re-running
  the same fetches already used at initial load, plus one new transient value:

  | Field | Type | Notes |
  |---|---|---|
  | `refreshToken` | `number` | Owned by `App.tsx`, incremented once per completed refresh. Passed to `NavigatorView` and applied as `key={refreshToken}` on `NavigatorDetailPane` only, forcing it to remount and re-run its own fetch effect (research.md § 3). Not persisted, not sent to the server - a purely local React re-mount signal. |
  | `refreshing` | `boolean` | Owned by `App.tsx`; `true` from the moment refresh is triggered until every re-fetch it directly awaits (tab availability, both folder tabs' trees/contents, the Navigator tree) has settled. Drives the control's disabled/rotating state (FR-008). Does not track the *remounted* detail pane's own internal fetch completion - research.md § 3 explains why that's an accepted scope boundary. |

## Server-side contract shape

The new route has no request body and no meaningful response body - see
`contracts/ui-behavior.md` for its full behavior.
