# Implementation Plan: Instrumental Console Redesign

**Branch**: `018-instrumental-console` (implemented on `ux-polish-console`) | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-instrumental-console/spec.md`

> **Retrospective plan**: written after the implementation, by reading it. It records the
> structure and the decisions that were actually taken, including the two that this
> reconstruction found to be constitution violations (see Constitution Check). It is not a
> forward-looking design document, and its Complexity Tracking table carries real entries
> rather than the usual "no violations" note.

## Summary

Replace the frontend's flat tab shell with a product shell - header, grouped sidebar, and a
default Overview - driven by a semantic design-token layer, and add first-run onboarding.
All work is in the React frontend; no CLI, server route, or artifact-reading behavior
changes. The derivation this needs (project-lineage grouping, run labelling, accordion
seeding, status labelling, action-item counting) is extracted into DOM-free modules so it is
unit-testable without a browser, per constitution Principle IV; the rendering on top of it
is verified manually per `quickstart.md`.

## Technical Context

**Language/Version**: TypeScript 5.7, strict mode, targeting ES2022. Same toolchain as
features 001-017.

**Primary Dependencies**: React 18 and MUI 6, both already present. This feature adds **no
new runtime dependency** - the token layer is plain CSS custom properties and the theme is
built with MUI's existing `createTheme`.

**Storage**: Browser preference storage for the onboarding choice only. Nothing is written
to the inspected project directory (constitution Principle II).

**Testing**: `tsx --test` over `tests/unit/web/`, as established. New DOM-free derivation
modules (`web/src/shell.ts`, `web/src/onboarding/onboarding.ts`) are unit-tested;
component rendering is manually verified per `quickstart.md`.

**Target Platform**: Desktop browsers on localhost, served by this tool's own CLI.

**Project Type**: Single TypeScript project with a bundled web frontend.

**Performance Goals**: No new fetches and no new derived-data passes over what features
001-017 already do. Navigation derivation runs over an already-fetched tree and is O(runs).

**Constraints**: Must degrade gracefully when preference storage is refused (FR-020), must
honour `prefers-reduced-motion` (FR-029), and must not regress WCAG AA contrast (SC-006).

**Scale/Scope**: Same corpus scale as prior features - tens of document runs, one project
directory per session.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | **VIOLATED.** No spec existed before implementation; `spec.md` and this plan were reconstructed from the delivered branch. Recorded in Complexity Tracking. |
| II. Read-Only Artifact Viewer | Yes | PASS. The only new write is the onboarding choice, into the browser's own preference storage. Nothing in the inspected project directory is created, mutated, or deleted, and no editing affordance is added. |
| III. Zero-Install, Local-First Operation | Yes | **VIOLATED.** The typography is loaded from a third-party font CDN at page load, so the UI does not render as designed offline and the browser contacts an external host while displaying project documents. Recorded in Complexity Tracking. |
| IV. TypeScript CLI & Web Interface Standards | Yes | PASS. No CLI surface is touched. The derivation logic is deliberately separated into `web/src/shell.ts` and `web/src/onboarding/onboarding.ts`, both importable and testable without a DOM - the principle's core requirement. Builds under strict mode. |
| V. Test-First for Parsing & Rendering Logic | Yes | **PARTIAL.** The derivation helpers do have unit tests covering the current behavior, but being a retrofit the tests were written alongside or after the code, not before it. The rendering layer falls under the principle's own manual-browser carve-out and is covered by `quickstart.md`. Recorded in Complexity Tracking. |

**Result**: FAIL on I and III, PARTIAL on V. This feature does not pass the gate cleanly.
Proceeding is a deliberate, recorded choice: the work is already delivered, and the purpose
of these artifacts is to make that fact reviewable rather than to pretend otherwise. The
Principle III finding is a genuine defect in the shipped code and is carried forward as
remediation work, not merely as a note.

**Post-Phase 1 re-check**: Design artifacts introduce no new dependency, no new route, and
no editing affordance, so II and IV remain PASS. The Principle III violation is a property
of the shipped page shell rather than of anything the design artifacts add, and it survives
the re-check unchanged - `research.md` records the two ways it can be resolved.

## Project Structure

### Documentation (this feature)

```text
specs/018-instrumental-console/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── ui-behavior.md
├── checklists/
│   └── requirements.md  # /speckit-specify output
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
web/
├── index.html                          # MODIFIED - typography link and the pre-paint
│                                       #   appearance script (the script itself belongs to
│                                       #   feature 019; the font link is this feature's,
│                                       #   and is the Principle III violation)
└── src/
    ├── tokens.css                      # NEW - the whole design-token layer: primitives
    │                                   #   (a neutral ramp, an accent ramp, status hues)
    │                                   #   then a semantic layer naming roles
    │                                   #   (bg/border/text/accent/status/focus). Components
    │                                   #   consume semantic names only, never primitives.
    ├── theme.ts                        # MODIFIED - `createAppTheme(mode)` maps the
    │                                   #   semantic tokens into MUI's palette/typography/
    │                                   #   component defaults, so MUI-rendered chrome and
    │                                   #   hand-written `sx` agree on one source of truth
    ├── shell.ts                        # NEW - DOM-free derivation for the whole shell:
    │                                   #   section/selection types, project-lineage
    │                                   #   grouping, run labelling, the workspace project
    │                                   #   name, status labelling, open-item counting, and
    │                                   #   the accordion expansion state machine
    ├── onboarding/
    │   └── onboarding.ts               # NEW - DOM-free: the persisted onboarding state,
    │                                   #   its read/write/clear helpers (each tolerating
    │                                   #   refused storage), and the tour step definitions
    ├── App.tsx                         # MODIFIED - rewired from tab state to shell
    │                                   #   selection; owns the expansion state and renders
    │                                   #   the header/sidebar/stage composition
    └── components/
        ├── shell/
        │   ├── AppHeader.tsx           # NEW - product identity, project name, and the
        │   │                           #   tooltip-labelled icon controls (Help, appearance,
        │   │                           #   reload)
        │   ├── AppSidebar.tsx          # NEW - the three labelled groups, the document
        │   │                           #   accordions, and the conditional per-project nest
        │   ├── BrandMark.tsx           # NEW - the product mark
        │   ├── OverviewView.tsx        # NEW - the default landing view
        │   ├── OverviewPanels.tsx      # NEW - the panel/list primitives Overview composes
        │   ├── WelcomeModal.tsx        # NEW - first-run welcome, including the read-only
        │   │                           #   statement required by FR-014
        │   ├── GuidedTour.tsx          # NEW - the anchored, escapable tour
        │   └── sidebarNav.tsx          # NEW - the sidebar's shared row/label presentation
        └── stage/
            ├── Stage.tsx               # NEW - the shared document-stage primitives
            │                           #   (frame, header, panel, stat strip, list row) that
            │                           #   give every view one layout vocabulary
            └── StatusChip.tsx          # NEW - icon-plus-label status presentation (FR-021)

tests/unit/web/
├── shell.test.ts                       # NEW - covers the derivation in shell.ts
└── onboarding.test.ts                  # NEW - covers persistence and tour-step config
```

**Structure Decision**: The organising decision is the split between **DOM-free derivation**
(`shell.ts`, `onboarding/onboarding.ts`) and **presentation** (`components/shell/`,
`components/stage/`). Constitution Principle IV requires derivation to be importable and
testable without a browser, and this feature's genuinely tricky logic is all derivation:
reconciling two folder families into one project identity, deciding when a per-project
nesting level is warranted, and running the accordion state machine so a user's collapse is
never undone. Putting that in components would have made it reachable only through a DOM
harness this project does not have, and would have left the state machine - the part most
likely to regress - untested.

`components/stage/` exists for a different reason: three separate views (Overview, sprint,
and the document detail views) were each inventing their own headings, panels, and stat
rows. It is extracted on the same "genuine third consumer" bar this project applied to
`FrontmatterInfoControl` (feature 012) and `MarkdownContent` (feature 017), not speculatively.

`sidebarNav.tsx` is presentation-only by design: it holds the row and label components, but
none of the decisions about *what* to render, which stay in `shell.ts` where they can be
tested.

## Complexity Tracking

> Filled because Constitution Check has violations that must be justified.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **Principle I** - no spec preceded the implementation | Not needed, and not justified. The work was done exploratorily, by hand, across many small iterations in which the design was still being discovered; a spec was written only afterwards. | The simpler alternative - writing the spec first - was not rejected for any reason; it was skipped. This entry exists to record the deviation, not to defend it. The remediation is this artifact set, and the cost already paid is that several decisions were made, reversed, and remade (the sidebar's information architecture was restructured twice) without a written contract to check them against. |
| **Principle III** - typography loaded from a third-party CDN at page load | Nothing required it. A remote font link was the quickest way to get the intended typeface during exploratory work. | Two simpler alternatives exist and neither was evaluated: **(a)** self-host the font files as a build asset, which keeps the typeface and restores offline rendering at the cost of bundle size; **(b)** drop the custom typeface for a system font stack, which costs nothing and loses only visual distinctiveness. Either satisfies the principle. This is a live defect: the tool is specified to work fully offline, and it currently makes an outbound request to a third party while displaying a user's private project documents - which the principle's own rationale names as the reason it exists. See `research.md` § 6. |
| **Principle V** - derivation tests not written first | The derivation modules were extracted from working component code during the redesign, so the behavior existed before the tests that describe it. | Test-first would have been possible for `shell.ts`'s state machine in particular, whose rules (seed once, never reopen a user-collapsed section) are specifiable without any UI. The tests that exist do pin the current behavior and would catch a regression; what was lost is their power to have caught the original design being wrong. Accepted rather than remediated - rewriting the tests now would not recover that property. |
