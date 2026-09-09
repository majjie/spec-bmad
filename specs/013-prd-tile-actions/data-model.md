# Data Model: PRD Tile Actions

This feature introduces two new derived entities, both computed fresh each time the PRD
view (or, for the second, the memory log dialog) is opened — nothing here is persisted or
written back (Assumptions, constitution Principle II).

## Review File Reference

One detected `review-*.md` file within the currently-viewed PRD folder.

| Field | Type | Notes |
|---|---|---|
| `fileName` | `string` | The raw filename on disk, e.g. `"review-edge-cases.md"`. |
| `path` | `string` | The file's full path, passed to `onOpenFile` when selected. Copied directly from the matching `ContentsEntry.path` (already an accurate absolute path, server-populated from the real scanned artifact tree) — never reconstructed via string concatenation, avoiding an unnecessary rebuild of a path the fetched data already carries. |
| `displayName` | `string` | The derived friendly name, e.g. `"Edge Cases"` — `review-` prefix removed, every `-` replaced with a space, Title Case applied (FR-003, Clarifications). |

**Derivation** (`buildReviewFileList` in `web/src/reviewFiles.ts`, pure and test-first):

1. From the PRD folder's `ContentsEntry[]` (already fetched via `fetchContents`), keep
   only entries where `type === "file"`, `name` starts with `"review-"`, and `name` ends
   with `".md"`.
2. For each, copy `fileName`/`path` straight from that entry's own `name`/`path` and derive
   `displayName` from `fileName` per the transform above.
3. Sort the resulting list ascending by `displayName` (FR-004) — not by raw `fileName`,
   since the two can diverge once casing/prefix transforms are applied.

**Uniqueness**: Keyed by `fileName`, which is already unique within one folder by
filesystem construction; no additional identity handling needed.

## Memory Log Entry

One top-level bullet point from `.memlog.md`, after its own YAML frontmatter has already
been stripped by the existing `stripFrontmatter()` (FR-011).

| Field | Type | Notes |
|---|---|---|
| `category` | `string \| null` | The parenthetical word from the bullet's leading text, capitalized (e.g. `"Decision"`), or `null` when the leading text didn't match that single-parenthetical-word shape (Edge Cases) — in which case the whole bullet is `segments` instead. |
| `segments` | `MemlogSegment[]` | The bullet's body text (everything after the category, if one was found), split into plain-text and requirement-code pieces in original order. |

### Memlog Segment

| Field | Type | Notes |
|---|---|---|
| `kind` | `"text" \| "code"` | Discriminant. |
| `value` | `string` | Present when `kind === "text"` — a literal run of plain text, rendered as-is (FR-014, Clarifications: no inline Markdown parsing). |
| `text` | `string` | Present when `kind === "code"` — the matched code's exact source text, e.g. `"FR-76"`. |
| `referenceId` | `string \| null` | Present when `kind === "code"` — the id of the matching `RequirementCodeReference` in the currently-open PRD (its *first* occurrence in document order, per `Array.prototype.find` over an already document-ordered array), or `null` when no such code exists in that PRD (FR-016/FR-017). A `"code"` segment with `referenceId === null` renders as plain text, not a link. |

**Derivation** (`parseMemlogEntries(body, prdReferences)` in `web/src/memlogParser.ts`,
pure and test-first):

1. Split `body` into lines; each non-blank line whose first character is `-` followed by a
   space begins one new entry (bullet-per-line — no multi-line bullet continuation is
   attempted, research.md § 5).
2. For each entry's raw text (with the leading `- ` marker removed): if it matches
   `/^\(([a-zA-Z]+)\)\s*/`, set `category` to that word, capitalized, and continue parsing
   the remainder as the entry's body; otherwise `category` is `null` and the entire line's
   text is the body (Edge Cases).
3. Scan the body for the shared requirement-code shape (`REQUIREMENT_CODE_PATTERN`,
   exported from `prdIndex.ts` — a bare inline match, unlike the PRD's own `**bold**`/
   `### heading`-wrapped detection) and split the body into an ordered sequence of `"text"`
   and `"code"` segments accordingly.
4. For each `"code"` segment, look up its matched text against `prdReferences` (by exact
   `code` string equality) via `Array.prototype.find` — first match wins — setting
   `referenceId` to that reference's `id`, or `null` if none matched (FR-015–FR-017,
   Clarifications: every matching code in a bullet is resolved independently, not only the
   first one in that bullet).

## Relationship to existing entities

`Requirement Code Reference` (feature 012, `web/src/prdIndex.ts`) is reused unmodified as
`parseMemlogEntries`'s second argument — the currently-open PRD's own already-computed
index, passed down from `PrdDetailView`'s existing `references` state. No existing entity
changes shape; `prdIndex.ts` gains one new exported constant (the shared requirement-code
regex fragment) alongside its existing exports.
