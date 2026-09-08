# Feature Specification: Action Items Tile

**Feature Branch**: `008-action-items-tile`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "I would like an extra tile on the navigator -> sprint status
pane. It will be an action items tile. It will sit to the right of the summary tile and be
the same height, consuming the rest of the space on that row. The items will be a
repeating item sitting within a scrolling container. Each item will consist of a header
with: an owner-type icon (human outline unless owner is 'dev loop', in which case a
computer-like icon; tooltip is the raw owner text), a read-only tick-box icon (filled when
status is 'done'), a bending-arrow 'jump icon' (tooltip is the raw ref text), the epic in
small text — to the right of the jump icon — and the action text. If any bound property
is missing, hide that element. If the jump icon is clicked and the referenced file exists,
a file view dialog is invoked, with the same close/back behaviour as the Infra/Output
tabs' file view dialog."

## Clarifications

### Session 2026-09-08

- Q: The source description's sentence describing the epic label's position was cut off
  ("The epic in small text to the right of the ...") — what does it sit to the right of?
  → A: The jump icon.

### Session 2026-09-08 (post-implementation feedback)

- Q: Should the Summary tile's height still govern the row (with Action Items scrolling to
  fit), or the reverse? → A: ~~The Action Items tile establishes the shared row height; the
  Summary tile stretches to match it.~~ **Superseded** (Session 2026-09-08, round 3 below):
  attempting to let Action Items dictate the height led first to Action Items being visibly
  *shorter* than Summary whenever Summary's real content was long, then — once that was
  fixed — to Summary being forced to scroll, and finally to Action Items' own unbounded
  item count inflating the row instead of scrolling. The Summary tile's natural height
  governs the row after all, exactly as it did before this feature; Action Items matches it
  and scrolls internally, no matter how many items it holds.
- Q: Should an item's action text sit inline with its header icons, or on its own line? →
  A: On its own line, directly below the header row — the original description's separation
  of "a header with [icons]" from "the text within the action" was correct; rendering it
  inline was a mistake to correct now.
- Q: In what order should items with different statuses render? → A: All non-`"done"`
  items first, then all `"done"` items; within each of those two groups, the file's
  declared order is preserved (a stable partition, not a full re-sort).
- Q: What glyph should the jump icon use? → A: A magnifying glass (search icon), not a
  bending arrow — the bending-arrow glyph from the original description is superseded.
- Q: Should adjacent item rows look visually distinct from one another? → A: Yes —
  alternating ("candy stripe") row backgrounds.

### Session 2026-09-08 (round 3 — height mechanism correction)

- Q: Given the Action-Items-dictates-height approach (round 2 above) proved unworkable in
  practice, what's the final, load-bearing rule? → A: The Summary tile always renders at
  its own natural height and never scrolls internally, exactly as before this feature
  existed. The Action Items tile matches that height exactly (not merely "close to it" or
  "at least that tall") and scrolls its own items internally, regardless of how many there
  are — a large action-items list must never make the Action Items tile (or the row, or the
  Summary tile) grow past the Summary tile's natural height.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See action items alongside the sprint summary (Priority: P1)

A user viewing the Sprint Status view sees a new tile, next to the Summary tile, listing
every action item from the sprint-status file — each showing at a glance who (or what)
owns it, whether it's done, which epic it belongs to, and what it says — without leaving
the view, even when there are more items than fit on screen at once.

**Why this priority**: This is the entire feature — everything else (the jump-to-file
behavior) is a refinement of an item that's already visible and readable on its own.

**Independent Test**: Open a Sprint Status view for a file with several action items
covering a mix of owners, statuses, and epics, including at least one item missing a
property (e.g. no `ref`); confirm the tile appears beside the Summary tile at the same
height, every item's visible elements match its data, the missing property's element is
absent (not blank/broken), and the tile scrolls internally once there are enough items to
overflow it.

**Acceptance Scenarios**:

1. **Given** a sprint-status file with action items, **When** the user opens the Sprint
   Status view, **Then** an "Action Items" tile appears immediately to the right of the
   Summary tile, matching its height, filling the rest of that row.
2. **Given** an action item whose `owner` is `"dev loop"`, **When** it renders, **Then**
   its owner icon is the computer-like icon; **given** any other (or missing) `owner`
   value, **then** it's the human-outline icon (or absent, if `owner` is missing).
3. **Given** an action item whose `status` is `"done"`, **When** it renders, **Then** its
   tick-box icon appears filled; **given** any other status, **then** it appears unfilled.
4. **Given** an action item missing one of `owner`, `status`, `ref`, `epic`, or `action`,
   **When** it renders, **Then** only the element bound to that missing property is
   absent — every other element still renders normally.
5. **Given** more action items than fit within the tile's height, **When** the user
   scrolls within the tile, **Then** the rest of the items come into view without the
   tile itself, the Summary tile, or the page growing.
6. **Given** a sprint-status file with no action items at all (or no `action_items` key),
   **When** the Sprint Status view renders, **Then** the tile still appears, showing an
   empty-state message.

---

### User Story 2 - Jump to an action item's referenced document (Priority: P2)

A user viewing an action item clicks its jump icon and the document it references opens
in the same full-screen file viewer already used elsewhere in this tool, closable the
same three ways (its "X", Escape, or the browser's Back).

**Why this priority**: A valuable shortcut, but every action item is already fully
readable without it (User Story 1) — this only adds a way to go see the source document.

**Independent Test**: Click the jump icon on an action item whose `ref` points to a real,
readable file; confirm the same file viewer dialog used by the Infra/Output tabs opens
showing that file, and that closing it via the "X", Escape, and browser Back all work
identically to how they already do there.

**Acceptance Scenarios**:

1. **Given** an action item whose `ref` points to a file that exists and can be read,
   **When** the user clicks its jump icon, **Then** the file viewer dialog opens showing
   that file's contents.
2. **Given** the file viewer dialog opened this way, **When** the user closes it via its
   "X" icon, the Escape key, or the browser's Back action, **Then** it closes and browser
   history stays consistent, identically to the existing file viewer dialog's behavior.
3. **Given** an action item whose `ref` points to a file that can't be read (missing,
   unreadable, etc.), **When** the user clicks its jump icon, **Then** the dialog still
   opens but shows an error message in place of file contents, rather than nothing
   happening or a broken view.

---

### Edge Cases

- What happens when the sprint-status file has no `action_items` key, or an empty one?
  The tile still appears, showing an empty-state message (FR-012).
- What happens when an action item is missing every one of its displayable properties
  (`owner`, `status`, `ref`, `epic`, `action`)? Every element is hidden per FR-008, leaving
  an effectively empty row for that item — an accepted, if unusual, consequence of hiding
  per-property rather than skipping the whole item.
- What happens when the jump icon's referenced file can't be read? The file viewer dialog
  still opens, showing an error message (FR-011) — the same behavior the dialog already
  has for any other unreadable file.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: An "Action Items" tile MUST appear on the Sprint Status view, positioned
  immediately to the right of the Summary tile, in the same row.
- **FR-002**: The Summary tile MUST render at its own natural height and MUST NOT scroll
  internally under any circumstance. The Action Items tile MUST match the Summary tile's
  height exactly and MUST fill the remaining horizontal space in the row, regardless of how
  many action items it holds (round 3 Clarifications — this supersedes the round 2 "Action
  Items dictates the height" rule, which proved unworkable).
- **FR-003**: When there are more action items than fit within the tile's height, the
  tile's own contents MUST scroll internally — the tile itself MUST NOT grow taller.
- **FR-004**: Each action item MUST render as a two-line block: a header line containing,
  in order, an owner-type icon, a read-only tick-box icon, a jump icon, and the item's epic
  in small text immediately to the right of the jump icon; followed by a second line
  containing the item's action text.
- **FR-005**: The owner-type icon MUST be a human-outline icon when the item's `owner`
  value is anything other than `"dev loop"`, or a computer-like icon when it is
  `"dev loop"` exactly; its tooltip/accessible text MUST be the raw `owner` value.
- **FR-006**: The tick-box icon MUST appear filled when the item's `status` is `"done"`
  exactly, and unfilled for any other status value.
- **FR-007**: The jump icon's tooltip/accessible text MUST be the item's raw `ref` value.
- **FR-008**: When an action item is missing its `owner`, `status`, `ref`, `epic`, or
  `action` property, the element bound to that specific property MUST be hidden — every
  other element of that same item MUST still render normally.
- **FR-009**: Action items MUST render with every non-`"done"` item before every `"done"`
  item; within each of those two groups, the sprint-status file's declared order MUST be
  preserved (a stable partition by done-status, not a full re-sort).
- **FR-010**: Selecting an action item's jump icon MUST open the file it references in
  the same file-viewing dialog used by the Infra/Output tabs, with the same close
  behavior (its "X" icon, Escape, and browser Back all close it and keep browser history
  consistent).
- **FR-011**: If the referenced file can't be read, the dialog MUST show an error message
  in place of file contents rather than a broken or blank view — the same behavior the
  dialog already has for any other unreadable file.
- **FR-012**: When the Sprint Status view has no action items at all, the Action Items
  tile MUST still appear, showing an empty-state message rather than an error or blank
  space.
- **FR-013**: No element of an action item is interactive except the jump icon — the
  tick-box, owner icon, epic text, and action text are read-only display only, consistent
  with the project's read-only principle.
- **FR-014**: Adjacent action item rows MUST alternate background shading ("candy stripe")
  so a row's boundaries are visually distinguishable from its neighbors at a glance.

### Key Entities

- **Action Item**: One entry from the sprint-status file's `action_items` list; has an
  identifier (not displayed), an epic number, action text, an owner, a status, and a file
  reference (`ref`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can see every action item in a Sprint Status view without leaving
  it, no matter how many there are.
- **SC-002**: A user can tell, without reading any text, whether an action item is
  assigned to a person or to the automated dev loop, and whether it's done.
- **SC-003**: A user can open an action item's referenced document in a single click from
  the Sprint Status view.

## Assumptions

- Clicking the jump icon always opens the file viewer dialog; a nonexistent or unreadable
  `ref` surfaces through the dialog's own existing error state (the File Content Viewer
  feature's established behavior) rather than being pre-checked and silently suppressed.
- `ref` is a path relative to the project's root folder (matching the sample data's own
  `_bmad-output/...` shape), resolved via the same file-serving path the Output tab
  already uses — action items only ever come from a file already located under
  `_bmad-output`.
- The epic number is displayed as `epic-<N>` (e.g. "epic-1"), matching the epic-key
  convention already used elsewhere in the Sprint Status view, rather than the bare
  number the file itself stores.
- Exact icon glyphs for the owner-type and tick-box icons are a visual design choice left
  to implementation, consistent with prior features' precedent. The jump icon's glyph is a
  magnifying glass (search icon), per the post-implementation Clarifications above.
- The Action Items tile always renders whenever the Sprint Status view itself renders,
  with an empty-state message when there are no items — consistent with how the epic-tile
  area already behaves when there are no epics.
- This feature only adds a new read path for `action_items` data already present in the
  sprint-status file; no editing, checking off, or reordering of any kind.
