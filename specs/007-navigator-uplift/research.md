# Phase 0 Research: Navigator Tab Uplift

## 1. Defaulting to the Navigator tab, with a fallback

**Decision**: Initialize `activeTab` to `"navigator"` optimistically; once `fetchTabs()`
resolves, if `tabs.navigator` is `false`, explicitly switch to `"infra"`.

**Rationale**: Tab availability is only known after an async fetch resolves, so *some*
synchronous initial value is unavoidable. Defaulting optimistically to `"navigator"` (the
more common case - this tool exists specifically to make `_bmad-output` easier to
navigate) means projects that have it never see a flash of the wrong tab; projects that
don't see one brief flash while falling back, exactly mirroring the flash this app
already accepts elsewhere (e.g. a tab's tree/contents loading in before appearing).

**Alternatives considered**: Deferring `activeTab`'s first real value until `fetchTabs()`
resolves (e.g. `null` until then, with a loading state) - rejected as unnecessary
complexity for a one-frame flash that resolves as fast as the network allows, matching
this app's existing tolerance for equivalent brief loading states elsewhere.

## 2. The baseline history entry, generalized

**Decision**: Generalize `createBaselineState(infraRootPath: string)` to
`createBaselineState(tab: TabId, path: string)`. In `App.tsx`'s mount effect, establish
the baseline as soon as the *actual* default tab is known - `{tab: "navigator", path:
""}` immediately once `tabs.navigator` is `true` (no further fetch needed, since
Navigator's "nothing selected" state doesn't depend on its tree having loaded), or the
existing `{tab: "infra", path: tree.path}` once Infra's tree resolves, when Navigator
isn't available.

**Rationale**: The FR-012-era baseline-replaceState call (feature 002/003) was written
when Infra was unconditionally the default tab and its root path was the only thing
worth waiting for. Now that the default tab depends on availability, the function needs
to accept *which* tab's baseline it's building rather than assuming Infra - a minimal,
backward-compatible generalization (existing Infra-fallback callers just pass `"infra"`
explicitly).

**Alternatives considered**: A second, Navigator-specific function
(`createNavigatorBaselineState()`) - rejected; the two shapes are structurally identical
(`{tab, path}`), so a second function would just be `createBaselineState` with a
narrower signature, adding a distinction without a difference.

## 3. Status icons

**Decision**: Reuse `@mui/icons-material` (already a dependency since feature 002) - no
new library. A small internal mapping in `SprintStatusView.tsx` from the four recognized
status strings to an icon; a status outside that set renders no icon, per FR-005.

**Rationale**: This app has never needed an icon outside `@mui/icons-material` (folder
icons, the close icon); introducing a second icon library for four glyphs would be
needless, and the spec explicitly leaves exact glyph choice to implementation.

**Alternatives considered**: A dedicated `StatusIcon.tsx` component/module - rejected as
premature; the mapping is small, has exactly one caller (`SprintStatusView.tsx`), and
splitting it into its own file wouldn't make it any more reusable or testable - it's a
presentational lookup, not logic worth unit-testing on its own.

## 4. Where "Active Epic" is calculated

**Decision**: A new pure function, `calculateActiveEpic(epics: EpicStatusGroup[]):
string`, in `src/navigator/sprint-status.ts` (server-side) - called by `parseSprintStatus`
to populate a new `activeEpic` field directly on `SprintStatusSummary` (not as a sibling
of `epics`), since the user's own description calls it "a new calculated field in the
summary."

**Rationale**: `parseSprintStatus` already computes `epics` in file-declared order
server-side (feature 006); "Active Epic" is a pure derivation over that same array, with
no new data source. Keeping it in the same module keeps all sprint-status business logic
in one already-established, already-tested place, rather than splitting derivation across
a server-side module and a new client-side one for what's fundamentally the same feature
area. Placing it inside `SprintStatusSummary` (rather than as a top-level
`SprintStatusResult` field) means it flows through `SprintStatusView.tsx`'s existing
`SUMMARY_FIELDS`-driven rendering loop with no special-casing needed there.

**Alternatives considered**: Computing it client-side in `SprintStatusView.tsx` from the
already-fetched `epics` array - rejected; it would split sprint-status derivation logic
across two layers (server for epics/summary, client for Active Epic) for no benefit, and
would need its own test setup separate from `parseSprintStatus`'s existing one.

**Derivation** (directly from FR-009/FR-010, restated precisely):

```text
if epics.length === 0: "unknown"
else if every epic.status === "done": "All complete"
else if every epic.status === "backlog": "Not started"
else if some epic.status === "in-progress": that epic's epicKey (first match, file order)
else: "unknown"
```
