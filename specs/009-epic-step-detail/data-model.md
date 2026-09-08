# Phase 1 Data Model: Epic Step Detail

## `StepDetail` (`src/navigator/step-detail.ts`)

```ts
interface StepDetail {
  key: string;              // the raw declared key, unchanged (e.g. "1-6a-walk-the-artifact-tree-safely")
  index: string;            // derived (e.g. "1-1", "2-1", "1-6a") — falls back to `key` if unrecognized
  title: string;            // derived, dashes → spaces (e.g. "walk the artifact tree safely") — falls
                             // back to `key` if unrecognized
  status: string;           // unchanged from today's StoryStatus.status
  specPath: string | null;  // absolute path to a matching spec document; null when none exists
}
```

This replaces `StoryStatus` (research.md § 3) — same entity, three new derived fields.
`EpicStatusGroup.stories: StoryStatus[]` becomes `EpicStatusGroup.steps: StepDetail[]`;
`SprintStatusResult`'s own shape is otherwise unchanged.

`parseSprintStatus`'s signature gains the implementation-artifacts file listing:

```ts
function parseSprintStatus(
  parsedYaml: unknown,
  projectRootPath: string,
  specFileNames: string[],
): SprintStatusResult;
```

## Derivation rules (quick reference)

| Input | Output |
|---|---|
| A key matching `<epic>-<story>[letter]-<descriptive-text>` (e.g. "1-1-run-the-command...", "1-6a-walk-...") | `index` = the leading `<epic>-<story>[letter]` segment; `title` = the remaining text with dashes replaced by spaces (FR-005/FR-006) |
| A key with no recognizable `<epic>-<story>` index (malformed/unusual) | `index` = the raw key; `title` = the raw key (FR-013) — never hidden, never an error |
| A filename under `implementation-artifacts` starting with `spec-<index>-` (index plus its own trailing dash) | Counts as a match for that step's `index` (FR-008) |
| No filename starts with `spec-<index>-` | `specPath: null` → the magnifying-glass control is absent (FR-007) |
| More than one filename matches `spec-<index>-` | The alphabetically-first match is used (FR-012); its full path becomes `specPath` |
| Exactly one filename matches | Its full path becomes `specPath` |

`specPath` is built as `join(projectRootPath, "_bmad-output", "implementation-artifacts",
matchedFileName)` — the same `implementation-artifacts` folder the sprint-status route
already reads `sprint-status.yaml` from, reconstructed via the same literal path segments
already relied on elsewhere in this codebase, not a separately-passed folder path
(research.md § 1).

## Frontend rendering shape (not a stored entity)

Each epic tile has two states, toggled by its own top-right control (FR-002), independent
of every other tile (research.md § 5):

| State | Rendered content |
|---|---|
| Collapsed (default) | Epic key + overall status only (FR-001) |
| Expanded | Epic key + overall status, then every step (below), then the retrospective status line — all unchanged from what an expanded tile already shows today except for the step rows themselves (FR-003) |

Each step renders as a two-line block (FR-004), matching the Action Items tile's
established pattern (data-model.md's own precedent, feature 008):

| Element | Line | Rendered when | Content |
|---|---|---|---|
| Index | Header | Always | `step.index` |
| Status | Header | Always | `step.status`, via the same status presentation already used for epic/story status elsewhere in this view |
| Magnifying-glass control | Header | `step.specPath !== null` | `onClick` opens the file viewer with `step.specPath` (FR-007/FR-009) |
| Title | Below header | Always | `step.title` |

Adjacent step rows alternate background shading ("candy stripe", FR-011) — a
presentational detail with no bearing on the data shape above.

## `NavigationState` (unchanged shape, reused mechanism)

No shape change (`{ tab, path, openFile? }`, features 002/004/007/008). Opening a step's
spec document reuses the exact same `onOpenFile` callback already threaded down to
`SprintStatusView.tsx` for the Action Items tile (feature 008) — no new plumbing, no new
call site beyond `SprintStatusView.tsx` itself.
