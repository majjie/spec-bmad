# Implementation Plan: Artifact Access Layer

**Branch**: `001-artifact-access-layer` | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-artifact-access-layer/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Build the internal access layer BMAD Browser uses to know what a BMAD project contains:
an in-memory, on-demand cache of the folder/file hierarchy of a project's `_bmad` and
`_bmad-output` folders (names/paths/types only, never file contents, never symlinks), plus
the CLI-level logic that resolves which project folder to point that cache at — defaulting
to the current working directory, rejecting folders without `_bmad`/`_bmad-output`, and
searching nearby folders (parent, and two levels below it) to suggest a corrected command
when the given folder is invalid.

## Technical Context

**Language/Version**: TypeScript 5.x, targeting Node.js ≥20 LTS

**Primary Dependencies**: None at runtime beyond Node.js built-ins (`node:fs/promises`,
`node:path`); `tsx` (dev-only) to run TypeScript directly for local dev/tests, per the
constitution's minimal-runtime-footprint constraint

**Storage**: N/A — in-memory only; nothing is persisted to disk or shared across processes

**Testing**: Node.js built-in test runner (`node:test` + `node:assert/strict`), executed via
`tsx`, per constitution Principle V (test-first for parsing logic)

**Target Platform**: Cross-platform CLI on Node.js ≥20 LTS (Linux/macOS/Windows), distributed
via `npx` per constitution Principle III

**Project Type**: Single project — a small internal TypeScript library (access layer) plus
the CLI entry point that resolves which folder it operates on; no frontend/backend split for
this feature (the future web UI consumes this layer in a later feature)

**Performance Goals**: None mandated by the spec — no performance target is required for
the Scale/Scope below

**Constraints**: MUST NOT read file contents (FR-002); MUST exclude symlinked files/folders
everywhere, including discovery (FR-003); MUST NOT scan or cache anything outside
`_bmad`/`_bmad-output` (FR-001); filesystem-only, no network access

**Scale/Scope**: Typical BMAD project artifact trees — tens to low thousands of files/folders
under `_bmad`/`_bmad-output`; no specific upper bound is mandated by the spec

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved and clarified (`spec.md`) before this plan; every requirement below traces to an FR-### |
| II. Read-Only Artifact Viewer | Yes | This feature only ever reads directory entries; FR-002 explicitly forbids writing/mutating anything. No violation. |
| III. Zero-Install, Local-First Operation | Yes | No new runtime dependencies, no network calls; folder resolution defaults to `cwd` per FR-006, keeping the "point it at a directory" UX intact. |
| IV. TypeScript CLI & Web Interface Standards | Yes | Access-layer logic (`src/artifacts/`, `src/discovery/`) is a plain TypeScript module with no UI/browser dependency, importable and unit-testable on its own; strict TS compiler settings apply project-wide. `--help`/`--version` (FR-014) are included in this feature's `cli.ts` scope rather than deferred, since the constitution states them as non-negotiable for "the CLI surface." |
| V. Test-First for Parsing & Rendering Logic | Yes | This feature *is* the parsing/discovery logic; tests for scanning, symlink exclusion, cache invalidation, and folder discovery are written before implementation (see tasks.md when generated). |

**Result**: PASS — no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts (`data-model.md`, `contracts/`, `quickstart.md`)
introduce no new dependency, no persistence, no network access, and no file-content
reading beyond what Technical Context already declared. PASS confirmed unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── artifacts/
│   ├── types.ts        # Artifact Node / Project Root / Hierarchy Cache types
│   ├── scan.ts          # Recursive folder/file scan of a _bmad|_bmad-output folder
│   └── cache.ts          # Hierarchy Cache: get-or-build, invalidate/refresh per Project Root
├── discovery/
│   └── resolve-project-folder.ts   # cwd default, _bmad/_bmad-output validity check,
│                                    # parent+2-level candidate search, suggestion formatting
└── cli.ts               # Thin CLI entry point wiring discovery + artifacts together

tests/
├── unit/
│   ├── artifacts/
│   │   ├── scan.test.ts
│   │   └── cache.test.ts
│   └── discovery/
│       └── resolve-project-folder.test.ts
└── integration/
    └── cli-folder-resolution.test.ts
```

**Structure Decision**: Single project (this is a standalone CLI/library package, not a
web app or mobile app). `src/artifacts/` and `src/discovery/` are the reusable access-layer
library required by constitution Principle IV — importable and testable without the CLI or
any future web UI. `src/cli.ts` is the thin, UI-independent entry point that will later be
joined by the localhost web server in a subsequent feature; it is not introduced by this
feature beyond what FR-006–FR-013 require.

## Complexity Tracking

*No violations — Constitution Check passed cleanly, so this section is intentionally empty.*
