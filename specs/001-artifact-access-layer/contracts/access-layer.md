# Contract: Artifact Access Layer (library API)

This is the public surface `src/artifacts/` and `src/discovery/` expose to the rest of
BMAD Browser (the CLI in this feature; a future web UI in a later one). It is a plain
TypeScript module contract — no network/IPC boundary is involved.

## `resolveProjectFolder`

```ts
function resolveProjectFolder(target?: string): Promise<DiscoveryResult>
```

- **Input**: `target` — an absolute or relative folder path, or `undefined`.
- **Behavior**:
  - `undefined` → uses `process.cwd()` (FR-006).
  - Checks the resolved `target` for a real `_bmad`/`_bmad-output` directory child
    (FR-007). If found → `DiscoveryResult` with `kind: 'valid'` and a populated `root`.
  - If not found → evaluates `target`'s parent, and that parent's descendants up to two
    levels deep (FR-009), skipping symlinks (FR-003) and hidden/dependency folders
    (FR-013). Returns `kind: 'invalid-with-candidates'` (one or more matches, FR-010) or
    `kind: 'invalid-no-candidates'` (none found, FR-011).
- **Errors**: Rejects only if `target` itself cannot be accessed at all (e.g. does not
  exist, or a permissions error on the target folder itself — not on folders encountered
  during discovery, which are skipped per the Edge Cases in `spec.md`).

## `HierarchyCache`

```ts
interface HierarchyCache {
  get(root: ProjectRoot): Promise<ArtifactNode[]>
  invalidate(root: ProjectRoot): void
}
```

- **`get(root)`**: Returns the cached `ArtifactNode` tree(s) for `root`'s `_bmad`/
  `_bmad-output` folder(s) (FR-001), building them from disk on first call or after an
  `invalidate()`, and returning the in-memory result otherwise (FR-004). One `ArtifactNode`
  is returned per folder that exists (so one entry if only `_bmad` exists, up to two if
  both `_bmad` and `_bmad-output` exist).
- **`invalidate(root)`**: Marks `root`'s cache entries stale (FR-005); does not itself touch
  the file system — the next `get(root)` call does the rebuild. Never throws for a root
  that was never cached (a no-op in that case).
- **Errors**: `get()` rejects if `root`'s folder can no longer be found on disk (FR-012),
  rather than resolving with a stale or empty tree.

## Types referenced

See `data-model.md` for the full shape of `ArtifactNode`, `ProjectRoot`,
`CacheEntry`/`HierarchyCache`, and `DiscoveryResult`.
