# Phase 1 Data Model: Output Navigator Tab

## PRD grouping (`src/navigator/prd-grouping.ts`)

```ts
interface PrdDateEntry {
  date: string;        // extracted "YYYY-MM-DD", used as the tree label (FR-006)
  folderName: string;  // full original folder name, e.g. "prd-foo-2028-08-30"
  path: string;         // absolute path to the backing folder - doubles as the node's
                         // selection id (FR-009's placeholder text uses folderName, not
                         // this path - see Assumptions in spec.md)
}

interface PrdProjectGroup {
  project: string;          // case-sensitive value shared by this group's folder names
  dates: PrdDateEntry[];     // sorted newest-to-oldest (FR-006)
}

interface PrdNonConformingEntry {
  folderName: string;  // literal folder name, used as both label and placeholder text
  path: string;
}

interface PrdGroupingResult {
  projects: PrdProjectGroup[];             // sorted by `project`, code-point order (FR-005)
  nonConforming: PrdNonConformingEntry[];  // sorted by `folderName`, code-point order (FR-007)
}
```

`groupPrdFolders(entries: { name: string; path: string }[]): PrdGroupingResult` - pure,
derived entirely from research.md § 3's algorithm. Returns `{ projects: [], nonConforming:
[] }` (not `null`) for an empty input list - the *route* is what turns an empty result into
"omit the PRD root node at all" (FR-008), keeping this function's contract simple (no
special-cased null return).

## Sprint status (`src/navigator/sprint-status.ts`)

```ts
interface SprintStatusSummary {
  generated: string;
  lastUpdated: string;
  project: string;
  projectKey: string;
  trackingSystem: string;
  storyLocation: string;
}

interface StoryStatus {
  key: string;     // e.g. "1-6a-walk-the-artifact-tree-safely"
  status: string;  // e.g. "done", "in-progress" - shown verbatim, not re-interpreted
}

interface EpicStatusGroup {
  epicKey: string;                  // e.g. "epic-2"
  status: string;
  stories: StoryStatus[];            // file-declared order (FR-013)
  retrospectiveStatus: string | null; // null when no epic-N-retrospective key exists
}

interface SprintStatusResult {
  summary: SprintStatusSummary;
  epics: EpicStatusGroup[];  // file-declared order of epic-N keys (FR-013)
}
```

`parseSprintStatus(parsedYaml: unknown): SprintStatusResult` - pure, derived entirely from
research.md § 4's two-pass algorithm. Throws only if `parsedYaml` isn't an object at all
(e.g. the YAML document was a bare string or number) - the route layer is what turns a
`js-yaml` parse exception (malformed YAML text) into FR-014's error response; this
function's own contract assumes it already received *some* parsed object and only has to
shape it, keeping "YAML text is malformed" and "YAML parsed but has an unexpected shape"
as two separately testable failure points.

## API contracts (server ↔ web)

Shared between `src/server/types.ts` and `web/src/api.ts` (mirrors the existing
`TabAvailability`/`FolderTreeNode`/`ContentsEntry` pattern):

```ts
type TabId = "navigator" | "infra" | "output";

interface TabAvailability {
  navigator: boolean;  // true iff _bmad-output exists (FR-002) - same signal `output` uses
  infra: boolean;
  output: boolean;
}

// GET /api/navigator/tree
interface NavigatorTree {
  prd: PrdGroupingResult | null;   // null when FR-008 applies (no prds folder / no subfolders)
  sprintStatusAvailable: boolean;  // FR-011
}

// GET /api/navigator/sprint-status
// 200 body: SprintStatusResult
// 404: sprint-status.yaml doesn't exist (race: tree said sprintStatusAvailable, file
//      removed before this request - same defensive handling as feature 004's file route)
// 422 body: { error: string }  - FR-014, the file exists but couldn't be parsed as YAML
```

## Derivation rules (quick reference)

| Input | Output |
|---|---|
| No subfolders under `prds/` | `NavigatorTree.prd === null` (FR-008) |
| A folder name matching `<project>-YYYY-MM-DD` | Grouped under its project, dated (FR-005/006) |
| A folder name not matching that shape | Listed under `nonConforming` (FR-007) |
| `sprint-status.yaml` absent | `NavigatorTree.sprintStatusAvailable === false`, no "Sprint Status" tree node (FR-011) |
| `sprint-status.yaml` present but unparseable | Tree node still shown; selecting it → 422 → error message in the detail pane (FR-014) |
| `development_status` absent/empty in an otherwise-valid file | `SprintStatusResult.epics === []`; Summary still populates |
| A `development_status` key matching neither `epic-N`, `epic-N-retrospective`, nor `<epic's own N>-...` | Left out entirely (FR-015) |
