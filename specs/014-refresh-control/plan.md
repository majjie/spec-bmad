# Implementation Plan: Refresh Control

**Branch**: `014-refresh-control` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-refresh-control/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

A refresh control (conventional reload icon, sized and aligned to sit in the same header
row as the Navigator/Infra/Output tabs) lets a user force this tool to pick up on-disk
changes without restarting it. Selecting it invalidates the server's cached folder
scan for every tab at once — reusing `HierarchyCache.invalidate()`, a method feature 001
already built and specified for exactly this purpose but never wired to anything — then
the client re-fetches whatever is currently visible: tab availability, both folder tabs'
trees/listings (falling back to each tab's root if the previously selected folder no
longer exists), and the Navigator's own tree, remounting its detail pane (Sprint Status or
the PRD view, whichever is showing) so it re-runs its own fetch from scratch. No new
persisted data or major architecture is introduced — this is a thin UI trigger over an
invalidation mechanism that already exists, plus the re-fetch wiring needed to make its
effect visible.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (client), Node.js ≥20 (server) — both unchanged.

**Primary Dependencies**: None new. `@mui/icons-material/Refresh` (already an available
package, unused so far) for the icon; no other new dependency.

**Storage**: N/A — no persisted data. The server already holds an in-memory
`HierarchyCache` (`src/artifacts/cache.ts`, feature 001) with a fully-implemented but
never-yet-called `invalidate(root)` method; this feature adds the first caller.

**Testing**: `cache.invalidate()` itself is already unit-tested (feature 001). This
feature adds: a small server-side unit test for the new route handler (genuine, if thin,
logic — confirms it calls `invalidate` and returns 200); and manual `quickstart.md`
verification for the client-side refresh/re-fetch/fallback UI behavior, per constitution
Principle V's carve-out (no new client-side derivation logic is introduced — every
re-fetch reuses existing, already-tested fetch functions unchanged).

**Target Platform**: Same as prior features — localhost server + full-size desktop
browsers only.

**Project Type**: Extends the existing single Node.js CLI + bundled web frontend — one
new backend route, plus frontend wiring.

**Performance Goals**: None mandated beyond SC-003's "within a couple of seconds for a
typical project" — matches this tool's existing initial-load scan performance, since a
refresh re-runs the exact same `scan()` the mount-time load already performs.

**Constraints**: Read-only with respect to project files (constitution Principle II) — a
refresh only re-reads on-disk state through routes that already exist; the only "write"
involved is to the server's own in-memory cache state (already an established, tested
mechanism, not a new one), never to any file.

**Scale/Scope**: Same as prior features.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved and clarified (`spec.md`) before this plan; every requirement traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes | Refresh only re-reads already-exposed on-disk state via existing routes; the only mutation is to the server's own in-memory cache (already built, already tested, feature 001) — no file is ever written. |
| III. Zero-Install, Local-First Operation | Yes | No new dependency — `@mui/icons-material` is already installed. |
| IV. TypeScript CLI & Web Interface Standards | Yes | The new route handler is a plain, testable TypeScript function alongside this app's other route handlers. |
| V. Test-First for Parsing & Rendering Logic | Yes | No new derivation/parsing logic is introduced — every re-fetch reuses existing, already-tested functions (`fetchTree`, `fetchContents`, `fetchNavigatorTree`, `fetchTabs`) unchanged. The one new server-side unit (the route handler) is thin but still gets a test, since it's the first caller of a previously-untested-in-production-use code path. Client-side wiring (the button, remount-based re-fetch triggering) is UI, manually verified per the carve-out. |

**Result**: PASS — no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts introduce exactly one new backend route (a thin
wrapper around an already-built, already-tested cache method) and no new client-side
derivation logic. PASS confirmed unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/014-refresh-control/
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
└── server/
    ├── routes/
    │   └── refresh.ts               # NEW — getRefreshResponse(root, cache): calls
    │                                  # cache.invalidate(root) and returns { status: 200 }
    └── api-router.ts                # MODIFIED — wires GET /api/refresh to the new route

web/
└── src/
    ├── api.ts                       # MODIFIED — adds fetchRefresh(): Promise<void>
    ├── navigatorApi.ts              # MODIFIED — exports findPrdFolderEntry(tree, itemId),
    │                                  # extracted from NavigatorDetailPane.tsx so App.tsx's
    │                                  # refresh handler can reuse the identical lookup to
    │                                  # check whether the current PRD selection still
    │                                  # exists after a refresh
    ├── App.tsx                      # MODIFIED — renders the RefreshButton in the tab row;
    │                                  # owns the refresh handler: calls fetchRefresh(),
    │                                  # re-fetches tab availability + both folder tabs'
    │                                  # trees/contents (falling back to each tab's root if
    │                                  # the selected folder is gone), re-fetches the
    │                                  # Navigator tree and resets navigatorSelectedItemId
    │                                  # if it no longer resolves, and bumps a
    │                                  # `refreshToken` counter
    └── components/
        ├── NavigatorView.tsx        # MODIFIED — accepts `refreshToken`, applies it as
        │                              # `key={refreshToken}` on NavigatorDetailPane only
        │                              # (not the tree sidebar), so a refresh remounts just
        │                              # the detail pane — causing its own Sprint
        │                              # Status/PrdDetailView fetch effects to naturally
        │                              # re-run from scratch, with no changes needed inside
        │                              # either of those components
        └── NavigatorDetailPane.tsx  # MODIFIED — removes its own local
                                       # findPrdFolderEntry in favor of the shared export

tests/
└── unit/server/
    └── refresh.test.ts              # NEW
```

**Structure Decision**: The backend change is minimal by design — `HierarchyCache`
already has a working, tested `invalidate()` method (feature 001, FR-005) with no caller
anywhere in the codebase; this feature's entire server-side job is exposing it via one new
GET route (kept as GET, not POST, since `http-server.ts` currently hard-rejects any
non-GET method with 405 — extending that shared, foundational module for the sake of one
action endpoint was judged higher-risk than a GET-triggered action, which is an accepted
simplification for a local-only, 127.0.0.1-bound tool with no proxies/CSRF surface,
research.md § 1). On the client, re-fetching Infra/Output's tab state is a direct
re-fetch-and-`setState` in `App.tsx`, since that state already lives there; the Navigator
detail pane's own two possible views (Sprint Status, PRD detail) each already fetch their
own data in a `useEffect`, so a `key`-driven remount (rather than threading a new prop
into both components and editing their effects) is the smaller, lower-risk way to force
them to redo that fetch — the same "force a fresh instance" idiom, just newly applied
here (research.md § 3).

## Complexity Tracking

*No violations — Constitution Check passed cleanly, so this section is intentionally empty.*
