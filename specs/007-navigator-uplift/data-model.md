# Phase 1 Data Model: Navigator Tab Uplift

## `SprintStatusSummary` (extended)

```ts
interface SprintStatusSummary {
  generated: string;
  lastUpdated: string;
  project: string;
  projectKey: string;
  trackingSystem: string;
  storyLocation: string;
  activeEpic: string;   // NEW - FR-009/FR-010
}
```

`EpicStatusGroup`/`SprintStatusResult` (feature 006) are otherwise unchanged.

## `calculateActiveEpic` derivation table

| Condition (checked in this order) | Result |
|---|---|
| `epics.length === 0` | `"unknown"` (FR-010) |
| Every epic's `status === "done"` | `"All complete"` |
| Every epic's `status === "backlog"` | `"Not started"` |
| Some epic's `status === "in-progress"` | That epic's `epicKey` (first match, in `epics`' existing file-declared order) |
| None of the above | `"unknown"` |

`epics` is already in file-declared order by the time `calculateActiveEpic` sees it
(feature 006's `parseSprintStatus` guarantees this), so "first match" is simply the first
array element satisfying the condition - no additional ordering logic needed.

## `NavigationState` (unchanged shape, generalized constructor)

```ts
// unchanged:
interface NavigationState {
  tab: TabId;
  path: string;
  openFile?: string;
}

// generalized (was: createBaselineState(infraRootPath: string)):
function createBaselineState(tab: TabId, path: string): NavigationState;
```

## Default-tab resolution (App.tsx, not a persisted entity)

| `tabs.navigator` | Initial `activeTab` | Resolved `activeTab` | Baseline established |
|---|---|---|---|
| `true` | `"navigator"` (optimistic) | `"navigator"` (unchanged) | `{tab: "navigator", path: ""}`, as soon as `tabs.navigator` is known - no further fetch needed |
| `false` | `"navigator"` (optimistic) | `"infra"` (explicit fallback, FR-002) | `{tab: "infra", path: <Infra's root path>}`, once Infra's tree resolves - unchanged from feature 002/003 |

## Status → icon mapping (rendering-time only, not a stored entity)

| Status value | Has an icon? |
|---|---|
| `"done"` | Yes |
| `"review"` | Yes |
| `"backlog"` | Yes |
| `"in-progress"` | Yes |
| Anything else (e.g. `"ready-for-dev"`, `"optional"`) | No - text label only (FR-005) |

Applies identically to an epic's own `status` and to each of its `stories[].status`
(FR-003/FR-004) - the same status value always maps to the same icon in both places.
