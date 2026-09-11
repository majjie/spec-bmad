---

description: "Task list template for feature implementation"
---

# Tasks: Artifact Access Layer

**Input**: Design documents from `/specs/001-artifact-access-layer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included - constitution Principle V (Test-First for Parsing & Rendering Logic)
requires tests before implementation for this feature's scanning/discovery logic.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project (per `plan.md` § Project Structure): `src/`, `tests/` at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create the directory skeleton from `plan.md` § Project Structure:
      `src/artifacts/`, `src/discovery/`, `src/cli.ts`, `tests/unit/artifacts/`,
      `tests/unit/discovery/`, `tests/integration/`
- [X] T002 Initialize the Node/TypeScript project: `package.json` (Node engines `>=20`,
      `"type": "module"`), `tsconfig.json` (`strict: true` per constitution Principle IV),
      `tsx` as a dev dependency, and npm scripts `"test": "tsx --test tests/**/*.test.ts"`
      and `"typecheck": "tsc --noEmit"` (research.md § 4)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be
implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Define the shared types from `data-model.md` (`ArtifactNode`,
      `ProjectRoot`, `CacheEntry`, `HierarchyCache`, `DiscoveryResult`) in
      `src/artifacts/types.ts`
- [X] T004 [P] Implement a symlink-safe directory entry listing helper in
      `src/artifacts/fs-entries.ts` - lists a directory's entries via
      `readdir(path, { withFileTypes: true })` and filters out anything where
      `dirent.isSymbolicLink()` is true, per FR-003 and research.md § 1
- [X] T005 Implement `buildProjectRoot(folderPath): Promise<ProjectRoot | null>` in
      `src/artifacts/project-root.ts` - returns a populated `ProjectRoot` when
      `folderPath` directly contains a real (non-symlink) `_bmad` and/or `_bmad-output`
      directory (FR-007), or `null` otherwise; depends on T003 (types) and T004
      (symlink-safe listing)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View the cached hierarchy of a valid project (Priority: P1) 🎯 MVP

**Goal**: Scan a valid project's `_bmad`/`_bmad-output` folders once and serve that
structure from memory on repeat requests, without reading file contents or following
symlinks.

**Independent Test**: Point the access layer at a directory containing
`_bmad`/`_bmad-output` folders with a known set of nested files and folders; request the
hierarchy twice and confirm both requests return the same structure and the second
request does not re-read the file system.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T006 [P] [US1] Unit test in `tests/unit/artifacts/scan.test.ts`: `scan()` builds an
      `ArtifactNode` tree matching a fixture directory's real layout, excludes symlinked
      entries entirely (FR-002, FR-003), and never inspects file contents
- [X] T007 [P] [US1] Unit test in `tests/unit/artifacts/cache.test.ts`: `HierarchyCache
      .get()` builds the tree on the first call and, on a second call with no
      invalidation, returns the identical result without invoking the scanner again
      (FR-004)

### Implementation for User Story 1

- [X] T008 [US1] Implement `scan(folderPath): Promise<ArtifactNode>` in
      `src/artifacts/scan.ts` - recursively builds the tree for one folder (a `_bmad` or
      `_bmad-output` folder) using the T004 symlink-safe listing helper, capturing only
      `name`/`path`/`type`/`children` (FR-001, FR-002); depends on T003, T004, and must
      make T006 pass
- [X] T009 [US1] Implement `HierarchyCache` in `src/artifacts/cache.ts` - `get(root)`
      resolves one `ArtifactNode` per existing `_bmad`/`_bmad-output` folder of `root` via
      T008's `scan()`, caches each as `{ tree, status: 'fresh' }` keyed by folder path, and
      returns the cached entries unchanged on repeat calls (FR-004); depends on T005, T008,
      and must make T007 pass
- [X] T010 [US1] Implement a minimal CLI entry point in `src/cli.ts`: accept an explicit
      folder path argument, resolve it via T005's `buildProjectRoot`, call
      `HierarchyCache.get()` on the result, and exit `0` on success (full argument
      defaulting and invalid-folder handling are added in User Story 3); depends on T009

**Checkpoint**: At this point, User Story 1 should be fully functional and testable
independently (quickstart.md Scenarios 1–2, 6)

---

## Phase 4: User Story 2 - Refresh the cache after the project changes (Priority: P2)

**Goal**: Let a cached hierarchy be invalidated and rebuilt so it reflects the project's
current on-disk state.

**Independent Test**: Build the initial cached hierarchy for a project, add and remove
files/folders on disk, trigger the refresh/invalidate mechanism, and confirm the next
requested hierarchy reflects exactly the additions and removals made.

### Tests for User Story 2 ⚠️

- [X] T011 [US2] Unit test in `tests/unit/artifacts/cache.test.ts`: after
      `HierarchyCache.invalidate(root)`, the next `get(root)` rebuilds the tree and
      reflects files/folders added or removed on disk since the last scan (FR-005,
      SC-002); and `get()` rejects rather than returning stale/empty data when `root`'s
      folder no longer exists on disk (FR-012)

### Implementation for User Story 2

- [X] T012 [US2] Implement `HierarchyCache.invalidate(root)` in `src/artifacts/cache.ts` -
      marks `root`'s cache entries `'stale'` without touching the file system (FR-005,
      research.md § 2); depends on T009
- [X] T013 [US2] Implement stale-triggered rebuild and the FR-012 not-found rejection in
      `HierarchyCache.get()` in `src/artifacts/cache.ts`: a `'stale'` entry is rescanned
      and marked `'fresh'` again on the next `get()`, and `get()` rejects if `root`'s
      folder can no longer be found on disk; depends on T012, and must make T011 pass
      (both were already satisfied by T009's stale-check branch and scan()'s natural
      ENOENT propagation - verified by the T011 tests passing with no further code needed)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently
(quickstart.md Scenario 3)

---

## Phase 5: User Story 3 - Get guided back to the right folder (Priority: P3)

**Goal**: When the CLI is pointed at (or defaults to) a folder without `_bmad`/
`_bmad-output`, tell the user it's invalid and suggest a corrected command for any real
project folder found nearby.

**Independent Test**: Run the CLI from/against a directory with no `_bmad` or
`_bmad-output` folder, where a directory within two levels of its parent (or the parent
itself) does contain one; confirm the tool reports the given folder as invalid and prints
a suggested command pointing at the discovered project folder.

### Tests for User Story 3 ⚠️

- [X] T014 [P] [US3] Unit test in `tests/unit/discovery/resolve-project-folder.test.ts`:
      `resolveProjectFolder()` defaults to `process.cwd()` when no target is given
      (FR-006); returns `kind: 'valid'` for a folder satisfying FR-007, and specifically
      still returns `'invalid-*'` when the only `_bmad`/`_bmad-output` present is itself a
      symlink (spec.md Edge Cases); for an invalid folder, searches the parent itself plus
      its children and grandchildren (FR-009), skipping symlinked, hidden, and
      dependency/build folders (FR-003, FR-013); returns `'invalid-with-candidates'` (one
      entry per match, FR-010) or `'invalid-no-candidates'` (FR-011) as appropriate; and a
      directory the process cannot read during the crawl is skipped without aborting the
      rest of the search (spec.md Edge Cases)
- [X] T015 [P] [US3] Integration test in `tests/integration/cli-folder-resolution.test.ts`:
      running the CLI end-to-end against fixture directory trees produces the exit codes
      and stderr content specified in `contracts/cli-invocation.md` for the valid,
      invalid-with-one-candidate, invalid-with-multiple-candidates, and
      invalid-no-candidates cases

### Implementation for User Story 3

- [X] T016 [US3] Implement `resolveProjectFolder(target?)` in
      `src/discovery/resolve-project-folder.ts` per `contracts/access-layer.md`: cwd
      default (FR-006), validity check via T005's `buildProjectRoot` (FR-007), the
      parent+2-level candidate search (FR-009) using T004's symlink-safe listing and
      skipping hidden/dependency folders (FR-013), and the `DiscoveryResult` shape from
      `data-model.md` (FR-010, FR-011); catch and skip (not abort on) a permission error
      reading any directory encountered during the crawl (spec.md Edge Cases); depends on
      T004, T005, and must make T014 pass
- [X] T017 [US3] Wire `resolveProjectFolder()` into `src/cli.ts` per
      `contracts/cli-invocation.md`: `kind: 'valid'` proceeds to `HierarchyCache.get()` as
      in T010 and exits `0`; `'invalid-with-candidates'` prints the FR-008 message plus one
      suggested invocation per candidate (FR-010) and exits non-zero; `'invalid-no-
      candidates'` prints the FR-008 and FR-011 messages and exits non-zero; depends on
      T010, T016, and must make T015 pass

**Checkpoint**: All user stories should now be independently functional (quickstart.md
Scenarios 4, 5, 7)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification that spans all user stories, plus the constitution-mandated CLI
conventions that apply regardless of which user story's flow is running

- [X] T018 [P] Add `--help` and `--version` flag handling to `src/cli.ts` (FR-014,
      constitution Principle IV): either flag prints usage/version text and exits `0`
      before any folder resolution is attempted; depends on T017
- [X] T019 [P] Add a `bin` entry to `package.json` (e.g. `"bmad-browser": "src/cli.ts"`,
      with a `tsx`-invoking shebang on `src/cli.ts`) so the command name used in
      `contracts/cli-invocation.md` and `quickstart.md`'s expected output is the same
      command that can actually be run; depends on T002, T017
- [X] T020 [P] Run `npm run typecheck` (`tsc --noEmit`) and resolve any strict-mode type
      errors across `src/`, per constitution Principle IV
- [X] T021 Execute `quickstart.md` Scenarios 1–7 manually against real fixture directories
      and confirm each matches its expected outcome (quickstart.md's own commands were
      also corrected during this run - see Notes)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational; no dependency on US2/US3
- **User Story 2 (Phase 4)**: Depends on Foundational and on `cache.ts` existing from US1
  (T009) - extends the same file, so implement after US1 rather than in parallel with it
- **User Story 3 (Phase 5)**: Depends on Foundational and on `cli.ts` existing from US1
  (T010) - extends the same file, so implement after US1
- **Polish (Phase 6)**: T018 and T019 depend on `cli.ts` existing from User Story 3 (T017);
  T020/T021 depend on all three user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independently testable once Foundational is done
- **User Story 2 (P2)**: Independently testable on its own once implemented, but its
  implementation tasks land in `src/artifacts/cache.ts`, the same file US1 creates -
  sequence after US1 to avoid file conflicts
- **User Story 3 (P3)**: Independently testable on its own once implemented, but its
  implementation tasks land in `src/cli.ts`, the same file US1 creates - sequence after
  US1 to avoid file conflicts

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Foundational types/helpers before scan/cache/discovery logic
- `scan.ts` before `cache.ts` (US1)
- `cache.ts`/`resolve-project-folder.ts` before `cli.ts` wiring

### Parallel Opportunities

- T003 and T004 (Foundational) can run in parallel - different files, no dependency
  between them
- T006 and T007 (US1 tests) can run in parallel - different files
- T014 and T015 (US3 tests) can run in parallel - different files
- T018 and T019 (Polish) can run in parallel - different files, both only need T017
- T020 (typecheck) can run in parallel with T018, T019, and T021 (manual quickstart run) in
  Polish

---

## Parallel Example: Foundational Phase

```bash
Task: "Define shared types in src/artifacts/types.ts"
Task: "Implement symlink-safe directory entry listing helper in src/artifacts/fs-entries.ts"
```

## Parallel Example: User Story 1 Tests

```bash
Task: "Unit test scan() in tests/unit/artifacts/scan.test.ts"
Task: "Unit test HierarchyCache.get() in tests/unit/artifacts/cache.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart.md Scenarios 1, 2, and 6 against a real directory
5. This is the smallest usable slice: a cached, symlink-safe, content-free view of one
   valid project's `_bmad`/`_bmad-output` folders

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Validate independently (MVP!)
3. Add User Story 2 → Validate independently (cache now stays current)
4. Add User Story 3 → Validate independently (bad input now gets a helpful nudge)
5. Each story adds value without breaking the previous ones

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 and US3 extend files US1 creates (`cache.ts`, `cli.ts`); this is a deliberate,
  minimal-file-count design per the feature's "keep it simple" brief - not a cross-story
  coupling of behavior, since each story's tests exercise only that story's requirements
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- quickstart.md's Scenario 1/4/5/6/7 commands were updated during T021 to invoke
  `src/cli.ts` directly via its shebang (absolute path) instead of `node --import tsx
  src/cli.ts`, which fails when the CLI's cwd (the argument being tested) has no
  `node_modules` of its own - the same class of issue as finding F1 in `/speckit-analyze`
