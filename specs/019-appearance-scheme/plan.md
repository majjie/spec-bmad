# Implementation Plan: Light and Dark Appearance

**Branch**: `019-appearance-scheme` (implemented on `ux-polish-console`) | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/019-appearance-scheme/spec.md`

> **Retrospective plan**, written after the implementation by reading it. Reconstructing it
> surfaced a defect that had been shipped - see Constitution Check, Principle IV - which was
> fixed as part of producing these artifacts rather than merely recorded.

## Summary

Add a second appearance by remapping feature 018's semantic token layer, resolve the
reader's preference against the system's, persist an explicit override, and apply the
resolved appearance before first paint so no wrong-appearance frame is ever shown. The
resolution rules live in a DOM-free module; the only DOM work is a provider that applies the
result and subscribes to system changes.

## Technical Context

**Language/Version**: TypeScript 5.7, strict mode, ES2022. Unchanged from feature 018.

**Primary Dependencies**: None added. The appearance is CSS custom properties plus the
existing component library's theme factory.

**Storage**: One browser preference value. Nothing is written to the inspected project
(constitution Principle II).

**Testing**: `tsx --test` over `tests/unit/web/`. The resolution logic and the token mapping
are unit-tested; the visual result is verified manually per `quickstart.md`.

**Target Platform**: Desktop browsers on localhost.

**Project Type**: Single TypeScript project with a bundled web frontend.

**Performance Goals**: Appearance resolution must complete before first paint, which
constrains it to a synchronous inline step - see research § 3.

**Constraints**: Must tolerate blocked preference storage (FR-008), must not animate under
reduced motion (FR-013), must hold AA contrast in both appearances (FR-011).

**Scale/Scope**: Two appearances, one preference value, one token block.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | **VIOLATED.** No spec preceded the implementation; these artifacts were reconstructed from the delivered branch. Recorded in Complexity Tracking. |
| II. Read-Only Artifact Viewer | Yes | PASS. The only write is one preference value in the browser's own storage. |
| III. Zero-Install, Local-First Operation | Yes | PASS for this feature - it adds no dependency and no network call. (Feature 018's font CDN violation is separate and tracked there as T037.) |
| IV. TypeScript CLI & Web Interface Standards | Yes | **VIOLATED AS SHIPPED, NOW FIXED.** `web/src/colorScheme.ts` is meant to be the DOM-free half, but two of its functions referenced `window`, `document` and `HTMLElement` directly. Because the module is imported by a unit test, this broke `npm run typecheck` on the branch - the whole project failed to type-check. Fixed while producing these artifacts by injecting the media query and an element-shaped structural type, moving DOM access into the provider. See Complexity Tracking. |
| V. Test-First for Parsing & Rendering Logic | Yes | **PARTIAL.** Preference resolution had tests; the two DOM-touching functions had **none**, which is why the type error went unnoticed. Tests were added alongside the fix. Being a retrofit, none were written first. |

**Result**: FAIL on I, PARTIAL on IV (fixed) and V. Recorded rather than waived.

**Post-Phase 1 re-check**: With `colorScheme.ts` no longer referencing DOM globals, Principle
IV is now genuinely satisfied - the module is importable and testable without a browser, and
`npm run typecheck` is clean. Principle I cannot be retroactively satisfied and stands as
recorded.

## Project Structure

### Documentation (this feature)

```text
specs/019-appearance-scheme/
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
web/
├── index.html                              # MODIFIED - a small synchronous script that
│                                           #   resolves and stamps the appearance before
│                                           #   the bundle loads. This is the whole of
│                                           #   FR-007; nothing else can prevent the flash.
└── src/
    ├── tokens.css                          # MODIFIED - adds the light block, remapping
    │                                       #   ONLY the semantic tier. Primitives gain warm
    │                                       #   sand / cool mist / ink ramps and a slate-blue
    │                                       #   accent for the light appearance to draw on.
    ├── colorScheme.ts                      # NEW - DOM-free: the preference and resolved
    │                                       #   types, fallible persistence, resolution
    │                                       #   against the system, the next-preference rule,
    │                                       #   and the element-shaped `ColorSchemeRoot` the
    │                                       #   applier writes through
    ├── theme.ts                            # MODIFIED - `createAppTheme(mode)` now builds
    │                                       #   either palette from the same semantic names
    └── components/shell/
        ├── ColorSchemeProvider.tsx         # NEW - owns preference state, applies the
        │                                   #   resolved appearance to the document element,
        │                                   #   subscribes to system changes, and provides
        │                                   #   the toggle through context. ALL DOM access
        │                                   #   for this feature lives here.
        └── AppHeader.tsx                   # MODIFIED - the appearance control, labelled
                                            #   with the appearance it will switch TO

tests/unit/web/
├── colorScheme.test.ts                     # NEW - resolution, persistence, the system
│                                           #   reader, and the applier
└── lightThemeTokens.test.ts                # NEW - asserts the light block's token mapping
```

**Structure Decision**: The split mirrors feature 018's: decisions in a DOM-free module,
effects in a provider. This feature makes the reason unusually concrete - the shipped code
violated the split, and the immediate consequence was that the project stopped type-checking,
because the module is reachable from a test compiled under a configuration with no DOM
library. Keeping `colorScheme.ts` DOM-free is therefore not a stylistic preference here; it
is what allows the logic to be tested at all in a project with no DOM test harness.

`index.html` carries the pre-paint script rather than the bundle because a module bundle
cannot, by construction, run before first paint. See research § 3.

## Complexity Tracking

> Filled because Constitution Check has violations that must be justified.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **Principle I** - no spec preceded the implementation | Not needed and not justified; the appearance work grew incrementally out of feature 018's polish rather than being specified. | Nothing rejected the simpler path of writing a spec first. Recorded, not defended. The concrete cost: the light appearance was reworked several times in place (a sage palette, then a mist-blue one) with no written statement of what it had to achieve, so there was nothing to check the reworks against. |
| **Principle IV** - DOM globals in the module meant to be DOM-free | Nothing required it. `applyColorSchemeToDocument` defaulted its target to `document.documentElement` and `readSystemColorScheme` defaulted to a live `window.matchMedia` call - convenient at the call site. | Injection was strictly simpler and was not rejected, just not done. The convenience cost the project its type-check: both functions were unreachable to the type checker's DOM-free configuration, and both were consequently **untested**. Fixed during this retrospective; three tests added. |
| **Principle V** - no tests for the DOM-touching functions | Not justified. The untested functions were exactly the ones carrying the defect. | Writing them first would have forced the injection seam immediately and prevented the violation above outright - a direct demonstration of what the principle is for. |
