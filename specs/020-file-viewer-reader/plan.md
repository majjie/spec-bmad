# Implementation Plan: File Viewer as a Reading Surface

**Branch**: `020-file-viewer-reader` (implemented on `ux-polish-console`) | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/020-file-viewer-reader/spec.md`

> **Retrospective plan**, written after the implementation by reading it.

## Summary

Turn the file viewer from a full-screen sheet into a centred reading panel: derive a real
title and a short set of identifying facts from what the document already declares, bound the
prose to a comfortable measure, and add an expand control for content that needs the room.
Both derivations are extracted into DOM-free modules; the dialog itself only arranges what
they return.

## Technical Context

**Language/Version**: TypeScript 5.7, strict mode, ES2022.

**Primary Dependencies**: None added. Rendering continues through feature 017's shared
Markdown component.

**Storage**: None. Size state lives only while the viewer is open, by explicit design
(spec.md, Assumptions).

**Testing**: `tsx --test` over `tests/unit/web/`. Title derivation and panel sizing are unit
tested; the reading experience is verified manually per `quickstart.md`.

**Target Platform**: Desktop browsers on localhost.

**Project Type**: Single TypeScript project with a bundled web frontend.

**Performance Goals**: No new fetches. Both derivations are pure string work over data the
viewer already holds.

**Constraints**: Must preserve feature 017's rendering behavior exactly (FR-012), and must
stay usable in a narrow window (FR-011).

**Scale/Scope**: One dialog, two derivation modules.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | **VIOLATED.** No spec preceded the implementation; reconstructed from the delivered branch. Recorded in Complexity Tracking. |
| II. Read-Only Artifact Viewer | Yes | PASS. Strictly a presentation change over content already fetched. No editing affordance, nothing persisted anywhere. |
| III. Zero-Install, Local-First Operation | Yes | PASS. No new dependency, no network call. |
| IV. TypeScript CLI & Web Interface Standards | Yes | PASS. Both derivations - `web/src/fileViewerMeta.ts` and `web/src/fileViewerPaper.ts` - are DOM-free, importable and unit-tested without a browser. This feature observes the principle cleanly, unlike its two siblings on the same branch. |
| V. Test-First for Parsing & Rendering Logic | Yes | **PARTIAL.** `humanizeFileName` is genuine string parsing and it *is* tested - but, being a retrofit, alongside rather than before the implementation. The dialog's arrangement falls under the manual-browser carve-out. |

**Result**: FAIL on I, PARTIAL on V. II, III and IV pass cleanly.

**Post-Phase 1 re-check**: Unchanged. The design artifacts add no dependency and no new data
path; the only judgement call they record is where the derivations live, which is what keeps
IV passing.

## Project Structure

### Documentation (this feature)

```text
specs/020-file-viewer-reader/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── ui-behavior.md   # Phase 1 output
├── checklists/
│   └── requirements.md  # /speckit-specify output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
web/src/
├── fileViewerMeta.ts                   # NEW - DOM-free: derives the header facts from the
│                                       #   path plus the document's declared preamble,
│                                       #   including the filename-to-title fallback that is
│                                       #   this feature's only real parsing
├── fileViewerPaper.ts                  # NEW - DOM-free: the two panel sizes, reading and
│                                       #   expanded, as plain values
└── components/
    ├── FileViewerDialog.tsx            # MODIFIED - centred panel instead of a full-screen
    │                                   #   sheet; renders the derived header, owns the
    │                                   #   expanded flag, resets it on close, and passes
    │                                   #   reader density and width down
    └── MarkdownContent.tsx             # MODIFIED - gains `density` and `wide` so one
                                        #   renderer serves both the in-page detail views and
                                        #   this reading surface. Rendering behavior from
                                        #   feature 017 is untouched (FR-012).

tests/unit/web/
├── fileViewerMeta.test.ts              # NEW - title derivation and fact omission
└── fileViewerPaper.test.ts             # NEW - the two size states differ as specified
```

**Structure Decision**: Two small modules rather than one, because they answer unrelated
questions - *what does this document say it is?* and *how big should the panel be?* - and have
no shared vocabulary. Merging them would produce a "file viewer helpers" module, the kind of
grab-bag that grows without a principle to bound it.

`fileViewerPaper.ts` is worth justifying on its own, since a table of sizes is not obviously
logic. It is extracted because the two size states are a **contract between the panel and its
content**: the dialog sizes the panel, and `MarkdownContent` independently decides its measure
from the same `expanded` flag. Keeping the sizes named and testable makes that pairing
explicit rather than leaving two components to drift apart through separately-edited inline
values.

`MarkdownContent` is extended rather than forked. Feature 017 extracted it precisely so that
all three rendering sites stay identical; adding a second renderer for the reading surface
would reintroduce the duplication 017 removed. `density` and `wide` are presentation
parameters over one renderer, not a second renderer.

## Complexity Tracking

> Filled because Constitution Check has violations that must be justified.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **Principle I** - no spec preceded the implementation | Not needed and not justified. The viewer rework emerged from the same exploratory polish pass as features 018 and 019. | Nothing rejected writing a spec first. Recorded, not defended. The cost here was the smallest of the three features on this branch - the change is self-contained and its derivations were extracted cleanly - which is itself evidence that the deviation's cost scales with how much a change touches. |
| **Principle V** - parsing tested alongside rather than before | `humanizeFileName` was written against a handful of real filenames in the sample corpus and generalised afterwards. | Test-first was entirely possible here: the transformation is specifiable from its inputs alone, and the edge cases that matter - a declared-but-blank title, a filename matching no convention - are exactly the ones an implementer working from examples is most likely to miss. The tests do now cover them. |
