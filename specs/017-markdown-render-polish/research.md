# Research: Markdown Render Polish

## 1. Why the existing table styling draws no visible border

**Decision**: Add an explicit `border: "1px solid"` alongside the already-present
`borderColor: "divider"` on `& table, & th, & td`, plus `borderCollapse: "collapse"` on
`& table` so adjacent cells share a single line instead of doubling up.

**Rationale**: Directly inspected the three existing call sites
(`FileViewerDialog.tsx`, `PrdDetailView.tsx`, `ArchitectureDetailView.tsx`) - all three
already carry `"& table, & th, & td": { borderColor: "divider" }`. Setting only
`border-color` with no `border-style`/`border-width` set anywhere draws nothing at all
(the CSS default `border-style` is `none`), which is exactly the bug described (FR-001).
`border: "1px solid"` sets width+style+an initial color, and the existing `borderColor:
"divider"` declared after it in the same `sx` object overrides just the color - this
relies on MUI's `sx` emitting object keys in the order given, so `border` must be listed
before `borderColor` in the object literal.

**Alternatives considered**: A CSS shorthand combining both into one
`border: "1px solid var(--mui-palette-divider)"` string - rejected; this app has no
existing precedent for reaching into MUI's CSS custom-property names directly, and the
two-key form already used elsewhere in this app for the same divider color (e.g.
`borderBottom: 1, borderColor: "divider"` in `PrdDetailView.tsx`'s own tile-row divider)
is the established idiom to follow instead.

## 2. Giving a fenced code block its own background without breaking inline code spans

**Decision**: Add `"& pre": { backgroundColor: "action.hover", borderRadius: 1, p: 1.5,
overflowX: "auto" }` to the same `sx` object, alongside the two already-existing rules
`"& code": { backgroundColor: "action.hover", ... }` (inline pill background) and
`"& pre code": { backgroundColor: "transparent", padding: 0 }` (cancels the inline pill
style specifically for code nested inside a `<pre>`).

**Rationale**: Empirically traced this Markdown pipeline's actual HTML output (via the
same `remark-parse`/`remark-rehype` stack `react-markdown` uses internally) for three
cases: an inline `` `code` `` span, a fenced block with no declared language, and a fenced
block declaring `typescript`. Result: an inline span produces a bare `<code>` with **no**
wrapping `<pre>` and **no** `className`; a fenced block - language declared or not - is
**always** wrapped in `<pre>`, and only gets a `language-xxx` `className` on its `<code>`
when a language was actually declared. This means "is this code inside a `<pre>`" is the
*only* structural signal that distinguishes an inline span from a block, regardless of
whether that block declared a language - and CSS descendant selectors already encode
exactly that distinction natively, without any new JavaScript branch:
`& pre` (matches only real `<pre>` elements, i.e. only fenced blocks, never inline spans)
now supplies the block's own background - including for a block with no declared
language, satisfying FR-003 and FR-006's "no language" half. `& pre code`'s existing
override keeps an inline-styled `<code>` from doubling up its own pill background inside
that block. `& code`'s existing rule continues to apply only to genuine inline spans,
since nothing else changed there - satisfying FR-004 with zero new logic.

**Alternatives considered**: Overriding the `code` React component to inspect whether it's
"inline" - rejected once the actual HAST output confirmed there is no `inline` prop or
signal of any kind available to a `code` component override in this version of
`react-markdown` (v9's commonmark-based rewrite dropped the `inline` prop earlier
versions had); the only remaining signal would be inspecting the surrounding React tree
for a `pre` ancestor from inside `code` itself, which is exactly what CSS descendant
selectors already do far more simply.

## 3. Syntax highlighting a fenced block that declares a language

**Decision**: Override only the `code` component (not `pre`) inside `MarkdownContent`'s
own `ReactMarkdown`: match `className` against `/language-(\w+)/`; on a match, render
`<SyntaxHighlighter language={match[1]} style={vscDarkPlus} PreTag="div"
customStyle={{ margin: 0 }}>` (the same `Prism` export + `vscDarkPlus` theme
`FileViewerDialog.tsx`'s whole-file "syntax" mode already imports); otherwise render the
default `<code>` unchanged.

**Rationale**: Per research §2's empirical trace, a `className` match on `language-xxx`
occurs *only* for a fenced block whose fence actually declared a language - never for an
inline span (no wrapping `pre`, no `className` at all) and never for an undeclared-language
block (wrapped in `pre`, but still no `className`) - so this single regex check is already
a fully reliable, sufficient signal with no risk of misfiring on the other two cases;
no parent-detection logic is needed at all. `PreTag="div"` (a documented
`react-syntax-highlighter` prop, confirmed present in this project's installed
`@types/react-syntax-highlighter`) swaps the highlighter's own default internal `<pre>` for
a `<div>`, so the result nests as `<pre>` (react-markdown's own, still carrying research
§2's `& pre` background/padding) → `<div>` (the highlighter's own, carrying its own
`vscDarkPlus` background) - valid markup, and visually the highlighter's own dark
background simply paints over the outer `<pre>`'s lighter one with no visible seam,
exactly as this same nesting shape already renders without incident in this project's own
`FileViewerDialog.tsx` whole-file view (a `Box` wrapper there, a `<pre>` here - same
principle). `customStyle={{ margin: 0 }}` only removes the highlighter's own default
external margin so it sits flush inside the outer `<pre>`'s own padding, rather than
adding a visible gap.

**Alternatives considered**: Also overriding `pre` to strip react-markdown's own wrapper
down to a no-op whenever its child is going to be syntax-highlighted - rejected as
unnecessary complexity once the nesting was confirmed harmless; it would also require
`pre`'s own override to inspect its unrendered child element's `className` to decide,
adding a second, more fragile place encoding the exact same `language-xxx` check `code`
already performs.

## 4. What happens for an undeclared or unrecognized language

**Decision**: Rely on `react-syntax-highlighter`'s `Prism` (full-bundle) export's own
built-in behavior - passing a `language` string it doesn't recognize renders the content
as plain, uncolored text rather than throwing or omitting content, matching FR-006's
requirement. No language string ever reaches `SyntaxHighlighter` in the "no language
declared" case at all (research §2/§3: that case never matches `/language-(\w+)/` in the
first place, so it renders as a plain `<code>` inside the now-backgrounded `<pre>`, not
through `SyntaxHighlighter`).

**Rationale**: `FileViewerDialog.tsx`'s own existing comment already documents that this
project relies on the `Prism` (full-bundle, not "light") export specifically because it
auto-registers every supported language - the same export this feature reuses unmodified.
The unrecognized-language fallback (plain text, no error) is this library's own documented,
long-standing behavior for an unregistered language name, not new behavior this feature
introduces.

**Alternatives considered**: Pre-validating the declared language string against a known
list before ever calling `SyntaxHighlighter` - rejected as unnecessary; it would duplicate
a list `Prism`'s own registry already maintains internally, for a fallback the library
already provides.

## 5. Extracting `MarkdownContent.tsx`

**Decision**: See plan.md's own Structure Decision - a new shared component owning the
`Typography`/`ReactMarkdown` pair, this feature's table/pre/code `sx` fixes, and the new
`code` override, accepting an optional `components` prop merged in for each caller's own
additional overrides (anchor-id assignment).

**Rationale**: All three existing call sites already inline byte-for-byte identical `sx`
styling for this exact purpose - a real, already-existing 3-way duplication this feature
must change identically in every instance, clearing this project's own established bar for
extracting a shared piece (a genuine second/third consumer, not a hypothetical one - the
same reasoning `FrontmatterInfoControl`'s own extraction in feature 012 documented).

**Alternatives considered**: A shared constant/function pair (just the `sx` object, just
the `code` renderer) instead of a full component - rejected; every caller already pairs
these with the identical `Typography`/`ReactMarkdown` wrapper too, so splitting only part
of that pairing out would still leave three near-identical copies of the rest, achieving
less de-duplication for the same amount of touched files.
