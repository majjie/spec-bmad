import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { parseActionItems } from "../../../src/navigator/action-items.js";

const PROJECT_ROOT = "/tmp/bmad-fixture-project";

test("parseActionItems() parses a fully-populated item", () => {
  const result = parseActionItems(
    {
      action_items: [
        {
          id: "item-1",
          epic: 1,
          action: "Do the thing",
          owner: "dev loop",
          status: "done",
          ref: "_bmad-output/implementation-artifacts/retro.md",
        },
      ],
    },
    PROJECT_ROOT,
  );
  assert.deepEqual(result, [
    {
      id: "item-1",
      epic: 1,
      action: "Do the thing",
      owner: "dev loop",
      status: "done",
      ref: "_bmad-output/implementation-artifacts/retro.md",
      resolvedPath: join(PROJECT_ROOT, "_bmad-output/implementation-artifacts/retro.md"),
    },
  ]);
});

test("parseActionItems() sets owner to null when missing, not an empty string", () => {
  const [item] = parseActionItems({ action_items: [{ id: "x" }] }, PROJECT_ROOT);
  assert.equal(item?.owner, null);
});

test("parseActionItems() sets status to null when missing", () => {
  const [item] = parseActionItems({ action_items: [{ id: "x" }] }, PROJECT_ROOT);
  assert.equal(item?.status, null);
});

test("parseActionItems() sets ref and resolvedPath to null when ref is missing", () => {
  const [item] = parseActionItems({ action_items: [{ id: "x" }] }, PROJECT_ROOT);
  assert.equal(item?.ref, null);
  assert.equal(item?.resolvedPath, null);
});

test("parseActionItems() sets epic to null when missing", () => {
  const [item] = parseActionItems({ action_items: [{ id: "x" }] }, PROJECT_ROOT);
  assert.equal(item?.epic, null);
});

test("parseActionItems() sets action to null when missing", () => {
  const [item] = parseActionItems({ action_items: [{ id: "x" }] }, PROJECT_ROOT);
  assert.equal(item?.action, null);
});

test("parseActionItems() treats a non-numeric epic value as missing", () => {
  const [item] = parseActionItems({ action_items: [{ id: "x", epic: "one" }] }, PROJECT_ROOT);
  assert.equal(item?.epic, null);
});

test("parseActionItems() returns [] when action_items is absent", () => {
  const result = parseActionItems({}, PROJECT_ROOT);
  assert.deepEqual(result, []);
});

test("parseActionItems() returns [] when action_items is not an array", () => {
  const result = parseActionItems({ action_items: "not an array" }, PROJECT_ROOT);
  assert.deepEqual(result, []);
});

test("parseActionItems() skips a non-object entry within the array", () => {
  const result = parseActionItems({ action_items: ["not an object", { id: "x" }] }, PROJECT_ROOT);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, "x");
});

test("parseActionItems() falls back to a synthetic array-index-based id when id is missing", () => {
  const result = parseActionItems({ action_items: [{}, {}] }, PROJECT_ROOT);
  assert.equal(result[0]?.id, "0");
  assert.equal(result[1]?.id, "1");
});

test("parseActionItems() falls back to a synthetic id when id is present but non-string", () => {
  const result = parseActionItems({ action_items: [{ id: 42 }] }, PROJECT_ROOT);
  assert.equal(result[0]?.id, "0");
});

test("parseActionItems() sorts every non-'done' item before every 'done' item, preserving file order within each group", () => {
  const result = parseActionItems(
    {
      action_items: [
        { id: "a", status: "done" },
        { id: "b", status: "open" },
        { id: "c" },
        { id: "d", status: "done" },
        { id: "e", status: "open" },
      ],
    },
    PROJECT_ROOT,
  );
  assert.deepEqual(
    result.map((item) => item.id),
    ["b", "c", "e", "a", "d"],
  );
});
