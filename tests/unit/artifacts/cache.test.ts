import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildProjectRoot } from "../../../src/artifacts/project-root.js";
import { createHierarchyCache } from "../../../src/artifacts/cache.js";

async function makeProjectFixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "bmad-cache-"));
  await mkdir(join(root, "_bmad", "specs"), { recursive: true });
  await writeFile(join(root, "_bmad", "specs", "spec.md"), "content");
  return root;
}

function findByName(names: string[], tree: { name: string; children?: any[] }): boolean {
  if (names.length === 0) return true;
  if (tree.name !== names[0]) {
    return (tree.children ?? []).some((child) => findByName(names, child));
  }
  if (names.length === 1) return true;
  return (tree.children ?? []).some((child) => findByName(names.slice(1), child));
}

test("HierarchyCache.get() builds on first call and reuses the cached result on the second", async () => {
  const projectPath = await makeProjectFixture();
  try {
    const root = await buildProjectRoot(projectPath);
    assert.ok(root);

    const cache = createHierarchyCache();
    const first = await cache.get(root);
    assert.equal(first.length, 1, "only _bmad exists for this fixture");
    assert.ok(findByName(["specs", "spec.md"], first[0]!));

    // Add a file on disk after the first get(); a fresh cache must NOT pick it up,
    // because it must not re-scan the file system until invalidated (FR-004).
    await writeFile(join(projectPath, "_bmad", "specs", "new-file.md"), "content");

    const second = await cache.get(root);
    assert.deepEqual(second, first, "second get() must return the identical cached tree");
    assert.equal(
      findByName(["specs", "new-file.md"], second[0]!),
      false,
      "an uninvalidated cache must not reflect a post-scan disk change",
    );
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("HierarchyCache.get() resolves one ArtifactNode per existing _bmad/_bmad-output folder", async () => {
  const projectPath = await mkdtemp(join(tmpdir(), "bmad-cache-"));
  try {
    await mkdir(join(projectPath, "_bmad"), { recursive: true });
    await mkdir(join(projectPath, "_bmad-output"), { recursive: true });

    const root = await buildProjectRoot(projectPath);
    assert.ok(root);

    const cache = createHierarchyCache();
    const trees = await cache.get(root);

    assert.equal(trees.length, 2);
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("invalidate() followed by get() rebuilds and reflects an added file (FR-005, SC-002)", async () => {
  const projectPath = await makeProjectFixture();
  try {
    const root = await buildProjectRoot(projectPath);
    assert.ok(root);

    const cache = createHierarchyCache();
    const first = await cache.get(root);
    assert.equal(findByName(["specs", "new-file.md"], first[0]!), false);

    await writeFile(join(projectPath, "_bmad", "specs", "new-file.md"), "content");
    cache.invalidate(root);

    const second = await cache.get(root);
    assert.ok(
      findByName(["specs", "new-file.md"], second[0]!),
      "rebuilt tree must include the file added since the last scan",
    );
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("invalidate() followed by get() reflects a removed file (FR-005, SC-002)", async () => {
  const projectPath = await makeProjectFixture();
  try {
    const root = await buildProjectRoot(projectPath);
    assert.ok(root);

    const cache = createHierarchyCache();
    const first = await cache.get(root);
    assert.ok(findByName(["specs", "spec.md"], first[0]!));

    await unlink(join(projectPath, "_bmad", "specs", "spec.md"));
    cache.invalidate(root);

    const second = await cache.get(root);
    assert.equal(
      findByName(["specs", "spec.md"], second[0]!),
      false,
      "rebuilt tree must no longer include the removed file",
    );
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("get() rejects when the root folder no longer exists on disk (FR-012)", async () => {
  const projectPath = await makeProjectFixture();
  const root = await buildProjectRoot(projectPath);
  assert.ok(root);

  const cache = createHierarchyCache();
  await cache.get(root);
  await rm(projectPath, { recursive: true, force: true });
  cache.invalidate(root);

  await assert.rejects(() => cache.get(root));
});
