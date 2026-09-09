# Data Model: PRD Detail Viewer

This feature introduces one new derived entity, computed fresh from a PRD's Markdown text
each time it's viewed — nothing here is persisted or written back (Assumptions,
constitution Principle II).

## Requirement Code Reference

One detected occurrence of a requirement code within a `prd.md` document.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Sequential DOM-anchor id, assigned in document order (`prd-ref-0`, `prd-ref-1`, …) — used as the `id` attribute the corresponding rendered element receives, and the scroll-to target when a code is selected in a tooltip. |
| `code` | `string` | Full code text, e.g. `"FR-25"`, `"UJ-1"`. |
| `prefix` | `string` | The letter portion only, e.g. `"FR"`, `"UJ"` — always uppercase per the Assumptions. |
| `number` | `number` | The parsed digit portion as an integer, e.g. `25`, `1` — used for numeric (not lexical) sort within a prefix group (FR-010), so `"FR-9"` sorts before `"FR-10"`. |
| `style` | `"bullet" \| "header"` | Which of the two detected patterns produced this reference — not shown in the UI, but distinguishes the two source locations for a code that appears in both styles (Edge Cases). |

**Uniqueness / identity**: Not unique by `code` — the same code text may legitimately
appear more than once (as two bullet occurrences, two header occurrences, or one of each),
and every occurrence gets its own `id` and its own row in the relevant prefix's tooltip
list (Edge Cases). `id` is the only field guaranteed unique per reference.

**Derivation** (Pass 1, `buildRequirementCodeIndex` in `web/src/prdIndex.ts`, pure and
test-first):

1. Scan the raw, frontmatter-stripped Markdown text left to right for both patterns:
   - Bullet style: `**<2+ letters>-<1+ digits>**`
   - Header style: a level-3 heading (`###`) starting with `<2+ letters>-<1+ digits>`,
     followed by a space and an em dash (`—`)
2. For each match, in the order found, construct a `RequirementCodeReference` with the
   next sequential `id`.
3. Return the full ordered array — this is the single source of truth both for the
   sibling rendering pass's anchor assignment (§ research.md 3) and for building the
   prefix-tile groupings below.

## Prefix Group (derived view, not a stored entity)

A grouping of `RequirementCodeReference`s sharing the same `prefix`, used to render one
tile per unique prefix (FR-009) and that tile's tooltip contents (FR-010).

| Field | Type | Notes |
|---|---|---|
| `prefix` | `string` | The group's key, e.g. `"FR"`. |
| `references` | `RequirementCodeReference[]` | Every reference with this prefix, sorted ascending by `number` (FR-010) — ties (e.g. the same code in both styles) keep their relative document order, since a stable sort preserves the input array's own order for equal keys. |

**Derivation** (`groupByPrefix` in `web/src/prdIndex.ts`):

1. Group the full `RequirementCodeReference[]` by `prefix`.
2. Within each group, sort `references` by `number` ascending (stable sort).
3. Order the groups themselves by the first appearance of their prefix in the original
   (ungrouped) array — i.e. the index of each prefix's earliest reference — per the
   Assumptions' "ordered by first appearance" rule, not alphabetically.
4. If the input array is empty, return an empty array of groups — this is what suppresses
   the entire index column when no codes are detected (Acceptance Scenario 6, User Story
   2).

## Relationship to existing entities

No existing entity (`PrdDateEntry`, `PrdNonConformingEntry`, `NavigatorTree`, `api.ts`) is
changed in shape — `NavigatorDetailPane.tsx`'s `findPrdFolderName` helper is generalized to
return the whole matching entry (already carrying both `folderName` and `path`) instead of
just `folderName`, but no field is added to any type. `RequirementCodeReference` and its
prefix groupings exist purely in-memory within `PrdDetailView.tsx`'s render, recomputed via
`useMemo` whenever the fetched `prd.md` content changes.
