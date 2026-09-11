# Specification Quality Checklist: File Viewer as a Reading Surface

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-11
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- All 16 items pass with zero [NEEDS CLARIFICATION] markers.

- **Retrospective specification**, reconstructed from an implemented branch. Two places where
  the implementation's specifics would have leaked into requirements were generalised:

  - FR-005 requires prose to be bounded to "a comfortable reading measure" rather than naming
    the measure the code uses. The number is a design decision that should be tunable without
    amending a specification; it is recorded in data-model.md § 4.
  - FR-007 requires expansion to "nearly fill the window" rather than naming the proportion.
    Same reasoning - the requirement is that the panel still reads as a panel, not that it
    occupies a particular fraction.

- **Scope bounding was straightforward here**, unlike features 018 and 019. This feature is
  self-contained: one dialog, two derivation modules, and a parameterisation of an existing
  renderer. The one boundary worth stating explicitly is FR-012 - feature 017's rendering
  behavior must survive unchanged - because this feature modifies a component 017 deliberately
  extracted to be shared, and a regression there would surface in three views rather than one.
  `quickstart.md` § D exists solely to check that, and is labelled as a regression check on a
  prior feature rather than a check on this one.

- **This feature is the best-behaved of the three delivered on this branch**, which is worth
  recording because it makes the others' problems legible by contrast. Its two derivations are
  genuinely DOM-free and unit-tested, so constitution Principles II, III and IV all pass
  cleanly; only Principle I (no spec preceded it) and the test-first half of Principle V fail,
  and both fail for the same reason every feature on this branch does. The plan notes the
  likely cause: this was the smallest and most self-contained of the three changes, and the
  cost of skipping the process scaled with how much each change touched.

- **One verification step has no fixture in the sample corpus.** A document declaring a blank
  title must be treated as having none - that is the rule protecting SC-001, and it is the
  case most likely to regress silently, because it renders as an empty header rather than an
  error. It is unit-tested, but `quickstart.md` § A notes that confirming it in a browser
  requires adding such a document by hand. Restoring a fixture for it would be a reasonable
  follow-up.
