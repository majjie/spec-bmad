# Phase 1 Data Model: Artifact Access Layer

Derived from `spec.md` § Key Entities, translated into concrete shapes. No persistence is
involved — every type here exists only in process memory for the lifetime of the CLI run.

## ArtifactNode

Represents a single file or folder discovered under a `_bmad`/`_bmad-output` folder.

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | The entry's own name (last path segment), e.g. `spec.md` |
| `path` | `string` | Absolute path on disk |
| `type` | `'file' \| 'folder'` | Never `'symlink'` — symlinks are excluded before a node is created (FR-003) |
| `children` | `ArtifactNode[]` | Present (possibly empty) when `type === 'folder'`; omitted when `type === 'file'` |

**Validation rules**:
- Never constructed for a symlinked entry (FR-003) — the scanner filters these out before
  building a node, so a symlink simply produces no `ArtifactNode` at all.
- Never carries file contents — only `name`/`path`/`type`/`children` (FR-002).
- `children` ordering is not specified by the spec; implementation MAY use whatever order
  `readdir` returns, since no requirement or success criterion depends on ordering.

## ProjectRoot

Represents the target folder that has been confirmed to directly contain a `_bmad` and/or
`_bmad-output` folder (FR-007). Not itself part of the cached hierarchy (per the
Clarifications session).

| Field | Type | Notes |
|---|---|---|
| `path` | `string` | Absolute path of the confirmed target folder |
| `bmadFolderPath` | `string \| null` | Absolute path to its `_bmad` child, or `null` if absent |
| `bmadOutputFolderPath` | `string \| null` | Absolute path to its `_bmad-output` child, or `null` if absent |

**Validation rules**:
- At least one of `bmadFolderPath` / `bmadOutputFolderPath` MUST be non-null — that is
  exactly the FR-007 validity condition.
- A path only counts here if it is a real directory, not a symlink (FR-007, FR-003).

## HierarchyCache

The in-memory store described in FR-004/FR-005, holding one cached tree per
`_bmad`/`_bmad-output` folder of a given `ProjectRoot`.

| Field | Type | Notes |
|---|---|---|
| `entries` | `Map<string, CacheEntry>` | Keyed by the `_bmad`/`_bmad-output` folder's absolute path |

### CacheEntry

| Field | Type | Notes |
|---|---|---|
| `tree` | `ArtifactNode` | The cached hierarchy, rooted at the `_bmad`/`_bmad-output` folder itself |
| `status` | `'fresh' \| 'stale'` | `'stale'` after `invalidate()`, until the next `get()` rebuilds it (research.md § 2) |

**State transitions**:

```text
(no entry) --get()--> fresh
fresh --invalidate()--> stale
stale --get()--> fresh   (rebuilds tree from disk)
fresh --get()--> fresh   (returns cached tree, no disk access) — FR-004
```

## DiscoveryResult

The structured, UI-independent result of resolving/validating a target folder (FR-006–
FR-013), returned by `resolveProjectFolder()` (research.md § 3) for `cli.ts` to render.

| Field | Type | Notes |
|---|---|---|
| `kind` | `'valid' \| 'invalid-with-candidates' \| 'invalid-no-candidates'` | |
| `target` | `string` | The folder that was evaluated (after applying the cwd default, FR-006) |
| `root` | `ProjectRoot \| null` | Present only when `kind === 'valid'` |
| `candidates` | `ProjectRoot[]` | Present only when `kind === 'invalid-with-candidates'`; one entry per folder found by the parent+2-level search (FR-009), each with its ready-to-run CLI invocation string attached (see `contracts/cli-invocation.md`) |

**Validation rules**:
- `candidates` is never empty when `kind === 'invalid-with-candidates'`, and always empty
  (or absent) otherwise.
- Every `ProjectRoot` appearing in `candidates` independently satisfies the FR-007 validity
  rule; none of them were reached by descending into a symlinked, hidden, or
  dependency/build folder (FR-003, FR-013).
