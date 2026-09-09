# Data Model: Architecture Tree

This feature introduces **no new entity shape** — it reuses the existing PRD grouping
model (feature 006) verbatim for a second artifact type, a deliberate choice recorded in
research.md § 2.

## Reused entities

| Type | Already defined in | Reused as |
|---|---|---|
| `PrdGroupingResult` (`{ projects, nonConforming }`) | `src/navigator/prd-grouping.ts` / `web/src/api.ts` | `NavigatorTree.architecture` — the exact same shape as `NavigatorTree.prd`, just for `planning-artifacts/architecture` instead of `planning-artifacts/prds`. |
| `PrdProjectGroup` (`{ project, dates }`) | same | One entry per unique `<project>` prefix found among architecture subfolder names. |
| `PrdDateEntry` (`{ date, folderName, path }`) | same | One entry per architecture subfolder matching the `<project>-YYYY-MM-DD` pattern. |
| `PrdNonConformingEntry` (`{ folderName, path }`) | same | One entry per architecture subfolder that doesn't match that pattern. |

## Modified entity

`NavigatorTree` (`src/server/types.ts`, `web/src/api.ts`) gains one new field:

| Field | Type | Notes |
|---|---|---|
| `architecture` | `PrdGroupingResult \| null` | `null` when `planning-artifacts/architecture` has no subfolders or doesn't exist (mirrors `prd`'s own null-when-absent behavior exactly, FR-001). |

## Derivation

Identical to the PRD grouping's own derivation (data-model.md of feature 006/007,
unchanged): `groupPrdFolders(entries)` matches each subfolder name against
`^(.+)-(\d{4})-(\d{2})-(\d{2})$`; a match's captured prefix becomes its `project` key and
the four digit groups become its `date` (joined as `YYYY-MM-DD`, not calendar-validated,
per this feature's own Edge Cases); a non-match becomes a `PrdNonConformingEntry`. Projects
are sorted alphabetically; each project's dates are sorted descending (newest first);
non-conforming entries are sorted alphabetically by folder name. None of this logic is new
or modified — this feature only supplies it a second input (architecture subfolders
instead of PRD subfolders).

## Relationship to existing entities

No existing entity's *shape* changes. `NavigatorDetailPane.tsx`'s dispatch logic gains one
new branch (an architecture-leaf match, alongside its existing PRD-leaf and Sprint Status
branches), and `App.tsx`'s refresh handler (feature 014) is updated to validate a selection
against *both* `tree.prd` and `tree.architecture` — see research.md § 3 for why this
integration point matters.
