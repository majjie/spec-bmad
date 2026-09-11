# Phase 0 Research: Artifact Access Layer

No `NEEDS CLARIFICATION` markers remain in the Technical Context (the spec's clarification
session already resolved the ambiguities that would otherwise have shown up here - see
`spec.md` § Clarifications). The research below covers the implementation-approach
decisions needed before design, per constitution Principles III–V.

## 1. Recursive directory scanning, excluding symlinks

**Decision**: Use `node:fs/promises` (`readdir(path, { withFileTypes: true })`) recursively,
checking `dirent.isSymbolicLink()` on every entry and skipping it (and not recursing into
it) before checking `isDirectory()`/`isFile()`.

**Rationale**: `withFileTypes: true` gives symlink/file/directory type information from the
same syscall batch that lists directory contents, avoiding a second `lstat` per entry.
Explicitly testing `isSymbolicLink()` first (rather than following the link and testing
what it points to) is what makes a symlink invisible to the hierarchy per FR-003 - Node's
`Dirent` type flags already distinguish "this entry is a symlink" from "this entry is a
directory/file", so no link is ever followed or descended into.

**Alternatives considered**:
- `fs.realpath`-then-`stat` on every entry: rejected - it resolves (follows) symlinks
  rather than excluding them, the opposite of FR-003.
- A third-party walker (e.g. `fast-glob`, `klaw`): rejected - constitution Principle III
  (minimal dependency footprint) and the scan is a straightforward recursive `readdir`
  with no glob/filter requirements that would justify a dependency.

## 2. In-memory Hierarchy Cache with invalidate/refresh

**Decision**: A small in-process map keyed by `Project Root` path, holding one entry per
`_bmad`/`_bmad-output` folder found under it: `{ tree: ArtifactNode, status: 'fresh' |
'stale' }`. `get(root)` builds and caches on first call and returns the cached tree on
later calls while `status === 'fresh'`; `invalidate(root)` sets `status = 'stale'` without
immediately rescanning; the next `get(root)` after that rebuilds the tree from disk and
marks it fresh again.

**Rationale**: This directly matches FR-004/FR-005 ("serve from cache until invalidated";
"rebuild on the next request" rather than eagerly on invalidation) with no extra machinery
- no file-system watcher, no TTL, no background timer. Deciding *when* to call `invalidate`
is explicitly out of scope for this layer per the spec's Assumptions, so the cache itself
stays passive.

**Alternatives considered**:
- Eager rebuild inside `invalidate()` itself: rejected - indistinguishable in behavior from
  the lazy approach for every acceptance scenario in the spec, but couples invalidation to
  a synchronous disk scan, which is unnecessary complexity for a "keep it simple" feature.
- `chokidar`/native FS watching for automatic invalidation: rejected - the spec's
  Assumptions explicitly defer "when to refresh" to whatever consumes this layer; adding a
  watcher here would be scope creep the constitution's simplicity principle warns against.

## 3. CLI folder resolution and discovery search

**Decision**: A single `resolveProjectFolder(target?: string)` function that: (a) defaults
`target` to `process.cwd()` when omitted (FR-006); (b) checks `target` for a real (non-
symlink) `_bmad` or `_bmad-output` child directory (FR-007); (c) if invalid, evaluates the
parent of `target` plus its children (level 1) and grandchildren (level 2) - per the
clarified FR-009 - for the same condition, skipping hidden/dot folders and conventional
dependency/build folders (`node_modules`, `.git`, etc., per FR-013) while doing so; (d)
returns a structured result (`valid` / `invalid-with-candidates` / `invalid-no-candidates`)
that the CLI entry point renders as user-facing text, including the ready-to-run command
for each candidate (FR-010/FR-011).

**Rationale**: Keeping this as one pure function returning a structured result (rather than
directly `console.log`-ing/exiting) is what constitution Principle IV requires - the
discovery logic is then unit-testable without spawning a process or capturing stdout; only
`cli.ts` deals with actually printing output and setting the process exit code.

**Alternatives considered**:
- Doing the validity check and discovery search inline in `cli.ts`: rejected - would make
  the discovery logic untestable without invoking the CLI process, violating constitution
  Principle IV.
- A configurable/parameterized crawl depth: rejected as unnecessary - the spec fixes the
  depth at "parent + 2 levels" (FR-009); making it configurable is speculative and not
  requested.

## 4. Test runner

**Decision**: Node's built-in `node:test` + `node:assert/strict`, run via `tsx` in dev
(`tsx --test`), no build step required for tests.

**Rationale**: Zero added runtime dependency, one small dev dependency (`tsx`) to execute
TypeScript directly. Matches constitution Principle III (minimal dependency footprint) and
Principle V (tests must exist before implementation) without introducing a heavier test
framework (Jest/Vitest) that this feature's scope does not need.

**Alternatives considered**:
- Vitest/Jest: rejected for this feature - neither watch-mode UI nor snapshot testing nor
  mocking-heavy features are needed for scanning/caching/discovery logic; `node:test`
  covers it with no added runtime weight.
