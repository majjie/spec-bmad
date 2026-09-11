import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COLOR_SCHEME_STORAGE_KEY,
  clearColorSchemePreference,
  nextColorSchemePreference,
  readColorSchemePreference,
  resolveColorScheme,
  writeColorSchemePreference,
  type ColorScheme,
} from "../../../web/src/colorScheme.js";

function withLocalStorage(run: (store: Map<string, string>) => void): void {
  const store = new Map<string, string>();
  const original = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    },
  });
  try {
    run(store);
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: original,
    });
  }
}

test("readColorSchemePreference returns system when storage is empty", () => {
  withLocalStorage(() => {
    clearColorSchemePreference();
    assert.equal(readColorSchemePreference(), "system");
  });
});

test("write/read color scheme preference round-trips light and dark", () => {
  withLocalStorage((store) => {
    clearColorSchemePreference();
    writeColorSchemePreference("light");
    assert.equal(readColorSchemePreference(), "light");
    writeColorSchemePreference("dark");
    assert.equal(readColorSchemePreference(), "dark");
    assert.equal(store.get(COLOR_SCHEME_STORAGE_KEY), "dark");
  });
});

test("readColorSchemePreference ignores invalid stored values", () => {
  withLocalStorage((store) => {
    store.set(COLOR_SCHEME_STORAGE_KEY, "neon");
    assert.equal(readColorSchemePreference(), "system");
  });
});

test("resolveColorScheme maps system to the provided platform scheme", () => {
  assert.equal(resolveColorScheme("system", "light"), "light");
  assert.equal(resolveColorScheme("system", "dark"), "dark");
  assert.equal(resolveColorScheme("light", "dark"), "light");
  assert.equal(resolveColorScheme("dark", "light"), "dark");
});

test("resolveColorScheme never returns system as the effective scheme", () => {
  const resolved: ColorScheme = resolveColorScheme("system", "light");
  assert.notEqual(resolved, "system");
});

test("nextColorSchemePreference flips the resolved appearance to the other mode", () => {
  assert.equal(nextColorSchemePreference("dark", "light"), "light");
  assert.equal(nextColorSchemePreference("light", "dark"), "dark");
  assert.equal(nextColorSchemePreference("system", "dark"), "light");
  assert.equal(nextColorSchemePreference("system", "light"), "dark");
});
