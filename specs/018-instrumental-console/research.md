# Research: Instrumental Console Redesign

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-09-11

> **Retrospective**: these decisions were taken during implementation rather than before it.
> Where the branch's own history shows a decision being made, reversed, and remade, that is
> recorded here as the evidence for the final choice - it is the closest thing this feature
> has to a design rationale, and it is more honest than presenting the endpoint as though it
> were reasoned to directly.

## 1. Navigation shape: artifact-type-first, not project-first

**Decision**: The sidebar's primary axis is the **document type** (Requirements,
Architecture), with project identity as a *nested* level introduced only when the corpus
actually contains more than one project.

**Rationale**: The tool serves one project directory at a time. Making project the primary
axis therefore produces a tree whose first level almost always has exactly one child - pure
navigational overhead, and actively misleading, since it implies a multi-project workspace
the tool does not support. Sorting by document type first puts the user's real question
("where are the requirements?") at the top level.

**Alternatives considered**:

- *Project-first, then document type* - implemented and then reverted on this branch. It
  read as a workspace browser for a product that browses one workspace. Its failure mode was
  visible immediately on the sample corpus: a single "Harbor" node that every path had to
  pass through.
- *Flat list of every run, newest first, regardless of type* - rejected; it collapses the
  distinction between a requirements run and an architecture run, which is the single most
  important classification in the corpus.
- *Keep the existing equal-weight tabs* - rejected by the spec's premise (FR-002): tabs give
  equal visual weight to "the thing you came for" and "the raw install folder".

## 2. When a per-project nesting level is warranted

**Decision**: Introduce the per-project level **only** when more than one *named* project
lineage exists. Non-conforming folders are collected under a separate group that never
counts toward that decision.

**Rationale**: This is the rule that makes decision 1 safe. Without it, the choice would be
between always nesting (overhead on the common single-project case) and never nesting (a
genuinely multi-project corpus becomes an undifferentiated list). Deciding per corpus costs
one predicate and gets both cases right. SC-009 exists to hold this.

**Alternatives considered**:

- *Always nest* - rejected as the overhead case above.
- *Never nest, and disambiguate by prefixing each run's label with its project* - rejected;
  it puts the disambiguator in the least scannable position and grows every label on the
  common case to serve the rare one.
- *Let the user choose* - rejected; a preference for a structural detail the user has no
  basis to have an opinion about, on first run, when they are least equipped to answer.

## 3. Reconciling two folder families into one project identity

**Decision**: Derive a project's identity by stripping the conventional artifact-type prefix
from its folder name and comparing case-insensitively, so the requirements family and the
architecture family for one product resolve to a single identity with one display title.

**Rationale**: The corpus names these folders by artifact type *and* project, which means
the project name is recoverable but is not the folder name. Without reconciliation the
sidebar shows the same product twice under two spellings, which is precisely the mental join
FR-006 exists to remove.

**Alternatives considered**:

- *Exact folder-name equality* - rejected; it never matches, because the two families are
  deliberately named differently.
- *Fuzzy or edit-distance matching* - rejected as unpredictable: two genuinely different
  products with similar names would silently merge, and the failure would be invisible.
  A convention-driven prefix strip fails loudly instead - a folder that does not match the
  convention lands in the non-conforming group, where it is still reachable (FR-009).

## 4. Accordion expansion is a state machine, not a derived value

**Decision**: Expansion state is seeded **once**, when the tree first has content, and is
thereafter only ever *added to* in response to a selection - and then only for keys the
selection newly requires. A section the user collapsed is never reopened as a side effect.

**Rationale**: The naive implementation - deriving "which sections are open" from the current
selection on every render - has a specific and infuriating failure: the user collapses a
section, clicks something inside it, and it springs back open. Because the rule is about
*transitions* rather than current state, it cannot be expressed as a pure function of the
selection, which is why this is a small state machine with an explicit "have we seeded yet?"
flag. It is also the single most regression-prone piece of this feature, which is why it
carries the densest unit-test coverage (SC-008).

**Alternatives considered**:

- *Derive from selection each render* - rejected for the failure above.
- *Persist expansion across sessions* - rejected as scope; nothing in the spec asks for it,
  and it would add a second persisted preference for no stated user need.
- *Expand everything by default* - rejected; on a corpus with several projects and many runs
  it produces a wall of rows and destroys the scannability the feature is for.

## 5. A three-tier token layer, with components restricted to the semantic tier

**Decision**: Define primitives (raw ramps) and then a semantic layer that names **roles**
(surface, border, text, accent, status, focus). Components reference semantic names only.
The same semantic names are mapped into the component library's own theme so that
library-rendered chrome and hand-written styling resolve to one source of truth.

**Rationale**: The problem being solved is concrete: before this feature, meaning was carried
by ad-hoc values and by borrowed semantic slots from the component library's default palette
(using an "info" or "warning" colour to mean "label" or "value"). Those choices are invisible
to search, impossible to retarget, and wrong the moment the palette changes. Naming roles
makes FR-025 checkable - a review can grep for a raw colour in a component and find it.

Restricting components to the semantic tier is what makes a second appearance possible by
remapping one layer (feature 019) rather than auditing every component.

**Alternatives considered**:

- *Two tiers (primitives consumed directly)* - rejected; it is the status quo with better
  names, and still leaves each component deciding what a colour *means*.
- *Theme-object only, no CSS custom properties* - rejected; a large amount of this UI is
  styled outside the component library's own theming path, and CSS custom properties are the
  only layer both reach.
- *A third-party design-token toolchain* - rejected on Principle III: a new dependency for
  what is about forty lines of CSS.

## 6. Typography delivery - an unresolved Principle III violation

**Decision as implemented**: the intended typeface is fetched from a third-party font CDN at
page load. **This is a defect, not a decision** - it is recorded here because the plan's
Constitution Check flags it and remediation needs a written comparison.

**Why it violates the principle**: Principle III requires the tool to "function fully offline
once its own dependencies are fetched", and its stated rationale is that the tool "renders
potentially sensitive project documents" and therefore depends on privacy-by-default. A
remote font link breaks both halves: offline, the intended typography silently does not
apply; online, the browser announces to a third party that the tool is in use, every time a
user opens their own private documents on localhost.

**Options for resolution**:

| Option | Restores offline rendering | Privacy | Cost |
|---|---|---|---|
| **A. Self-host the font files** as build assets | Yes | Yes - no outbound request | Bundle size grows by the subset shipped; a build step to produce the subset |
| **B. Drop the custom typeface** for a system font stack | Yes | Yes | Loses the typographic distinctiveness the redesign was partly about |
| **C. Keep the CDN link with a local fallback stack** | No - falls back silently | No | Free, but is the current behavior and resolves nothing |

**Recommendation**: **A**, because the typeface is load-bearing for this feature's stated
purpose and B gives it up to fix a problem A also fixes. C is listed only to be explicit that
the existing fallback stack does not make the current state compliant - a silent degradation
is still a failure to "function fully offline as designed", and it does nothing about the
outbound request, which is the more serious half.

This is carried as remediation work in `tasks.md` rather than closed here.

## 7. Onboarding persistence and its versioned key

**Decision**: Persist a single tri-state value - not yet seen, dismissed, completed - under a
**versioned** key, and treat every read and write as fallible.

**Rationale**: Versioning the key is what lets the stored shape change without stranding
users on an unreadable value: bumping the version re-onboards everyone rather than reading
garbage. The shipped key is at its **third** version, which is itself the finding - the
persisted shape changed twice during implementation with no record of what changed or why,
and the only surviving evidence is the version number. Under a spec-first process those
would have been two recorded decisions.

Fallibility is not defensive padding: preference storage genuinely throws in private
browsing and when a user has blocked site data, and an uncaught throw here would take down
first paint for the whole application (FR-020).

**Alternatives considered**:

- *A boolean "seen"* - rejected; it cannot distinguish "skipped" from "completed", and
  FR-018's replay behavior needs to know the difference.
- *No persistence* - rejected; the welcome would reappear on every load, which the spec
  treats as worse than not having one.
- *Persist per project directory* - rejected; the welcome explains BMAD's vocabulary, which
  is not project-specific, so re-showing it per project would be noise.

## 8. Status presentation: icon plus label, colour last

**Decision**: Every status renders as an icon **and** a text label, with colour applied as
reinforcement only. An unrecognised status degrades to its text label rather than rendering
nothing.

**Rationale**: SC-005 requires statuses to survive greyscale, which rules out colour-only
encoding outright. The icon-plus-label pairing also solves a second problem: the stored
status values are machine tokens, and showing them raw ("in-progress") leaks storage format
into the interface (FR-022).

The unrecognised-status fallback matters because the status vocabulary belongs to the BMAD
tooling, not to this viewer - a corpus written by a newer version of that tooling must remain
readable here rather than rendering a blank cell.

**Alternatives considered**:

- *Colour-coded dot with a tooltip* - rejected; it fails greyscale and hides the meaning
  behind a hover the user has no reason to attempt.
- *Text label only* - rejected; it is accessible but scans poorly in a dense table, which is
  the view's whole problem.
- *Throwing or omitting on an unrecognised status* - rejected per the forward-compatibility
  argument above.

## 9. Where the derivation lives

**Decision**: All shell derivation goes in DOM-free modules importable without a browser;
components consume their output and make no decisions of their own.

**Rationale**: Constitution Principle IV requires exactly this separation, and this project
has no DOM test harness - so logic placed in a component is, in practice, logic that cannot
be tested at all. The rules this feature introduces (lineage reconciliation, the nesting
predicate, the expansion state machine) are precisely the kind that break silently on corpus
shapes a developer did not have to hand.

**Alternatives considered**:

- *Hooks holding the logic* - rejected; a hook needs a React renderer to test, which
  reintroduces the harness this split avoids.
- *Adding a DOM test harness and testing components directly* - rejected as disproportionate
  for this feature, and as a new dependency weighed against Principle III. It remains the
  right answer if this project ever needs to test interaction rather than derivation.
