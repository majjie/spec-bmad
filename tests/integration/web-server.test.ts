import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildProjectRoot } from "../../src/artifacts/project-root.js";
import { createHierarchyCache } from "../../src/artifacts/cache.js";
import { startHttpServer, type HttpServerHandle } from "../../src/server/http-server.js";
import { createApiRequestHandler } from "../../src/server/api-router.js";

async function makeFixture(): Promise<string> {
  const projectPath = await mkdtemp(join(tmpdir(), "bmad-web-server-"));
  await mkdir(join(projectPath, "_bmad", "specs"), { recursive: true });
  await writeFile(join(projectPath, "_bmad", "specs", "spec.md"), "content");
  return projectPath;
}

async function startServerFor(projectPath: string): Promise<HttpServerHandle> {
  const root = await buildProjectRoot(projectPath);
  assert.ok(root, "fixture must be a valid BMAD project");
  const cache = createHierarchyCache();
  return startHttpServer(createApiRequestHandler(root, cache));
}

test("GET /api/tabs, /api/tree/infra, /api/contents/infra match the valid-folder contract", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const tabsRes = await fetch(`${server.url}/api/tabs`);
    assert.equal(tabsRes.status, 200);
    assert.deepEqual(await tabsRes.json(), { infra: true, output: false });

    const treeRes = await fetch(`${server.url}/api/tree/infra`);
    assert.equal(treeRes.status, 200);
    const tree = (await treeRes.json()) as { name: string; children: unknown[] };
    assert.equal(tree.name, "_bmad");
    assert.equal(tree.children.length, 1);

    const bmadPath = join(projectPath, "_bmad");
    const contentsRes = await fetch(
      `${server.url}/api/contents/infra?path=${encodeURIComponent(bmadPath)}`,
    );
    assert.equal(contentsRes.status, 200);
    const entries = (await contentsRes.json()) as Array<{ name: string }>;
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.name, "specs");
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/tree/bogus-tab returns 404 for an unrecognized tab", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const res = await fetch(`${server.url}/api/tree/bogus-tab`);
    assert.equal(res.status, 404);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/contents/infra with no path query param returns 400", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const res = await fetch(`${server.url}/api/contents/infra`);
    assert.equal(res.status, 400);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/contents/infra?path=<nonexistent> returns 404", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const missingPath = join(projectPath, "_bmad", "does-not-exist");
    const res = await fetch(
      `${server.url}/api/contents/infra?path=${encodeURIComponent(missingPath)}`,
    );
    assert.equal(res.status, 404);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/tree/output returns the missing-folder response when only _bmad exists", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const tabsRes = await fetch(`${server.url}/api/tabs`);
    assert.deepEqual(await tabsRes.json(), { infra: true, output: false });

    const treeRes = await fetch(`${server.url}/api/tree/output`);
    assert.equal(treeRes.status, 404);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/contents/infra?path=<outside infra's tree> returns 403", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  const outsidePath = await mkdtemp(join(tmpdir(), "bmad-web-server-outside-"));
  try {
    const res = await fetch(
      `${server.url}/api/contents/infra?path=${encodeURIComponent(outsidePath)}`,
    );
    assert.equal(res.status, 403);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
    await rm(outsidePath, { recursive: true, force: true });
  }
});
