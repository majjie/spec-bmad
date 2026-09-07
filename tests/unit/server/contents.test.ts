import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildContentsEntries } from "../../../src/server/routes/contents.js";
import type { ArtifactNode } from "../../../src/artifacts/types.js";

test("buildContentsEntries() enriches direct children with stat metadata, size null for folders", async () => {
  const root = await mkdtemp(join(tmpdir(), "bmad-contents-"));
  try {
    await mkdir(join(root, "checklists"), { recursive: true });
    await writeFile(join(root, "spec.md"), "hello world");

    const folderNode: ArtifactNode = {
      name: "specs",
      path: root,
      type: "folder",
      children: [
        { name: "checklists", path: join(root, "checklists"), type: "folder", children: [] },
        { name: "spec.md", path: join(root, "spec.md"), type: "file" },
      ],
    };

    const entries = await buildContentsEntries(folderNode);
    const byName = new Map(entries.map((entry) => [entry.name, entry]));

    const folderEntry = byName.get("checklists");
    assert.ok(folderEntry);
    assert.equal(folderEntry.type, "folder");
    assert.equal(folderEntry.size, null);
    assert.ok(!Number.isNaN(Date.parse(folderEntry.createdAt)));
    assert.ok(!Number.isNaN(Date.parse(folderEntry.updatedAt)));

    const fileEntry = byName.get("spec.md");
    assert.ok(fileEntry);
    assert.equal(fileEntry.type, "file");
    assert.equal(fileEntry.size, "hello world".length);
    assert.ok(!Number.isNaN(Date.parse(fileEntry.createdAt)));
    assert.ok(!Number.isNaN(Date.parse(fileEntry.updatedAt)));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("buildContentsEntries() skips a child that no longer exists on disk rather than failing", async () => {
  const root = await mkdtemp(join(tmpdir(), "bmad-contents-"));
  try {
    await writeFile(join(root, "still-here.md"), "content");

    const folderNode: ArtifactNode = {
      name: "specs",
      path: root,
      type: "folder",
      children: [
        { name: "still-here.md", path: join(root, "still-here.md"), type: "file" },
        { name: "gone.md", path: join(root, "gone.md"), type: "file" },
      ],
    };

    const entries = await buildContentsEntries(folderNode);

    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.name, "still-here.md");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
