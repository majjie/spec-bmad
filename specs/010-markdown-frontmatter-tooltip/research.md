# Phase 0 Research: Markdown Frontmatter Tooltip

## 1. Where frontmatter detection/stripping happens

**Decision**: Entirely client-side, in a new pure module (`web/src/frontmatter.ts`),
called from `FileViewerDialog.tsx` only when the file's render mode is `"markdown"`.

**Rationale**: `src/server/routes/file.ts` currently serves file content completely
unmodified (confirmed: it reads the file, checks for binary content, and returns the raw
buffer as text) — there is no existing precedent anywhere in this app for the server
transforming content before serving it. Introducing one here, for a single dialog's
display concern, would be a bigger architectural change than the feature calls for, and
would mean the server needs to duplicate the "is this a markdown file?" decision
`getFileRenderMode` already makes client-side. Doing it client-side keeps the server
route exactly as simple as it already is, and the transformation lives right next to the
only place that needs it.

**Alternatives considered**: Server-side stripping in `getFileResponse` — rejected; no
existing precedent, would require the server to also know about render modes (currently a
purely client-side concept), and would strip content the server has no way to know is
even destined for Markdown rendering (the same route serves every file type).

## 2. `js-yaml` becomes a client-side dependency for the first time

**Decision**: Import `js-yaml`'s `load()` directly in `web/src/frontmatter.ts`, the same
function already used server-side (`src/navigator/sprint-status.ts`, feature 006).

**Rationale**: It's already a project dependency (`package.json`'s `dependencies`, not
`devDependencies`) — no `npm install` is needed, and Vite already resolves and bundles
from `node_modules` regardless of which `package.json` section a dependency sits under.
Using the exact same library the server already relies on for YAML parsing avoids
introducing a second YAML parser with potentially different tolerance/error behavior.

**Alternatives considered**: A hand-rolled minimal YAML-mapping parser scoped to just this
feature's needs — rejected; reinventing YAML parsing (even a subset) risks silently
mis-parsing real frontmatter (quoted strings, empty lists like `context: []`, etc.) that
`js-yaml` already handles correctly and consistently with the server side.

## 3. Frontmatter + marker-element detection algorithm

**Decision**: A single pure function, `stripFrontmatter(content: string)`, doing:

1. Require the content to start with a `---` line (no leading whitespace/content before
   it) — if not, return `{ body: content, preamble: null }` unchanged (FR-003/FR-004).
2. Find the next line that is exactly `---`, marking the end of the YAML block. If none
   exists, return unchanged (malformed/unterminated block — FR-004's tolerant fallback).
3. Parse the text between the two `---` lines with `js-yaml`'s `load()`. If it throws, or
   the result isn't a plain object (mapping), return unchanged (FR-004) — a YAML *scalar*
   or *list* at the top isn't this feature's frontmatter shape.
4. Everything after the closing `---` line is the remaining document. If (after skipping
   blank lines) it starts with an XML-like opening tag — `<tagName ...>` — capture the tag
   name and search the *rest* of the document for a `</tagName>` closing tag with the same
   name — the closing tag is not assumed to be near the opening tag or near the top of the
   file; it can follow an entire block of ordinary Markdown.
   - Both found: remove exactly those two tag lines; everything else (including the
     content between them) stays, in its original position (FR-002, Clarifications).
   - Only the opening tag found (no matching close): remove just that one line
     (Edge Cases' best-effort fallback).
   - No opening tag at all: nothing further to remove — the YAML block was the entire
     preamble.
5. Return `{ body: <remaining document with any matched tag lines removed>, preamble:
   <parsed YAML mapping> }`.

**Rationale**: A hand-rolled scan (not a general XML/HTML parser) is appropriate here —
this feature only ever needs to recognize one specific narrow shape (a single named
opening tag, optionally paired with a same-named closing tag), not arbitrary nested
markup. `js-yaml` does the actual YAML work; everything else is plain string/line
scanning, which keeps the module small and its behavior easy to specify exactly (see
data-model.md's derivation table).

**Alternatives considered**: A full XML parser (e.g. treating the marker element as real
markup to parse) — rejected as solving a problem this feature doesn't have: the tag is
never inspected for nested structure, only located and removed by name.

## 4. Preamble value stringification for the readout

**Decision**: A second pure helper, `stringifyPreambleValue(value: unknown): string` —
strings/numbers/booleans/null render via their natural text form; arrays and objects
render via `JSON.stringify(value)` (e.g. `context: []` → the literal text `[]`).

**Rationale**: FR-007 requires "a plain, readable form regardless of its underlying YAML
type" without prescribing an exact format — `JSON.stringify` is a simple, deterministic,
already-available way to render a nested value as readable text without writing a bespoke
formatter, and it degrades gracefully for the empty-list case the spec's own example
(`context: []`) shows.

**Alternatives considered**: Re-serializing back to YAML syntax for nested values —
rejected as unnecessary complexity for what the spec calls "a simple readout."

## 5. Info control: hover *and* click, in the existing close-button container

**Decision**: Add the info control inside `FileViewerDialog.tsx`'s existing floating
`Box` (the one currently holding only the close `IconButton`), as a sibling `IconButton`
using the `InfoOutlined` icon. Its readout is a controlled tooltip/popover — MUI's
`Tooltip` alone only opens on hover/focus, not click, so showing it on click too needs the
`open` state to be controlled explicitly (toggled on click, in addition to the built-in
hover behavior).

**Rationale**: FR-005 places it "in the same container" as the close control — reusing
that existing `Box` (rather than a new one) is the direct reading of that requirement, and
it already sits above every render mode's content (`zIndex: 10`), so the tooltip needs no
new stacking-context work. Supporting both hover and click (FR-007) needs a controlled
open state because MUI's default `Tooltip` trigger set doesn't include click.

**Alternatives considered**: A MUI `Popover` instead of a controlled `Tooltip` — either
would satisfy the requirements; `Tooltip` was chosen since it's simpler to also wire for
hover without hand-rolling that behavior, and this app has no existing `Popover` usage to
follow as precedent whereas hover-style disclosure (via `Tooltip`, e.g. the Action Items
tile's owner/jump icons, feature 008) is already an established pattern here.

## 6. Key/value color differentiation

**Decision**: Use two distinct MUI theme palette tokens for the readout's key and value
text (e.g. `info.light` for keys, `warning.light` for values, or similar) rather than
hardcoded hex colors.

**Rationale**: `web/src/theme.ts` defines only `palette.mode: "dark"` with no custom
palette — using theme tokens (not hex) keeps the readout consistent with the rest of this
app's theme-driven styling and would adapt automatically if the theme's palette is ever
extended or changed, rather than hardcoding colors that could clash with a future palette
change.

**Alternatives considered**: Hardcoded hex colors — rejected as inconsistent with every
other color reference in this codebase, which uses theme palette keys via `sx` props
(e.g. `color: "text.secondary"`, `bgcolor: "action.hover"`) rather than literal values.
