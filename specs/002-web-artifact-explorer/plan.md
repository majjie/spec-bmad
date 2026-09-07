# Implementation Plan: Web Artifact Explorer

**Branch**: `002-web-artifact-explorer` | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-web-artifact-explorer/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add the localhost web UI BMAD Browser exists to provide: a two-tab (Infra/Output) screen
where each tab shows a folder-only tree on the left (bound to `_bmad`/`_bmad-output`) and a
sortable files+folders table on the right for whichever folder is selected, in a dark,
material-styled, desktop-only layout. The frontend is an off-the-shelf React + MUI app
(pre-built to static assets at publish time, not a runtime dependency); the backend is a
small dependency-free `node:http` server, added to `src/cli.ts`'s existing valid-folder
path, that serves those static assets plus three read-only JSON endpoints sourced from
feature 001's access layer.

**Note on feature 001's existing behavior**: today, a valid folder makes `cli.ts` build the
cache once and exit `0` immediately (feature 001's `src/cli.ts`, tested by
`tests/integration/cli-folder-resolution.test.ts`'s "valid folder" case). This feature
changes that: a valid folder now starts the HTTP server and keeps the process running
until interrupted, since spec.md's premise ("opens BMAD Browser in a desktop browser")
requires the server to actually stay up. `/speckit-tasks` MUST include updating that
existing test to assert the new behavior (server starts and responds) rather than
immediate exit — this is called out here so it isn't missed as a "later cleanup."

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js ≥20 LTS (server, build tooling); React 18 +
TypeScript for the frontend.

**Primary Dependencies**: Published-package runtime dependencies remain at zero beyond
Node built-ins (`node:http`, `node:fs`, `node:path`) — the frontend is pre-built to static
assets before publish, not installed by end users. Build-time only (devDependencies):
`react`, `react-dom`, `@mui/material`, `@mui/x-tree-view`, `@emotion/react`,
`@emotion/styled` (MUI's peer deps), `vite`, `@vitejs/plugin-react`.

**Storage**: N/A — no persistence added; the server reads feature 001's in-memory
`HierarchyCache` plus on-demand `fs.stat()` calls for display metadata (see research.md).

**Testing**: Node's built-in test runner for the server/API layer (constitution Principle
V's parsing/data-logic clause); manual verification in a running browser for the React UI
itself, documented in `quickstart.md` (constitution Principle V's explicit UI-rendering
clause — "UI/rendering changes MUST be manually verified in a running browser session").

**Target Platform**: Localhost HTTP server on Node.js ≥20 LTS, viewed in any modern
full-size-desktop browser (no mobile layout, per FR-014).

**Project Type**: Web application layered onto the existing single-package CLI project —
adds `src/server/` (backend) and a `web/` frontend source tree within this same repository
and published package, not a separate project/workspace.

**Performance Goals**: None mandated beyond SC-002 ("no full page reload" for sort, a
purely client-side operation). Folder-contents metadata cost scales with one folder's
direct children at a time (see research.md § 3), not the whole tree, per FR-017's
no-virtualization-needed decision.

**Constraints**: Server MUST bind to `127.0.0.1` only (constitution Principle III); every
route MUST be read-only, no mutation endpoints (FR-016); no virtualization/pagination
required (FR-017); dark/material-like styling (FR-015); desktop-only, no mobile layout
(FR-014).

**Scale/Scope**: Same as feature 001 — tens to low thousands of files/folders per
`_bmad`/`_bmad-output` tree (per feature 001's plan.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Assessment |
|---|---|---|
| I. Spec-First Development | Yes | Spec approved and clarified (`spec.md`) before this plan; every requirement below traces to an FR-###. |
| II. Read-Only Artifact Viewer | Yes | FR-016 forbids any create/rename/move/delete route; the server exposes GET-only endpoints (research.md § 4/§5, contracts/http-api.md). |
| III. Zero-Install, Local-First Operation | Yes | Server binds to `127.0.0.1` only; runs via the existing `npx bmad-browser` entry point; React/MUI/Vite are devDependencies used to pre-build static assets before publish — end users' `npx` install and cold-start are unaffected by them (see Primary Dependencies above). |
| IV. TypeScript CLI & Web Interface Standards | Yes | Route handlers (`src/server/routes/*.ts`) are plain, UI-independent TypeScript functions, unit-testable without a browser; CLI conventions (`--help`/`--version`, non-zero exit codes) from feature 001 are unchanged. |
| V. Test-First for Parsing & Rendering Logic | Yes | Server-side data logic (folder-tree filtering, contents enrichment) gets tests written first, per Principle V's main clause; the React UI itself is manually verified in a running browser per Principle V's explicit UI carve-out, documented as `quickstart.md` scenarios. |

**Result**: PASS — no violations, no entries needed in Complexity Tracking.

**Post-Phase 1 re-check**: Design artifacts (`data-model.md`, `contracts/`, `quickstart.md`)
introduce no mutation routes, no new runtime dependency (React/MUI/Vite stay build-time
only), and no network exposure beyond `127.0.0.1`. PASS confirmed unchanged.

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
├── artifacts/               # unchanged (feature 001)
├── discovery/                # unchanged (feature 001)
├── server/
│   ├── http-server.ts        # creates/starts the node:http server, wires routes + static files
│   ├── static-files.ts        # serves web/dist/* built assets
│   └── routes/
│       ├── tabs.ts             # GET /api/tabs
│       ├── tree.ts              # GET /api/tree/:tab (folder-only tree)
│       └── contents.ts           # GET /api/contents/:tab?path=... (stat-enriched entries)
└── cli.ts                    # extended: valid-folder branch now starts the server (see Summary)

web/                          # frontend source (built to web/dist/ before publish)
├── index.html
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx                 # tabs root (Infra/Output), owns per-tab tree/selection state
    ├── theme.ts                 # MUI dark theme
    └── components/
        ├── FolderTree.tsx        # left pane, wraps @mui/x-tree-view
        └── ContentsTable.tsx      # right pane, sortable table (folders-before-files)

tests/
├── unit/
│   ├── artifacts/            # unchanged (feature 001)
│   ├── discovery/             # unchanged (feature 001)
│   └── server/
│       ├── tree.test.ts
│       └── contents.test.ts
└── integration/
    ├── cli-folder-resolution.test.ts   # feature 001's "valid folder" case updated (see Summary)
    └── web-server.test.ts               # end-to-end: start server, hit /api/* over HTTP
```

**Structure Decision**: Single repository/package, extended rather than split into
separate frontend/backend projects — `src/server/` mirrors the existing `src/artifacts/`
and `src/discovery/` layering (constitution Principle IV: route handlers stay
UI-independent and unit-testable), while `web/` holds the React/MUI source that Vite
builds to `web/dist/` for `src/server/static-files.ts` to serve. No workspaces/monorepo
tooling is introduced — `web/`'s devDependencies live in the single root `package.json`,
keeping the "one-shot" build-tooling cost the user accepted without adding project-management
overhead.

## Complexity Tracking

*No violations — Constitution Check passed cleanly, so this section is intentionally empty.*
