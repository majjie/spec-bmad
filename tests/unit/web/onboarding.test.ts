import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ONBOARDING_STORAGE_KEY,
  TOUR_STEPS,
  resolvableTourSteps,
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

test("resolvableTourSteps drops steps whose anchor is not on the page", () => {
  // `nav-overview` is absent whenever the sidebar's curated section is - a project with
  // `_bmad` but no `_bmad-output`, which is exactly when a first-run visitor is offered
  // the tour.
  const present = new Set(["sidebar", "main-stage", "refresh", "help"]);
  const steps = resolvableTourSteps(TOUR_STEPS, (anchor) => present.has(anchor));

  assert.ok(!steps.some((step) => step.anchor === "nav-overview"));
  assert.equal(steps.length, TOUR_STEPS.length - 1);
  assert.deepEqual(
    steps.map((step) => step.anchor),
    TOUR_STEPS.filter((step) => step.anchor !== "nav-overview").map((step) => step.anchor),
  );
});

test("resolvableTourSteps keeps every step when all anchors resolve", () => {
  const steps = resolvableTourSteps(TOUR_STEPS, () => true);
  assert.deepEqual(steps, [...TOUR_STEPS]);
});

test("resolvableTourSteps falls back to every step rather than none", () => {
  // A tour that shows imperfectly beats a Help button that silently does nothing.
  const steps = resolvableTourSteps(TOUR_STEPS, () => false);
  assert.equal(steps.length, TOUR_STEPS.length);
});

test("the tour bridges the Requirements section to the PRD documents inside it", () => {
  // The sidebar section is "Requirements" while leaves annotate as "latest PRD"; the tour
  // is where a newcomer learns those are the same thing.
  const blob = TOUR_STEPS.map((step) => `${step.title} ${step.body}`).join(" ");
  assert.match(blob, /Requirements/);
  assert.match(blob, /PRD/);
  assert.match(blob, /Requirements holds this project's PRDs/);
});
