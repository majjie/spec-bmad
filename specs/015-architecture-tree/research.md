# Research: Architecture Tree

## 1. Reusing the existing PRD-grouping route logic

**Decision**: In `src/server/routes/navigator-tree.ts`, add a second lookup — the same
shape as the existing `prdsPath`/`prdsNode`/`subfolders` sequence, pointed at
`planning-artifacts/architecture` instead of `planning-artifacts/prds` — and call the
existing `groupPrdFolders(subfolders)` again on its result, assigning it to a new
`architecture` field on the `NavigatorTree` response body.

**Rationale**: `groupPrdFolders` (`src/navigator/prd-grouping.ts`, feature 006) takes a
plain `{ name, path }[]` and has zero PRD-specific behavior in its implementation — it
matches a generic `<project>-YYYY-MM-DD` pattern and buckets non-matches, nothing more.
The route already reuses the same cached `_bmad-output` tree (`getCachedTabTree("output",
...)`) for both the "output" tab's own tree and this Navigator-specific view, so looking up
a second subfolder from that same already-fetched tree costs nothing extra — no new scan,
no new cache entry.

**Alternatives considered**: A new, separately-named grouping function for architecture
folders — rejected; it would be a byte-for-byte duplicate of `groupPrdFolders` with a
different name, which is exactly the kind of needless duplication this project avoids
elsewhere (e.g. `prdIndex.ts`'s shared `REQUIREMENT_CODE_PATTERN`, feature 013).

## 2. Not renaming the PRD-flavored types

**Decision**: `PrdGroupingResult`, `PrdDateEntry`, `PrdProjectGroup`, and
`PrdNonConformingEntry` (feature 006) are reused exactly as they are, for architecture data
too — `NavigatorTree.architecture` is typed as `PrdGroupingResult | null`, not a
newly-named equivalent.

**Rationale**: These types are already fully generic in shape (a project string, a list of
dated entries, a non-conforming bucket) — nothing about them is actually PRD-specific
beyond their *name*. Renaming them to something artifact-agnostic (e.g.
`ArtifactGroupingResult`) would be a purely cosmetic improvement that ripples across every
file that already imports them — `web/src/api.ts`, `src/server/types.ts`,
`NavigatorDetailPane.tsx`, `PrdDetailView.tsx`, `App.tsx`, and their own test files, spanning
features 006 through 014 — for zero functional benefit. This project has consistently
preferred small, targeted changes over speculative refactors of already-shipped code (e.g.
feature 013 § 4 declined to refactor `PrefixTile` for the same reason); the same judgment
applies here, just at a larger scale.

**Alternatives considered**: Renaming everything to artifact-agnostic names — rejected for
the reasons above. Introducing a *type alias* (`type ArchitectureGroupingResult =
PrdGroupingResult`) purely for readability at architecture call sites — considered, but
rejected as adding a layer of indirection with no real behavioral or type-safety benefit,
and it would leave two names for one concept, which is its own small source of confusion.

## 3. Generalizing the folder-lookup helper

**Decision**: `findPrdFolderEntry(tree: NavigatorTree | null, itemId: string)`
(`web/src/navigatorApi.ts`, extracted in feature 014) is generalized to
`findFolderEntry(grouping: PrdGroupingResult | null, itemId: string)` — taking the grouping
result directly rather than the whole `NavigatorTree`. Callers now pass `tree?.prd ?? null`
or `tree?.architecture ?? null` explicitly.

**Rationale**: Two real call sites need this exact lookup against *different* fields of the
same tree: `NavigatorDetailPane.tsx` (to find which grouping a selected leaf belongs to,
now checking both PRD and architecture) and `App.tsx`'s refresh handler (feature 014, to
decide whether a selection survives a refresh). Keeping the function tied to
`NavigatorTree` specifically (and hard-coded to only ever look at `.prd`) would mean either
duplicating the identical traversal logic for architecture, or awkwardly overloading the
one function with a "which field" parameter — passing the grouping result directly is the
simpler, more general shape, and was already a small, natural next step for a function only
just extracted in the immediately-preceding feature.

**A concrete correctness gap this fixes**: `App.tsx`'s refresh handler (feature 014)
currently calls `findPrdFolderEntry(tree, current)` — hard-wired to only ever check
`tree.prd`. Without this generalization, refreshing while an *architecture* leaf is
selected would find no match, and incorrectly reset the selection to `null` every single
time, even though the folder still exists — directly contradicting FR-006 of *this*
feature ("no other existing Navigator behavior" should be altered) by making a
newly-introduced selection type behave inconsistently with an already-shipped one. This
plan updates that call site to check both groupings before deciding to reset.

**Alternatives considered**: Writing a second, near-identical `findArchitectureFolderEntry`
— rejected; it would not only duplicate logic but also leave the feature-014 refresh gap
above unaddressed unless *that* call site were separately updated to call both functions,
which is strictly more code for no benefit over the single generalized function.

## 4. Test coverage for the route's own wiring

**Decision**: Add one new test to `tests/integration/web-server.test.ts` —
`GET /api/navigator/tree groups architecture folders the same way it groups PRD folders`
— mirroring the existing PRD-grouping test's fixture/assertion shape exactly (a project
with two dated folders, one non-conforming folder). Also extend the existing
`returns prd: null ... when neither exists` test to assert `architecture: null` too.

**Rationale**: `/api/navigator/tree`'s own route handler currently has no *direct* unit
test at all — only integration coverage in `web-server.test.ts` — so extending that same
file, in the same style, is the natural, already-established place for this. The
underlying `groupPrdFolders` logic itself needs no new tests (unmodified, already covered),
but the route's own wiring (reading a second folder path, assigning it to a second
response field) is worth one integration-level check, the same weight of coverage its own
PRD-grouping half already has.

**Alternatives considered**: Skipping a new test entirely, relying only on manual
`quickstart.md` verification — rejected; this route already has integration test
precedent for its PRD half, and matching that same coverage for its new architecture half
costs little and guards against a regression neither this nor a future feature's manual
testing might catch.
