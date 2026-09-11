# UI Behavior Contract: Instrumental Console Redesign

**Feature**: [../spec.md](../spec.md) | **Data model**: [../data-model.md](../data-model.md)

The observable contract of the shell. Each clause is checkable in a running browser; the
verification script is [../quickstart.md](../quickstart.md).

This feature changes **no HTTP contract**. The routes and payloads established by features
001-017 are consumed exactly as they were; `ShellSection` is a frontend concept mapped onto
the existing tab identifiers, not a rename of them.

---

## Header

- Shows the product mark and name, always.
- Shows the detected project name when one can be determined - the sprint project if present,
  otherwise the sole named project lineage. When neither resolves (a multi-project corpus with
  no sprint data) the project name is **omitted**, never shown as a placeholder or a guess.
- Carries three icon controls: Help, appearance, and reload. Every one has a text name exposed
  to assistive technology and revealed on hover or focus (FR-027).
- The reload control's name states that it re-reads from disk (FR-019), and reports its
  in-progress state while reloading.

## Sidebar

- Renders three labelled groups, in order: workspace-wide views, curated documents, raw
  folders (FR-002).
- The sprint entry appears **only** when sprint data exists. It is never rendered disabled or
  empty (FR-003).
- Each raw-folder entry carries a caption naming the underlying folder (FR-004).
- Requirements and Architecture render as accordions. Their expand affordance reflects state
  via `aria-expanded`, and the control names the region it governs.
- A document section with no content is not rendered at all - consistent with the sprint rule,
  and with feature 015's existing "shown only when that folder has subfolders" behavior.
- Non-conforming folders are reachable under a separate group that sorts **last**, after every
  named project (FR-009).
- Selection is full-bleed: the selected row's treatment spans the sidebar's full width, with no
  inset gap.

### Nesting

- With **one** named project: runs list directly under their document type. No per-project
  level is rendered (SC-009).
- With **more than one** named project: runs nest under the project they belong to, and each
  project's nest carries a summary of what it contains.
- The non-conforming group never counts toward this decision.

### Expansion

- On first load with content, document sections that have content are opened, plus the first
  named project's nests when nesting applies. This seeding happens **once**.
- Selecting a document opens whatever its selection newly requires - and nothing else.
- A section the user has collapsed **stays collapsed** for the rest of the session, including
  when the user selects a document inside it (FR-010, SC-008).

## Stage

- On load, the stage shows Overview. It never shows an empty-selection prompt as its initial
  state (FR-005, SC-002).
- Overview surfaces, as its primary line: the project, the latest requirements run, the latest
  architecture run, the active epic, and the count of open action items. Any value that cannot
  be derived renders as a neutral placeholder rather than being omitted, so the row's shape is
  stable.
- Overview's sprint panel is present only when sprint data exists; otherwise Overview directs
  the reader to the requirements section instead (FR-012).
- Overview's document panels each state their own empty case in words ("No requirements runs
  yet.") rather than rendering an empty region.

## Sprint status

- Every step's status renders as an icon **and** a text label. Colour reinforces but never
  carries the meaning alone (FR-021, SC-005).
- Status labels are human phrases, never the stored token (FR-022).
- A status the viewer does not recognise renders as its raw value in plain text - never blank,
  never an error.
- The epic currently in progress is expanded on load (FR-023).
- Project metadata is collapsed behind a disclosure (FR-024).
- The open action-item count treats any status other than `done` as open.

## Onboarding

- On a browser with no stored onboarding choice, the welcome appears on load.
- The welcome explains the three document types and states that the tool never writes to the
  project (FR-014).
- It offers exactly two paths: start the tour, or dismiss.
- Either choice is remembered; the welcome does not reappear on a later load (FR-015, SC-003).
- The tour highlights the element each step describes, and is exitable at every step by a
  single action including Escape (FR-017, SC-004).
- Help starts the tour from its first step, and never re-presents the welcome (FR-018).
- If preference storage throws or is blocked, the application still loads and simply shows the
  welcome again (FR-020).

## Appearance, motion and accessibility

- All colour and typography resolve through the semantic token layer. No component defines a
  raw colour of its own (FR-025).
- The first focusable element offers to skip to the main content (FR-026).
- Header, navigation, and main regions are exposed as landmarks with accessible names.
- The focused element is always visibly indicated, using the focus token (FR-028).
- When the system requests reduced motion, transitions and looping animation are suppressed -
  including the tour's highlight and the reload control's activity indicator (FR-029).

## Explicitly unchanged

- Every artifact-reading behavior from features 001-017: folder walking, PRD and architecture
  grouping, the requirement-code index, frontmatter presentation, CSV rendering, and the
  refresh route's semantics.
- The browser history behavior established by feature 006.
- The backend tab identifiers.

## Out of scope - specified elsewhere

- **The light appearance and its switching control** are feature 019. This feature's only
  obligation is that the token layer *can* express a second appearance without component
  edits.
- **The file viewer's reading layout and expand affordance** are feature 020.
