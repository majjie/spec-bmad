import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ONBOARDING_STORAGE_KEY,
  TOUR_STEPS,
  shouldShowWelcome,
  writeOnboardingState,
  readOnboardingState,
} from "../../../web/src/onboarding/onboarding.js";

test("TOUR_STEPS has between 4 and 5 steps with unique anchors", () => {
  assert.ok(TOUR_STEPS.length >= 4 && TOUR_STEPS.length <= 5);
  const anchors = TOUR_STEPS.map((s) => s.anchor);
  assert.equal(new Set(anchors).size, anchors.length);
});

test("shouldShowWelcome is true only for pending", () => {
  assert.equal(shouldShowWelcome("pending"), true);
  assert.equal(shouldShowWelcome("skipped"), false);
  assert.equal(shouldShowWelcome("completed"), false);
});

test("read/write onboarding state round-trips via localStorage when available", () => {
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
    assert.equal(readOnboardingState(), "pending");
    writeOnboardingState("skipped");
    assert.equal(store.get(ONBOARDING_STORAGE_KEY), "skipped");
    assert.equal(readOnboardingState(), "skipped");
    writeOnboardingState("completed");
    assert.equal(readOnboardingState(), "completed");
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: original,
    });
  }
});

test("TOUR_STEPS orient on document sections, not a Products accordion", () => {
  assert.ok(TOUR_STEPS.some((s) => /requirements|architecture|documents/i.test(`${s.title} ${s.body}`)));
  assert.ok(!TOUR_STEPS.some((s) => /product accordion|products live here/i.test(`${s.title} ${s.body}`)));
});
