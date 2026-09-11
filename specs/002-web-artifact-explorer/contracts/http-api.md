# Contract: HTTP API (server ↔ frontend)

All routes are read-only GET requests served from `127.0.0.1` on the port the CLI prints
at startup (research.md § 6). No route accepts a body or mutates anything, per FR-016.

## `GET /api/tabs`

Returns `TabAvailability` (data-model.md).

```json
{ "infra": true, "output": true }
```

- **200**: always, once the server is up (availability is derived from the already-
  resolved `ProjectRoot`, no filesystem access needed here).

## `GET /api/tree/:tab`

`:tab` is `infra` or `output`. Returns the tab's `FolderTreeNode` tree (data-model.md),
rooted at that tab's `_bmad`/`_bmad-output` folder.

```json
{ "name": "_bmad", "path": "/abs/path/_bmad", "children": [ { "name": "specs", "path": "/abs/path/_bmad/specs", "children": [] } ] }
```

- **200**: `:tab`'s folder exists (`TabAvailability` for it is `true`).
- **404**: `:tab`'s folder does not exist for this project (matches FR-012 - the frontend
  uses this, or the `/api/tabs` result, to show that tab's empty state instead).
- **404**: `:tab` is neither `infra` nor `output`.

## `GET /api/contents/:tab?path=<absolute-folder-path>`

Returns the direct children of `path` as `ContentsEntry[]` (data-model.md). `path` MUST be
a folder path that appears somewhere in `:tab`'s tree (either the tab's own root, or a
`path` value returned by `/api/tree/:tab`). **The server MUST verify this itself** -
`path` is caller-supplied and reachable by anything that can reach `127.0.0.1:<port>`, so
containment is enforced here, not merely assumed of well-behaved callers (constitution
Principle II's Read-Only *Artifact* Viewer scope: this server exposes `_bmad`/
`_bmad-output`, not the rest of the filesystem).

```json
[
  { "name": "spec.md", "path": "/abs/.../spec.md", "type": "file", "size": 1024, "createdAt": "2026-09-07T10:00:00.000Z", "updatedAt": "2026-09-07T10:05:00.000Z" },
  { "name": "checklists", "path": "/abs/.../checklists", "type": "folder", "size": null, "createdAt": "2026-09-07T09:00:00.000Z", "updatedAt": "2026-09-07T09:00:00.000Z" }
]
```

- **200**: `path` exists and is a folder within `:tab`'s tree.
- **400**: `path` query parameter is missing.
- **403**: `path` is not equal to, or a descendant of, `:tab`'s own root folder path - the
  server rejects it without touching the filesystem outside that root.
- **404**: `path` is within `:tab`'s tree but no longer exists on disk (mirrors feature
  001's FR-012 "report the folder cannot be found" stance, applied here to a single folder
  rather than the whole cache), or `:tab` itself is neither `infra` nor `output`.

## `GET /` and other static asset paths

Serves `web/dist/`'s built frontend (`index.html`, JS/CSS bundles). Not JSON - plain
static file serving, with the built `index.html` returned for any unrecognized path so the
frontend's own routing (if any) can take over client-side.
