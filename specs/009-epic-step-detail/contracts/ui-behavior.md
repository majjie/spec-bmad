# Contract: UI Behavior — Epic Step Detail

Extends feature 006/007/008's Sprint Status contracts. No new routes — the existing `GET
/api/navigator/sprint-status` response's `epics[].steps` shape changes (data-model.md);
`epics[].stories` no longer exists.

## Collapse/expand

- Every epic tile renders collapsed by default: only its key and overall status are shown
  (FR-001).
- Every epic tile has its own toggle control, positioned in the tile's top-right corner
  (FR-002). Selecting it expands the tile; selecting it again collapses it.
- Expanding a tile reveals its full step list and its retrospective status line — the same
  content an expanded tile already shows today, unaffected by this feature except for how
  each step itself renders (FR-003).
- Every tile's collapsed/expanded state is independent — expanding one never affects any
  other tile (research.md § 5).

## Per-step rendering

- One two-line block per step, in the same order steps already render in today (FR-004,
  FR-010):
  - Header line: index, status, then the magnifying-glass control (present only when a
    matching spec document exists).
  - A second line below the header, containing the step's title.
- Adjacent step rows alternate background shading ("candy stripe", FR-011).
- No element of a step row is interactive except the magnifying-glass control.

## Magnifying-glass → file viewer integration

- Clicking a step's magnifying-glass control calls the same `onOpenFile` path the Action
  Items tile already uses (feature 008), passing the step's `specPath` — opening the
  *existing* `FileViewerDialog`, unchanged, with its existing rendering-mode dispatch and
  its existing close behavior (X icon, Escape, browser Back).
- If the matched spec document can't be read when opened (e.g. deleted or moved since the
  page loaded), the dialog opens anyway and shows the same error state it already shows for
  any other unreadable file — no new error UI (FR-009, Edge Cases).
- Closing this dialog returns the user to the Navigator tab with the Sprint Status node
  still selected, exactly as it already does for the Action Items tile's own jump icon.

## Scope boundary

No control anywhere in this feature edits, checks off, expands/collapses in a way that
persists, or reorders any step or epic — collapse/expand state is view-local and
transient, and the magnifying glass only ever opens the already-read-only file viewer.
Constitution Principle II is unaffected.
