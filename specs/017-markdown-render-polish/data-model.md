# Data Model: Markdown Render Polish

This feature introduces no new data entities and no new derived data shape - it is a
rendering/styling change over content this tool already fetches through existing routes
(constitution Principle II). The only new "shape" is a component prop contract.

## `MarkdownContent` props (`web/src/components/MarkdownContent.tsx`)

| Field | Type | Notes |
|---|---|---|
| `content` | `string` | The already frontmatter-stripped Markdown body to render - identical to what each of the three existing call sites already passes to `ReactMarkdown` today. |
| `components` | `Components` (from `react-markdown`), optional | Caller-specific renderer overrides merged *underneath* this feature's own `code` override - used by `PrdDetailView.tsx` (`strong`+`h3`, feature 012) and `ArchitectureDetailView.tsx` (`h3` only, feature 016) for their own requirement-code anchor-id assignment; omitted entirely by `FileViewerDialog.tsx`, which has no anchors to assign. |

**Merge rule**: `MarkdownContent` always renders `<ReactMarkdown components={{ ...components, code: CodeBlock }}>` - a caller's own `components` object is spread first, then `code` is set unconditionally afterward, so no caller can ever override this feature's own code-block behavior (Assumptions: this feature owns code-block rendering universally, per FR-008).

## Fenced-block language detection (inline rendering logic, not a data entity)

`CodeBlock` (the `code` component override inside `MarkdownContent.tsx`) branches on a
single derived value at render time - not a stored or cached entity:

| Input | Derivation | Outcome |
|---|---|---|
| A `code` element's `className` | Matched against `/language-(\w+)/` | A match (only ever possible when the fenced block that produced this `code` element declared a language, research.md § 2) renders `SyntaxHighlighter`; no match (inline span, or an undeclared-language block) renders a plain `<code>`, letting the CSS rules in research.md §§ 1–2 supply its visual treatment instead. |

No reference/registry of "known languages" is introduced by this feature - an
unrecognized-but-declared language string is passed straight through to
`SyntaxHighlighter`, whose own existing behavior (research.md § 4) already degrades
gracefully.

## Relationship to existing entities

None of `RequirementCodeReference`, `PrefixGroup`, `ReviewFileReference`, `MemlogEntry`, or
any other existing derived entity changes shape. `PrdDetailView.tsx`'s and
`ArchitectureDetailView.tsx`'s own anchor-assignment renderer overrides (`strong`/`h3`)
are unchanged in behavior - only *where* they're declared moves, from being passed
directly to `ReactMarkdown`'s own `components` prop to being passed through
`MarkdownContent`'s `components` prop instead.
