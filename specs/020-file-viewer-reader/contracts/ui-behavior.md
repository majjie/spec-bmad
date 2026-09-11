# UI Behavior Contract: File Viewer as a Reading Surface

**Feature**: [../spec.md](../spec.md) | **Data model**: [../data-model.md](../data-model.md)

No HTTP contract changes. The viewer fetches exactly what it fetched before; this feature
changes only how the result is presented.

## Opening

- Opens as a centred panel over the application, on a surface distinct from the page behind
  it - not a full-screen takeover (FR-006).
- Opens at the **reading size**, always, regardless of how the previous document was left
  (FR-009, SC-004).
- Every opening is labelled by its derived title, which is exposed as the panel's accessible
  name.

## Header

- Shows the document's declared title when present and non-blank (FR-001).
- Otherwise shows a title derived from the filename - conventional prefix removed, remaining
  words sentence-cased (FR-002).
- A declared title that is blank or whitespace is treated as **absent**, not honoured.
- Shows status, type, and creation date when declared; omits any that are not, with no label
  and no placeholder (FR-003, SC-005).
- Identifies the underlying file, so the reader can always tell what is open (FR-004).
- Ignores declared keys it does not recognise, rather than rendering them generically.
- Carries exactly two controls: expand/shrink, and close.

## Reading

- Prose is bounded to a comfortable measure and does not grow with the window (FR-005,
  SC-002).
- A table or fenced code block wider than the measure scrolls within its own block, without
  widening the prose around it - unchanged from feature 017.
- All rendering behavior established by feature 017 is preserved exactly: table grids, fenced
  code block backgrounds, and syntax colouring for declared languages (FR-012, SC-006).
- Non-Markdown content renders as it did before, inside the same panel.

## Expanding

- The expand control grows the panel to nearly fill the window, keeping a thin margin so it
  still reads as a panel (FR-007).
- When expanded, the content **widens to use the room** - it does not stay at the reading
  measure (FR-008). These are two decisions driven by one flag and they must agree.
- Activating the control again returns the panel to the reading size.
- The control exposes its current pressed state to assistive technology, not only its label
  (FR-010).
- Its label names the action it will perform.

## Narrow windows

- The panel shrinks rather than overflowing, in both states (FR-011).
- Prose never requires sideways scrolling; only wide content scrolls, and only within its own
  block.

## Closing

- Closing resets the size state, so the next document opens at the reading size (FR-009).
- The close control is always present and reachable by keyboard.

## Explicitly unchanged

- What the viewer fetches, and from where.
- Which files open in the viewer, and from which contexts - sprint status steps, review
  files, addenda, and navigator selections all open it exactly as before.
- Feature 010's dedicated affordance for inspecting a document's full declaration block. The
  header shows a curated subset; it does not replace that affordance.
- Feature 012's and 016's in-page detail views, which are not dialogs and are not affected.
