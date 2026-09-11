# Feature Specification: Markdown Frontmatter Tooltip

**Feature Branch**: `010-markdown-frontmatter-tooltip`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "There is some bespoke header-like content that sits at the
top of spec markdown. It seems to be a chunk of YAML followed by an optional XML element.
Example:
```
---
title: \"Copy the artifact's path\"
type: 'feature'
created: '2026-09-04'
status: 'done'
baseline_commit: 'd64f993073510e8ec56449ad9d5afb65bc7fac7e'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason=\"human-owned intent - do not modify unless human
renegotiates\">
```
This renders terribly in the file viewer. Can we extend the file viewer for Markdown
files to look for this content at the start of the file? Remove it from the rendered
content. However, I would like to extend the semi-opaque container that holds the 'X' for
closing the file viewer. To add an informational (i) icon. When the user hovers, or
clicks, an enhanced tooltip is shown. It will be a simple readout of the dictionary of
values in the YAML pre-amble. I would like different colours to be used for the keys and
the values when rendered. The XML will not be displayed at present."

## Clarifications

### Session 2026-09-08

- Q: Does the marker element (e.g. `<frozen-after-approval reason="...">`) have a
  matching closing tag somewhere later in the document that should also be found and
  stripped, or is it just that one line? → A: It's a real wrapper - a matching closing
  tag (identified by the same tag name, e.g. `</frozen-after-approval>`) exists later in
  the document, possibly at the very end, and must also be found and excluded. The
  document content between the opening and closing tags still renders normally - only the
  two tag lines themselves are excluded, not the content they wrap.

### Session 2026-09-08 (post-implementation feedback)

- Q: The readout's default tooltip styling (translucent background, small text) was hard
  to read over varied Markdown content showing through it - what should change? → A: Make
  the background fully opaque, and render the text at a larger size than this tool's
  default tooltip text.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clean Markdown rendering (Priority: P1)

A user opens a Markdown file whose content begins with a YAML preamble (optionally
wrapped, along with the rest of the document, by a marker element's opening and closing
tags) and sees only the document's actual written content - the raw preamble text and the
marker element's own tag lines no longer clutter the rendered view.

**Why this priority**: This is the reported problem - the preamble currently "renders
terribly," obscuring the document a user actually opened the file to read.

**Independent Test**: Open a Markdown file whose content starts with a YAML block
(delimited by `---` lines) followed by a marker element whose closing tag sits at the very
end of the document, wrapping ordinary Markdown in between; confirm the rendered view
shows only that ordinary Markdown, with no visible YAML syntax and neither of the marker
element's tag lines anywhere in it.

**Acceptance Scenarios**:

1. **Given** a Markdown file whose content starts with a YAML preamble followed by
   ordinary Markdown, **When** it's opened in the file viewer, **Then** the rendered view
   shows only the ordinary Markdown - the preamble is not visible anywhere in it.
2. **Given** a Markdown file whose preamble is followed by a marker element - an opening
   tag (e.g. `<frozen-after-approval reason="...">`) and, later in the document, a
   matching closing tag (e.g. `</frozen-after-approval>`) - wrapping the document's
   ordinary Markdown, **When** it's opened, **Then** both of that marker element's tag
   lines are excluded from the rendered view, while the ordinary Markdown between them
   still renders normally.
3. **Given** a Markdown file with no such preamble, **When** it's opened, **Then** the
   rendered view is unaffected - every line of its content renders exactly as it does
   today.
4. **Given** a non-Markdown file (any other file type this viewer already renders),
   **When** it's opened, **Then** this feature has no effect on it, even if its content
   happens to start with a similarly-shaped block.

---

### User Story 2 - Preamble readout on demand (Priority: P2)

A user viewing a Markdown file whose preamble was stripped from view can still see every
value it held, on demand, via an informational control placed alongside the viewer's
existing close control.

**Why this priority**: A valuable enhancement once the preamble is no longer cluttering
the view (User Story 1) - the document is already fully readable without it; this adds a
way to still consult the preamble's values when needed.

**Independent Test**: Open a Markdown file with a multi-key YAML preamble; confirm an
informational control appears next to the close control, and that hovering or clicking it
reveals every key/value pair from that preamble, with keys and values visually
distinguishable by color.

**Acceptance Scenarios**:

1. **Given** a Markdown file whose preamble was stripped from view, **When** the file
   viewer renders it, **Then** an informational control appears in the same container as
   the close control.
2. **Given** that control, **When** the user hovers over it, **Then** a readout of the
   preamble's keys and values appears.
3. **Given** that control, **When** the user clicks it instead, **Then** the same readout
   appears.
4. **Given** the readout, **When** it renders, **Then** each key and its value are shown
   in visually distinct colors from one another.
5. **Given** a Markdown file with no preamble (or a non-Markdown file), **When** it's
   opened, **Then** no informational control appears at all.

---

### Edge Cases

- What happens when a file's content merely starts with `---` for an unrelated reason
  (e.g. a Markdown horizontal rule, or YAML that fails to parse as a mapping)? The content
  renders exactly as it does today - nothing is stripped, and no informational control
  appears, rather than showing a broken or partial removal.
- What happens when the preamble's YAML block has no marker element after it? Only the
  YAML block is stripped; the ordinary Markdown that follows it renders immediately
  after (FR-001/FR-002).
- What happens when a marker element's opening tag is present but no matching closing tag
  (same tag name) is found anywhere later in the document? The recognized opening tag line
  is still excluded on its own (best-effort, consistent with this tool's existing tolerant
  parsing elsewhere); the rest of the document renders normally rather than being hidden
  or the view breaking (FR-002).
- What happens when the preamble's YAML block parses to an empty mapping (no keys at
  all)? It's stripped from view the same as any other preamble, but no informational
  control appears - there would be nothing to show in its readout (FR-006).
- What happens when a preamble value isn't plain text (e.g. an empty list, like
  `context: []`)? It still appears in the readout, using a plain, readable representation
  of its value (FR-007).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a Markdown file's content begins with a YAML block - delimited by a
  `---` line at the very start of the content and a second `---` line that closes it -
  that block MUST be excluded from the rendered view.
- **FR-002**: When such a YAML block is immediately followed by a marker element's
  opening tag (an XML-like tag, e.g. `<frozen-after-approval reason="...">`), both that
  opening tag line and its matching closing tag (identified by the same tag name, e.g.
  `</frozen-after-approval>`, wherever it appears later in the document - including at the
  very end) MUST be excluded from the rendered view. The document content between those
  two tag lines MUST still render normally - only the tag lines themselves are excluded,
  never the content they wrap (Clarifications).
- **FR-003**: This exclusion MUST apply only to Markdown files, and only to a YAML block
  found at the very start of the file's content - a `---` line appearing later in the
  document (e.g. a Markdown horizontal rule, or a second YAML-like block) MUST NOT be
  treated as this preamble.
- **FR-004**: A file whose content starts with `---` but whose contents between the two
  `---` lines don't parse as a YAML mapping MUST be left completely unaffected - rendered
  exactly as today, with nothing stripped and no informational control shown.
- **FR-005**: The file viewer's existing close control MUST gain a sibling informational
  control, shown in the same container, whenever the currently-open Markdown file has a
  YAML preamble that was excluded from view (per FR-001).
- **FR-006**: This informational control MUST be entirely absent when the current file
  has no such preamble (including when the preamble's YAML parses to an empty mapping), or
  when the current file isn't rendered as Markdown at all.
- **FR-007**: Selecting the informational control - by hovering over it or by clicking it
  - MUST reveal every key/value pair from the excluded YAML preamble, each value shown in
  a plain, readable form regardless of its underlying YAML type (text, number, empty list,
  etc.).
- **FR-008**: In that readout, every key MUST render in a color visually distinct from the
  color used for values, consistently across all pairs shown.
- **FR-009**: The marker element's tag lines excluded per FR-002 (including any
  attributes they carry, such as the opening tag's `reason`) MUST NOT be shown anywhere -
  not in the rendered document, and not in the informational readout. This does not apply
  to the ordinary Markdown content between those tag lines, which renders normally per
  FR-002.
- **FR-010**: Excluding the preamble from the rendered view MUST NOT alter the
  underlying file in any way - this is a display-only change, consistent with this
  tool's read-only principle.
- **FR-011**: The readout's background MUST be fully opaque - never translucent - and its
  text MUST render at a size larger than this tool's default tooltip text, so it stays
  legible regardless of what Markdown content is showing underneath it (post-implementation
  Clarifications).

### Key Entities

- **Frontmatter Preamble**: The YAML block found at the very start of a Markdown file's
  content - a set of key/value pairs - plus an indicator of whether a marker element's
  opening tag followed it, and if so, whether a matching closing tag was found elsewhere
  in the document. Not a stored or persisted entity; derived fresh from a file's content
  each time it's viewed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user opening any Markdown file that has this preamble sees only the
  document's actual written content, with no leftover YAML or marker-element clutter.
- **SC-002**: A user can view every value from a Markdown file's preamble without leaving
  the file viewer or consulting any other tool.
- **SC-003**: A user can tell a preamble's keys apart from its values at a glance, by
  color, without having to read each pair carefully.
- **SC-004**: Markdown files without this preamble, and every other file type, show no
  behavior change at all from this feature.

## Assumptions

- Only the very first YAML-delimited block at the absolute start of a file's content is
  ever treated as this preamble; nothing later in the document is scanned for one,
  consistent with standard frontmatter conventions.
- "Markdown files" means whatever this tool already renders in its Markdown mode - this
  feature adds no new file-type detection of its own.
- This feature applies uniformly wherever the file viewer already opens a Markdown file
  from (the Infra tab, the Output tab, the Action Items tile, or the Epic Step Detail
  jump-to-spec control) - it's a change to the shared viewer, not to any one caller.
- A preamble's values are read-only, point-in-time data for display purposes only - this
  feature adds no ability to edit, copy structured data from, or otherwise act on them
  beyond viewing.
