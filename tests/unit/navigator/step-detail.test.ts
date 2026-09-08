import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveStepDisplay, matchSpecFileName } from "../../../src/navigator/step-detail.js";

test("deriveStepDisplay() splits a two-segment index from its descriptive text", () => {
  const result = deriveStepDisplay("1-1-run-the-command-and-reach-a-served-page");
  assert.deepEqual(result, { index: "1-1", title: "run the command and reach a served page" });
});

test("deriveStepDisplay() handles another two-segment index", () => {
  const result = deriveStepDisplay("1-2-establish-the-visual-foundation");
  assert.deepEqual(result, { index: "1-2", title: "establish the visual foundation" });
});

test("deriveStepDisplay() handles a story segment with a trailing letter", () => {
  const result = deriveStepDisplay("1-6a-walk-the-artifact-tree-safely");
  assert.deepEqual(result, { index: "1-6a", title: "walk the artifact tree safely" });
});

test("deriveStepDisplay() falls back to the raw key when no recognizable index exists", () => {
  const result = deriveStepDisplay("1-fix-a-thing-with-no-story-number");
  assert.deepEqual(result, {
    index: "1-fix-a-thing-with-no-story-number",
    title: "1-fix-a-thing-with-no-story-number",
  });
});

test("deriveStepDisplay() does not confuse epic 1's index with epic 10's", () => {
  const result = deriveStepDisplay("10-1-something");
  assert.deepEqual(result, { index: "10-1", title: "something" });
});

test("matchSpecFileName() returns null when no filename matches", () => {
  const result = matchSpecFileName("1-2", ["spec-1-1-run-the-command.md", "sprint-status.yaml"]);
  assert.equal(result, null);
});

test("matchSpecFileName() returns the single matching filename", () => {
  const result = matchSpecFileName("1-1", [
    "spec-1-1-run-the-command-and-reach-a-served-page.md",
    "spec-1-2-establish-the-visual-foundation.md",
  ]);
  assert.equal(result, "spec-1-1-run-the-command-and-reach-a-served-page.md");
});

test("matchSpecFileName() returns the alphabetically-first match when more than one matches", () => {
  const result = matchSpecFileName("1-6a", [
    "spec-1-6a-walk-the-artifact-tree-safely-v2.md",
    "spec-1-6a-walk-the-artifact-tree-safely-v1.md",
  ]);
  assert.equal(result, "spec-1-6a-walk-the-artifact-tree-safely-v1.md");
});

test("matchSpecFileName() never lets index '1-1' match a filename for index '1-10'", () => {
  const result = matchSpecFileName("1-1", ["spec-1-10-something.md"]);
  assert.equal(result, null);
});

test("matchSpecFileName() never lets index '1-1' match a filename for index '1-1a'", () => {
  const result = matchSpecFileName("1-1", ["spec-1-1a-something.md"]);
  assert.equal(result, null);
});
