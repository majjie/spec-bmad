# Contract: UI Behavior — Action Items Tile

Extends feature 006/007's Sprint Status contracts. No new routes — the existing `GET
/api/navigator/sprint-status` response gains one field (`actionItems`, data-model.md).

## Layout

- The Summary tile and the new Action Items tile share one row: the Summary tile renders
  at its own natural height and never scrolls; the Action Items tile fills the rest of the
  row's width and matches the Summary tile's height exactly, no matter how many items it
  holds (FR-001/FR-002, round 3 Clarifications — the Summary tile's own rendered height is
  measured and applied directly to the Action Items tile, since CSS alone can't stop an
  unbounded item count from otherwise inflating the row, research.md § 4).
- The epic-tile stack (feature 007) renders below this row, unchanged in every respect.
- The Action Items tile's own contents scroll internally once they overflow its height —
  the tile itself, the row, and the Summary tile never grow to accommodate more items
  (FR-003).
- When `actionItems` is empty, the tile still renders, with an empty-state message in
  place of any rows (FR-012).

## Per-item rendering

- One two-line block per `ActionItem` (FR-004, post-implementation Clarifications):
  - Header line: owner-type icon, tick-box icon, jump icon, epic label (in that order).
  - A second line below the header, containing the action text.
- Item order: every non-`"done"` item before every `"done"` item, file-declared order
  preserved within each group (FR-009, data-model.md's derivation rules table).
- Each element renders only when its bound field is non-`null` (FR-008) — see
  data-model.md's rendering table for the exact condition per element.
- Adjacent rows alternate background shading ("candy stripe", FR-014).
- No element is interactive except the jump icon, which uses a magnifying-glass glyph
  (FR-013).

## Jump icon → file viewer integration

- Clicking a jump icon calls the same file-opening path Infra/Output's `ContentsTable`
  already uses, passing the item's `resolvedPath` — opening the *existing*
  `FileViewerDialog` (feature 004), unchanged, with its existing rendering-mode dispatch
  and its existing close behavior (X icon, Escape, browser Back), per research.md § 3.
- If the resolved path doesn't correspond to a readable file, the dialog opens anyway and
  shows the same error state it already shows for any other unreadable file (FR-011) — no
  new error UI is introduced.
- Closing this dialog returns the user to the Navigator tab with the Sprint Status node
  still selected — never to the Output tab, even though the file's *content* was fetched
  through the Output tab's own route under the hood (research.md § 3).

## Scope boundary

No control anywhere in this feature edits, checks off, or reorders an action item, or
writes anything — the jump icon only ever opens the already-read-only file viewer.
Constitution Principle II is unaffected.
