# Phase 1 Data Model: Markdown Frontmatter Tooltip

## `FrontmatterResult` (`web/src/frontmatter.ts`)

```ts
interface FrontmatterResult {
  body: string;                        // content with the preamble (and any matched
                                        // marker tag lines) removed; unchanged from the
                                        // input when no preamble was detected
  preamble: Record<string, unknown> | null; // the parsed YAML mapping, or null when no
                                        // preamble was detected (FR-004/FR-006)
}

function stripFrontmatter(content: string): FrontmatterResult;
function stringifyPreambleValue(value: unknown): string;
```

`stripFrontmatter` is called from `FileViewerDialog.tsx` only when
`getFileRenderMode(fileNameOf(path)).kind === "markdown"` (FR-003) — for every other render
mode, content passes through completely untouched and `preamble` is never computed.

## Derivation rules (quick reference)

| Input | Output |
|---|---|
| Content doesn't start with a `---` line | `{ body: content, preamble: null }` — unchanged (FR-003) |
| A `---` line at the start, but no second `---` line closing it | Unchanged — malformed/unterminated block (FR-004) |
| Text between the two `---` lines doesn't parse as a YAML mapping (a YAML scalar, list, parse error, etc.) | Unchanged (FR-004) |
| A YAML mapping between the `---` lines, nothing recognizable after the closing `---` | YAML block removed; `preamble` = the parsed mapping (FR-001) |
| A YAML mapping, followed (after any blank lines) by an XML-like opening tag whose same-named closing tag is found later in the document | YAML block **and** both tag lines removed; content between and after the tags stays in place; `preamble` = the parsed mapping (FR-002, Clarifications) |
| A YAML mapping, followed by an opening tag with **no** matching closing tag found anywhere later | YAML block **and** the opening tag line removed; nothing else touched (Edge Cases) |
| The parsed YAML mapping has zero keys | Preamble is still detected and stripped, but treated as "no preamble" for the info control's visibility (FR-006) — `preamble` distinguishes this from `null` only internally; the component treats an empty object the same as `null` for FR-006's purposes |

## Frontend rendering shape (not a stored entity)

| Element | Rendered when | Content |
|---|---|---|
| Rendered Markdown body | Always (markdown mode) | `stripFrontmatter(content).body`, passed to the existing `ReactMarkdown` render path unchanged otherwise |
| Info control | `preamble !== null` and `Object.keys(preamble).length > 0` | An `IconButton` (`InfoOutlined`) alongside the existing close control, in the same container (FR-005/FR-006) |
| Readout (on hover or click) | Info control is hovered or clicked | One row per `Object.entries(preamble)`: the key in one color, `stringifyPreambleValue(value)` in a second, visually distinct color (FR-007/FR-008) |

The marker element's tag lines (and any attributes they carry, e.g. `reason="..."`) are
never surfaced anywhere — not in `body`, not in `preamble`, not in the readout (FR-009).
`preamble` only ever holds the YAML mapping's own key/value pairs.

## Non-goals carried over from spec.md's Assumptions

- No editing, copying-as-structured-data, or persisting of preamble values — display only.
- No new file-type detection — this only ever activates for whatever `getFileRenderMode`
  already classifies as `"markdown"`.
- Applies uniformly across every caller of `FileViewerDialog` (Infra, Output, Action Items,
  Epic Step Detail) — it's a change to the shared dialog, not any one caller.
