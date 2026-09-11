# Quickstart: Verifying Light and Dark Appearance

**Feature**: [spec.md](./spec.md) | **Contract**: [contracts/ui-behavior.md](./contracts/ui-behavior.md)

Constitution Principle V requires UI changes to be verified in a running browser. Automated
coverage of the resolution rules is in `tests/unit/web/colorScheme.test.ts`; the token
mapping is guarded by `tests/unit/web/lightThemeTokens.test.ts`.

## Prerequisites

```bash
npm run typecheck && npm test && npm run build:web
npx tsx src/cli.ts examples/sample-project
```

> **Reset between runs**: clear the `bmad-browser:color-scheme` key from site data, or use a
> private window, to get back to "follow the system".

## A. Following the system (US1)

| # | Step | Expected |
|---|---|---|
| A1 | With no stored preference and the OS set to **light**, load the tool | The interface is light (FR-002, SC-001) |
| A2 | Set the OS to **dark**, with the tool still open | It follows immediately, no reload (FR-003) |
| A3 | Set the OS back to light | It follows back |
| A4 | Reload | Still following the system |

## B. Override and persistence (US2)

| # | Step | Expected |
|---|---|---|
| B1 | Read the appearance control's tooltip | It names the appearance it will switch **to** (FR-004) |
| B2 | Activate it | The interface switches immediately |
| B3 | Reload | The choice survives (FR-005, SC-002) |
| B4 | With an explicit **light** override, set the OS to dark | The interface stays light - the override wins (FR-005) |
| B5 | Inspect site data | `bmad-browser:color-scheme` holds `light` or `dark`, never `system` |
| B6 | Set the stored value to `banana` by hand and reload | Treated as follow-the-system, not applied blindly (FR-006) |
| B7 | Note what you cannot do | There is no way back to "follow the system" from the interface - the known limitation in the contract. Confirm it is still true before closing this as verified. |

## C. No flash (US3)

| # | Step | Expected |
|---|---|---|
| C1 | Store a **light** override; in devtools throttle the network to Slow 3G; hard-reload | No dark frame is painted at any point (FR-007, SC-003) |
| C2 | Repeat with a **dark** override on a light system | No light frame |
| C3 | Record the load in devtools' performance panel and step the filmstrip | The first frame already carries the correct appearance |
| C4 | Block site data entirely, reload | A defined appearance is applied; the page renders normally (FR-008) |

> C1-C3 are the rows most likely to regress silently, because the mechanism is a script in
> `web/index.html` that is easy to remove while "tidying up" and whose loss is invisible in
> any automated test this project has.

## D. Both appearances are legible (US4)

| # | Step | Expected |
|---|---|---|
| D1 | In light, inspect page and panel surfaces | Muted warm tones - **no pure white** (FR-010) |
| D2 | Compare the accents | Light uses its own accent, not a lightened dark accent |
| D3 | Run a contrast check over body text and focus rings in **both** appearances | AA in both (FR-011, SC-004) |
| D4 | Open sprint status in both and apply a greyscale filter | Every status stays distinguishable (FR-012, SC-005) |
| D5 | Look at panel elevation in light | Shadows read as soft and warm, not as the dark appearance's values on a light ground |
| D6 | Scroll a long document in both | The scrollbar and any native control match the appearance |
| D7 | Enable OS reduced motion and switch appearance | No animated transition (FR-013) |

## E. The architectural claim (SC-006)

| # | Step | Expected |
|---|---|---|
| E1 | Search the components under `web/src/components/` for raw colour literals | None - every colour resolves through a semantic token (FR-009) |
| E2 | Read the light block in `web/src/tokens.css` | It redefines **only** semantic names, never primitives |

---

## Done when

Every row passes and `npm run typecheck`, `npm test`, `npm run build:web` are clean.

**D3 has no automated equivalent.** Nothing in the suite checks contrast - the token test
asserts which primitive a semantic name points at, not what that looks like. If you skip D3,
SC-004 is unverified, regardless of a green test run.
