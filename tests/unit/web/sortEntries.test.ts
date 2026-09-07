import { test } from "node:test";
import assert from "node:assert/strict";
import { sortContentsEntries } from "../../../web/src/sortEntries.js";
import type { ContentsEntry } from "../../../web/src/api.js";

function entry(overrides: Partial<ContentsEntry>): ContentsEntry {
  return {
    name: "unnamed",
    path: `/${overrides.name ?? "unnamed"}`,
    type: "file",
    size: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const zebraFile = entry({ name: "zebra.md", type: "file", size: 30 });
const appleFile = entry({ name: "apple.md", type: "file", size: 10 });
const zFolder = entry({ name: "z-folder", type: "folder", size: null });
const aFolder = entry({ name: "a-folder", type: "folder", size: null });

test("sortContentsEntries() groups folders before files regardless of column", () => {
  const sorted = sortContentsEntries([zebraFile, aFolder, appleFile, zFolder], "size", "asc");

  assert.deepEqual(
    sorted.map((e) => e.type),
    ["folder", "folder", "file", "file"],
  );
});

test("sortContentsEntries() sorts each group by the given column, ascending", () => {
  const sorted = sortContentsEntries([zebraFile, aFolder, appleFile, zFolder], "name", "asc");

  assert.deepEqual(
    sorted.map((e) => e.name),
    ["a-folder", "z-folder", "apple.md", "zebra.md"],
  );
});

test("sortContentsEntries() reverses order within each group when direction is desc", () => {
  const sorted = sortContentsEntries([zebraFile, aFolder, appleFile, zFolder], "name", "desc");

  assert.deepEqual(
    sorted.map((e) => e.name),
    ["z-folder", "a-folder", "zebra.md", "apple.md"],
  );
});

test("sortContentsEntries() sorts by size, treating folders' null size as equal", () => {
  const sorted = sortContentsEntries([zebraFile, appleFile], "size", "asc");

  assert.deepEqual(
    sorted.map((e) => e.name),
    ["apple.md", "zebra.md"],
  );
});
