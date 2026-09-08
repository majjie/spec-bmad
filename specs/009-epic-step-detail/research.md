# Phase 0 Research: Epic Step Detail

## 1. Where index/title derivation and spec-file matching happen

**Decision**: Both server-side, inside `src/navigator/step-detail.ts`, called from
`parseSprintStatus`. The server already lists `implementation-artifacts` (a new
`listRealEntries` call in the sprint-status route) and passes just the bare filenames
through as `parseSprintStatus`'s new third parameter, `specFileNames: string[]` — the
route does not also pass the folder's own path as a separate parameter. Inside
`step-detail.ts`, the folder's absolute path is reconstructed from the existing
`projectRootPath` parameter via the same `_bmad-output/implementation-artifacts` literal
already relied on elsewhere in this codebase (the sprint-status route itself, when first
locating `sprint-status.yaml`; `project-root.ts`'s own `_bmad-output` constant) — not
re-derived from scratch or guessed. `specPath = join(projectRootPath, "_bmad-output",
"implementation-artifacts", matchedFileName)`.

**Rationale**: The browser has no filesystem access, so spec-file matching cannot happen
client-side regardless — the server is the only place that can know which files actually
exist. Deriving the index/title from the raw key is *technically* independent of that
constraint (it doesn't need a directory listing), but doing it in the same pure module,
right next to the matching logic, keeps one entity's full derivation (`StepDetail`) in one
place, mirroring how `parseActionItems` owns all of an `ActionItem`'s derivation (including
its `resolvedPath`) rather than splitting it across the client/server boundary.

**Alternatives considered**: Deriving the index/title client-side (since it's pure string
manipulation) while matching server-side — rejected; splitting one entity's fields across
two layers only to save a few lines of duplicate regex logic adds more complexity than it
removes, and this project's server/client type-duplication convention already means the
*shape* (`StepDetail`) is declared in both places regardless — only the derivation itself
would gain from staying server-side and unified.

## 2. Reusing `listRealEntries` for the directory listing

**Decision**: Call the existing `listRealEntries` (`src/artifacts/fs-entries.ts`, already
used by the Infra/Output content routes) against the same `implementation-artifacts` folder
the sprint-status route already reads `sprint-status.yaml` from, filtering to non-directory
entries before matching.

**Rationale**: This is the exact same "list a real folder's entries, symlinks excluded"
operation the app already performs elsewhere — no new filesystem utility is needed, and
reusing it keeps the symlink-exclusion behavior (FR-003 of the original folder-browsing
feature) consistent here too, for free.

**Alternatives considered**: A bespoke `readdir` call inside the sprint-status route —
rejected; it would silently drop the existing symlink-exclusion guarantee unless
reimplemented, for no benefit over calling the function that already provides it.

## 3. Renaming `stories`/`StoryStatus` to `steps`/`StepDetail`

**Decision**: Rename the field and type outright — `EpicStatusGroup.stories: StoryStatus[]`
becomes `EpicStatusGroup.steps: StepDetail[]`, with `StepDetail` carrying the original
`key`/`status` fields plus three new derived ones (`index`, `title`, `specPath`).

**Rationale**: This feature's own spec consistently calls these entities "steps," matching
how the actual sprint-status data models them (and how a user reads them) — continuing to
call them "stories" internally while the UI and spec both say "step" would leave a
needless naming mismatch for no reason, since there is exactly one place in the codebase
(`SprintStatusView.tsx`) that consumes this field. There's no case here for keeping both an
old `stories` array and a new `steps` array side by side — they'd hold identical entities,
just duplicated.

**Alternatives considered**: Adding a parallel `steps: StepDetail[]` field alongside the
existing `stories: StoryStatus[]`, deprecating the latter later — rejected as needless
duplication with only one real consumer to update.

## 4. Step-row layout: reusing the Action Items tile's header/body, candy-stripe pattern

**Decision**: Build the step row directly inside `SprintStatusView.tsx` (where epic tiles
already render), following the same shape `ActionItemsTile.tsx` already established: a
header line (index, status, optional magnifying-glass), a body line below it (the title),
and alternating row backgrounds via `action.hover`/`transparent` on even/odd index.

**Rationale**: Consistency with an already-shipped, already-verified pattern in the same
view, with no new visual vocabulary introduced. Extracting a shared component used by only
two call sites (Action Items' rows and step rows), each with different bound fields, would
add an abstraction layer this project's existing style doesn't reach for elsewhere (e.g.
`Tile` is already duplicated, not shared, between `SprintStatusView.tsx` and
`ActionItemsTile.tsx`).

**Alternatives considered**: Extracting a shared `CandyStripedRow` (or similar) component
used by both `ActionItemsTile.tsx` and the new step rows — rejected for now as a premature
abstraction over two call sites with different data shapes; nothing here blocks doing so
later if a third consumer appears.

## 5. Collapse/expand state

**Decision**: A single piece of client-side state in `SprintStatusView.tsx` — a `Set` of
currently-expanded epic keys, defaulting to empty (every tile collapsed), toggled per-tile
by its own top-right control. Not persisted anywhere; resets to all-collapsed whenever the
Sprint Status view is freshly mounted (matching this tool's existing session-local,
non-persisted view-state conventions elsewhere, e.g. Navigator tree expansion).

**Rationale**: The simplest state shape that satisfies FR-001–FR-003: each tile's collapsed
state is independent (a `Set` membership check per epic key), with no cross-tile
coordination needed.

**Alternatives considered**: A boolean per epic key in a `Record`, rather than a `Set` of
expanded keys — equivalent in behavior; a `Set` was chosen only because "is this key
present" reads slightly more directly as "is this one expanded" than a `Record` lookup with
an implicit `undefined → false` default.

## 6. Deterministic tie-break for multiple spec-file matches

**Decision**: When more than one filename under `implementation-artifacts` starts with
`spec-<index>-`, use the alphabetically-first one (already fixed by spec.md's FR-012).

**Rationale**: A stable, simple, fully-deterministic choice that needs no extra metadata
(e.g. modification time) — plain string comparison over the already-listed filenames.

**Alternatives considered**: Most-recently-modified file — rejected; adds a stat call per
candidate for a scenario real sprint-status data isn't expected to produce (one spec
document per step), for no clear benefit over a simpler, purely-lexical rule.
