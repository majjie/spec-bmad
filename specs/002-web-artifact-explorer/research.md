# Phase 0 Research: Web Artifact Explorer

No `NEEDS CLARIFICATION` markers remain in the Technical Context — the spec's clarification
session already resolved the two decisions (sort grouping, rendering scale) that would
otherwise have shown up here. The research below covers the remaining implementation-
approach decisions needed before design.

## 1. Frontend stack: React + MUI + Vite

**Decision**: React 18 + TypeScript, styled with MUI (`@mui/material` + `@mui/x-tree-view`
for the folder tree), bundled by Vite. The built output (`web/dist/`) ships as static
assets in the published package; React/MUI/Vite themselves are devDependencies only.

**Rationale**: The user explicitly asked for an off-the-shelf rendering framework rather
than a bespoke one, and for a "material-like" dark theme — MUI *is* Google's Material
Design implemented for React, so it directly satisfies both asks with one library choice.
`@mui/x-tree-view` gives an expandable/collapsible folder tree (FR-003/FR-004) with no
custom tree-widget code, and MUI's `Table`/`TableSortLabel` gives sortable columns
(FR-009/FR-010) out of the box. Vite is the standard, minimal-config bundler for this
stack.

**Alternatives considered**:
- Hand-rolled vanilla JS/CSS: rejected — directly against the user's explicit preference
  for an off-the-shelf framework.
- Vue + Vuetify: also a legitimate "material-like" off-the-shelf option, but React + MUI
  has a larger ecosystem and a purpose-built tree component (`@mui/x-tree-view`); no
  functional requirement favors Vue, so the more common choice was taken.
- Svelte + a Material component kit: rejected — the Svelte Material ecosystem is smaller
  and less battle-tested than MUI for a tree + sortable table combination.

## 2. Backend transport: dependency-free `node:http`, no framework

**Decision**: A small `node:http` server in `src/server/http-server.ts` routes a handful of
GET endpoints and serves `web/dist/`'s static files, with no Express/Fastify/etc.
dependency.

**Rationale**: The route surface is tiny (three JSON endpoints + static files) and entirely
read-only (FR-016), so hand-rolling it is a small, well-bounded amount of code. This keeps
the *runtime* dependency footprint at zero beyond Node builtins, consistent with
constitution Principle III — the "off-the-shelf framework" allowance the user gave was
specifically framed around rendering (the frontend), not the transport layer.

**Alternatives considered**:
- Express: rejected for now — would reduce boilerplate slightly but adds a runtime
  dependency for a surface this small; revisit if route/middleware complexity grows in a
  later feature.

## 3. Data delivery split: free tree structure vs. on-demand metadata

**Decision**: Two different endpoints with two different cost profiles:
- `GET /api/tree/:tab` returns the *entire* folder-only tree for a tab in one response,
  derived by filtering feature 001's already-cached `ArtifactNode` tree down to
  `type === 'folder'` nodes. This costs no additional filesystem work — it's pure
  in-memory filtering of data feature 001 already scanned.
- `GET /api/contents/:tab?path=...` returns only the *direct children* of one specific
  folder, each enriched with `fs.stat()`-derived size/created/updated metadata. This is
  requested once per folder selection (FR-005/FR-007), so the `stat()` cost scales with
  one folder's child count, not the whole tree.

**Rationale**: FR-017 confirms virtualization/pagination isn't required, but that's about
*rendering* — it doesn't mean it's free to `stat()` every file in a multi-thousand-entry
tree on every page load. Splitting "structure" (free) from "metadata" (stat-on-selection)
keeps initial load cheap while still handling the confirmed scale comfortably once a user
actually selects a folder.

**Alternatives considered**:
- Enrich the entire tree with stat metadata upfront: rejected — would `stat()` every file
  in the project on every tab load, most of which are never shown in the table this
  session, for no benefit given the tree pane never displays size/dates (only the table
  does).
- Fully lazy per-folder tree fetching (only fetch a folder's *subfolder* names when
  expanded): rejected as unneeded complexity — the tree structure alone is cheap enough to
  send whole, per FR-017's confirmed scale.

**Security note**: because `/api/contents/:tab` takes `path` as a caller-supplied query
parameter, the route MUST verify server-side that `path` is contained within `:tab`'s own
root folder before calling `fs.stat()`/`readdir()` on it (403 otherwise) — anything able to
reach `127.0.0.1:<port>` could otherwise enumerate arbitrary directories readable by the
CLI's user, well beyond the `_bmad`/`_bmad-output` scope this tool is meant to expose. This
was surfaced during `/speckit-analyze` and is captured in `contracts/http-api.md`.

## 4. Folder rows in the contents table: no recursive size

**Decision**: A folder's `size` field is `null` (rendered as "—") rather than a recursive
sum of its contents' sizes.

**Rationale**: Spec FR-006 requires a Size column but doesn't require it to be meaningful
for folders; recursively summing a folder's full contents (potentially the whole
`_bmad-output` tree) on every table render would reintroduce exactly the "stat the whole
tree" cost § 3 avoids, for a number most file managers don't show either.

**Alternatives considered**: Recursive sum, computed lazily and cached: rejected as
unrequested complexity — no functional requirement or success criterion asks for it.

## 5. Timestamp source

**Decision**: `fs.stat()`'s `birthtime` for Created, `mtime` for Updated, both serialized
as ISO-8601 strings over the API.

**Rationale**: Both are standard, built-in `fs.Stats` fields — no extra dependency needed.

**Known limitation**: `birthtime` isn't reliably populated on every filesystem (some Linux
filesystems/older kernels report it as equal to `ctime` or `mtime`). This is a Node/OS-level
limitation, not something this feature can work around; it's noted here rather than
treated as a defect.

## 6. Server binding and port selection

**Decision**: Bind to `127.0.0.1` on an OS-assigned ephemeral port (`listen(0, '127.0.0.1')`),
printing the resolved URL to stdout once listening; handle `SIGINT` to close the server and
exit `0` cleanly.

**Rationale**: Matches constitution Principle III (localhost-only, zero required config) —
"pointing it at a project directory is the only required input." An OS-assigned port avoids
a fixed default port colliding with another local process, with no fallback logic needed.

**Alternatives considered**: A fixed default port (e.g. 4173): rejected — no fallback would
be needed only until the first port conflict; letting the OS pick avoids the problem
entirely at no cost, since the CLI prints the actual URL either way.
