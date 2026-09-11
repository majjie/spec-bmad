# UI Behavior Contract: Light and Dark Appearance

**Feature**: [../spec.md](../spec.md) | **Data model**: [../data-model.md](../data-model.md)

No HTTP contract changes. This feature is entirely client-side.

## On load

- The appearance is resolved and applied **before the first paint**, by a synchronous step
  that runs ahead of the application bundle (FR-007, SC-003).
- With a stored preference of `light` or `dark`, that appearance is applied.
- With no stored preference, the system's requested appearance is applied.
- With an unreadable or unrecognised stored value, the system's appearance is applied
  (FR-006).
- If preference storage throws during this step, a defined appearance is still applied and
  the page renders normally (FR-008).

## The appearance control

- Lives in the header, alongside Help and reload.
- Its accessible name and tooltip describe the appearance it will switch **to**, so the
  effect is knowable before activation (FR-004).
- Activating it applies the opposite of what is currently shown and records it as an explicit
  preference - including when the reader was previously following the system.
- The change is immediate and does not require a reload.
- If preference storage is unavailable, the switch still takes effect for the session; only
  the memory of it is lost.

## Following the system

- While no explicit preference is stored, a change to the system appearance is reflected
  immediately, without a reload (FR-003).
- Once an explicit preference is stored, system changes do **not** override it (FR-005).

### Returning to "follow the system"

There is **no way to return to "follow the system" from the interface**, by design (FR-004a).
Once the reader has used the control they hold an explicit preference until they clear the
stored value by hand. The trade is a predictable control against a reachable third state, and
it is recorded here so the absence reads as a decision rather than an oversight. If it ever
needs solving, the answer is a menu, not a longer cycle.

## Appearance itself

- Every view renders correctly in both appearances (FR-001).
- Light uses muted warm surfaces - no pure white - and its own accent, not a lightened version
  of the dark accent (FR-010).
- Elevation is defined separately per appearance; light gets softer, warmer shadows rather
  than the dark appearance's values.
- The browser's own chrome - scrollbars, form controls - matches the appearance, via the
  native colour-scheme declaration as well as the token attribute.
- Body text and focus indicators meet AA contrast in **both** appearances (FR-011, SC-004).
- Every status stays distinguishable from the others in both appearances and in greyscale
  (FR-012, SC-005).
- No view defines an appearance-specific colour of its own; appearance is expressed purely by
  remapping the shared semantic tokens (FR-009, SC-006).

## Motion

- Switching appearance does not animate when the reader's system requests reduced motion
  (FR-013). The duration tokens are neutralised at source by feature 018's reduced-motion
  block, so this is not re-implemented per component.

## Explicitly unchanged

- What any view contains. This feature changes colour only - no layout, no content, no
  navigation behavior.
- Feature 018's token architecture. This feature adds a second mapping of the semantic tier;
  it does not alter the tier's names or the rule that components consume it exclusively.
