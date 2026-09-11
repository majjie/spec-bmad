# Feature Specification: Instrumental Console Redesign

**Feature Branch**: `018-instrumental-console` (implemented on `ux-polish-console`)

**Created**: 2026-09-11

**Status**: Retrofitted

**Input**: User description: "Redesign the artifact browser as a polished instrumental
developer console: a product shell with a clear information architecture, an Overview that
is the default landing view, one project identity across artifact types, a first-run
welcome with a skippable guided tour, a coherent visual system, and a legible sprint view -
aimed at developers who have never used BMAD."

> **Retrofit note**: this specification was reconstructed from an already-implemented
> branch rather than written ahead of it, and therefore did not gate the work it describes
> (constitution Principle I). It records the behavior that shipped so the feature becomes
> traceable and reviewable. The colour-scheme switcher and the file-viewer reading modal
> were delivered on the same branch but are specified separately, as features 019 and 020.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Orient without knowing BMAD (Priority: P1)

A developer opens the tool against a project for the first time. They have never used BMAD
and do not know what its folders mean. Instead of a row of equal-weight tabs labelled with
internal jargon and an empty pane inviting them to "select something", they see a named
product header, a sidebar grouped into plain-language sections, and a populated Overview
telling them what is in progress and which documents exist.

**Why this priority**: This is the feature's entire reason for existing. Every other story
improves an experience that this one makes possible at all; without it a newcomer cannot
form a mental model of the project from the tool.

**Independent Test**: Open the tool against a project containing both planning and
implementation artifacts and confirm, without touching any control, that the main area is
populated and every sidebar label is readable without BMAD knowledge. Delivers orientation
on first paint.

**Acceptance Scenarios**:

1. **Given** a project whose artifacts can be read, **When** the tool finishes loading,
   **Then** Overview is the selected navigation item and the main area shows content rather
   than an empty-selection prompt.
2. **Given** sprint data exists, **When** Overview renders, **Then** the currently active
   epic is the most prominent item and the number of still-open action items is visible.
3. **Given** the sidebar renders, **When** a newcomer reads it, **Then** each raw folder
   entry carries a caption naming the folder it maps to, so the mapping between plain
   labels and on-disk folders is never guesswork.
4. **Given** a project with no implementation artifacts, **When** the tool loads, **Then**
   the sections that depend on them are omitted rather than shown empty, and Overview
   explains where to look instead.

---

### User Story 2 - Welcome once, skip freely (Priority: P1)

A first-time visitor is greeted by a welcome that explains, in two sentences, the three
kinds of document BMAD produces, states plainly that the tool never writes to their
project, and offers a guided tour. They can take the tour or dismiss it outright. Whichever
they choose, the tool does not ask again - but Help can replay the tour on demand.

**Why this priority**: Equal to US1 because the shell only orients someone who already
knows what they are looking at. The welcome is what makes the vocabulary legible, and an
onboarding flow that cannot be escaped or replayed is worse than none.

**Independent Test**: Load the tool in a browser profile that has never opened it, dismiss
the welcome, reload, and confirm it does not return; then replay it from Help. Delivers
first-run explanation without imposing a permanent cost.

**Acceptance Scenarios**:

1. **Given** a visitor who has never used the tool in this browser, **When** the tool
   loads, **Then** a welcome appears explaining the three document types and stating that
   the tool is read-only.
2. **Given** the welcome is showing, **When** the visitor chooses to skip, **Then** it
   closes immediately and does not reappear on later visits.
3. **Given** the visitor starts the tour, **When** it runs, **Then** each step highlights
   the part of the interface it describes, and the tour can be left at any step by a single
   action.
4. **Given** a visitor who previously skipped, **When** they invoke Help, **Then** the tour
   runs from its first step without the welcome reappearing.
5. **Given** a browser that refuses to remember preferences, **When** the tool loads,
   **Then** it still works and simply shows the welcome again rather than failing.

---

### User Story 3 - One project, many document types (Priority: P2)

A project's requirements and architecture documents are written in separate folder families
that nonetheless describe the same product. The developer sees one project identity, with
its requirements runs and architecture runs presented under the artifact type they belong
to, newest first and marked as the latest of its kind - rather than two unrelated folder
trees they must mentally join.

**Why this priority**: Substantial navigational value, but it improves a tree the developer
can already use once US1 lands. It also only becomes visible on projects that have both
artifact types.

**Independent Test**: Point the tool at a project containing requirements and architecture
folders sharing a project name and confirm they resolve to a single named identity with the
newest run of each type annotated. Delivers coherent navigation independently of onboarding.

**Acceptance Scenarios**:

1. **Given** requirements and architecture folders that name the same project, **When** the
   sidebar renders, **Then** they are presented as one project identity rather than two.
2. **Given** several dated runs of one document type, **When** they are listed, **Then**
   each is labelled with a human-readable date, newest first, and the newest is annotated as
   the latest of its type.
3. **Given** a project containing exactly one named project identity, **When** the sidebar
   renders, **Then** no redundant per-project grouping level is introduced.
4. **Given** a project containing more than one named project identity, **When** the sidebar
   renders, **Then** runs are nested under the project they belong to.
5. **Given** folders that do not follow the naming convention, **When** the sidebar renders,
   **Then** they are still reachable, grouped separately rather than hidden.
6. **Given** the developer has collapsed a section, **When** they later select a document
   elsewhere, **Then** the section they collapsed stays collapsed.

---

### User Story 4 - Read sprint status at a glance (Priority: P2)

A developer checking progress sees each step's status as an icon paired with a plain-English
label, the epic currently in progress already open, and the project's bookkeeping metadata
tucked out of the way until asked for - instead of a uniform wall of rows in which status is
carried by colour alone.

**Why this priority**: Sprint status is the most information-dense view in the tool and the
one most often consulted, but it is one view among several, so it ranks below the shell and
onboarding.

**Independent Test**: Open sprint status for a project with a mix of step states and confirm
every status reads correctly in greyscale and that the in-progress epic needs no click to
reveal. Delivers legibility independently of the rest of the redesign.

**Acceptance Scenarios**:

1. **Given** steps in differing states, **When** they render, **Then** each state is carried
   by both an icon and a text label, so no meaning depends on colour alone.
2. **Given** an epic that is in progress, **When** the view loads, **Then** that epic is
   already expanded.
3. **Given** project metadata, **When** the view loads, **Then** it is collapsed behind a
   disclosure rather than competing with status for attention.

---

### User Story 5 - Navigate without a mouse or fine colour vision (Priority: P3)

A developer using a keyboard and a screen reader reaches the main content without traversing
the whole sidebar, hears meaningful names for icon-only controls, and can always see which
element holds focus. A developer who has asked their system to reduce motion gets no
animated transitions.

**Why this priority**: Necessary for the tool to be usable by everyone and cheap to uphold
once the shell exists, but it refines a shell that must be built first.

**Independent Test**: Traverse the entire interface using only a keyboard, with animations
disabled at the OS level, and confirm every control is reachable, named, and visibly focused.

**Acceptance Scenarios**:

1. **Given** keyboard focus at the start of the page, **When** the user presses Tab once,
   **Then** a control offering to skip directly to the main content is available.
2. **Given** any control shown only as an icon, **When** it receives focus or hover, **Then**
   its purpose is announced and shown as text.
3. **Given** the user's system requests reduced motion, **When** any transition would play,
   **Then** the change is applied without animation.

### Edge Cases

- A project contains method files but no generated artifacts: curated document sections are
  omitted, and the raw method folder remains browsable.
- A project has no sprint data: the sprint entry does not appear at all, and Overview points
  the developer at requirements instead of showing an empty tile.
- A project's folders follow no recognised naming convention: every folder remains reachable
  under a separate grouping rather than disappearing.
- Preference storage is unavailable or refused: onboarding falls back to showing the welcome
  each time, and nothing else breaks.
- A dated folder name carries a date that cannot be parsed: the folder's own name is shown
  rather than an error or a blank label.
- The developer collapses a section and then selects a document inside it: the selection is
  honoured without forcing the section back open.

## Requirements *(mandatory)*

### Functional Requirements

#### Shell and information architecture

- **FR-001**: The interface MUST present a persistent header carrying the product identity,
  the detected project name when one can be determined, and controls for Help, appearance,
  and reloading from disk.
- **FR-002**: Navigation MUST be organised into three labelled groups - one for
  workspace-wide views, one for curated documents, and one for raw folder browsing -
  replacing the previous set of equal-weight tabs.
- **FR-003**: The sprint entry MUST appear only when the project actually contains sprint
  data, and MUST be absent (not empty or disabled) otherwise.
- **FR-004**: Each raw-folder entry MUST carry a caption naming the underlying folder, so a
  reader can map the plain-language label to what is on disk.
- **FR-005**: Overview MUST be the selected view on load whenever project data is available,
  and the main area MUST never present an empty-selection prompt as its initial state.

#### Project identity and document navigation

- **FR-006**: Requirements and architecture folders whose names identify the same project
  MUST be presented as a single project identity.
- **FR-007**: Each dated run MUST be labelled with a human-readable date, ordered newest
  first, and the newest run of each document type MUST be annotated as the latest of that
  type.
- **FR-008**: A per-project grouping level MUST be introduced only when more than one named
  project identity exists; with a single project it MUST be omitted as redundant.
- **FR-009**: Folders that do not match the naming convention MUST remain reachable under a
  separate group rather than being hidden.
- **FR-010**: Section expansion MUST be seeded once when the tree first loads; thereafter a
  section the user has collapsed MUST NOT be reopened as a side effect of selecting a
  document.

#### Overview

- **FR-011**: Overview MUST surface the active epic as its primary insight, the count of
  still-open action items, and the most recent requirements and architecture documents.
- **FR-012**: When a data source Overview would summarise is absent, Overview MUST explain
  what the developer can look at instead, rather than rendering an empty region.

#### Onboarding

- **FR-013**: On first use, the tool MUST present a welcome that explains the three document
  types BMAD produces and offers both starting a tour and dismissing it.
- **FR-014**: The welcome MUST state plainly that the tool never writes to the project it is
  reading.
- **FR-015**: The developer's onboarding choice MUST be remembered across sessions in the
  same browser, and the welcome MUST NOT reappear once a choice has been made.
- **FR-016**: The tour MUST consist of steps anchored to the interface elements they
  describe, covering navigation, Overview, the document area, reloading, and Help. It is an
  orientation to *where things are*, and MUST NOT attempt to enumerate structural details -
  per-project nesting, the non-conforming group, accordion behavior - which a reader either
  does not encounter or discovers faster by looking than by being told. A tour that grows a
  step per feature stops being skippable in spirit.
- **FR-016a**: A step whose anchored element is not present MUST be omitted, and the step
  count MUST follow the steps actually shown. No step may render unanchored, describing
  something the reader cannot see.
- **FR-017**: The tour MUST be exitable at any step by a single action, including a keyboard
  action.
- **FR-018**: Help MUST replay the tour on demand without re-presenting the welcome.
- **FR-019**: The reload control MUST communicate that it re-reads the project from disk.
- **FR-020**: If preference storage is unavailable, the tool MUST continue to function,
  degrading only to presenting the welcome again.

#### Sprint status

- **FR-021**: Every step status MUST be conveyed by an icon together with a plain-English
  label, and MUST NOT rely on colour as its only distinguishing channel.
- **FR-022**: Status labels MUST read as human phrases rather than raw stored values.
- **FR-023**: The epic that is currently in progress MUST be expanded when the view loads.
- **FR-024**: Project metadata MUST be collapsed behind a disclosure by default.
- **FR-025**: Action items MUST be presented as a full-width section of the sprint view,
  rendered at their natural height, rather than as a fixed-height panel that scrolls within
  itself. Every per-item affordance established by feature 008 MUST be preserved: the owner
  indication, the completion indication, the jump to the referenced document, omission of
  properties a given item does not declare, and outstanding items ordered before completed
  ones.
- **FR-026**: Overview MUST additionally surface the outstanding action items with a direct
  affordance to open the document each one references, so the most common reason to visit
  sprint status is answerable without leaving Overview.

#### Visual system and accessibility

- **FR-027**: All colour and typography MUST derive from a single named design-token system
  rather than one-off values chosen per component, so appearance stays consistent and can be
  retargeted in one place.
- **FR-028**: The interface MUST provide a control that moves keyboard focus directly to the
  main content, and MUST expose navigation, header, and main regions as identifiable
  landmarks.
- **FR-029**: Every icon-only control MUST have a text name available to assistive technology
  and revealed on hover or focus.
- **FR-030**: The element holding keyboard focus MUST always be visibly indicated.
- **FR-031**: When the user's system requests reduced motion, transitions and looping
  animations MUST be suppressed.

### Key Entities

- **Project identity**: one named product, derived by reconciling the naming of requirements
  and architecture folders that refer to it. Carries a display title, its requirements runs,
  its architecture runs, and any non-conforming folders attributed to it.
- **Document run**: one dated production of a document type for a project identity. Carries
  the date it was produced, the folder it came from, and whether it is the most recent run of
  its type.
- **Navigation section**: one addressable destination in the sidebar - the Overview, sprint,
  each document type, and each raw folder root.
- **Onboarding state**: whether the developer has yet to see the welcome, dismissed it, or
  completed the tour. Remembered per browser.
- **Step status**: one of a small closed set of progress states, each with an icon, a human
  label, and a colour that reinforces but never solely carries the meaning.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer who has never used BMAD can identify the active epic and open a
  requirements document within one minute of first opening the tool, without external help.
- **SC-002**: On a project with readable artifacts, the main area is populated on first paint
  in 100% of loads - an empty-selection prompt is never the initial state.
- **SC-003**: The welcome is presented exactly once per browser profile; after a choice is
  made it appears in 0% of subsequent loads.
- **SC-004**: The tour can be exited from any step in a single action, by mouse or keyboard.
- **SC-004a**: Every step shown highlights an element actually on the page, in 100% of
  supported project shapes - including a project with method files but no generated
  artifacts.
- **SC-005**: Every step status is distinguishable in greyscale, because each is carried by
  at least two channels (icon and text) in addition to colour.
- **SC-006**: Body text and focus indicators meet WCAG 2.1 AA contrast ratios in every
  supported appearance.
- **SC-007**: Every navigation destination and header control is reachable and operable using
  a keyboard alone.
- **SC-008**: A section the developer collapses stays collapsed for the remainder of the
  session, in 100% of subsequent selections.
- **SC-009**: On a project with one named project identity, the sidebar introduces no
  grouping level that contains only a single child.

## Assumptions

- This specification was written after the implementation it describes; it documents
  delivered behavior rather than gating it. Constitution Principle I was not satisfied for
  this feature, and this note is the record of that.
- The tool continues to be strictly read-only with respect to the project it inspects
  (constitution Principle II). Remembering an onboarding choice writes only to the browser's
  own preference storage, never to the project directory.
- One tool session inspects one project directory. Multi-project workspaces are out of scope.
- The tool remains desktop-oriented; small-screen layouts are not a target of this feature.
- Browser preference storage may be unavailable or refused, and the tool must tolerate that
  rather than depend on it.
- The choice of light or dark appearance, and the control that switches between them, are
  specified separately (feature 019). This feature assumes only that the token system it
  introduces is capable of expressing more than one appearance.
- The behavior of the file viewer that opens individual documents is specified separately
  (feature 020).
- Existing artifact-reading behavior established by features 001-017 is unchanged; this
  feature restructures presentation only and introduces no new way of reading the project.
- **This feature partially supersedes [feature 008](../008-action-items-tile/spec.md).**
  Restructuring the sprint view replaced that feature's fixed-height tile with a full-width
  section (FR-025), which retires its FR-001, FR-002, FR-003 and FR-014. Its remaining
  requirements and its whole derivation layer are untouched, and no capability is lost - the
  per-item affordances all survive, and Overview adds a second route to them (FR-026). The
  amendment is recorded in 008's own spec so a reader of either finds the other.
