# Implementation Plan: Markdown Frontmatter Tooltip

**Branch**: `010-markdown-frontmatter-tooltip` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-markdown-frontmatter-tooltip/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

The file viewer's Markdown rendering mode currently shows a YAML frontmatter block (and
an optional wrapping marker element) verbatim, cluttering the top of the document. This
feature detects that preamble - a YAML block delimited by `---` lines at the very start of
the content, optionally followed by a marker element whose opening and closing tags may be
far apart in the document - and excludes it (and the marker's tag lines) from what
renders, while the document's actual content, including whatever sits between the marker's
tags, renders unchanged. The excluded YAML's key/value pairs remain available on demand via
a new informational control added next to the dialog's existing close control, shown only
when a preamble was actually detected; hovering or clicking it reveals every pair, keys and
values in visually distinct colors. This is a display-only change - the underlying file
is never modified (constitution Principle II) - and needs no new dependency install:
`js-yaml` is already a dependency (used server-side since feature 006), just not yet
imported by any client code.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (unchanged).

**Primary Dependencies**: `js-yaml` (already a dependency; this is its first client-side
use - server-side parsing, e.g. `sprint-status.yaml`, is unaffected and uses it
separately). Icon from the already-installed `@mui/icons-material` (`InfoOutlined`,
matching this app's established icon-reuse convention).

**Storage**: N/A - operates entirely on already-fetched file content already held in
`FileViewerDialog`'s existing state; no new data source, no new route.

**Testing**: Node's built-in test runner for the new pure derivation module (frontmatter
detection/stripping, tag-pair matching, and preamble-value stringification) - genuine
parsing/derivation logic under constitution Principle V's main clause, following this
app's established precedent for `getFileRenderMode`/`parseActionItems`/`deriveStepDisplay`
(also plain `web/src/*.ts` modules tested without a browser). The info control's hover/
click interaction and the key/value color rendering are UI/rendering, manually verified
per the carve-out (`quickstart.md`).

**Target Platform**: Same as prior features - localhost server + full-size desktop
browsers only.

**Project Type**: Extends the existing single Node.js CLI + bundled web frontend - one new
frontend-only module, no new routes, no backend changes at all (file content is already
served raw; this feature only changes how the client renders it).

**Performance Goals**: None mandated - same scale assumptions as prior features (a single
already-fetched file's content, parsed once per view).

**Constraints**: Read-only (constitution Principle II) - this is a display-only
transformation; the file `GET /api/file/:tab` returns is untouched. Must apply only to the
existing Markdown render mode (constitution Principle IV's parsing/rendering split is
respected: detection is a plain module, rendering stays in the dialog component).

**Scale/Scope**: Same as prior features.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved and clarified (`spec.md`) before this plan; every requirement traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes | Purely a display-time transformation of already-fetched content; the file itself, and the route that serves it, are both untouched. |
| III. Zero-Install, Local-First Operation | Yes | No new dependency install - `js-yaml` is already a project dependency; this is a new *client* usage of it, adding its parser to the web bundle for the first time (noted in research.md), not a new package. |
| IV. TypeScript CLI & Web Interface Standards | Yes | The new frontmatter module is a plain, DOM-independent TypeScript module, unit-testable without a browser, alongside `fileRenderMode.ts`. |
| V. Test-First for Parsing & Rendering Logic | Yes | Frontmatter/tag-pair detection and value stringification are genuine derivation logic - full test-first coverage. The info control's interaction and color rendering remain manually verified per the carve-out. |

**Result**: PASS - no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts introduce no new route, no new install, and no
editing affordance - the info control is read-only display, and stripped content is a
view-time transformation only. PASS confirmed unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/010-markdown-frontmatter-tooltip/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
web/
└── src/
    ├── frontmatter.ts                 # NEW - FrontmatterResult type, stripFrontmatter(),
    │                                   # stringifyPreambleValue()
    └── components/
        └── FileViewerDialog.tsx       # MODIFIED - computes stripFrontmatter() for
                                        # markdown-mode content before handing it to
                                        # DialogBody; renders a new info control (hover/
                                        # click tooltip) in the existing close-button
                                        # container when a preamble was detected

tests/
└── unit/web/
    └── frontmatter.test.ts           # NEW
```

**Structure Decision**: `frontmatter.ts` is a new sibling to `fileRenderMode.ts` in
`web/src/` - its own distinct piece of derivation logic (detection, tag-pair matching,
stringification), called from `FileViewerDialog.tsx` rather than folded into it, mirroring
how that file already delegates render-mode decisions to a separate pure module. No new
component file is introduced for the info control itself - like `ActionItemsTile.tsx`'s
per-row icons or the epic-tile toggle (features 008/009), it's added directly inside
`FileViewerDialog.tsx`, matching this project's preference for small, file-local UI pieces
over new shared abstractions for a single call site. No backend files change at all.

## Complexity Tracking

*No violations - Constitution Check passed cleanly, so this section is intentionally empty.*
