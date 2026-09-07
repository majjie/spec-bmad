import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scan } from "../../../src/artifacts/scan.js";
import type { ArtifactNode } from "../../../src/artifacts/types.js";

function findChild(node: ArtifactNode, name: string): ArtifactNode | undefined {
  return node.children?.find((child) => child.name === name);
}

test("scan() builds a tree matching the fixture's real layout", async () => {
  const root = await mkdtemp(join(tmpdir(), "bmad-scan-"));
  try {
    await mkdir(join(root, "specs"), { recursive: true });
    await writeFile(join(root, "specs", "spec.md"), "content");
    await writeFile(join(root, "top-level.md"), "content");

    const tree = await scan(root);

    assert.equal(tree.type, "folder");
    assert.equal(tree.path, root);

    const specsNode = findChild(tree, "specs");
    assert.ok(specsNode, "expected a 'specs' child");
    assert.equal(specsNode.type, "folder");

    const specMdNode = findChild(specsNode, "spec.md");
    assert.ok(specMdNode, "expected 'specs/spec.md'");
    assert.equal(specMdNode.type, "file");
    assert.equal(specMdNode.children, undefined);

    const topLevelNode = findChild(tree, "top-level.md");
    assert.ok(topLevelNode, "expected 'top-level.md'");
    assert.equal(topLevelNode.type, "file");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("scan() excludes symlinked files and folders entirely", async () => {
  const root = await mkdtemp(join(tmpdir(), "bmad-scan-"));
  try {
    await mkdir(join(root, "real-folder"), { recursive: true });
    await writeFile(join(root, "real-file.md"), "content");
    await symlink(join(root, "real-file.md"), join(root, "linked-file.md"));
    await symlink(join(root, "real-folder"), join(root, "linked-folder"));

    const tree = await scan(root);

    assert.equal(findChild(tree, "linked-file.md"), undefined);
    assert.equal(findChild(tree, "linked-folder"), undefined);
    assert.ok(findChild(tree, "real-file.md"), "real file should still be present");
    assert.ok(findChild(tree, "real-folder"), "real folder should still be present");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("scan() never reads file contents", async () => {
  const root = await mkdtemp(join(tmpdir(), "bmad-scan-"));
  try {
    // A file whose contents would fail if ever parsed/read as UTF-8 text.
    await writeFile(join(root, "binary.md"), Buffer.from([0xff, 0xfe, 0x00, 0x01]));

    const tree = await scan(root);

    const node = findChild(tree, "binary.md");
    assert.ok(node);
    assert.equal(node.type, "file");
    assert.ok(!("contents" in node), "ArtifactNode must never carry file contents");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
