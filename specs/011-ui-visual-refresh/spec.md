# Feature Specification: UI Visual Refresh

**Feature Branch**: `011-ui-visual-refresh`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "The general appearance of the UI needs tweaking. It's too
monotone, and the fonts are too small. Given that the accent colour of the scheme so far,
has a blue-ish hue, let's build off of that. On action items, there are three items in the
header; two icons and a button which houses an icon. The button introduces some padding/
margin. As a result the gap between the first two icons looks much less than the gap
between the second and third icons. Can you increase the gap between the first two to
look consistent? For the summary tile, can you use different colours on the key and
value? Match the colours used in the information tooltip for markdown files. I'll take
further suggestions on anything else you think would lift the appearance."

## Clarifications

### Session 2026-09-08

- Q: Should User Story 3 proceed with all three proposed enhancements (larger base font,
  blue accent on every tile heading, semantic status-icon colors), or should any be
  dropped/adjusted? → A: Proceed with all three as proposed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent icon spacing in item-row headers (Priority: P1)

A user scanning an Action Items row or an Epic Step Detail row sees its icons evenly
spaced — the gap between the first two no longer looks noticeably tighter than the gap
between the second and third, even though the third is housed inside a clickable control
that carries its own padding.

**Why this priority**: A concrete, easily-verified visual bug reported directly — every
row in both tiles currently shows this inconsistency.

**Independent Test**: Open a Sprint Status view with at least one action item that has an
owner icon, a status icon, and a jump control, and at least one epic step with a status
and a jump control; visually confirm the gap between the first two icons matches the gap
between the second and third in both places.

**Acceptance Scenarios**:

1. **Given** an Action Items row with all three header elements present, **When** it
   renders, **Then** the visual gap between the owner icon and the status icon matches the
   visual gap between the status icon and the jump control.
2. **Given** an Epic Step Detail row with a status and a jump control, **When** it
   renders, **Then** the visual gap between the index text and the status matches the
   visual gap between the status and the jump control.
3. **Given** a row where the jump control is absent (no matching document), **When** it
   renders, **Then** the remaining elements' spacing is unaffected by this fix.

---

### User Story 2 - Summary tile key/value colors match the frontmatter tooltip (Priority: P1)

A user viewing the Sprint Status Summary tile sees each field's label and value in the
same two colors already used for the Markdown frontmatter tooltip's key/value readout —
one consistent visual language for "label vs. value" across the app.

**Why this priority**: A concrete, small consistency fix directly requested, reusing a
color pairing that already exists elsewhere in the app.

**Independent Test**: Open the Sprint Status Summary tile and a Markdown file with a
frontmatter preamble side by side (or in sequence); confirm the Summary tile's field
labels use the same color as the tooltip's keys, and the Summary tile's field values use
the same color as the tooltip's values.

**Acceptance Scenarios**:

1. **Given** the Summary tile, **When** it renders, **Then** every field's label renders
   in the same color as a frontmatter tooltip's keys.
2. **Given** the Summary tile, **When** it renders, **Then** every field's value renders
   in the same color as a frontmatter tooltip's values.

---

### User Story 3 - A more deliberate, less monotone visual theme (Priority: P2)

A user opening the app perceives a more considered visual design than today's — larger,
easier-to-read text throughout, and a cohesive color scheme that builds on the blue accent
already present rather than reading as flat gray-and-white.

**Why this priority**: The headline complaint ("too monotone," "fonts too small"), but
broader and more a matter of design judgment than User Stories 1–2 — appropriately
sequenced after the two concrete, unambiguous fixes.

**Independent Test**: Open the app fresh; confirm body text is legible at a comfortable
size without leaning in, and that the blue accent already used for active states (e.g.
the selected tab) now also appears deliberately elsewhere (e.g. tile headings), alongside
at least one additional distinguishing color (e.g. semantically-colored status icons)
rather than every status looking the same shade as its surrounding text.

**Acceptance Scenarios**:

1. **Given** the app freshly opened, **When** any view renders, **Then** its base body
   text is visibly larger than today's.
2. **Given** any tile with a heading (Summary, Action Items, an epic, a step), **When** it
   renders, **Then** its heading uses the app's blue accent color rather than plain
   default text color.
3. **Given** an epic or step status icon (done/review/backlog/in-progress), **When** it
   renders, **Then** its icon uses a distinct, semantically fitting color for that status
   rather than the surrounding text's color.
4. **Given** every other existing behavior (layout, data shown, interactions), **When**
   this feature ships, **Then** none of it changes — this is a visual-only refresh.

---

### Edge Cases

- What happens if the larger base font size causes text to wrap or overflow in a
  tight area (e.g. a narrow tile, the tab bar)? Existing layouts must accommodate the
  larger size without clipping or overlapping content — this is a constraint on how much
  larger the text can practically go, not a reason to skip the increase.
- What happens to contrast/legibility once new accent colors are introduced against the
  existing dark background? Every new color choice must remain clearly readable against
  that background — consistent with the app's current (informal) legibility bar.
- What happens to a status value that isn't one of the four recognized statuses (done/
  review/backlog/in-progress)? It continues to render as plain text with no icon and no
  special color, unchanged from today (no new status categories are introduced by this
  feature).
- Does the icon-spacing fix change what's clickable, or only how far apart things look?
  Only the visual spacing changes — every element's click behavior is unaffected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: In both the Action Items tile's rows and the Epic Step Detail tile's rows,
  the visual gap between the first two header elements MUST match the visual gap between
  the second and third, even though the third is housed inside a control that carries its
  own internal padding.
- **FR-002**: The Summary tile's field labels MUST render in the same color already used
  for a Markdown frontmatter tooltip's keys.
- **FR-003**: The Summary tile's field values MUST render in the same color already used
  for a Markdown frontmatter tooltip's values.
- **FR-004**: The app's base body text size MUST increase from its current size, applied
  consistently across the app (not just one view), while every existing layout continues
  to display without clipping or overlapping content.
- **FR-005**: The app MUST use one deliberately-chosen blue accent color, built on the hue
  already visible today (e.g. the active tab indicator), applied consistently to
  interactive/emphasis elements — including, at minimum, every tile heading (Summary,
  Action Items, an epic, a step).
- **FR-006**: Each of the four recognized statuses (done/review/backlog/in-progress) MUST
  render its icon in its own distinct, semantically fitting color (e.g. a completed state
  reading as unambiguously "finished" versus an in-progress state reading as
  unambiguously "ongoing") rather than every status sharing the surrounding text's color.
- **FR-007**: None of this feature's changes MUST alter any existing behavior, data, or
  interaction — every change is visual/styling only.

### Key Entities

*No new data entities — this feature is a visual/styling change over data already
rendered elsewhere.*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can read the app's body text comfortably at a normal viewing
  distance, without needing to lean toward the screen.
- **SC-002**: A user scanning an Action Items or Epic Step Detail row perceives its icons
  as evenly spaced, not lopsided toward one side.
- **SC-003**: A user can tell a Summary field's label from its value by color alone, using
  the same color association they've already learned from the Markdown frontmatter
  tooltip.
- **SC-004**: A user can distinguish a "done" status from an "in-progress" status by color
  alone, without reading the status text.
- **SC-005**: Every existing acceptance scenario from prior features (navigation, file
  viewing, action items, epic steps, frontmatter stripping) continues to pass unchanged —
  this feature adds no new functional behavior.

## Assumptions

- The description names "action items" specifically, but the exact three-item header
  shape it describes (two plain icons/text, then an icon housed in a button) also appears
  in the Epic Step Detail tile's step rows — User Story 1 treats both as the same
  underlying issue and fixes them together, rather than leaving one inconsistent with the
  other.
- Exact color values (hex/theme-token choices), the exact base font size, and exact
  spacing values are visual-design decisions made during planning — this spec commits to
  the *direction* (build on the existing blue hue; increase text size; match specific
  existing color pairings; semantically color status icons) without pinning down specific
  numbers or codes.
- The app's existing dark theme is unchanged by this feature — this is a refinement
  within that dark theme, not a light-mode option or a theme toggle.
- "The information tooltip for markdown files" refers to the frontmatter preamble readout
  already shipped (feature 010) — its existing key color and value color are the two
  colors User Story 2 reuses, whatever they currently are.
- Beyond the two concretely-requested fixes (icon spacing, Summary tile colors) and the
  three User Story 3 enhancements confirmed via Clarifications (larger base text, an
  intentional accent applied to tile headings, semantic status-icon coloring), no further
  visual changes are in scope for this feature — additional ideas can be proposed as
  follow-up feedback the same way prior rounds in this project have been.
- No new dependency is required — this feature only adjusts this project's existing theme
  configuration and existing components' own styling.
