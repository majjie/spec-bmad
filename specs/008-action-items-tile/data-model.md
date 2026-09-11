# Phase 1 Data Model: Action Items Tile

## `ActionItem` (`src/navigator/action-items.ts`)

```ts
interface ActionItem {
  id: string;              // synthetic (array index) if the file's own id is missing -
                            // never displayed, only used as a stable list key
  epic: number | null;     // null when the `epic` property is missing/non-numeric
  action: string | null;   // null when the `action` property is missing
  owner: string | null;    // null when the `owner` property is missing
  status: string | null;   // null when the `status` property is missing
  ref: string | null;      // the raw ref text (FR-007's tooltip source); null when absent
  resolvedPath: string | null; // absolute path (research.md § 1); null iff ref is null
}
```

Each field's `null` vs. present state is exactly what FR-008's per-element hiding reads
from - a `null` field means "this action item's YAML entry didn't have this property,"
distinct from an empty string (which would mean the property was present but blank, and
per FR-008's literal wording, still renders - only a *missing* property hides its
element). `parseActionItems` never invents a placeholder value for a missing property.

## `SprintStatusResult` (extended)

```ts
interface SprintStatusResult {
  summary: SprintStatusSummary;   // unchanged (feature 006/007)
  epics: EpicStatusGroup[];        // unchanged (feature 006)
  actionItems: ActionItem[];       // NEW
}
```

`parseSprintStatus`'s signature gains the project's root path:

```ts
function parseSprintStatus(parsedYaml: unknown, projectRootPath: string): SprintStatusResult;
```

## Derivation rules (quick reference)

| Input | Output |
|---|---|
| `action_items` absent, or not an array | `actionItems: []` (FR-012's empty state) |
| An `action_items` entry that isn't an object | Skipped entirely (tolerant parsing, matching `parseSprintStatus`'s existing style) |
| The parsed list | Stably partitioned: every item whose `status !== "done"` (including `null`) before every item whose `status === "done"`; file-declared order preserved within each group (FR-009, post-implementation Clarifications) |
| An entry's `id` missing or non-string | A synthetic id (its array index, stringified) - never shown, only a list key |
| An entry's `epic` present and a number | Kept as-is; displayed as `epic-<N>` (spec.md's Clarifications) |
| An entry's `epic` missing or non-number | `epic: null` → epic label hidden (FR-008) |
| An entry's `owner`/`status`/`action` present and a string | Kept as-is |
| An entry's `owner`/`status`/`action` missing or non-string | `null` → that element hidden (FR-008) |
| An entry's `ref` present and a string | Kept as `ref`; `resolvedPath = join(projectRootPath, ref)` |
| An entry's `ref` missing or non-string | `ref: null`, `resolvedPath: null` → jump icon hidden (FR-008) |

## Frontend rendering shape (not a stored entity)

Each item renders as a two-line block (FR-004, post-implementation Clarifications): a
header line, then the action text on its own line below it.

| Element | Line | Rendered when | Icon/content |
|---|---|---|---|
| Owner-type icon | Header | `owner !== null` | Human-outline icon unless `owner === "dev loop"` exactly, else computer-like icon; tooltip = `owner` (FR-005) |
| Tick-box icon | Header | `status !== null` | Filled iff `status === "done"` exactly, else unfilled (FR-006) |
| Jump icon | Header | `resolvedPath !== null` (equivalently, `ref !== null`) | A magnifying-glass (search) icon; tooltip = `ref`; `onClick` opens the file viewer with `resolvedPath` (FR-007/FR-010) |
| Epic label | Header | `epic !== null` | `epic-<N>`, small text, immediately right of the jump icon (FR-004, Clarifications) |
| Action text | Below header | `action !== null` | The item's main text, on its own line (FR-004) |

Adjacent rows alternate background shading ("candy stripe", FR-014) - a presentational
detail with no bearing on the data shape above.

## `NavigationState` (unchanged shape, new usage)

No shape change (`{ tab, path, openFile? }`, feature 002/004/007). Opening a file from
the Action Items tile pushes `{ tab: "navigator", path: navigatorSelectedItemId,
openFile: resolvedPath }` - the same shape Infra/Output already push, just with
Navigator's own tab/path values (research.md § 3).
