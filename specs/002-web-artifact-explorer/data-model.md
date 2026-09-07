# Phase 1 Data Model: Web Artifact Explorer

Derived from `spec.md` § Key Entities, translated into the concrete shapes the API and
frontend exchange. Nothing here is persisted — it's all derived on request from feature
001's in-memory `HierarchyCache` plus on-demand `fs.stat()` calls (research.md § 3).

## TabId

```ts
type TabId = "infra" | "output";
```

Maps to `_bmad` (`infra`) and `_bmad-output` (`output`) respectively (FR-001).

## TabAvailability

One entry per `TabId`, reporting whether that tab's folder exists for the current
`ProjectRoot` (feature 001's `ProjectRoot.bmadFolderPath` / `bmadOutputFolderPath`).

| Field | Type | Notes |
|---|---|---|
| `infra` | `boolean` | `true` iff `ProjectRoot.bmadFolderPath !== null` |
| `output` | `boolean` | `true` iff `ProjectRoot.bmadOutputFolderPath !== null` |

Drives FR-012: a tab whose availability is `false` renders its empty-state message
instead of a tree.

## FolderTreeNode

The **Tree Node** entity from spec.md, restricted to folders only (files never appear in
the left-hand tree, only in the right-hand table).

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Folder's own name |
| `path` | `string` | Absolute path — used as the row/selection key and passed back as the `path` query param to `/api/contents` |
| `children` | `FolderTreeNode[]` | Child folders only; always present (possibly empty) |

Derived by filtering feature 001's `ArtifactNode` tree down to `type === "folder"` nodes,
recursively — no filesystem access beyond what feature 001 already cached (research.md
§ 3).

## ContentsEntry

The **Folder Contents Entry** entity from spec.md: one row in the right-hand table.

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | |
| `path` | `string` | |
| `type` | `"file" \| "folder"` | Determines whether clicking it navigates further (FR-007/FR-008) |
| `size` | `number \| null` | Bytes for files; `null` for folders (research.md § 4) |
| `createdAt` | `string` | ISO-8601, from `fs.stat().birthtime` (research.md § 5) |
| `updatedAt` | `string` | ISO-8601, from `fs.stat().mtime` |

**Validation rules**:
- `type: "folder"` entries always have `size: null`.
- The set of entries returned for a folder is exactly that folder's direct children (no
  further recursion) — matches feature 001's `ArtifactNode.children` for that path, one
  level deep.

## Sort state (frontend-only)

Not transmitted over the API — purely client-side per-view state, since sort choice does
not persist across a folder/tab change (User Story 3, Acceptance Scenario 4).

| Field | Type | Notes |
|---|---|---|
| `column` | `"name" \| "createdAt" \| "updatedAt" \| "size"` | Currently sorted column |
| `direction` | `"asc" \| "desc"` | Toggles on repeat-click of the same header (FR-010) |

Applied as: group by `type` (folders before files, per the Clarifications session), then
sort each group by `column`/`direction`.

## Tab view state (frontend-only)

Held per `TabId`, independent of the other tab (FR-011).

| Field | Type | Notes |
|---|---|---|
| `expandedPaths` | `Set<string>` | Which `FolderTreeNode.path` values are currently expanded |
| `selectedPath` | `string` | Which folder's contents are shown in the table; defaults to the tab's own root folder path on first load (FR-002), so the table is never empty-by-default |
