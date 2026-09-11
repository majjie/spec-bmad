# Implementation Plan: Markdown Render Polish

**Branch**: `017-markdown-render-polish` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-markdown-render-polish/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Every place this tool renders Markdown for reading (`FileViewerDialog.tsx`'s own Markdown
mode, `PrdDetailView.tsx`, `ArchitectureDetailView.tsx`) shares one visual gap: a table's
cells have no visible grid lines (the existing style sets `borderColor` with no `border`
of its own, so nothing actually draws), and a fenced code block has no background of its
own, so it looks like ordinary prose. This feature adds the missing `border`/
`borderCollapse` styling for tables, a background for the `<pre>` wrapper every fenced
block already renders inside, and - when a fenced block's opening fence declares a
language - syntax highlighting via this tool's own already-installed
`react-syntax-highlighter` (the same `Prism`/`vscDarkPlus` combination
`FileViewerDialog.tsx`'s whole-file "syntax" render mode already uses). Because the exact
same `sx` styling and the exact same new `code`-block renderer are needed identically in
all three places, this feature extracts one small shared component,
`web/src/components/MarkdownContent.tsx`, that all three now render through instead of
each inlining its own `<Typography>`/`<ReactMarkdown>` pair.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (unchanged).

**Primary Dependencies**: None new. `react-markdown`/`remark-gfm` (already used by all
three call sites) and `react-syntax-highlighter`'s `Prism` export plus its `vscDarkPlus`
style (already used by `FileViewerDialog.tsx`'s own whole-file "syntax" mode) are reused
as-is.

**Storage**: N/A - this feature only changes how already-fetched Markdown content is
rendered; no new route, no new file read.

**Testing**: No new pure derivation logic is introduced - the fenced-block language match
(`/language-(\w+)/` against a `code` element's `className`) is a small, inline,
rendering-time branch directly analogous to `PrdDetailView.tsx`'s own existing
`STRONG_CODE_PATTERN`/`HEADING_CODE_PATTERN` inline checks, which are themselves not
separately unit-tested (constitution Principle V's UI-rendering carve-out already covers
this exact shape of code in this codebase). This whole feature is UI/rendering, covered by
manual `quickstart.md` verification.

**Target Platform**: Same as prior features - localhost server + full-size desktop
browsers only.

**Project Type**: Extends the existing single Node.js CLI + bundled web frontend -
frontend-only; no backend files touched, no new routes.

**Performance Goals**: None mandated - `react-syntax-highlighter`'s `Prism` build is
already loaded and used today for whole-file code views; embedding it once per fenced code
block in a Markdown document is the same rendering cost already paid elsewhere in this
tool, at the same content scale.

**Constraints**: Read-only (constitution Principle II) - this feature only changes how
existing, already-fetched content is displayed; nothing is written anywhere. Must reuse,
not duplicate, the existing `react-syntax-highlighter`/`vscDarkPlus` pairing and the
existing per-view `sx` styling rather than introducing a second, differently-themed code
renderer.

**Scale/Scope**: Same as prior features.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved (`spec.md`) before this plan; every requirement traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes | Purely a rendering/styling change over content this tool already fetches through existing routes - no new write capability anywhere. |
| III. Zero-Install, Local-First Operation | Yes | No new dependency of any kind - both `react-markdown` and `react-syntax-highlighter` are already installed and used elsewhere in this tool. |
| IV. TypeScript CLI & Web Interface Standards | Yes | The new `MarkdownContent.tsx` is a plain React component; no backend/CLI surface is touched. |
| V. Test-First for Parsing & Rendering Logic | Yes | No new parsing/derivation module is introduced - the fenced-block language match is inline rendering logic, directly analogous to existing, already-unmodified inline patterns in `PrdDetailView.tsx`/`ArchitectureDetailView.tsx` that this codebase already treats as the UI-rendering carve-out, not unit-tested. Manually verified per `quickstart.md`. |

**Result**: PASS - no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts introduce no new dependency, no new route, and
no editing affordance - every change is a styling/rendering change to a shared component
consuming data this tool already has access to. PASS confirmed unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/017-markdown-render-polish/
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
    └── components/
        ├── MarkdownContent.tsx        # NEW - the shared Markdown-rendering piece: the
        │                                # `Typography`/`ReactMarkdown` pair, the
        │                                # table/pre/code `sx` styling (with this
        │                                # feature's border/background fixes), and the new
        │                                # `code` component override that renders
        │                                # `SyntaxHighlighter` for a declared, recognized
        │                                # language and a plain `<code>` otherwise -
        │                                # merging in each caller's own extra `components`
        │                                # overrides (anchor-id assignment) unchanged
        ├── FileViewerDialog.tsx        # MODIFIED - its "markdown" render mode now
        │                                # renders `<MarkdownContent>` instead of inlining
        │                                # its own `Typography`/`ReactMarkdown` pair; no
        │                                # other render mode touched
        ├── PrdDetailView.tsx           # MODIFIED - its document-rendering region now
        │                                # renders `<MarkdownContent>`, passing its own
        │                                # existing `strong`/`h3` anchor-id overrides
        │                                # through as `components`; its own tile row,
        │                                # index column, and every other behavior
        │                                # untouched
        └── ArchitectureDetailView.tsx  # MODIFIED - same change as PrdDetailView.tsx,
                                          # passing its own `h3`-only anchor-id override
                                          # through as `components`
```

**Structure Decision**: `MarkdownContent.tsx` is extracted because this is a genuine,
already-existing 3-way duplication (`FileViewerDialog.tsx`, `PrdDetailView.tsx`,
`ArchitectureDetailView.tsx` each independently inline the identical `sx` table/code
styling today) that this feature must change identically in all three places - exactly
the "extract on a genuine second/third consumer" bar this project already applies
(`FrontmatterInfoControl`, feature 012). It accepts an optional `components` prop so each
caller's own anchor-id renderer overrides (`PrdDetailView`'s `strong`+`h3`,
`ArchitectureDetailView`'s `h3`-only, `FileViewerDialog`'s none at all) keep working
unchanged - `MarkdownContent` always adds its own `code` override on top, never
overridable by a caller, since no caller has a reason to want different code-block
behavior. `MarkdownContent` owns the whole `Typography`/`ReactMarkdown` pair (not just the
`sx` object or just the `code` renderer alone) because every caller was already pairing
them identically - splitting styling from rendering across two separate exports would add
indirection with no second, differently-combined consumer to justify it.

## Complexity Tracking

*No violations - Constitution Check passed cleanly, so this section is intentionally empty.*
