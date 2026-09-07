# Contract Addendum: HTTP API — `GET /api/file/:tab`

Extends feature 002's `contracts/http-api.md` (unchanged: `/api/tabs`, `/api/tree/:tab`,
`/api/contents/:tab` all stay exactly as they are). This is the one new route this feature
adds.

## `GET /api/file/:tab?path=<absolute-file-path>`

`:tab` is `infra` or `output`. Returns the file's raw text content.

- **200**: `path` is a real file, within `:tab`'s root, and its content does not look
  binary (research.md § 2). Response body is the file's contents; `Content-Type:
  text/plain; charset=utf-8`.
- **400**: `:tab` is neither `infra` nor `output`, or `path` is missing.
- **403**: `path` is not equal to, or a descendant of, `:tab`'s own root folder path —
  same containment rule `/api/contents/:tab` already enforces (feature 002).
- **404**: `:tab` is a recognized value (`infra`/`output`) but that tab's folder doesn't
  exist for the current project — same convention `/api/tree/:tab` already uses (feature
  002) for this exact condition, not 400. Also covers `path` not existing, not being a
  file (e.g. it's a directory), or otherwise not being readable (e.g. a permissions
  error).
- **415**: The file was read successfully but its content looks binary — the server
  declines to return it as text.

No request body. No other methods on this path.
