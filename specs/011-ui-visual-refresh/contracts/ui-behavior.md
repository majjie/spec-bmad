# Contract: UI Behavior - UI Visual Refresh

Extends the existing Sprint Status view (features 006–009) and the Markdown frontmatter
tooltip (feature 010). No routes, no data shapes, and no interactions change - every
contract here is purely visual.

## Icon-header spacing

- In an Action Items row, the visual gap between the owner icon and the status checkbox
  matches the visual gap between the status checkbox and the jump control (FR-001).
- In an Epic Step Detail row, the visual gap between the index text and the status
  matches the visual gap between the status and the jump control, when present (FR-001).
- A row with the jump control absent (no matching document) is unaffected - its remaining
  elements' spacing is exactly as it was before this feature (Edge Cases).
- Every element's click behavior, tooltip, and disabled state are unchanged - only the
  visual distance between elements changes.

## Summary tile colors

- Every Summary field's label renders in the same color as a frontmatter tooltip's keys
  (FR-002).
- Every Summary field's value renders in the same color as a frontmatter tooltip's values
  (FR-003).

## Base text size

- The app's base body text is visibly larger than before this feature, applied
  consistently everywhere (not just one view) (FR-004).
- Every existing layout continues to display without clipping or overlapping content at
  the new size (FR-004's own constraint, verified per view in quickstart.md).

## Blue accent on tile headings

- The Summary tile's heading, the Action Items tile's heading, every epic's key text, and
  every step's index text render in the app's blue accent color (FR-005).
- That accent is the same hue already visible in the active tab's indicator today - no
  new or different blue is introduced.
- An epic's or step's own status text keeps its own semantic color (below), not the
  accent - the two never compete for the same element.

## Semantic status-icon colors

- `done` renders in a "success" (green) color; `review` in a "warning" (amber) color;
  `in-progress` in an "info" (blue) color; `backlog` in a muted "disabled" color (FR-006).
- This applies identically wherever a status renders - an epic's own status and a step's
  status use the exact same mapping, since both go through the same `StatusText`.
- A status value outside these four continues to render as plain text with no icon and no
  special color, exactly as before this feature (Edge Cases).

## Scope boundary

Nothing in this feature changes what data is shown, how navigation works, what's
clickable, or any route's response shape - every prior feature's acceptance scenarios
must continue to pass unchanged (FR-007, SC-005). This is the first feature in this
project with no genuine derivation/parsing logic of its own; constitution Principle V's
test-first requirement simply doesn't apply here, only its UI-rendering carve-out does.
