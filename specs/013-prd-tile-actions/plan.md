# Implementation Plan: PRD Tile Actions

**Branch**: `013-prd-tile-actions` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-prd-tile-actions/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Feature 012 shipped three placeholder tiles ("reviews," "addendum," "memory log") along
the top of the PRD detail pane, deliberately inert. This feature wires up all three: the
reviews tile detects every `review-*.md` file in the currently-viewed PRD folder and, on
hover, offers a tooltip listing them by a friendly Title-Case name, opening the selected
one in this tool's existing file-viewer dialog; the addendum tile does the same for a
single `addendum.md` file; the memory log tile detects `.memlog.md` and opens a new,
bespoke dialog — not the standard Markdown view — that renders each top-level bullet as a
candy-striped row with its `(category)` prefix broken into its own colored header, and any
requirement code mentioned that also exists in the currently-open PRD rendered as a link
that jumps the PRD to it and closes the dialog. Any tile with nothing behind it renders
visually disabled. No backend changes are needed: file existence is checked via the
already-existing folder-contents route (the same one the Output/Infra tabs' own file
browser already uses), and reviews/addendum content is opened through the exact same
shared file-viewer-dialog mechanism Action Items and Epic Step Detail already use to jump
to a spec document.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (unchanged).

**Primary Dependencies**: None new. Reuses `@mui/material` (`Tooltip`, `Dialog`, `Paper`)
and the already-installed `@mui/icons-material` icons already assigned to these tiles in
feature 012.

**Storage**: N/A — reads via two already-existing routes: `GET /api/contents/:tab` (folder
listing, to detect which files exist) and `GET /api/file/:tab` (file content, via the
existing `fetchFileContentOrNull`/`fetchFileContent` client helpers) — both already used
elsewhere in this tool; no new route, no backend code touched at all.

**Testing**: Node's built-in test runner for two new pure modules —
`web/src/reviewFiles.ts` (friendly-name derivation + sorting) and `web/src/memlogParser.ts`
(bullet-splitting, category extraction, requirement-code cross-referencing) — both genuine
derivation logic under constitution Principle V's main clause. The tile
enabled/disabled styling, the reviews tooltip, and the memory log dialog's rendering are
UI, manually verified per the carve-out (`quickstart.md`).

**Target Platform**: Same as prior features — localhost server + full-size desktop
browsers only.

**Project Type**: Extends the existing single Node.js CLI + bundled web frontend —
frontend-only; no backend files touched, no new routes.

**Performance Goals**: None mandated — a PRD folder's contents listing and each opened
file are fetched once per selection/click, consistent with this app's established scale
assumptions.

**Constraints**: Read-only (constitution Principle II) — every new interaction only ever
reads existing files through routes this tool already exposes; no new write path anywhere.

**Scale/Scope**: Same as prior features.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved and clarified (`spec.md`) before this plan; every requirement traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes | Every new interaction reads through routes that already exist (`/api/contents`, `/api/file`) — no new write capability anywhere. |
| III. Zero-Install, Local-First Operation | Yes | No new dependency of any kind. |
| IV. TypeScript CLI & Web Interface Standards | Yes | `reviewFiles.ts` and `memlogParser.ts` are plain, DOM-independent TypeScript functions, unit-testable without a browser, alongside `prdIndex.ts`/`frontmatter.ts`. |
| V. Test-First for Parsing & Rendering Logic | Yes | Friendly-name derivation/sorting and memory-log bullet parsing/cross-referencing are genuine derivation logic — full test-first coverage. Tile styling, the reviews tooltip, and the memory log dialog's layout remain manually verified per the carve-out. |

**Result**: PASS — no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts introduce no new dependency, no new route, and
no editing affordance — every change is a new read-only interaction over data this tool
already has access to. PASS confirmed unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/013-prd-tile-actions/
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
    ├── reviewFiles.ts                  # NEW — ReviewFileReference type,
    │                                    # buildReviewFileList(): derives each review
    │                                    # file's friendly Title-Case name and sorts the
    │                                    # list alphabetically by it
    ├── memlogParser.ts                  # NEW — MemlogEntry/MemlogSegment types,
    │                                    # parseMemlogEntries(): splits top-level
    │                                    # bullets, extracts each one's "(category)"
    │                                    # header when present, and cross-references any
    │                                    # embedded requirement code against the current
    │                                    # PRD's own detected codes to decide which
    │                                    # become links
    ├── prdIndex.ts                      # MODIFIED — exports the existing requirement
    │                                    # code shape (letters-dash-digits) as a shared
    │                                    # constant so memlogParser.ts reuses the exact
    │                                    # same definition rather than a second copy
    └── components/
        ├── PrdDetailView.tsx           # MODIFIED — fetches the folder's own contents
        │                                # listing alongside prd.md; wires the reviews
        │                                # tile (hover tooltip, listing, click-to-open),
        │                                # the addendum tile (click-to-open), and the
        │                                # memory log tile (click-to-open the new bespoke
        │                                # dialog); accepts a new `onOpenFile` prop
        ├── MemoryLogDialog.tsx         # NEW — the bespoke, non-Markdown dialog for
        │                                # `.memlog.md`: candy-striped rows, category
        │                                # headers, requirement-code links, reusing
        │                                # FrontmatterInfoControl for its own frontmatter
        └── NavigatorDetailPane.tsx     # MODIFIED — threads its own existing
                                         # `onOpenFile` prop down into `PrdDetailView`

tests/
└── unit/web/
    ├── reviewFiles.test.ts             # NEW
    └── memlogParser.test.ts            # NEW
```

**Structure Decision**: The reviews tile's tooltip is added as a new local component
inside `PrdDetailView.tsx` (matching how `PrefixTile` — the requirement-code index's own
hover-tooltip tile — already lives there as a local, non-exported component, not a
separate file); reviews and addendum both open through the existing app-wide
`onOpenFile`/`FileViewerDialog` mechanism already used by Action Items and Epic Step
Detail, so neither needs any new dialog component. The memory log tile is the one genuine
exception: its bespoke rendering only makes sense in the context of the PRD currently
open (it needs that PRD's own detected requirement codes to decide which mentions become
links, and must trigger that same PRD's own jump-to-code behavior on selection) — data
`PrdDetailView` already owns and the global, decoupled `FileViewerDialog` has no reason to
know about. `MemoryLogDialog.tsx` is therefore a new, `PrdDetailView`-owned component,
structurally modeled on `FileViewerDialog.tsx`'s own proven shell (the corner controls as
siblings of the scrolling content, not descendants of it — the exact structure a
[prior fix](../012-prd-detail-viewer/tasks.md) already confirmed avoids the "controls
scroll away with the content" bug) rather than extending `FileViewerDialog`/
`getFileRenderMode` itself, since bespoke rendering for `.memlog.md` is scoped to this
one tile's own interaction, not to every place a `.memlog.md` file could ever be opened
(e.g. browsing to it directly from the Output tab still shows it as plain Markdown,
unaffected by this feature, per FR-018).

## Complexity Tracking

*No violations — Constitution Check passed cleanly, so this section is intentionally empty.*
