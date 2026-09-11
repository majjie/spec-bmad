# Data Model: Instrumental Console Redesign

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-09-11

Everything here is **derived, in-memory, frontend-only state**. This feature adds no
persisted artifact data and no server-side shape. The single value that outlives a page load
is the onboarding choice (§ 5), which lives in the browser's own preference storage, never in
the inspected project.

All types below live in `web/src/shell.ts` unless stated otherwise.

---

## 1. `ShellSection` and `ShellSelection`

The UI's navigation vocabulary. Deliberately **separate from the backend's tab identifiers**
(`navigator` / `infra` / `output`), which are unchanged by this feature - the shell maps onto
those, rather than renaming them and forcing a server-side change.

```ts
type ShellSection = "overview" | "requirements" | "architecture" | "sprint" | "method" | "generated";

type ShellSelection =
  | { kind: "overview" }
  | { kind: "sprint" }
  | { kind: "prd"; path: string }
  | { kind: "architecture"; path: string }
  | { kind: "method" }
  | { kind: "generated" };
```

**Why two types**: a *section* is a place in the sidebar; a *selection* is what the stage is
currently showing. They differ because the document sections are containers - selecting
"Requirements" does not show a document, selecting a run inside it does. Collapsing them into
one type would make `{ kind: "requirements" }` a state the stage cannot render.

**Validation**: `path` on a document selection is a path the navigator tree already produced.
This feature never constructs a path, so it cannot reach outside the artifact roots that
features 001/006 already bound.

---

## 2. `ProjectNavGroup` - one reconciled project identity

| Field | Type | Notes |
|---|---|---|
| `key` | `string` | Stable identity, lowercased with the artifact-type prefix stripped (e.g. `harbor`). The reserved key `_other` holds non-conforming folders. |
| `title` | `string` | Display title, Title Cased from `key` (e.g. `Harbor`). `Other` for the reserved group. |
| `requirements` | `ProjectNavLeaf[]` | This project's requirements runs, newest first. |
| `architecture` | `ProjectNavLeaf[]` | This project's architecture runs, newest first. |
| `other` | `PrdNonConformingEntry[]` | Folders attributed to this group that do not follow the dated convention. |

**Derivation** (`buildProjectNav`):

1. Walk the requirements families, then the architecture families.
2. For each, reduce the folder's project name to a `key` by stripping a leading artifact-type
   prefix and lowercasing. This is what merges the two families of one product into a single
   group (FR-006, research § 3).
3. Attach the family's dated runs to the matching side of the group, creating the group on
   first sight.
4. Collect non-conforming folders from both families into the reserved `_other` group,
   de-duplicating by path - a folder reachable from both families must not appear twice.
5. Sort named groups by title; `_other` always sorts last, regardless of title.

**Uniqueness**: one group per `key`. Two folders whose names reduce to the same key are the
same project **by definition** - that is the reconciliation rule, not a collision.

---

## 3. `ProjectNavLeaf` - one dated run

| Field | Type | Notes |
|---|---|---|
| `path` | `string` | The run folder's path; the selection target. |
| `date` | `string` | The run's date as the folder encodes it. May be empty when the folder is not dated. |
| `folderName` | `string` | The literal folder name - the label fallback when `date` is absent or unparseable. |
| `isLatest` | `boolean` | True for the first leaf of its type within its group. Derived from position, since the source list is already newest-first; never computed by comparing dates. |

**Label derivation** (`formatRunDate`, `formatArtifactLeafLabel`):

- `formatRunDate` turns an ISO `YYYY-MM-DD` into a human date (`1 Sep 2026`) and returns
  **anything it cannot parse unchanged**. It never throws and never renders a partial date -
  an unrecognised value passes through so the user sees the folder's own truth rather than a
  blank or an `Invalid Date`.
- `formatArtifactLeafLabel` renders the date, and for `isLatest` appends an annotation naming
  the document type (`· latest PRD`, `· latest architecture`). The type is named, not just
  "latest", because a project's two families each have their own latest and an unqualified
  annotation would appear twice with no way to tell them apart.

---

## 4. Sidebar structure state

| Concept | Function | Rule |
|---|---|---|
| Is nesting warranted? | `hasMultipleNamedSlugs` | True only when **more than one named** group exists. `_other` never counts (research § 2, SC-009). |
| Does a section have anything? | `sectionHasLeaves` | Requirements counts its runs **and** non-conforming folders; architecture counts only its runs. The asymmetry is real - non-conforming folders are surfaced under requirements, which is where the convention that rejected them is defined. |
| Which keys does a selection need open? | `keysForDocSelection` | The section key always; plus the `section:slug` nest key when, and only when, nesting is warranted and the slug is a named one. |

**Expansion state machine** - the part most likely to regress (research § 4):

| Function | Contract |
|---|---|
| `seedExpandedIfNeeded(expanded, groups, seeded)` | Runs **once**. Opens each document section that has content, plus the first named project's nests when nesting is warranted. If nothing has content it returns `seeded: false`, so seeding is retried when data arrives rather than being consumed against an empty tree. |
| `toggleExpandedKey(expanded, key)` | Pure toggle. The only path by which a key is ever **removed**. |
| `expandForDocSelection(expanded, previousKeys, nextKeys)` | Adds only the keys the new selection needs **that the previous selection did not already need**. This difference is the whole point: without it, re-selecting within a section the user just collapsed would re-add its key and bounce it open. |

**Invariant**: no code path other than `toggleExpandedKey` removes a key, and no path adds a
key the user explicitly removed unless their selection moves somewhere that newly requires it.

---

## 5. Onboarding state *(`web/src/onboarding/onboarding.ts`)*

| Field | Value |
|---|---|
| Storage key | `bmad-browser:onboarding:v3` |
| Type | `"pending" \| "skipped" \| "completed"` |
| Persisted values | Only `skipped` and `completed`. `pending` is the **absence** of a stored value, never written. |

**Why the version suffix**: bumping it re-onboards every user rather than reading a value
whose meaning has changed. It is at `v3` because the shape changed twice during
implementation - see research § 7, which records that those two changes have no other
surviving documentation.

**Read/write contract**: every access is wrapped so that a throwing or blocked storage
backend yields `pending` on read and is a silent no-op on write (FR-020). An unrecognised
stored string is also treated as `pending` - forward-compatible with a future value, and
robust against a hand-edited one.

**State transitions**:

```text
pending ──skip──────► skipped ──┐
   │                            ├──► Help replays the tour; neither state
   └──complete tour──► completed┘     returns to pending, so the welcome
                                      never shows again (FR-015, FR-018)
```

`clearOnboardingState` exists to return to `pending`; it is a development and test affordance,
not reachable from the interface.

---

## 6. Tour steps *(`web/src/onboarding/onboarding.ts`)*

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Stable step identity. |
| `anchor` | `string` | Matches a `data-tour` attribute on the element the step describes. |
| `title` | `string` | Step heading. |
| `body` | `string` | Step copy. |

The shipped steps cover the five concerns FR-016 names: navigation, Overview, the document
stage, reloading from disk, and Help. They are **data, not markup**, so their count and copy
are testable without rendering - which is what lets `onboarding.test.ts` assert that every
step's anchor is non-empty and that the replay affordance is described.

**Anchor contract**: a step whose `anchor` matches no rendered element must not strand the
tour. This is the config's one real coupling to the DOM, and the reason the anchor is a
matched attribute rather than a CSS selector: an attribute is greppable from the component
that owns it.

---

## 7. Status vocabulary *(`formatStatusLabel`, and `StatusChip.tsx`)*

| Stored value | Human label | Icon role |
|---|---|---|
| `done` | Done | Completion |
| `review` | In review | Review |
| `in-progress` | In progress | Activity |
| `backlog` | Backlog | Queued |
| *anything else* | the raw value | none - renders as plain text |

The unrecognised case is a **requirement**, not a fallback (research § 8): the vocabulary
belongs to the BMAD tooling, so a corpus from a newer version must stay readable.

`countOpenActionItems` counts every item whose status is not exactly `done` - deliberately
inclusive, so an unrecognised status counts as open. Under-reporting outstanding work is the
worse error.

---

## 8. Design tokens *(`web/src/tokens.css`)*

Three tiers, with a hard rule that **components reference the semantic tier only**.

| Tier | Contents | Consumed by |
|---|---|---|
| Primitives | Raw ramps - neutrals, accent, status hues, shadow | The semantic tier only |
| Semantic | Roles: `--color-bg-*`, `--color-border-*`, `--color-text-*`, `--color-accent*`, `--color-status-*`, `--color-focus-ring`, plus spacing/radius/duration/easing | Components, and `theme.ts` |
| Theme mapping | `createAppTheme(mode)` in `web/src/theme.ts` | The component library's own chrome |

The semantic tier is the seam feature 019 remaps to produce a second appearance; nothing in
this feature should require a component edit to support one. A reduced-motion block neutralises
the duration tokens at the source, so honouring FR-029 is not each component's job.
