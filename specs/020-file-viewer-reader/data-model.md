# Data Model: File Viewer as a Reading Surface

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-09-11

Entirely derived, in-memory, per-opening state. Nothing here is persisted, and no new data is
fetched - both derivations run over values the viewer already holds.

---

## 1. `FileViewerMeta` *(`web/src/fileViewerMeta.ts`)*

The header's contents, derived once per opening from the file's path and its declared
preamble.

| Field | Type | Derivation |
|---|---|---|
| `title` | `string` | The declared title when present and non-blank; otherwise derived from the filename (§ 2). **Never empty** - this is SC-001. |
| `status` | `string \| null` | The declared status, or `null` when absent or blank. |
| `type` | `string \| null` | The declared type, or `null`. |
| `created` | `string \| null` | The declared creation date, or `null`. |
| `fileName` | `string` | The final path segment, so the reader can always identify the file (FR-004). |

**Blank-is-absent rule**: every declared value passes through a check that treats a
non-string, an empty string, or whitespace as absent. This is not defensive padding - a
templated document that declares `title:` with no value is common in this corpus, and
honouring it literally produces the empty header this feature exists to remove (research § 2).

**Null means omit**, not "render empty". A `null` field is not rendered at all, with no label
and no placeholder (FR-003, SC-005). Unrecognised declared keys are ignored entirely - feature
010's affordance already exists for inspecting the full block.

---

## 2. `humanizeFileName` *(`web/src/fileViewerMeta.ts`)*

The one piece of genuine parsing in this feature.

```text
spec-2-2-render-sprint-status.md  →  "Render sprint status"
```

| Step | Rule |
|---|---|
| 1 | Drop the file extension. |
| 2 | Drop a leading specification prefix - the literal `spec-`, an epic number, and an optional step number that may carry a letter suffix (`1-6a`). |
| 3 | Split the remainder on dashes and underscores, discarding empties. |
| 4 | Sentence-case: capitalise the first word, lowercase the rest. |

**Fallbacks, in order**: if stripping the prefix leaves nothing, fall back to the
extension-less name; if splitting yields no words, return that name unchanged. The function
therefore **always returns a non-empty string** for a non-empty filename - which is what lets
`title` guarantee SC-001 without the caller checking.

**Sentence case, not title case**: these are sentences ("Render sprint status"), and title
case would capitalise words that read wrong as headings. It also avoids having to decide which
small words to skip.

**Deliberately not handled**: a filename matching no convention simply keeps all its words -
the prefix strip is a no-op and the result is still readable. That is the correct behavior
for a viewer that reads whatever it finds, rather than an unhandled case.

---

## 3. Panel size *(`web/src/fileViewerPaper.ts`)*

```ts
fileViewerPaperSize(expanded: boolean): {
  margin, width, maxWidth, height, maxHeight
}
```

| State | Shape |
|---|---|
| Reading | A bounded, centred panel - a fixed maximum width with a viewport-relative fallback so it shrinks rather than overflowing on a narrow window (FR-011) |
| Expanded | Nearly the full viewport, with a thin uniform margin so it still reads as a panel rather than a takeover |

Both states are expressed so the panel **never exceeds the viewport**, which is what keeps
FR-011 true without a separate narrow-window branch.

Returning a plain object of values, rather than applying styles, is what keeps this module
DOM-free and testable (plan.md, Structure Decision).

---

## 4. Content measure *(`web/src/components/MarkdownContent.tsx`)*

Two presentation parameters, no behavior change:

| Parameter | Values | Effect |
|---|---|---|
| `density` | `default` \| `reader` | `reader` applies the reading surface's spacing |
| `wide` | `boolean` | Releases the bounded measure so content uses the full panel |

| Panel state | `density` | `wide` | Prose measure |
|---|---|---|---|
| Reading | `reader` | `false` | Bounded to a comfortable measure (FR-005) |
| Expanded | `reader` | `true` | Released, content uses the room (FR-008) |
| In-page detail views | `default` | `false` | Unchanged from feature 017 |

**The coupling to watch**: the panel's size and the content's measure are decided in two
different modules from the *same* `expanded` flag, and they have to agree. An expanded panel
whose prose stays at the reading measure is a visible defect, and it is what results from
editing one and not the other (research § 6).

**Wide content is exempt**, unchanged from feature 017: a table or a code block wider than the
measure scrolls within its own block rather than widening the prose around it.

---

## 5. Viewer size state *(`web/src/components/FileViewerDialog.tsx`)*

| Property | Value |
|---|---|
| Type | boolean - reading size or expanded |
| Lifetime | Only while the viewer is open |
| Initial value | Always reading size |
| Reset | On close (FR-009, SC-004) |

Not persisted, in memory or otherwise, and deliberately so - see research § 4. The reset is on
**close** rather than on open, so the state is clean before the next opening begins rather
than being corrected during it.

The control exposes its pressed state to assistive technology, not just a label, because it is
a toggle rather than an action (FR-010).
