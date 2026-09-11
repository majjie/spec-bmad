# Implementation Plan: Instrumental Console Redesign

**Branch**: `018-instrumental-console` (implemented on `ux-polish-console`) | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-instrumental-console/spec.md`

> **Retrospective plan**: written after the implementation, by reading it. It records the
> structure and the decisions that were actually taken, including the two constitution
> violations this reconstruction found (see Constitution Check) - one of which, the font CDN
> dependency, was fixed as a result. It is not a forward-looking design document, and its
> Complexity Tracking table carries real entries rather than the usual "no violations" note.

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

**Primary Dependencies**: React 18 and MUI 6, both already present. The token layer is plain
CSS custom properties and the theme is built with MUI's existing `createTheme`, so this
feature adds **no new runtime dependency**. It does add two build-time font packages (T037),
which are bundled into the built assets and are not on the `npx` cold-start path.

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
| III. Zero-Install, Local-First Operation | Yes | **VIOLATED AS SHIPPED, NOW FIXED.** The typography was loaded from a third-party font CDN at page load, so the UI did not render as designed offline and the browser contacted an external host while displaying project documents. Resolved during this retrospective by bundling the font files at build time (T037, research § 6 option A). Recorded in Complexity Tracking. |
| IV. TypeScript CLI & Web Interface Standards | Yes | PASS. No CLI surface is touched. The derivation logic is deliberately separated into `web/src/shell.ts` and `web/src/onboarding/onboarding.ts`, both importable and testable without a DOM - the principle's core requirement. Builds under strict mode. |
| V. Test-First for Parsing & Rendering Logic | Yes | **PARTIAL.** The derivation helpers do have unit tests covering the current behavior, but being a retrofit the tests were written alongside or after the code, not before it. The rendering layer falls under the principle's own manual-browser carve-out and is covered by `quickstart.md`. Recorded in Complexity Tracking. |

**Result**: FAIL on I, PARTIAL on V. Principle III failed as shipped and has since been
fixed. This feature did not pass the gate cleanly at the time it was delivered, and recording
that is the point of these artifacts.

**Post-Phase 1 re-check**: II and IV remain PASS - the design artifacts add no new route and
no editing affordance. Principle III now **passes**: the fonts are bundled as build assets and
the built page makes no outbound request, verified by searching the build output for the CDN
hosts. The one dependency this added is a build-time font package, which does not affect the
`npx` cold-start path the principle is concerned with. Principle I cannot be satisfied
retroactively and stands as recorded.

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
├── index.html                          # MODIFIED - carries only the pre-paint appearance
│                                       #   script, which belongs to feature 019. The font
│                                       #   CDN links this feature originally added here
│                                       #   were the Principle III violation and have been
│                                       #   removed (T037)
└── src/
    ├── main.tsx                        # MODIFIED - imports the token layer, and the latin
    │                                   #   subset of exactly the IBM Plex weights theme.ts
    │                                   #   maps, so the fonts are bundled as build assets
    │                                   #   rather than fetched from a third party (T037)
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
| **Principle III** - typography loaded from a third-party CDN at page load | Nothing required it. A remote font link was the quickest way to get the intended typeface during exploratory work, and the intent had been to bundle the fonts at build time - but no such step was ever added, and nothing in normal development would have revealed that, since the CDN fonts load fine whenever the developer is online. | **Resolved**, by research § 6 option A: the font files are now bundled as build assets and the remote link is gone. The alternative of dropping the custom typeface (option B) was rejected because the typeface is load-bearing for this feature's stated purpose and option A fixes the same problem without giving it up. Cost: one build-time dependency and ~128 KB of subsetted font assets, against a bundle whose script alone is 1.37 MB. |
| **Principle V** - derivation tests not written first | The derivation modules were extracted from working component code during the redesign, so the behavior existed before the tests that describe it. | Test-first would have been possible for `shell.ts`'s state machine in particular, whose rules (seed once, never reopen a user-collapsed section) are specifiable without any UI. The tests that exist do pin the current behavior and would catch a regression; what was lost is their power to have caught the original design being wrong. Accepted rather than remediated - rewriting the tests now would not recover that property. |
