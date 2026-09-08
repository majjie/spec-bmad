import { test } from "node:test";
import assert from "node:assert/strict";
import { createBaselineState, statesEqual } from "../../../web/src/navigationHistory.js";

test("createBaselineState() builds the Infra/root baseline state (FR-012)", () => {
  const state = createBaselineState("infra", "/project/_bmad");

  assert.deepEqual(state, { tab: "infra", path: "/project/_bmad" });
});

test("createBaselineState() builds the Navigator baseline state (feature 007 FR-001)", () => {
  const state = createBaselineState("navigator", "");

  assert.deepEqual(state, { tab: "navigator", path: "" });
});

test("statesEqual() returns true when tab and path both match", () => {
  const a = { tab: "infra" as const, path: "/project/_bmad" };
  const b = { tab: "infra" as const, path: "/project/_bmad" };

  assert.equal(statesEqual(a, b), true);
});

test("statesEqual() returns false when the path differs", () => {
  const a = { tab: "infra" as const, path: "/project/_bmad" };
  const b = { tab: "infra" as const, path: "/project/_bmad/specs" };

  assert.equal(statesEqual(a, b), false);
});

test("statesEqual() returns false when the tab differs", () => {
  const a = { tab: "infra" as const, path: "/project/_bmad" };
  const b = { tab: "output" as const, path: "/project/_bmad" };

  assert.equal(statesEqual(a, b), false);
});

test("statesEqual() returns true when both states lack openFile", () => {
  const a = { tab: "infra" as const, path: "/project/_bmad" };
  const b = { tab: "infra" as const, path: "/project/_bmad" };

  assert.equal(statesEqual(a, b), true);
});

test("statesEqual() returns true when both states have the same openFile", () => {
  const a = { tab: "infra" as const, path: "/project/_bmad", openFile: "/project/_bmad/spec.md" };
  const b = { tab: "infra" as const, path: "/project/_bmad", openFile: "/project/_bmad/spec.md" };

  assert.equal(statesEqual(a, b), true);
});

test("statesEqual() returns false when only one state has openFile set", () => {
  const a = { tab: "infra" as const, path: "/project/_bmad" };
  const b = { tab: "infra" as const, path: "/project/_bmad", openFile: "/project/_bmad/spec.md" };

  assert.equal(statesEqual(a, b), false);
});

test("statesEqual() returns false when openFile is set to different paths", () => {
  const a = { tab: "infra" as const, path: "/project/_bmad", openFile: "/project/_bmad/spec.md" };
  const b = { tab: "infra" as const, path: "/project/_bmad", openFile: "/project/_bmad/plan.md" };

  assert.equal(statesEqual(a, b), false);
});
