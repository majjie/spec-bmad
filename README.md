# BMAD Browser

Browse [BMAD](https://github.com/bmad-code-org/BMAD-METHOD) spec-driven-development
artifacts from a localhost web UI.

Point the CLI at a project that contains `_bmad` and/or `_bmad-output` folders and it
serves a dark-themed, desktop-oriented explorer for those artifacts on `127.0.0.1`. The
viewer is strictly **read-only** — it never writes, mutates, or deletes anything in the
target project.

## Requirements

- Node.js >= 20

## Quick start

```bash
npm install
npm run build:web                 # builds the frontend into web/dist (not checked in)
npx tsx src/cli.ts /path/to/project
```

The CLI prints the URL it bound to (an OS-assigned port on `127.0.0.1`) — open it in a
browser. `Ctrl-C` shuts the server down.

```
Usage: bmad-browser [folder]

Arguments:
  folder         Project directory to browse (defaults to the current working directory)

Options:
  --help         Show this help text and exit
  --version      Show the installed version and exit
```

If the target folder has neither `_bmad` nor `_bmad-output`, the CLI says so on stderr,
crawls nearby (the parent folder plus two levels down, skipping dot-folders and
`node_modules`-style directories) and suggests the invocation that would have worked. It
exits non-zero in that case.

## The UI

Three tabs, driven by what the resolved project actually contains:

| Tab | Backed by | What it shows |
| --- | --- | --- |
| **Navigator** (default) | `_bmad-output` | Curated views rather than raw folders |
| **Infra** | `_bmad` | Explorer-style folder tree + contents table |
| **Output** | `_bmad-output` | Explorer-style folder tree + contents table |

**Explorer tabs** pair a folder tree on the left with a sortable contents table (Name,
Created, Updated, Size) on the right. Folder/tab navigation is pushed onto the browser
history stack, so mouse Back buttons move within the app instead of leaving it.

**Navigator** presents two curated roots:

- **PRD view** — `planning-artifacts/prds` folders grouped by project slug, then by date
  (newest first); folders that don't match the convention are listed under their literal
  name.
- **Sprint Status** — shown when `implementation-artifacts/sprint-status.yaml` exists.
  A Summary tile (including a calculated *Active epic* field), an Action Items tile, and
  one collapsible tile per epic listing its numbered steps with status icons. A step's
  magnifying-glass button opens the matching `spec-<index>-*.md` from
  `implementation-artifacts` in the file viewer; steps are matched by index prefix
  (`1-6a-walk-the-artifact-tree-safely` → `spec-1-6a-`), not by full-slug equality.

**File viewer** — double-clicking a file opens a full-screen dialog, rendered by
extension: Markdown as HTML, `.yaml`/`.toml`/`.py` with syntax highlighting, `.csv` as a
read-only spreadsheet grid, everything else as monospace text with line numbers. Escape,
the close button, or browser Back all dismiss it.

## HTTP API

All routes are read-only `GET`s; anything other than `GET` gets a `405`. Unrecognized
paths fall through to the built frontend in `web/dist/`.

| Route | Returns |
| --- | --- |
| `GET /api/tabs` | `{ navigator, infra, output }` availability flags |
| `GET /api/tree/:tab` | Folder tree for `infra` or `output` (404 if that folder is absent) |
| `GET /api/contents/:tab?path=` | Direct children of an absolute folder path |
| `GET /api/file/:tab?path=` | Raw text of a file (`415` if it looks binary) |
| `GET /api/navigator/tree` | The curated Navigator tree |
| `GET /api/navigator/sprint-status` | Parsed `sprint-status.yaml` (`422` if unparseable) |

`path` is caller-supplied, so the server verifies containment itself: a path outside the
tab's own root is rejected with `403` before any filesystem access. Only the `_bmad` and
`_bmad-output` subtrees are ever exposed.

## Layout

```
src/
  cli.ts                 entry point: flag handling, folder resolution, server start
  artifacts/             in-memory folder/file hierarchy cache (never file contents)
  discovery/             project-folder resolution and the nearby-project crawl
  server/                dependency-free HTTP server, routing, static file serving
  navigator/             PRD grouping, sprint status, step detail, action items
web/
  src/                   React + MUI frontend (Vite)
  dist/                  build output, served by the CLI — build before first run
tests/
  unit/, integration/    node:test suites
specs/                   one folder per feature: spec, plan, tasks, contracts, checklists
.specify/                Spec Kit templates, scripts, and the project constitution
```

Artifact parsing lives outside the web layer, so it's importable and testable without a
browser.

## Development

```bash
npm test          # tsx --test over tests/unit and tests/integration (128 tests)
npm run typecheck # tsc --noEmit for both the Node and web tsconfigs
npm run build:web # vite build
```

Both type-check targets run under TypeScript strict mode, with
`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` on.

## How this project is built

BMAD Browser is developed spec-first via [Spec Kit](https://github.com/github/spec-kit):
every feature starts as a spec, then a plan, then tasks, before any implementation code is
written. Those artifacts live in [specs/](specs/) and the process is binding, not
advisory — see [.specify/memory/constitution.md](.specify/memory/constitution.md) for the
project's five core principles (spec-first development, read-only viewing, zero-install
local-first operation, CLI/TypeScript standards, and test-first parsing logic).

Features shipped so far:

| # | Feature |
| --- | --- |
| 001 | [Artifact access layer](specs/001-artifact-access-layer/spec.md) |
| 002 | [Web artifact explorer](specs/002-web-artifact-explorer/spec.md) |
| 003 | [Explorer UI polish](specs/003-explorer-ui-polish/spec.md) |
| 004 | [File content viewer](specs/004-file-content-viewer/spec.md) |
| 005 | [CSV spreadsheet view](specs/005-csv-spreadsheet-view/spec.md) |
| 006 | [Output navigator tab](specs/006-output-navigator/spec.md) |
| 007 | [Navigator tab uplift](specs/007-navigator-uplift/spec.md) |
| 008 | [Action items tile](specs/008-action-items-tile/spec.md) |
| 009 | [Epic step detail](specs/009-epic-step-detail/spec.md) |
