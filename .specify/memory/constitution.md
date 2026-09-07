<!--
Sync Impact Report
Version change: (template, unratified) → 1.0.0
Modified principles: n/a (initial ratification, all placeholders filled)
Added sections:
  - I. Spec-First Development (NON-NEGOTIABLE)
  - II. Read-Only Artifact Viewer
  - III. Zero-Install, Local-First Operation
  - IV. TypeScript CLI & Web Interface Standards
  - V. Test-First for Parsing & Rendering Logic
  - Additional Constraints (technology stack)
  - Development Workflow (review & quality gates)
  - Governance
Removed sections: none
Deferred/TODO placeholders: none
Templates requiring follow-up: none checked automatically by this command (out of scope
  per Scope Guard); downstream commands (/speckit-plan, /speckit-tasks, /speckit-analyze)
  read this file at runtime and need no edits here.
-->

# BMAD Browser Constitution

## Core Principles

### I. Spec-First Development (NON-NEGOTIABLE)
No implementation code is written until an approved spec exists for the feature it belongs
to, produced through the BMAD SDD process (spec → plan → tasks). Every task in `tasks.md`
MUST trace back to an approved spec/plan; work that has no corresponding artifact is
rejected in review, regardless of how small it seems.
Rationale: this tool exists to visualize and reinforce the SDD process; if its own
development doesn't follow that process, it has no credibility as a viewer for it.

### II. Read-Only Artifact Viewer
BMAD Browser observes and renders SDD artifacts (specs, plans, tasks, checklists,
constitutions, etc.) found in the target project directory. It MUST NOT write, mutate, or
delete any file in that directory. Any future editing/interactive-authoring capability is a
distinct, explicitly-scoped feature requiring its own spec and user-facing opt-in — never a
silent default.
Rationale: a viewer that mutates the very artifacts it inspects erodes trust and risks
corrupting a user's SDD history; the safe default is strictly observational.

### III. Zero-Install, Local-First Operation
The tool MUST run via `npx` with no separate install step, MUST bind its web server to
localhost only (never expose artifacts over the network by default), and MUST function
fully offline once its own dependencies are fetched. Pointing it at a project directory is
the only required input to get a working session.
Rationale: it renders potentially sensitive project documents; low-friction usage and
privacy-by-default both depend on this constraint.

### IV. TypeScript CLI & Web Interface Standards
The CLI surface follows standard conventions: `--help` and `--version` flags, sensible
defaults, non-zero exit codes on failure, human-readable errors to stderr. Artifact-parsing
logic MUST be implemented as a layer usable independently of the web UI (importable and
testable without a browser). The whole codebase builds under TypeScript strict mode.
Rationale: keeping parsing logic decoupled from rendering keeps the highest-risk code
testable and keeps the CLI predictable enough to script around.

### V. Test-First for Parsing & Rendering Logic
Parsers that turn Spec Kit markdown artifacts (spec/plan/tasks/constitution/checklists)
into structured data MUST have tests written and failing before the parser is implemented,
covering the current template formats shipped in `.specify/templates/`. UI/rendering
changes MUST be manually verified in a running browser session before being considered
complete, per the project's general UI-testing practice.
Rationale: hand-written markdown parsing is the part of this system most likely to break
silently on template drift; test-first here catches format mismatches before users see a
blank or garbled artifact view.

## Additional Constraints

Technology stack: Node.js (current LTS) and TypeScript, strict compiler settings enabled
project-wide. Runtime dependency footprint is kept minimal to keep `npx` cold-start time
low. Distribution is a single package published to the npm registry; no bundled native
binaries or external service dependencies are required to run it.

## Development Workflow

All changes MUST pass type-checking and the automated test suite before merge. Any change
to how an artifact format is parsed MUST update or add fixtures/tests that reflect the new
expected format. Pull requests MUST state which constitution principles are relevant and
confirm compliance; any deviation (e.g., a feature that writes to the target directory)
MUST be justified explicitly in the PR description and treated as an amendment trigger for
this document, not a silent exception.

## Governance

This constitution supersedes ad hoc practice for this project. Amendments are made by
editing this file via `/speckit-constitution`, recording the change in the Sync Impact
Report at the top of the file, and bumping the version per semantic versioning: MAJOR for
backward-incompatible principle removals/redefinitions, MINOR for new principles or
materially expanded guidance, PATCH for clarifications and wording fixes. Every PR is
reviewed against the Core Principles above before merge; unjustified complexity or
deviation is grounds for requesting changes.

**Version**: 1.0.0 | **Ratified**: 2026-09-07 | **Last Amended**: 2026-09-07
