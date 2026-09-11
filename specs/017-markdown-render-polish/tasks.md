---

description: "Task list template for feature implementation"
---

# Tasks: Markdown Render Polish

**Input**: Design documents from `/specs/017-markdown-render-polish/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-behavior.md, quickstart.md

**Tests**: No new pure derivation logic is introduced - the fenced-block language match is
inline rendering logic directly analogous to this codebase's existing, already-untested
`STRONG_CODE_PATTERN`/`HEADING_CODE_PATTERN` inline checks. This whole feature is UI/
rendering, covered by manual `quickstart.md` verification instead, per constitution
Principle V's carve-out.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project with a bundled web frontend (per plan.md): frontend code lives under
`web/src/`.

---

## Phase 1: Setup

**Purpose**: Confirm the feature needs no new dependencies before touching any code.

- [X] T001 Verify `package.json` already lists `react-markdown`, `remark-gfm`, and
      `react-syntax-highlighter` (with `@types/react-syntax-highlighter`) - all already
      used by `FileViewerDialog.tsx`, `PrdDetailView.tsx`, and `ArchitectureDetailView.tsx`
      - and that no `npm install` is required.

**Checkpoint**: No dependency work needed - proceed directly to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extract the shared `MarkdownContent` component as a pure refactor (no
behavior change yet) so all three user stories can add their own fix to one file instead
of three.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Create `web/src/components/MarkdownContent.tsx`: accepts `content: string` and
      an optional `components?: Components` prop (from `react-markdown`); renders the
      existing `<Typography component="div" sx={...}><ReactMarkdown remarkPlugins=
      {[remarkGfm]} components={{ ...components }}>{content}</ReactMarkdown></Typography>`
      pair, copying the exact `sx` object currently duplicated in `FileViewerDialog.tsx`'s
      `"markdown"` mode, `PrdDetailView.tsx`, and `ArchitectureDetailView.tsx` - byte-for-
      byte, no fixes applied yet (those come in US1–US3) (data-model.md; plan.md
      Structure Decision).
- [X] T003 [P] In `web/src/components/FileViewerDialog.tsx`, replace the `"markdown"`
      mode's inlined `Typography`/`ReactMarkdown` block with
      `<MarkdownContent content={content} />` - no `components` prop, since this view has
      no anchor overrides of its own (depends on T002; contracts/ui-behavior.md).
- [X] T004 [P] In `web/src/components/PrdDetailView.tsx`, replace its own inlined
      `Typography`/`ReactMarkdown` block with `<MarkdownContent content={body}
      components={{ strong: ..., h3: ... }} />`, passing its existing `strong`/`h3`
      anchor-id renderer functions through unchanged (depends on T002; data-model.md
      "Merge rule").
- [X] T005 [P] In `web/src/components/ArchitectureDetailView.tsx`, replace its own inlined
      `Typography`/`ReactMarkdown` block with `<MarkdownContent content={body}
      components={{ h3: ... }} />`, passing its existing `h3` anchor-id renderer function
      through unchanged (depends on T002; data-model.md "Merge rule").
- [X] T006 Manually verify this refactor is a true no-op: open a PRD leaf, an architecture
      leaf, and a Markdown file via the Output/Infra tabs; confirm each renders exactly as
      it did before this feature (tables still borderless, code blocks still
      backgroundless) - proving T002–T005 changed nothing observable yet, only where the
      code lives (depends on T003, T004, T005).

**Checkpoint**: Foundation ready - all three user stories can now start, each adding one
fix to the single shared `MarkdownContent.tsx`.

---

## Phase 3: User Story 1 - See table structure clearly (Priority: P1) 🎯 MVP

**Goal**: Every table rendered from Markdown content shows a visible grid of cell borders,
using this tool's existing divider color (FR-001, FR-002).

**Independent Test**: Open a Markdown document containing a table with at least two
columns and two rows; confirm every cell shows a visible border on all sides, forming a
clear grid, in whichever view rendered it.

### Implementation for User Story 1

- [X] T007 [US1] In `MarkdownContent.tsx`, change `"& table, & th, & td": { borderColor:
      "divider" }` to `"& table, & th, & td": { border: "1px solid", borderColor:
      "divider" }` (key order matters - `border` first, `borderColor` after, so the color
      override applies per MUI's `sx` emission order), and add `"& table": {
      borderCollapse: "collapse" }` so shared cell edges render as one line, not doubled
      (depends on T002; research.md § 1; FR-001, FR-002).
- [X] T008 [US1] Manually verify quickstart.md Scenario 1 via Playwright: open the fixture
      table in a PRD leaf, an architecture leaf, and via the Output/Infra file browser;
      confirm a complete, non-doubled grid renders in all three.

**Checkpoint**: User Story 1 is fully functional and independently testable - every table
in every Markdown view now shows a visible grid.

---

## Phase 4: User Story 2 - See code blocks as distinct blocks (Priority: P1)

**Goal**: Every fenced code block - with or without a declared language - renders inside a
background clearly distinct from surrounding prose, without affecting inline code spans'
own existing background, and scrolls horizontally when too wide (FR-003, FR-004, FR-007).

**Independent Test**: Open a Markdown document containing a fenced code block with no
declared language; confirm it renders with a visible background distinct from the
surrounding text, while an inline, single-backtick code span elsewhere in the same
document keeps its own already-established, smaller inline background unaffected.

### Implementation for User Story 2

- [X] T009 [US2] In `MarkdownContent.tsx`, add `"& pre": { backgroundColor: "action.hover",
      borderRadius: 1, p: 1.5, overflowX: "auto" }` to the same `sx` object - the existing
      `"& code"` (inline pill background) and `"& pre code"` (cancels that pill background
      specifically inside a `<pre>`) rules are left unchanged, since together with this
      new rule they already correctly distinguish inline spans from blocks via CSS
      descendant selectors alone (depends on T007; research.md § 2; FR-003, FR-004,
      FR-007).
- [X] T010 [US2] Manually verify quickstart.md Scenario 2 (background distinct from prose;
      inline span unaffected) and Scenario 4 (an overly long code line scrolls
      horizontally within its own block, without widening the pane) via Playwright.

**Checkpoint**: User Stories 1 and 2 both work independently - tables show a grid, and
every fenced code block (regardless of declared language) shows its own background.

---

## Phase 5: User Story 3 - See syntax-highlighted code blocks (Priority: P2)

**Goal**: A fenced code block whose opening fence declares a recognized language renders
with syntax coloring matching this tool's existing whole-file code view, while an
undeclared or unrecognized language still degrades gracefully to User Story 2's plain
background (FR-005, FR-006).

**Independent Test**: Open a Markdown document containing a fenced code block whose
opening fence declares a recognized language; confirm its contents render with syntax
coloring matching how this tool already colors that same language when a file of that type
is opened directly.

### Implementation for User Story 3

- [X] T011 [US3] In `MarkdownContent.tsx`, import `{ Prism as SyntaxHighlighter }` from
      `react-syntax-highlighter` and `vscDarkPlus` from
      `react-syntax-highlighter/dist/esm/styles/prism` (the same imports
      `FileViewerDialog.tsx`'s "syntax" mode already uses), and add a `code` entry to the
      `components` object passed to `ReactMarkdown` - set *after* spreading the caller's
      own `components` prop, so it can never be overridden: match `className` against
      `/language-(\w+)/`; on a match, render `<SyntaxHighlighter language={match[1]}
      style={vscDarkPlus} PreTag="div" customStyle={{ margin: 0 }}>` around the code
      content (with its trailing newline stripped); otherwise render the default `<code>`
      unchanged (depends on T009; research.md §§ 3–4; FR-005, FR-006).
- [X] T012 [US3] Manually verify quickstart.md Scenario 3 via Playwright: a fenced block
      declaring a recognized language shows syntax coloring matching the same language
      opened directly from the Output/Infra tabs; a fenced block declaring an unrecognized
      language still shows only User Story 2's plain background, with no error and no
      missing content.

**Checkpoint**: All three user stories are independently functional - tables show a grid,
every code block shows a background, and a declared, recognized language gets syntax
coloring.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Confirm nothing regressed across the whole test suite and every other
existing Markdown-adjacent behavior.

- [X] T013 [P] Run the full `npm test` suite and confirm zero regressions (no test file
      changes are expected from this feature, per the Tests section above).
- [X] T014 Manually verify quickstart.md's Regression pass: the requirement-code index
      column's own anchor-jump behavior (PRD and architecture leaves) still works
      unaffected by the `MarkdownContent` extraction; `FileViewerDialog.tsx`'s `csv-grid`
      and `syntax` render modes are untouched; Sprint Status and every other existing
      Navigator selection still renders exactly as before (FR-009).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational only.
- **User Story 2 (Phase 4)**: Depends on Foundational; in practice also depends on User
  Story 1's T007 being already applied, since both edit the same `sx` object in
  `MarkdownContent.tsx` - complete Phase 3 before Phase 4, even though both are P1.
- **User Story 3 (Phase 5)**: Depends on Foundational; in practice also depends on User
  Story 2's T009 (the same file, same `sx` object, plus the new `components.code` entry
  sits logically on top of the plain-background rule it falls back to) - complete Phase 4
  before Phase 5.
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### Within Each Phase

- T002 before T003/T004/T005 (all three need the component to exist first).
- T003, T004, T005 touch three different files and can run in parallel once T002 exists.
- T006 (the no-op verification) depends on T003, T004, and T005 all being done.
- Within each user story, its own `sx`/`components` edit (T007/T009/T011) precedes its own
  verification task (T008/T010/T012).

### Parallel Opportunities

- T003, T004, and T005 (Foundational) touch different files and can run in parallel.
- T013 is independent of T014 and can run in parallel.
- Unlike most prior features in this codebase, User Stories 1–3 here are **not** safe to
  implement in parallel with each other despite being independently valuable and
  independently testable - all three edit the same `sx`/`components` object in the one
  shared `MarkdownContent.tsx` file, so they must be applied in sequence (P1 → P1 → P2) to
  avoid edit conflicts, even though nothing about their *value* to a reader depends on
  that order.

---

## Parallel Example: Foundational Phase

```bash
# Launch T003, T004, and T005 together once T002 exists - three different files:
Task: "Wire MarkdownContent into FileViewerDialog.tsx's markdown mode"
Task: "Wire MarkdownContent into PrdDetailView.tsx"
Task: "Wire MarkdownContent into ArchitectureDetailView.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories, and is itself a
   verified no-op).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: Run quickstart.md Scenario 1 independently.
5. This alone already fixes the more basic legibility problem (tables) across every
   Markdown view in this tool.

### Incremental Delivery

1. Setup + Foundational → the shared component exists, behavior unchanged (verified
   no-op).
2. User Story 1 → validate → tables show a grid everywhere (MVP).
3. User Story 2 → validate → every code block shows a background everywhere.
4. User Story 3 → validate → a declared, recognized language gets syntax coloring.
5. Polish → full regression pass.

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- This feature's three user stories are unusually tightly coupled to one shared file
  (`MarkdownContent.tsx`) compared to most prior features in this codebase - sequence
  them in priority order rather than assuming parallel team capacity.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
