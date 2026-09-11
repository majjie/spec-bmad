# Data Model: Light and Dark Appearance

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-09-11

All frontend, all derived except one persisted preference. Types live in
`web/src/colorScheme.ts`.

---

## 1. The persisted preference

| Property | Value |
|---|---|
| Storage key | `bmad-browser:color-scheme` |
| Stored values | `"light"`, `"dark"` - and **nothing**, meaning follow the system |
| Read contract | Anything other than `"light"` or `"dark"` reads as `"system"`, including a throwing storage backend (FR-006, FR-008) |
| Write contract | Fallible and silent - a refused write loses the memory, never the switch |

```ts
type ColorSchemePreference = "light" | "dark" | "system";
type ColorScheme = "light" | "dark";
```

> **This key is shared with the pre-paint script in `web/index.html`.** It is read in two
> places written in two languages-of-a-sort - the typed module and an inline script that must
> run before the bundle exists (research § 3). Changing the key, or the meaning of its values,
> requires changing both. This is the feature's one genuine coupling and the thing most likely
> to be broken by a future edit that looks local.

`"system"` is never written. It is the absence of a stored value, which is what keeps "never
chose" distinguishable from "chose, and it happens to match the system right now".

---

## 2. Resolution

```ts
resolveColorScheme(preference, systemScheme): ColorScheme
```

| Preference | System | Resolved |
|---|---|---|
| `light` | either | `light` |
| `dark` | either | `dark` |
| `system` | `light` | `light` |
| `system` | `dark` | `dark` |

**Invariant**: the result is never `"system"`. Everything downstream - the token attribute,
the theme factory, the toggle - consumes a resolved appearance only, so no component ever has
to know that a third preference exists.

**Override precedence (FR-005) is a property of this table**, not of the subscription that
feeds it: a system change updates `systemScheme`, and the first two rows ignore it. Keeping
precedence here rather than in the provider is what makes it testable without a browser.

---

## 3. Reading the system preference

```ts
readSystemColorScheme(media: { matches: boolean } | null): ColorScheme
```

Takes the media query **by injection**, and treats `null` as light. The parameter is
structural - the narrowest shape the function actually uses - so this module never names a
DOM type.

> This signature is the fix for the Principle IV violation recorded in plan.md. It previously
> defaulted to calling `window.matchMedia` itself, which made the module un-typecheckable
> outside a DOM configuration and, in practice, untested.

---

## 4. Applying the appearance

```ts
interface ColorSchemeRoot {
  dataset: { [key: string]: string | undefined };
  style: { colorScheme: string };
}

applyColorSchemeToDocument(scheme: ColorScheme, root: ColorSchemeRoot): void
```

Writes two things to the element it is given:

| What | Why |
|---|---|
| `data-color-scheme` attribute | The selector the light token block keys off |
| native `color-scheme` style | Tells the browser to match its own chrome - form controls, scrollbars - to the appearance |

`ColorSchemeRoot` is an element-shaped **structural** type, not `HTMLElement`, for the same
reason as § 3: it keeps the module DOM-free and makes the function testable against a plain
object. The real document element satisfies it.

Setting only the attribute and not the native style is a real bug with a subtle signature -
scrollbars and native controls stay in the other appearance - which is why both writes live
in one function rather than at the call site.

---

## 5. The toggle rule

```ts
nextColorSchemePreference(preference, systemScheme): ColorSchemePreference
```

Resolves the current appearance, then returns the **opposite** as an explicit preference.

| Current preference | System | Returns |
|---|---|---|
| `dark` | either | `light` |
| `light` | either | `dark` |
| `system` | `dark` | `light` |
| `system` | `light` | `dark` |

The last two rows are the important ones: activating the control while following the system
produces an explicit override, so the reader's first interaction always sticks. It never
returns `"system"` - see research § 2 for why the control is not a three-state cycle, and
`contracts/ui-behavior.md` for the resulting limitation.

---

## 6. Token remapping *(`web/src/tokens.css`)*

| Tier | Dark (default) | Light (`:root[data-color-scheme="light"]`) |
|---|---|---|
| Primitives | neutral charcoal ramp, amber accent | warm **sand** surfaces, cool **mist** chrome, **ink** text, **slate-blue** accent |
| Semantic | maps onto the charcoal/amber primitives | **remapped** onto the sand/mist/ink/slate-blue primitives |
| Components | consume semantic names only | *unchanged* |

The light block redefines **only** the semantic tier. That is the mechanism behind FR-009 and
SC-006: a third appearance would add one more block and touch no component.

Light additionally redefines the shadow tokens - a shadow tuned for a dark surface is
near-invisible on a light one, so elevation needs its own softer, warmer definition rather
than the same values.

---

## 7. Theme mapping *(`web/src/theme.ts`)*

`createAppTheme(mode: ColorScheme)` builds the component library's palette from the same
semantic names for whichever appearance it is given, and is rebuilt when the resolved
appearance changes. Both appearances share one typography and one component-defaults block -
only the palette differs, since nothing about type or spacing is appearance-dependent.
