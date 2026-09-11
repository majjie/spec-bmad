# Feature Specification: File Viewer as a Reading Surface

**Feature Branch**: `020-file-viewer-reader` (implemented on `ux-polish-console`)

**Created**: 2026-09-11

**Status**: Retrofitted

**Input**: User description: "Opening a document should feel like opening a document. Give
the file viewer a real title and a comfortable reading column instead of a full-screen sheet
of edge-to-edge text, and let the reader expand it when the content needs the room."

> **Retrofit note**: reconstructed from an already-implemented branch rather than written
> ahead of it, so it did not gate the work it describes (constitution Principle I). It builds
> on the Markdown rendering established by feature 017 and the token layer from feature 018.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Know what I just opened (Priority: P1)

A developer opens a step's specification from sprint status. Instead of a header showing a
path, they see the document's own title - taken from the document when it declares one, and
otherwise derived from its filename into something readable - alongside the few facts that
identify it: its status, its type, when it was created.

**Why this priority**: The viewer is reached from several places and the reader arrives
without context. A header showing a path makes them reconstruct what they are looking at from
a string; a title and a handful of facts answer it directly.

**Independent Test**: Open a specification file that declares a title and one that does not,
and confirm both show a readable title. Delivers identification independently of any layout
change.

**Acceptance Scenarios**:

1. **Given** a document that declares its own title, **When** it opens, **Then** that title
   is the header.
2. **Given** a document with no declared title, **When** it opens, **Then** a readable title
   is derived from its filename rather than showing the raw name.
3. **Given** a document declaring status, type, or creation date, **When** it opens, **Then**
   those facts appear alongside the title.
4. **Given** a document declaring none of them, **When** it opens, **Then** the header shows
   the title alone, without empty fields or placeholder labels.

---

### User Story 2 - Read comfortably (Priority: P1)

A developer reading a long specification gets a centred column of a comfortable measure on a
distinct surface, rather than prose stretched across the full width of a large monitor.

**Why this priority**: Equal to US1. Line length is the single largest determinant of whether
long prose is actually readable, and these documents are long prose. A full-width sheet on a
wide display is the specific problem being fixed.

**Independent Test**: Open a long document on a wide display and confirm the text sits in a
bounded, centred column rather than spanning the viewport.

**Acceptance Scenarios**:

1. **Given** a wide display, **When** a document opens, **Then** its text is bounded to a
   comfortable measure rather than the full window width.
2. **Given** the viewer is open, **When** the reader looks at it, **Then** it reads as a
   panel over the application rather than as a full-screen takeover.
3. **Given** a narrow window, **When** a document opens, **Then** the viewer adapts without
   clipping content or forcing sideways scrolling of prose.

---

### User Story 3 - Give me the room when I need it (Priority: P2)

A developer hits a wide table or a broad diagram inside a document and expands the viewer to
nearly the full window. The content uses the extra width. When they are done, the viewer
returns to its reading size - and the next document they open starts at the reading size
again.

**Why this priority**: The comfortable measure is right for prose and wrong for wide content.
This is the escape hatch, valuable but secondary to getting the default right.

**Independent Test**: Open a document containing a wide table, expand, confirm the content
uses the width, close, and confirm the next document opens at the reading size.

**Acceptance Scenarios**:

1. **Given** an open document, **When** the reader activates the expand control, **Then** the
   viewer grows to nearly fill the window and the content widens to use it.
2. **Given** an expanded viewer, **When** the reader activates the control again, **Then** it
   returns to the reading size.
3. **Given** an expanded viewer, **When** the reader closes it and opens another document,
   **Then** the new document opens at the reading size, not expanded.
4. **Given** the expand control, **When** assistive technology inspects it, **Then** its
   current state is exposed, not just its label.

### Edge Cases

- A document declares a title that is empty or only whitespace: treated as absent, and a
  title is derived from the filename instead.
- A filename follows no recognised convention: a readable title is still produced rather than
  an empty header.
- A document's content is wider than the reading column even when expanded: it scrolls within
  its own block, without breaking the prose measure around it (feature 017's established
  behavior).
- A document declares facts this viewer does not recognise: they are ignored, not rendered as
  unlabelled values.
- A non-Markdown file is opened: it continues to render as it did before, inside the same
  reading surface.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The viewer MUST show the document's own declared title as its header when one
  is present and non-empty.
- **FR-002**: When no title is declared, the viewer MUST derive a readable title from the
  filename, removing conventional prefixes and rendering the remainder as words.
- **FR-003**: The viewer MUST show the document's status, type, and creation date when
  declared, and MUST omit any that are not - never rendering an empty field or a placeholder.
- **FR-004**: The viewer MUST identify the underlying file, so the reader can always tell
  which file is open.
- **FR-005**: Document text MUST be bounded to a comfortable reading measure rather than the
  full width of the viewer.
- **FR-006**: The viewer MUST present as a centred panel over the application, on a surface
  distinct from the page behind it.
- **FR-007**: The viewer MUST offer a control that expands it to nearly fill the window, and
  returns it to the reading size.
- **FR-008**: When expanded, the document content MUST widen to use the additional room
  rather than remaining at the reading measure.
- **FR-009**: The expanded state MUST reset when the viewer closes, so each document opens at
  the reading size.
- **FR-010**: The expand control MUST expose its current state to assistive technology, not
  only its label.
- **FR-011**: The viewer MUST remain usable in a narrow window, without clipping content or
  requiring sideways scrolling of prose.
- **FR-012**: All rendering behavior established by feature 017 - tables, fenced code blocks,
  syntax colouring - MUST be preserved unchanged inside the viewer.

### Key Entities

- **Document header facts**: the title, status, type, creation date, and filename shown for
  an open document. Derived per open; nothing is persisted.
- **Viewer size state**: whether the viewer is currently at its reading size or expanded.
  Lives only as long as the viewer is open.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every document opens with a non-empty, human-readable title, including
  documents that declare no title of their own.
- **SC-002**: On a display of any width, prose lines stay within a comfortable measure rather
  than growing with the window.
- **SC-003**: A reader can switch between reading size and expanded, and back, in one action
  each way.
- **SC-004**: Opening any document after closing an expanded one starts at the reading size,
  in 100% of cases.
- **SC-005**: The header shows no empty or placeholder fields for facts a document does not
  declare.
- **SC-006**: Every rendering behavior verified by feature 017 still passes inside the new
  reading surface.

## Assumptions

- Written after the implementation it describes; it documents delivered behavior rather than
  gating it (constitution Principle I not satisfied - see plan.md).
- The document facts read here come from the leading declaration block features 010 and 012
  already parse. This feature adds no new parsing of document bodies.
- Feature 017's Markdown rendering is a prerequisite and is not modified in substance - only
  given a measure and a density to render within.
- The viewer remains read-only; nothing here introduces editing (constitution Principle II).
- Size state is deliberately not remembered between openings. Persisting it was not requested
  and would make each document's first impression depend on an invisible earlier choice.
