import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReviewFileList } from "../../../web/src/reviewFiles.js";
import type { ContentsEntry } from "../../../web/src/api.js";

function fileEntry(name: string, path: string): ContentsEntry {
  return { name, path, type: "file", size: 100, createdAt: "2026-01-01", updatedAt: "2026-01-01" };
}

function folderEntry(name: string, path: string): ContentsEntry {
  return { name, path, type: "folder", size: null, createdAt: "2026-01-01", updatedAt: "2026-01-01" };
}

test("buildReviewFileList() keeps only files starting with review- and ending in .md", () => {
  const entries = [
    fileEntry("review-adversarial.md", "/p/review-adversarial.md"),
    fileEntry("prd.md", "/p/prd.md"),
    fileEntry("addendum.md", "/p/addendum.md"),
    folderEntry("review-notdotmd", "/p/review-notdotmd"),
    fileEntry("review-something.txt", "/p/review-something.txt"),
  ];
  const result = buildReviewFileList(entries);
  assert.deepEqual(
    result.map((r) => r.fileName),
    ["review-adversarial.md"],
  );
});

test("buildReviewFileList() copies fileName and path directly from the matching entry", () => {
  const entries = [fileEntry("review-rubric.md", "/p/review-rubric.md")];
  const result = buildReviewFileList(entries);
  assert.equal(result[0]?.fileName, "review-rubric.md");
  assert.equal(result[0]?.path, "/p/review-rubric.md");
});

test("buildReviewFileList() derives a Title Case display name, dashes replaced with spaces", () => {
  const entries = [fileEntry("review-edge-cases.md", "/p/review-edge-cases.md")];
  const result = buildReviewFileList(entries);
  assert.equal(result[0]?.displayName, "Edge Cases");
});

test("buildReviewFileList() Title Cases a single-word name the same way", () => {
  const entries = [fileEntry("review-rubric.md", "/p/review-rubric.md")];
  const result = buildReviewFileList(entries);
  assert.equal(result[0]?.displayName, "Rubric");
});

test("buildReviewFileList() sorts by displayName, not raw fileName, when the two orders differ", () => {
  // "review-zulu.md" -> "Zulu" and "review-alpha-alpha.md" -> "Alpha Alpha": raw filenames
  // already happen to sort the same way here, so pick a pair where casing of the *raw*
  // name would sort differently from the derived, uniformly-cased display name.
  const entries = [fileEntry("review-Zulu.md", "/p/a.md"), fileEntry("review-alpha.md", "/p/b.md")];
  const result = buildReviewFileList(entries);
  assert.deepEqual(
    result.map((r) => r.displayName),
    ["Alpha", "Zulu"],
  );
});

test("buildReviewFileList() returns an empty array when there are no matching files", () => {
  assert.deepEqual(buildReviewFileList([fileEntry("prd.md", "/p/prd.md")]), []);
});

test("buildReviewFileList() returns an empty array for empty input", () => {
  assert.deepEqual(buildReviewFileList([]), []);
});
