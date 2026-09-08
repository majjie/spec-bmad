# Contract: UI Behavior — Navigator Tab Uplift

Extends feature 006's own contracts. No new routes; `GET /api/navigator/sprint-status`'s
existing 200/404/422 status codes and body shape are unchanged except one added field.

## `GET /api/navigator/sprint-status` (response body, extended)

`summary` gains one field, `activeEpic: string` (data-model.md) — computed server-side by
`parseSprintStatus`, per FR-009/FR-010. No other field, status code, or route changes.

## App load — default tab (FR-001/FR-002)

- On load, before `GET /api/tabs` resolves, the Navigator tab is shown optimistically.
- Once resolved: if `navigator` is `true`, it stays the active tab. If `false`, the app
  switches to the Infra tab — exactly the pre-uplift default.
- The FR-012-era baseline history entry (feature 002/003) reflects whichever tab actually
  ends up active, not always Infra.

## Sprint Status view — icons (FR-003/FR-004/FR-005)

- An epic's own status row shows an icon immediately before (or after) its existing text
  label, when the status is one of `done`/`review`/`backlog`/`in-progress`.
- Each story row shows the same treatment, using the identical icon-to-status mapping an
  epic's own status uses.
- Any other status string (epic or story) shows its text label with no icon and no error
  — the existing text-only rendering, unchanged.
- Retrospective status rows are unaffected (still text-only, e.g. "not started").

## Sprint Status view — epic tile layout (FR-006/FR-007/FR-008)

- The Summary tile keeps its existing appearance and position.
- Epic tiles render below it as a single vertical column, each spanning the full width of
  the detail pane, in the same order `epics` already provides (file-declared order,
  feature 006's FR-013) — this changes arrangement only, not order or content.

## Sprint Status view — Active Epic (FR-009/FR-010)

- Rendered as one more entry in the Summary tile's existing field list (alongside
  Generated/Last updated/Project/Project key/Tracking system/Story location) — no new
  tile, no special-cased rendering path.

## Scope boundary

No control anywhere in this feature adds, edits, or removes anything — a default-tab
choice and three rendering changes over data feature 006 already reads and shapes.
Constitution Principle II (read-only) is unaffected.
