# Phase 0 Research: Explorer UI Polish

No `NEEDS CLARIFICATION` markers remain in the Technical Context — the spec's clarification
session already resolved the two decisions (baseline history entry, reload behavior) that
would otherwise have shown up here.

## 1. Native History API instead of a router library

**Decision**: Use the browser's built-in `history.pushState`/`history.replaceState` and the
`popstate` event directly — no routing library (e.g. react-router).

**Rationale**: The app has exactly two dimensions of navigable state (active tab, selected
folder path) and, per the spec's Assumptions, explicitly does not need URL-based deep
linking/bookmarking. A router's job is mapping URLs to views; since this feature deliberately
keeps the URL unchanged (reload resets to default, per the clarification), there's no
URL-to-view mapping to manage — just "remember and restore two values." A full router would
be unjustified complexity for that.

**Alternatives considered**:
- `react-router` (or similar): rejected — its core value (URL-driven routing, nested
  routes) doesn't apply here since the URL isn't meant to encode state; adopting one just
  for its history-stack helpers would be a large dependency for a small need.

## 2. Baseline entry via `replaceState` on initial mount

**Decision**: Once the app's initial data load completes (Infra tab, root selected), call
`history.replaceState({ tab: "infra", path: rootPath }, "")` — tagging the page's own
existing load entry with our state object, not adding a new one.

**Rationale**: This directly implements FR-012 (Clarifications session): a single
subsequent navigation must still be undoable by Back. Using `replaceState` (not
`pushState`) for the baseline avoids creating an extra, otherwise-meaningless history entry
distinct from the page load itself.

**Alternatives considered**:
- No baseline entry (only push on real navigations): rejected per the Clarifications
  session — this would make Back after exactly one navigation leave the app, which reads
  as broken on the very first try.

## 3. History state shape and reload behavior

**Decision**: Each pushed/replaced entry's `state` object is `{ tab: TabId, path: string }`.
The app never reads `history.state` on a fresh mount — every load (including a reload)
always starts from the hardcoded default view (Infra tab, root selected), then establishes
the baseline entry per research.md § 2.

**Rationale**: Matches the Clarifications session directly: reload resets to default,
treated the same as a fresh load. Not reading `history.state` on mount is what makes this
simple — there's no "is this a real fresh load or a reload with stale state to restore"
branch to get wrong.

**Alternatives considered**:
- Restoring from `history.state` on mount: rejected per the Clarifications session — this
  is exactly the "restore last-viewed folder/tab" option that was explicitly declined.

## 4. Distinguishing user-initiated navigation from history-restored navigation

**Decision**: Route every tab/folder change through one function,
`navigate(tab, path, { fromHistory })`. When `fromHistory` is false (a real user click), it
also calls `history.pushState`. The `popstate` listener calls the same function with
`fromHistory: true`, applying the restored state without pushing again.

**Rationale**: Without this distinction, restoring state from a `popstate` event would
itself trigger another `pushState`, corrupting the stack (every Back press would create a
new forward entry instead of just moving the pointer). Funneling all changes through one
function is the standard, minimal way to avoid that.

**Alternatives considered**:
- Separate code paths for user clicks vs. popstate restoration, each managing React state
  independently: rejected — duplicates the "update active tab / selected path / fetch
  contents" logic twice, risking drift between the two paths.

## 5. Folder icon: `@mui/icons-material`

**Decision**: Use `@mui/icons-material`'s `Folder` icon component next to folder names, in
both the tree and the contents table.

**Rationale**: Consistent with feature 002's "off-the-shelf rather than bespoke" choice —
`@mui/icons-material` is MUI's own companion icon package, already visually matched to the
Material theme in use, with zero new runtime weight (build-time only, same as the rest of
MUI).

**Alternatives considered**:
- A custom SVG/emoji: rejected — inconsistent with the existing off-the-shelf-framework
  approach, and MUI already ships an appropriate icon.

## 6. Row striping and dividers: MUI `sx`, no new dependency

**Decision**: Remove `TableCell`'s default bottom border (`sx={{ '& .MuiTableCell-root':
{ borderBottom: "none" } }}` on `TableBody`, or per-cell) and shade alternating rows via
`sx={{ '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover } }}` on
`TableRow` — MUI's own documented pattern for a striped table.

**Rationale**: Purely a styling change; MUI already exposes exactly the hooks needed
(`sx`, theme-aware `action.hover`) without any additional library.

**Alternatives considered**: A dedicated "striped table" component/library: rejected —
unnecessary for a two-line `sx` change.
