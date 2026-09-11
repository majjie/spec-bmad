# Phase 0 Research: File Content Viewer

No `NEEDS CLARIFICATION` markers remain - the spec's clarification session already
resolved the one architecturally significant decision (history sync on X/Escape close).

## 1. New endpoint: `GET /api/file/:tab?path=...`

**Decision**: A new route, alongside `tabs.ts`/`tree.ts`/`contents.ts`, that: validates
`:tab`, requires `path`, reuses `src/server/tab-tree.ts`'s existing `isWithinRoot` check
(the same one `contents.ts` uses) to confirm `path` is within that tab's root, then reads
the file directly from disk (no need to consult the cached `ArtifactNode` tree - files
aren't part of `FolderTreeNode`, and the frontend only ever calls this for a path it just
saw in a `/api/contents` response).

**Rationale**: Mirrors `contents.ts`'s existing shape and reuses its security-critical
containment check exactly rather than re-implementing path validation a second time -
directly addresses this plan's Constraints section (containment is non-negotiable for a
content-reading endpoint).

**Alternatives considered**: Folding file-reading into the existing `/api/contents` route
(e.g., an extra query flag): rejected - conflates "list a folder's children" with "read
one file's bytes", two different response shapes and error conditions; a separate route
is clearer and matches the existing one-route-per-concern pattern.

## 2. Binary detection: null-byte scan, no library

**Decision**: Read the file as a `Buffer`. Scan up to the first 8000 bytes for a `0x00`
byte; if found, treat the file as binary and respond with a non-200 status instead of
content. Otherwise decode the (full) buffer as UTF-8 and return it as `text/plain`.

**Rationale**: This is the same lightweight heuristic long used by tools like `git` and
`grep` to distinguish text from binary - cheap, dependency-free, and reliable enough for
this tool's purpose (deciding whether to *attempt* a text view, not perfectly classifying
every file format). Reading with an explicit encoding upfront (rather than scanning first)
would silently turn invalid bytes into replacement characters instead of catching the
binary case per spec.md's Assumptions ("show an error/unsupported message instead of
attempting to display it").

**Alternatives considered**: A file-type-detection library (e.g. sniffing magic
bytes/MIME types): rejected - heavier than needed; this tool only needs a binary/text
split, not a full format catalog.

## 3. Markdown rendering: `react-markdown` + `remark-gfm`

**Decision**: Render `.md` files with `react-markdown`, with the `remark-gfm` plugin for
GitHub-flavored constructs (tables, checkboxes, strikethrough) - matching spec.md's
Assumption that Markdown rendering should cover what this tool's own artifacts use.

**Rationale**: `react-markdown` renders to React elements rather than injecting raw HTML
via `dangerouslySetInnerHTML`, so it doesn't execute embedded HTML/scripts from a
project's Markdown files by default - a meaningful safety property for a tool that renders
arbitrary project content. It's also the most widely-used React Markdown component,
consistent with this project's off-the-shelf-over-bespoke approach.

**Alternatives considered**: `marked`/`markdown-it` + `dangerouslySetInnerHTML`: rejected
- both produce a raw HTML string that would need injecting via
`dangerouslySetInnerHTML`, which executes any HTML/script tags embedded in the source
Markdown; `react-markdown` avoids that class of risk with no extra sanitization step.

## 4. Syntax + plain-text-with-line-numbers: one component, `react-syntax-highlighter`

**Decision**: Use `react-syntax-highlighter` for every non-Markdown file, varying only its
`language` prop: `"yaml"`/`"toml"`/`"python"` for the syntax-highlighted cases (FR-006),
and a plain/no-highlight language (e.g. `"text"`) for everything else (FR-007/FR-008/
FR-009) - always with `showLineNumbers` enabled.

**Rationale**: `react-syntax-highlighter` already supports line numbers and per-language
highlighting out of the box, so one component serves both "plain monospace with line
numbers" and "syntax-highlighted with line numbers" - they're the same rendering with a
different `language` value, not two separate things to build. This avoids hand-rolling a
line-numbered text view from scratch.

**Alternatives considered**: A bespoke `<pre>`-based line-numbered text renderer for the
plain-text cases, separate from a syntax-highlighter for the highlighted cases: rejected -
unnecessary duplication when one library already covers both.

**Known nuance**: `react-syntax-highlighter`'s lighter build registers languages
individually; TOML support needs its language definition explicitly registered (it isn't
in the same default set as YAML/Python in every bundle variant) - a task-level detail, not
a scope change.

## 5. Modal: MUI `Dialog` with custom sizing, not the built-in `fullScreen` prop

**Decision**: Use MUI's `Dialog` component, but override its paper sizing via `sx`
(`margin: '20px'`, computed width/height of `calc(100% - 40px)`, `maxWidth: 'none'`)
rather than MUI's built-in `fullScreen` prop, which renders edge-to-edge with no margin at
all.

**Rationale**: The spec calls for a specific 20px border around an otherwise full-viewport
dialog - `fullScreen` alone doesn't produce that; a small `sx` override on top of the
standard `Dialog` does, without needing a bespoke overlay component.

**Alternatives considered**: A hand-built full-viewport `<div>` overlay instead of MUI's
`Dialog`: rejected - `Dialog` already provides focus trapping, an accessible backdrop, and
the Escape-key handling this feature needs, matching the off-the-shelf-first approach used
throughout this project.

## 6. History integration: extend `NavigationState` with `openFile`

**Decision**: Add an optional `openFile?: string` field to feature 003's `NavigationState`
(now `{ tab, path, openFile? }`). Opening a file pushes a new entry with `openFile` set;
closing it - via the "X" icon, Escape, or Back - always calls `window.history.back()`
(the Clarifications session's resolution), letting the resulting `popstate` event (whose
restored state lacks `openFile`) clear the dialog. `statesEqual` is extended to compare
`openFile` too, so re-double-clicking the already-open file doesn't push a redundant entry.

**Rationale**: This keeps exactly one mechanism - the existing `popstate` handler from
feature 003 - as the single source of truth for what's currently shown, rather than
letting the dialog's open/closed state drift independently of the history stack (which is
precisely the desync the Clarifications session ruled out).

**Alternatives considered**: A separate, independent open/closed boolean not tied to
history, with manual `pushState`/`back()` calls kept in sync by hand at every close site:
rejected - this is exactly the "leave history as-is" option (B) the Clarifications session
rejected, since every new close path would risk drifting out of sync again.
