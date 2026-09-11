# Research: File Viewer as a Reading Surface

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-09-11

> **Retrospective**: decisions taken during implementation, reconstructed by reading it.

## 1. A centred panel, not a full-screen sheet

**Decision**: The viewer is a bounded, centred panel over the application, on its own surface.

**Rationale**: The previous full-screen dialog had two distinct problems. Visually, prose ran
the full width of a large monitor, producing lines far past the point where the eye reliably
finds the next one. Structurally, a full-screen takeover severs the reader from where they
were - it stops feeling like opening a document *in* the tool and starts feeling like
navigating away from it, which is wrong for a viewer reached from a step in a list the reader
intends to return to.

A bounded panel fixes both at once: the measure is a consequence of the panel's width, and
the visible application behind it preserves the sense of place.

**Alternatives considered**:

- *Keep the full-screen dialog and bound only the text* - rejected; it fixes the measure but
  leaves a mostly-empty full-screen surface, which reads as a layout error rather than a
  choice.
- *Render the document in the main stage instead of a dialog* - rejected as a much larger
  change: the viewer is opened from several contexts that each have their own idea of what the
  stage is showing, and taking it over would mean defining a return path for each. The PRD and
  architecture detail views already occupy the stage; this is the viewer for everything else.
- *A side panel* - rejected; it makes the measure worse, not better, on the axis that matters.

## 2. Deriving a title, and what to do when there is not one

**Decision**: Use the document's declared title when present and non-blank. Otherwise derive
one from the filename by dropping the conventional specification prefix and rendering the
remaining words as a sentence.

**Rationale**: The corpus is inconsistent about declaring titles, and a header showing a raw
filename is barely better than showing a path - the reader still has to parse it. The
filenames, however, are highly structured: a conventional prefix followed by dash-separated
words that *are* the title. Deriving from them recovers a genuine title for the majority of
documents that declare none.

Treating a blank declared title as absent matters more than it looks: an empty declaration is
a common artifact of templated generation, and honouring it literally yields an empty header -
the exact failure the feature exists to remove (SC-001).

**Alternatives considered**:

- *Show the filename raw when no title is declared* - rejected; it leaves the reader parsing a
  slug, which is the status quo.
- *Show the path* - rejected as strictly worse; more text, less signal.
- *Require a declared title and show nothing otherwise* - rejected; it makes the viewer's
  usefulness depend on a convention the viewer does not control, which contradicts this tool's
  posture of reading whatever it finds.

## 3. Omitting absent facts rather than showing empty fields

**Decision**: Status, type, and creation date each appear only when declared. Nothing renders
a label with no value.

**Rationale**: A header of mostly-empty labelled fields is a worse signal than a short header:
it implies the document is deficient, when in fact the field is simply optional. Because these
facts come from an optional declaration block, absence is the normal case for a large share of
the corpus, so the sparse header is the *common* rendering, not the exceptional one.

This is also why unrecognised declared facts are ignored rather than displayed generically -
rendering unknown keys as unlabelled values would fill the header with noise from any document
using declarations this viewer was not designed around.

**Alternatives considered**:

- *Render every field with a placeholder for missing values* - rejected for the reasons above.
- *Render every declared key generically* - rejected; feature 010 already provides a dedicated
  affordance for inspecting the full declaration block, so the header does not need to be it.

## 4. Expansion as ephemeral state

**Decision**: Expanded / reading size is state that lives only while the viewer is open, and
resets on close (FR-009).

**Rationale**: The reading size is the right default for prose, and expansion is a response to
*this* document's content - a wide table, a broad diagram. Carrying the choice forward means
the next document opens in a shape chosen for a document the reader is no longer looking at,
and the cause is invisible. Resetting makes each opening predictable.

**Alternatives considered**:

- *Persist across openings, in memory* - rejected for the invisible-cause problem above.
- *Persist across sessions* - rejected more firmly; it adds a third persisted preference
  (alongside onboarding and appearance) for a choice that is per-document by nature.
- *Choose the size automatically from the content* - rejected as unpredictable: it would mean
  measuring rendered content and resizing after paint, so the panel would visibly jump, and
  the heuristic would be wrong often enough to be annoying.

## 5. One renderer, parameterised - not a second one

**Decision**: Extend feature 017's shared Markdown component with a density and a width
parameter, rather than writing a reading-specific renderer.

**Rationale**: Feature 017 extracted that component *because* three sites had independently
inlined the same rendering and drifted. Adding a fourth, separate renderer for the reading
surface would recreate precisely the problem it solved, and would mean every future rendering
fix - a table border, a code block background - had to be applied twice and would eventually
be applied once.

The parameters are presentational only. No rendering *behavior* differs between the reading
surface and the in-page detail views, which is what FR-012 requires and what makes a shared
renderer correct rather than merely convenient.

**Alternatives considered**:

- *A separate `ReaderMarkdown` component* - rejected per the duplication argument.
- *Style the reading surface from outside via a wrapper* - rejected; the measure has to apply
  to the prose itself while wide content is allowed to exceed it, which is a decision inside
  the renderer, not around it.

## 6. Why the panel sizes are a module

**Decision**: The two size states live in a named, unit-tested module rather than inline in
the dialog.

**Rationale**: The sizes look like styling but function as a **contract between two
components**: the dialog sizes the panel from the expanded flag, and the Markdown renderer
independently decides its measure from the same flag. Those two decisions have to agree - an
expanded panel whose content stays at the reading measure is a visible bug, and it is exactly
the bug that results from editing one inline value and not the other.

Naming the sizes does not prevent that drift by itself, but it makes the pairing findable and
gives the test suite somewhere to assert that the two states actually differ.

**Alternatives considered**:

- *Inline values in the dialog* - rejected; it was the arrangement most likely to drift, for a
  saving of one small file.
- *Drive both from a CSS custom property* - a reasonable alternative that was not taken. It
  would put the sizes in the token layer where the rest of the appearance lives, but the
  renderer's measure decision is conditional logic rather than a value, so it would still need
  the flag. Worth revisiting if a third size state is ever added.
