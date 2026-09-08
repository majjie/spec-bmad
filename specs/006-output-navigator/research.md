# Phase 0 Research: Output Navigator Tab

## 1. YAML parsing library

**Decision**: `js-yaml@^5.4.1`, calling its `load()` function.

**Rationale**: `sprint-status.yaml` is real, hand-authored YAML — the actual sample data
includes wrapped comments, an inline comment stripping a cancelled story, and a multi-line
folded action-item string. Empirically verified (via a throwaway script) that `js-yaml`
v5's `load()`:
- Parses the full sample file (summary fields, `development_status`, `action_items`,
  comments) without error.
- Preserves `development_status`'s key order exactly as declared — critical for FR-013's
  "in the order the file declares them" requirement, since JS object property order for
  string keys is insertion order per spec, and `js-yaml` builds its result as a plain
  object.
- Throws a catchable `YAMLException` on malformed input (verified with a deliberately
  broken flow-collection), and also throws on a completely empty file ("expected a
  document, but the input is empty") — both routed to FR-014's error path.
- Ships its own TypeScript declarations (`./dist/js-yaml.d.ts`) — no separate `@types/`
  package needed.
- `load()` (not the pre-v4 unsafe `load`/`safeLoad` split) is safe-by-default in v5: no
  arbitrary tag execution.

**Alternatives considered**:
- **Hand-rolled line-based parser** (only the small subset of YAML this file actually
  uses): rejected. `action_items` alone demonstrates the file uses folded/wrapped string
  values and inline comments — real BMAD-generated files are outside this project's
  control, and a hand-rolled parser risks silently misreading a real file in a way a
  proper library wouldn't. This is exactly the failure mode constitution Principle V's own
  rationale warns about ("hand-written parsing... most likely to break silently").
- **`yaml` (eemeli/yaml)**: also a solid, popular choice; not chosen only because `js-yaml`
  is more widely deployed/battle-tested for this exact "parse a plain-object config file"
  use case and needs no extra type package.

## 2. Where PRD-folder names come from

**Decision**: Reuse feature 001's existing `HierarchyCache` — it already scans all of
`_bmad-output` (folders and files) into an in-memory `ArtifactNode` tree at cache-fill
time. The new `/api/navigator/tree` route locates the `planning-artifacts/prds` folder
node within that already-cached tree (the same traversal pattern
`src/server/tab-tree.ts`'s `findFolderNodeByPath` already uses) and reads its direct
children's names — no new filesystem scanning code.

**Rationale**: Avoids a second, parallel directory-listing mechanism; PRD folder names are
already sitting in memory as soon as the existing cache is warm, which happens before this
feature's route can even be reached (the tab itself is gated on `_bmad-output` existing,
which the cache already needs to know).

**Alternatives considered**: A fresh `fs.readdir()` call scoped to `prds/` directly —
rejected as an unnecessary second path to the same data, and one that wouldn't benefit from
the existing cache's staleness/invalidation handling.

## 3. PRD folder-name grouping algorithm

**Decision**: `groupPrdFolders(folderNames: string[])` — pure function, no I/O.
- Match each name against `/^(.+)-(\d{4})-(\d{2})-(\d{2})$/`.
- A match's group 1 is the project value (must be non-empty — the regex's `.+` already
  guarantees this, so a bare date like `2026-08-28` with nothing before it naturally falls
  through to "non-conforming" instead, satisfying that Assumption without special-casing
  it).
- Group by project value into a `Map<string, string[]>` (exact string key — case-sensitive
  by construction, no normalization).
- Within each project's list, sort matched dates descending via plain string comparison —
  correct for zero-padded `YYYY-MM-DD` strings, no date parsing needed.
- Sort project keys, and separately the non-conforming folder-name list, using plain
  JavaScript string comparison (code-point order) — this is what "alphabetically,
  case-sensitive" resolves to concretely: it sorts all names starting with an uppercase
  letter before any starting with a lowercase letter (e.g. `PRD-foo` before `prd-bar`),
  which is a well-defined, consistent, and easily testable rule, even though it isn't
  "dictionary" order.

**Rationale**: Every rule traces directly to a spec FR/Assumption; no ambiguity left for
implementation to guess at (this was tightened during `/speckit-clarify`).

**Alternatives considered**: `Intl.Collator`-based locale-aware sorting — rejected; it
would make uppercase/lowercase interleave in a way that's harder to specify and test, and
this is an internal dev-tool where predictable code-point ordering is preferable to
locale-sensitive "natural" sorting.

## 4. Sprint-status derivation algorithm

**Decision**: `parseSprintStatus(parsed: unknown)` — pure function operating on
`js-yaml`'s already-parsed object (not on raw text — text→object is `js-yaml`'s job, object
→ shaped result is ours, keeping the two concerns separately testable).
- Summary fields are read directly off the top-level object (`generated`, `last_updated`,
  `project`, `project_key`, `tracking_system`, `story_location`); a missing field renders as
  an empty string rather than failing the whole parse (lenient — only a totally unparseable
  document triggers FR-014's error path, not one missing field).
- `development_status` is read as a plain object, treated as `{}` if absent or not an
  object (satisfies the "no epics declared" edge case added during `/speckit-clarify`).
- **Two-pass derivation** over `Object.entries(development_status)`:
  1. First pass: collect every key matching `/^epic-(\d+)$/` into an ordered list of
     `EpicStatusGroup` shells (recording the epic number and status, in file order), and
     every key matching `/^epic-(\d+)-retrospective$/` into a `Map<epicNumber, status>`.
  2. Second pass: for every remaining key matching `/^(\d+)-/`, look up the epic whose
     number equals the matched leading digits; if found, append `{key, status}` to that
     epic's `stories` array (in file order, since we're iterating `Object.entries` in
     order); if no epic with that exact number was declared, the entry is left out
     entirely (FR-015).
  3. Attach each epic's retrospective status from the first pass's map (`null` if that
     epic had no `epic-N-retrospective` key).
- The leading-number match uses the delimiter-based rule from FR-013 (`^(\d+)-`, matched
  against the epic's own number as a whole, not a raw string-prefix check) — this is what
  correctly distinguishes epic `1`'s stories (`1-...`) from epic `10`'s or `11`'s
  (`10-...`/`11-...`), since `"11-2-foo".match(/^(\d+)-/)` captures `"11"`, not `"1"`.

**Rationale**: Two passes are simpler and more robust than a single-pass "attach to
whichever epic was most recently seen" approach — they work correctly regardless of
whether every story happens to immediately follow its epic key (which the sample data
does, but the spec doesn't require), and they make the "leave out unmatched entries" rule
(FR-015) a natural fallthrough rather than a special case.

**Alternatives considered**: Single-pass "current epic" tracking (append each numbered
story to whichever `epic-N` key was most recently seen while iterating) — rejected: it
would silently misattribute a story to the wrong epic if the file ever declares epics and
stories out of strict order, which the file-format's own comments (```# Epic transitions
to 'in-progress' automatically...```) suggest is possible in principle even if today's
sample happens to be strictly ordered.

## 5. `action_items` — confirmed out of scope

**Decision**: Not read, parsed, or rendered by this feature at all — `parseSprintStatus`
doesn't touch that key, and no UI surfaces it.

**Rationale**: Reconfirmed from spec.md's own Assumptions (the source description's tile
list names only Summary + Status tiles); noted here only so a future "surface action
items" feature has a clear, uncontested starting point rather than colliding with logic
this feature already wrote.
