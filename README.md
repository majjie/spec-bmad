# BMAD Browser

Browse [BMAD](https://docs.bmad-method.org/) spec-driven-development
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

A **refresh control** sits at the right-hand end of that same tab row, vertically centred
against the tabs. The folder structure is cached in memory, so this is how on-disk changes
get picked up without restarting: it invalidates the cache for every tab at once (not just
the active one), then re-fetches whatever is currently displayed. The icon spins while the
refresh is in flight and turns red briefly if it fails. Your selection is kept when it
still exists afterwards, and falls back to the tab's own root when it doesn't.

The theme is dark with a blue accent (`#90caf9`) carried through tile headings, a 15px
base font, semantic status-icon colours, and a shared key/value colour pairing used
everywhere a label sits next to a value (the Summary tile, the frontmatter readout).

**Explorer tabs** pair a folder tree on the left with a sortable contents table (Name,
Created, Updated, Size) on the right. Folder/tab navigation is pushed onto the browser
history stack, so mouse Back buttons move within the app instead of leaving it.

**Navigator** presents three curated roots:

- **PRD view** — `planning-artifacts/prds` folders grouped by project slug, then by date
  (newest first); folders that don't match the convention are listed under their literal
  name. Selecting a leaf opens the **PRD detail view** described below.
- **Architecture view** — `planning-artifacts/architecture` folders, grouped by exactly
  the same slug-then-date convention and the same non-conforming bucket, since the two
  artifact types share it. Shown only when that folder has subfolders. Selecting a leaf
  opens the **Architecture detail view** described below.
- **Sprint Status** — shown when `implementation-artifacts/sprint-status.yaml` exists.
  A Summary tile (including a calculated *Active epic* field), an Action Items tile, and
  one collapsible tile per epic listing its numbered steps with status icons. A step's
  magnifying-glass button opens the matching `spec-<index>-*.md` from
  `implementation-artifacts` in the file viewer; steps are matched by index prefix
  (`1-6a-walk-the-artifact-tree-safely` → `spec-1-6a-`), not by full-slug equality.

**PRD detail view** — selecting a PRD leaf renders that folder's `prd.md` as Markdown
filling the pane (no dialog, no close control), partitioned into three regions by divider
lines:

- A row of tiles across the top, each bound to files in the same PRD folder and greyed out
  when its target is absent:
  - **reviews** — `review-*.md` files, listed in a hover tooltip under friendly Title Case
    names (`review-edge-cases.md` → "Edge Cases"), alphabetically; picking one opens it in
    the file viewer.
  - **addendum** — opens `addendum.md` in the file viewer.
  - **memory log** — opens `.memlog.md` in a bespoke dialog: one candy-striped item per
    bullet, the parenthetical prefix (`(decision)`, `(assumption)`, …) broken out as a
    coloured header, and any requirement code that exists in the PRD rendered as a link
    that closes the dialog and jumps the PRD to it.
- The PRD itself in the middle, with the frontmatter `(i)` control pinned in the pane's
  top-right corner while the document scrolls beneath it.
- A **requirement-code index** column down the right: one small tile per unique code
  prefix found in the document (`FR`, `NFR`, `UJ`, …), matching both bullet-style
  (`**FR-25** …`) and header-style (`### UJ-1 — …`) requirements. Hovering a tile lists
  every code under that prefix in numerical order; the tooltip stays open while the
  pointer is over it (with a 400ms grace period after it leaves), scrolls internally when
  it's taller than the screen, and clicking a code jumps the PRD to that point.

**Architecture detail view** — selecting an architecture leaf renders that folder's
`ARCHITECTURE-SPINE.md` the same way, deliberately mirroring the PRD view's layout while
differing in three places:

- The requirement-code index indexes **header-style codes only** (`### AD-1 — …`).
  Architecture documents don't use the bullet-pointed style, so a `**AD-1**` in the body
  is left alone rather than indexed.
- **reviews** are read from the folder's own `reviews/` subfolder rather than the leaf
  folder itself; the `review-*.md` matching, friendly Title Case naming and alphabetical
  ordering are unchanged.
- There is **no addendum tile**, and the **memory log** dialog renders requirement codes
  as plain text rather than links.

If the folder has no `ARCHITECTURE-SPINE.md`, the pane says so instead of erroring.

**File viewer** — double-clicking a file opens a full-screen dialog, rendered by
extension: Markdown as HTML, `.yaml`/`.toml`/`.py` with syntax highlighting, `.csv` as a
read-only spreadsheet grid, everything else as monospace text with line numbers. Escape,
the close button, or browser Back all dismiss it.

For Markdown, a leading YAML frontmatter block — and the tag lines of a marker element
wrapping the document, e.g. `<frozen-after-approval …>` … `</frozen-after-approval>` —
is excluded from the rendered output rather than rendered as text; the content the marker
wraps still renders normally. When a preamble was found, an `(i)` control appears beside
the close button, and hovering or clicking it reads the parsed key/value pairs back with
keys and values in distinct colours. Anything that doesn't match that exact shape (an
unterminated block, a non-mapping YAML document, a non-Markdown file) renders completely
unchanged.

Everywhere Markdown renders in this tool — the file viewer, the PRD detail view, and the
Architecture detail view — tables show a full cell grid in the app's own divider colour,
and fenced code blocks get a background distinct from the surrounding text. A block whose
opening fence names a language (e.g. `` ```typescript ``) is syntax-highlighted with the
same highlighter used for the `.py`/`.yaml` file view; one with no language, or a language
that highlighter doesn't recognize, still gets the plain background with no error.

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
| `GET /api/refresh` | Invalidates the cached folder structure for every root at once |

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
  navigator/             PRD/architecture grouping, sprint status, steps, action items
web/
  src/                   React + MUI frontend (Vite); the parsing/derivation modules
                         (frontmatter, prdIndex, memlogParser, reviewFiles, csvGrid,
                         sortEntries) are plain TypeScript and unit-tested directly
  dist/                  build output, served by the CLI — build before first run
tests/
  unit/, integration/    node:test suites
specs/                   one folder per feature: spec, plan, tasks, contracts, checklists
.specify/                Spec Kit templates, scripts, and the project constitution
```

Artifact parsing lives outside the web layer, so it's importable and testable without a
browser — and the frontend's own derivation logic is kept in DOM-free modules for the same
reason (`tests/unit/web/`).

## Development

```bash
npm test          # tsx --test over tests/unit and tests/integration (179 tests)
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
| 010 | [Markdown frontmatter tooltip](specs/010-markdown-frontmatter-tooltip/spec.md) |
| 011 | [UI visual refresh](specs/011-ui-visual-refresh/spec.md) |
| 012 | [PRD detail viewer](specs/012-prd-detail-viewer/spec.md) |
| 013 | [PRD tile actions](specs/013-prd-tile-actions/spec.md) |
| 014 | [Refresh control](specs/014-refresh-control/spec.md) |
| 015 | [Architecture tree](specs/015-architecture-tree/spec.md) |
| 016 | [Architecture detail view](specs/016-architecture-detail-view/spec.md) |
| 017 | [Markdown render polish](specs/017-markdown-render-polish/spec.md) |
