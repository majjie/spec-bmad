# Data Model: Architecture Detail View

This feature introduces no new derived-entity shapes - every entity it renders is an
existing one (feature 012/013), computed fresh each time the architecture view is opened,
nothing persisted or written back (Assumptions, constitution Principle II). The only shape
change is one new, backward-compatible optional parameter on an existing pure function.

## Requirement Code Reference / Prefix Group (reused, `web/src/prdIndex.ts`)

Unchanged shape (`RequirementCodeReference`, `PrefixGroup` - feature 012). What changes is
how the list is *produced*:

| Function | Change |
|---|---|
| `buildRequirementCodeIndex(content, styles?)` | Gains an optional second parameter, `styles: RequirementCodeStyle[]`, defaulting to `["bullet", "header"]` (every existing PRD call site's behavior is unchanged). `ArchitectureDetailView` calls it as `buildRequirementCodeIndex(body, ["header"])` - only `HEADER_PATTERN` is scanned, so a bullet-style occurrence like `**AD-1**` anywhere in an architecture document is never collected into the returned array at all (FR-005). |
| `groupByPrefix(references)` | Unchanged - it groups and sorts whatever reference array it's given, with no awareness of which style(s) produced it. |

**Derivation** (unchanged from feature 012, only the input style set narrows):

1. Scan the (frontmatter-stripped) document for each requested style's pattern.
2. Sort all matches by document position (`index`), combining styles when more than one is
   requested - for architecture, only `HEADER_PATTERN` is requested, so the combine step is
   a no-op.
3. Map each match to a `RequirementCodeReference` (`id`, `code`, `prefix`, `number`,
   `style`) exactly as before.

**Uniqueness**: Unchanged - the same code may still appear more than once (e.g. mentioned
in prose after its own heading); each occurrence gets its own distinct reference, same as
PRD's own documented behavior.

## Review File Reference (reused unmodified, `web/src/reviewFiles.ts`)

Unchanged shape and derivation (`buildReviewFileList`, feature 013). What changes is which
`ContentsEntry[]` is handed to it:

| Caller | Listing source |
|---|---|
| `PrdDetailView` | The PRD leaf folder's own direct contents (`fetchContents("output", entry.path)`). |
| `ArchitectureDetailView` | That folder's own `reviews` **subfolder's** contents (`fetchContents("output", `${entry.path}/reviews`)`) - a second, independent fetch (FR-011). |

A rejected fetch (the `reviews` subfolder doesn't exist) is caught and treated as an empty
listing, exactly like `PrdDetailView`'s own existing folder-contents-fetch-failure
handling - `buildReviewFileList([])` returns `[]`, and the reviews tile renders disabled
(FR-012), with no distinct "subfolder missing" state ever surfaced.

## Memory Log Entry / Segment (reused unmodified, `web/src/memlogParser.ts`)

Unchanged shape and derivation (`MemlogEntry`, `MemlogSegment`, `parseMemlogEntries`,
feature 013). What changes is the `prdReferences` argument `ArchitectureDetailView` passes
to `MemoryLogDialog` (which forwards it, unmodified, into `parseMemlogEntries`):

| Caller | `prdReferences` value | Effect |
|---|---|---|
| `PrdDetailView` | The currently-open PRD's own detected codes (`references` state). | A mentioned code matching one of those references renders as a clickable link. |
| `ArchitectureDetailView` | `[]` (always, unconditionally). | `Array.prototype.find` against an empty array never matches - every `"code"` segment's `referenceId` resolves to `null`, so it always renders as plain text (FR-019), regardless of what codes the architecture document itself contains. |

No new field, no new branch inside `parseMemlogEntries` or `MemlogSegmentView` - this
behavior falls directly out of logic that already exists.

## Architecture Document (view state, `ArchitectureDetailView.tsx`, not a new named type)

The same `LoadState` union `PrdDetailView.tsx` already declares locally (`loading` /
`no-file` / `error` / `ready`), re-declared identically in the new component (each
component owns its own copy, matching this codebase's established server/client and
per-component type-duplication convention rather than importing a shared type across
files that have no other coupling).

| Field | Type | Notes |
|---|---|---|
| `kind` | `"loading" \| "no-file" \| "error" \| "ready"` | Discriminant, identical semantics to `PrdDetailView`'s own. |
| `content` | `string` (when `kind === "ready"`) | The raw fetched content of `ARCHITECTURE-SPINE.md`, before frontmatter stripping. |
| `message` | `string` (when `kind === "error"`) | A fetch-failure message. |

**Derivation**: Fetch `${entry.path}/ARCHITECTURE-SPINE.md` via
`fetchFileContentOrNull("output", ...)` on mount and whenever `entry.path` changes;
`null` → `no-file` (FR-004), a thrown error → `error`, otherwise → `ready`.

## Relationship to existing entities

No existing entity's shape changes except `buildRequirementCodeIndex`'s new optional
parameter (backward-compatible: every existing call site with one argument is unaffected).
`ReviewFileReference`, `MemlogEntry`, and `MemlogSegment` are reused with zero code changes
- only their call sites' own inputs (which folder's listing, which `prdReferences` array)
differ.
