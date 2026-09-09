# Research: Architecture Detail View

## 1. Restricting requirement-code detection to heading style only

**Decision**: Give `buildRequirementCodeIndex` (`web/src/prdIndex.ts`, feature 012) a new
optional second parameter, `styles: RequirementCodeStyle[] = ["bullet", "header"]`.
Internally, `collectMatches` is only called for a style present in the given array —
`ArchitectureDetailView` calls `buildRequirementCodeIndex(body, ["header"])`; every
existing PRD call site (`buildRequirementCodeIndex(body)`) keeps its current two-argument
default and is completely unaffected.

**Rationale**: `collectMatches` plus the shared `.sort((a, b) => a.index - b.index)` is the
one piece of real logic both features need identically — forking it into a second,
near-duplicate function (e.g. `buildHeaderOnlyRequirementCodeIndex`) would risk the two
copies drifting apart over time for no benefit, since the shape of a header-style code
(`### AD-1 — ...`) is identical in both PRD and architecture documents (confirmed by direct
inspection of the reference project's real
`_bmad-output/planning-artifacts/architecture/architecture-bmad-2026-08-28/
ARCHITECTURE-SPINE.md`: `### AD-1 —` through `### AD-19 —`, some with a trailing bracketed
tag like `[ADOPTED]` after the em-dash text — harmless, since `HEADER_PATTERN` only anchors
the line's start). `groupByPrefix` needs no change at all — it operates on whatever
reference array it's handed, agnostic to how that array was filtered.

**Alternatives considered**: A second exported function duplicating `collectMatches` and
the sort — rejected per the reasoning above (this is the one legitimately shared piece of
logic, unlike `ReviewsTile`'s own layout, § 3 below). A boolean flag
(`headerOnly: boolean`) instead of a `styles` array — rejected as less extensible and less
self-documenting than naming the styles directly, especially since `RequirementCodeStyle`
already exists as an exported union type with exactly two members.

## 2. The main document's fixed filename

**Decision**: `ArchitectureDetailView` fetches `${entry.path}/ARCHITECTURE-SPINE.md` via
the existing `fetchFileContentOrNull("output", ...)`, exactly mirroring how
`PrdDetailView` fetches `${entry.path}/prd.md`.

**Rationale**: Direct inspection of the reference project's real architecture folder
confirmed this fixed, all-caps, hyphenated filename with genuine YAML frontmatter
(`name`, `type: architecture-spine`, `purpose`, `altitude`, `paradigm`, `scope`, `status`,
`created`, `updated`, `binds`, `sources`, `companions`) — the same fixed-filename
convention `prd.md` already established for PRD, just a different literal name.

**Alternatives considered**: Scanning the folder's contents for a document matching some
pattern (e.g. any `*.md` file at the top level not matching `.memlog.md`) — rejected;
unnecessary indirection when the convention is fixed and already confirmed by inspection,
and it would risk picking the wrong file in a folder with unexpected extra Markdown files.

## 3. The reviews tile's own subfolder source

**Decision**: `ArchitectureDetailView` performs a second, independent `fetchContents`
call — `fetchContents("output", `${entry.path}/reviews`)` — and feeds its result straight
into the existing, unmodified `buildReviewFileList()` (feature 013), exactly as
`PrdDetailView` already feeds its own (single) folder listing into that same function. A
missing `reviews` subfolder makes this second fetch reject (404, same as any other
non-existent path passed to `GET /api/contents/:tab`); the existing catch-and-treat-as-
empty pattern `PrdDetailView` already uses for its own folder-contents fetch (research.md,
feature 013, contracts/ui-behavior.md) is reused verbatim here, satisfying the spec's edge
case that a missing `reviews` subfolder behaves identically to one with no matching files.

**Rationale**: `buildReviewFileList` already operates purely on a `ContentsEntry[]` — it
has no dependency on *which* folder that listing came from, so no change to that function
is needed at all; only the caller's own fetch target differs (FR-011). Confirmed by direct
inspection that files inside the reference project's own `reviews/` subfolder
(`review-rubric.md`, `review-adversarial-seams.md`, `review-tech-currency.md`) still follow
the exact same `review-*.md` naming convention PRD's own reviews already use — the friendly
Title-Case transform needs no change either.

**Alternatives considered**: Fetching the leaf folder's own contents once and filtering
client-side for entries whose `path` contains `/reviews/` — rejected; the existing
`fetchContents` route already takes an explicit path and returns only that folder's direct
children, so a second call with the subfolder's own path is both simpler and consistent
with how every other folder listing in this tool already works (one call per folder of
interest, never a recursive one).

## 4. No links in the architecture memory log

**Decision**: `ArchitectureDetailView` reuses `MemoryLogDialog` and `parseMemlogEntries`
completely unmodified, always passing `prdReferences={[]}` (an empty array) regardless of
what the architecture document itself contains.

**Rationale**: `parseMemlogEntries`'s own cross-referencing step
(`splitSegments`/`Array.prototype.find` against `prdReferences`) already resolves to
`referenceId: null` for any code-shaped segment when no reference in the given array
matches it — by construction, an empty array never matches anything, so every mentioned
code renders as plain text (`MemlogSegmentView`'s existing `segment.referenceId === null`
branch) with zero new parsing logic, zero new rendering logic, and zero risk of the "no
links" requirement (FR-019) silently breaking if `parseMemlogEntries` itself ever changes —
the *contract* ("empty references in → no links out") is exactly what that function
already guarantees today. Confirmed by inspecting the reference project's own `.memlog.md`:
its category vocabulary (`(constraint)`, `(event)`, `(direction)`, `(decision)`,
`(question)`) is a superset of PRD's own examples, but `CATEGORY_PATTERN`'s definition
(any lowercase-letter word in parentheses) already accepts all of them with no code change.

**Alternatives considered**: A new `parseMemlogEntries` overload or flag
(`linksDisabled: boolean`) that skips cross-referencing entirely — rejected; strictly more
code for an identical observable result, since passing an empty array already produces
that exact behavior through the function's existing, tested logic.

## 5. No addendum tile

**Decision**: `ArchitectureDetailView`'s tile row renders only two tiles (reviews, memory
log) — no `SingleFileTile` for an addendum file at all, and no `addendum.md` existence
check performed anywhere.

**Rationale**: The feature description and FR-020 are explicit and unambiguous here; there
is no equivalent artifact convention for architecture to bind such a tile to, and adding a
disabled tile with nothing behind it in every case would be pure clutter, not a
degrade-gracefully affordance.

**Alternatives considered**: None — this is a direct scope exclusion, not a design choice
with real alternatives.

## 6. `ArchitectureDetailView` as a new sibling component

**Decision**: A new top-level component, `web/src/components/ArchitectureDetailView.tsx`,
structurally modeled on `PrdDetailView.tsx` (same overall layout: tile row, scrolling
Markdown body with a corner `FrontmatterInfoControl`, a structurally-separate
requirement-code index column) rather than adding conditional branches to
`PrdDetailView.tsx` itself to handle both artifact kinds.

**Rationale**: See plan.md's own Structure Decision for the full reasoning — in short, the
two views' tile rows have genuine, non-cosmetic differences (fewer tiles, a different
reviews source, a style-restricted index, no bullet-style anchor renderer at all), and
every piece of logic that *is* identical between them (`prdIndex.ts`, `reviewFiles.ts`,
`memlogParser.ts`, `MemoryLogDialog.tsx`, `FrontmatterInfoControl.tsx`) is already shared
without any duplication — nothing here is a "third consumer" pushing toward a bigger,
parameterized shared view component. `NavigatorDetailPane.tsx`'s existing dispatch pattern
(check `tree.prd` then `tree.architecture`, feature 015) already anticipates this — its
architecture branch was always the placeholder this feature was expected to replace.

**Alternatives considered**: Parameterizing `PrdDetailView` with an `artifactKind: "prd" |
"architecture"` prop and branching internally on tile rendering/index styles/document
filename — rejected; this would spread architecture-specific knowledge throughout an
already-shipped, load-bearing component for a saving of one new (fairly short) file, the
same tradeoff feature 013 already weighed and rejected once for `ReviewsTile` vs.
`PrefixTile` (research.md § 4 there).
