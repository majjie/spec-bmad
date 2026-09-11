import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveFileViewerMeta } from "../../../web/src/fileViewerMeta.js";

test("deriveFileViewerMeta prefers frontmatter title and status", () => {
  const meta = deriveFileViewerMeta("/project/_bmad-output/implementation-artifacts/spec-2-2-render-sprint-status.md", {
    title: "Render sprint status",
    status: "review",
    type: "feature",
    created: "2026-09-08",
  });
  assert.equal(meta.title, "Render sprint status");
  assert.equal(meta.status, "review");
  assert.equal(meta.type, "feature");
  assert.equal(meta.created, "2026-09-08");
  assert.equal(meta.fileName, "spec-2-2-render-sprint-status.md");
});

test("deriveFileViewerMeta falls back to a humanized filename when title is missing", () => {
  const meta = deriveFileViewerMeta("/x/spec-1-6a-walk-the-artifact-tree-safely.md", null);
  assert.equal(meta.title, "Walk the artifact tree safely");
  assert.equal(meta.status, null);
  assert.equal(meta.type, null);
  assert.equal(meta.created, null);
  assert.equal(meta.fileName, "spec-1-6a-walk-the-artifact-tree-safely.md");
});

test("deriveFileViewerMeta ignores non-string preamble fields", () => {
  const meta = deriveFileViewerMeta("/x/notes.md", {
    title: 42,
    status: ["review"],
    type: { kind: "feature" },
    created: true,
  });
  assert.equal(meta.title, "Notes");
  assert.equal(meta.status, null);
  assert.equal(meta.type, null);
  assert.equal(meta.created, null);
});
