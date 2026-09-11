# Phase 1 Design Reference: UI Visual Refresh

No new data entities (spec.md's Key Entities section is explicitly empty - this feature is
a visual/styling change over data already rendered elsewhere). This file instead records
the concrete design tokens and mappings the research.md decisions establish, as a single
source of truth for implementation and manual verification.

## Theme tokens (`web/src/theme.ts`)

| Token | Before | After |
|---|---|---|
| `typography.fontSize` | `13` | `15` (research.md § 2) |
| `palette.primary` | unset (MUI dark-mode default, `#90caf9`, implicit) | explicit `{ main: "#90caf9" }` - same value, now deliberate (research.md § 3) |

## Status → icon color mapping (`StatusText`, `SprintStatusView.tsx`)

| Status | Icon (unchanged) | Icon `color` (new) |
|---|---|---|
| `done` | `CheckCircleIcon` | `success` |
| `review` | `RateReviewIcon` | `warning` |
| `backlog` | `Inventory2Icon` | `disabled` |
| `in-progress` | `AutorenewIcon` | `info` |
| *(any other value)* | none (unchanged) | none - plain text, no color, exactly as today |

## Tile-heading accent color (research.md § 4)

| Element | File | Color |
|---|---|---|
| "Summary" heading | `SprintStatusView.tsx` | `primary.light` |
| "Action Items" heading | `ActionItemsTile.tsx` | `primary.light` |
| Epic key (the `epic.epicKey` text only, not its status) | `SprintStatusView.tsx` | `primary.light` |
| Step index (`step.index` text) | `SprintStatusView.tsx` | `primary.light` |

## Summary tile key/value colors (research.md § 5)

| Element | Before | After |
|---|---|---|
| `Field`'s label | `text.secondary` | `info.light` (matches `PreambleReadout`'s keys) |
| `Field`'s value | unset (`text.primary`, inherited) | `warning.light` (matches `PreambleReadout`'s values) |

## Icon-header spacing fix (research.md § 1)

| Row | File | Change |
|---|---|---|
| `ActionItemRow` header | `ActionItemsTile.tsx` | Extra `marginRight` on the owner-icon element (or its wrapping `Tooltip`/`span`), widening only the gap before the status checkbox |
| `StepRow` header | `SprintStatusView.tsx` | Extra `marginRight` on the index-text `Typography`, widening only the gap before `StatusText` |

Exact margin value: tuned empirically during implementation, confirmed visually
(quickstart.md) - "look consistent" is a visual judgment, not a fixed metric (research.md
§ 1).
