# Phase 0 Research: UI Visual Refresh

## 1. Fixing the uneven icon-header spacing

**Decision**: In both `ActionItemsTile.tsx`'s `ActionItemRow` header and
`SprintStatusView.tsx`'s `StepRow` header, add extra right-margin to the first header
element specifically, widening only the gap between the first and second elements — not a
uniform `gap` change across the whole row, and not a reduction of the jump control's own
padding.

**Rationale**: Both rows share the same three-element shape: two plain icons/text with no
padding of their own, then a control housed in an `IconButton` (`size="small"`), which
carries its own internal padding on every side. A single flex `gap` value applies equally
between every pair of children, so the visible gap before the padded `IconButton` already
looks larger than the gap between the two padding-less elements before it — the flex
`gap` plus the button's own padding, versus the flex `gap` alone. The user explicitly
asked to "increase the gap between the first two" (not shrink the button's padding), so
the fix targets that specific pair — a `marginRight` on the first element, layered on top
of the row's existing `gap`, tuned so the two visible gaps read as equal. The exact
pixel value is tuned empirically and confirmed visually (quickstart.md), not computed
from a formula, since "look consistent" is inherently a visual judgment, not a fixed
metric — consistent with how every other UI/rendering change in this project is verified
(constitution Principle V's carve-out).

**Alternatives considered**: Removing the `IconButton`'s own padding instead (`sx={{ p:
0 }}`) — technically equally capable of achieving visual parity, but rejected because it
contradicts the explicitly requested fix direction ("increase the gap between the first
two," not "shrink the button"), and because the button's padding also serves as its
click-target size, which this feature must not shrink (FR-001 doesn't touch click
behavior, spec.md's Edge Cases).

## 2. Raising the base font size

**Decision**: Raise `theme.ts`'s `typography.fontSize` from `13` to `15`.

**Rationale**: The current value (13) sits *below* MUI's own stock default (14) — the app
was already smaller than a typical MUI application before this feature, which lines up
with the reported "fonts are too small" complaint. `15` is a deliberate, noticeably larger
step (roughly +15%) while remaining a plausible size for a dense, information-heavy
interface — verified visually across every existing view (quickstart.md) to confirm
FR-004's "no clipping or overlapping" constraint holds at this size.

**Alternatives considered**: `14` (MUI's own default) — rejected as too small a change to
register as "larger" against the stated complaint. `16` or higher — deferred; if `15`
turns out to cause layout strain in a tight area (e.g. the Action Items tile, the tab
bar) during visual verification, drop back rather than push further, since FR-004
explicitly prioritizes "no clipping" over how large the increase is.

## 3. An explicit, deliberately-chosen primary (blue) accent

**Decision**: Add an explicit `palette.primary` to `theme.ts`, pinned to MUI's own
dark-mode default blue (`#90caf9`) — the exact same hue already implicitly in use today
(e.g. the active tab's indicator and label color, which MUI derives from
`palette.primary` whether or not the theme declares it explicitly).

**Rationale**: FR-005 asks for "one deliberately-chosen blue accent color, built on the
hue already visible today" — the hue is already correct (nothing about how it currently
looks needs to change), but it's currently only present *by omission* (an unstated MUI
default that could silently shift on a future MUI major-version upgrade). Declaring it
explicitly in `theme.ts` makes the choice a real, intentional part of this project's own
theme rather than an implicit default, without introducing any visible change to the
color itself — zero risk of a mismatch between "the accent on tile headings" and "the
accent already visible on the active tab."

**Alternatives considered**: Choosing a different, new blue shade — rejected; FR-005
explicitly says to build on the hue *already visible*, and introducing a second, slightly
different blue would read as inconsistent rather than cohesive.

## 4. Applying the accent to tile headings

**Decision**: Apply `color: "primary.light"` to: the Summary tile's "Summary" heading, the
Action Items tile's "Action Items" heading, the epic key portion of each epic tile's
heading (the epic's status text keeps its own semantic color from decision § 6, not the
accent), and each step row's index text (its closest per-row analog to a tile heading,
per spec.md's FR-005 wording covering "a step").

**Rationale**: `primary.light` (not `primary.main`) reads as legible, appropriately
subtle body-adjacent text against this app's dark background — matching the weight
already used elsewhere for emphasis text (e.g. the frontmatter tooltip's `info.light`
keys) rather than the more saturated `primary.main`, which MUI reserves for filled
buttons/indicators at higher visual weight than a text label needs.

**Alternatives considered**: `primary.main` — rejected as visually heavier than a plain
text heading warrants at this app's information density; reserved for indicator-style
uses (the tab underline) where it already appears today.

## 5. Summary tile key/value colors

**Decision**: Change `Field`'s label `Typography` from `color="text.secondary"` to
`color="info.light"`, and its value `Typography` (currently uncolored, inheriting
`text.primary`) to `color="warning.light"` — the exact same two tokens the frontmatter
tooltip's `PreambleReadout` already uses for its keys and values respectively.

**Rationale**: FR-002/FR-003 ask for an exact match to an existing, already-shipped color
pairing — reusing the identical theme tokens (not just visually-similar colors) guarantees
they render identically, and keeps a single source of truth (MUI's theme palette) rather
than a second, independently-tuned pair that could drift out of sync later.

**Alternatives considered**: None seriously — "match the colours used in the information
tooltip" is a literal, unambiguous instruction naming an existing implementation to reuse
exactly.

## 6. Semantic status-icon colors

**Decision**: Map each of the four recognized statuses to a distinct MUI icon `color`:

| Status | Icon color | Rationale |
|---|---|---|
| `done` | `success` | Universally reads as "finished, good" |
| `in-progress` | `info` | "Actively happening now" — MUI's `info` blue is close in family to, but visually distinct from, the `primary` accent (§ 3/§ 4), reinforcing the overall blue theme without being identical |
| `review` | `warning` | "Needs attention" — the conventional meaning of amber/warning tones |
| `backlog` | `disabled` | Deliberately muted/de-emphasized — "not started yet, lowest visual priority" of the four |

Implemented via `StatusText`'s existing per-status `Icon` lookup gaining a parallel
per-status `color` lookup, passed straight through as the MUI `<Icon>` component's own
`color` prop (which already accepts these exact palette-name strings) — no manual `sx`
color needed.

**Rationale**: These four MUI semantic tokens already exist in the theme (no new palette
entries needed) and map naturally onto the four statuses' real-world meaning, satisfying
FR-006's "distinct, semantically fitting" bar without inventing new colors.

**Alternatives considered**: A custom four-color palette tuned specifically for these
statuses — rejected as unnecessary; MUI's existing semantic tokens already fit well and
keep this change to component/theme wiring only, no new palette entries.
