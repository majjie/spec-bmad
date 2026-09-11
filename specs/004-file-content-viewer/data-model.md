# Phase 1 Data Model: File Content Viewer

Derived from `spec.md` § Key Entities. Nothing here is persisted - file content is read
fresh from disk on each request (research.md § 1), and the open/closed dialog state lives
only in the browser's history stack for the session (research.md § 6).

## FileRenderMode

The concrete shape of the **File Content View** entity from spec.md, as returned by the
new pure `getFileRenderMode(filename)` function in `web/src/fileRenderMode.ts`.

```ts
type FileRenderMode =
  | { kind: "markdown" }
  | { kind: "syntax"; language: "yaml" | "toml" | "python" }
  | { kind: "plain" };
```

**Derivation rules** (in order, first match wins):

| Condition | Result |
|---|---|
| Filename is in the known-extensionless-files list (currently: `.gitignore`) | `{ kind: "plain" }` |
| Extension is `.md` | `{ kind: "markdown" }` |
| Extension is `.yaml` | `{ kind: "syntax", language: "yaml" }` |
| Extension is `.toml` | `{ kind: "syntax", language: "toml" }` |
| Extension is `.py` | `{ kind: "syntax", language: "python" }` |
| Extension is `.txt` or `.csv` | `{ kind: "plain" }` |
| Anything else | `{ kind: "plain" }` (FR-009 default) |

## FileContentResponse

Not a JSON envelope - `GET /api/file/:tab?path=...` (contracts/http-api-addendum.md)
returns the file's raw text as the response body (`Content-Type: text/plain`) on success,
or a bare non-200 status with no body on failure, matching the existing
`tabs`/`tree`/`contents` routes' minimalist error style.

| Outcome | Status |
|---|---|
| File read successfully, looks like text | 200, body = file contents |
| `:tab` invalid, or `path` missing | 400 |
| `path` not within `:tab`'s root | 403 |
| `path` doesn't exist, isn't a file, or otherwise can't be read | 404 |
| File read successfully but looks binary (research.md § 2) | 415 |

## NavigationState (extended)

Feature 003's `NavigationState` gains one optional field:

| Field | Type | Notes |
|---|---|---|
| `tab` | `TabId` | Unchanged from feature 003 |
| `path` | `string` | Unchanged from feature 003 |
| `openFile` | `string \| undefined` | Absolute path of the file currently shown in the dialog; absent/`undefined` when no dialog is open |

**Validation rules**:
- `statesEqual` (feature 003) is extended to also compare `openFile`, so a state with a
  file open is never mistaken for one without, or for a different open file.
- Every state pushed while opening a file carries the *same* `tab`/`path` the user was
  already on - opening a file never changes which folder/tab is considered active.

## FileDialogState (frontend-only)

Local UI state in `App.tsx`/`FileViewerDialog.tsx` for whatever `openFile` currently is;
not itself part of history (it's *derived* from `NavigationState.openFile` each time the
history stack changes).

| Field | Type | Notes |
|---|---|---|
| `path` | `string` | Mirrors `NavigationState.openFile` |
| `content` | `string \| null` | `null` while loading |
| `error` | `string \| null` | Set instead of `content` on a non-200 response (data-model.md's `FileContentResponse` outcomes) |
