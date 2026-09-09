import { test } from "node:test";
import assert from "node:assert/strict";
import { getRefreshResponse } from "../../../src/server/routes/refresh.js";
import type { HierarchyCache, ProjectRoot } from "../../../src/artifacts/types.js";

function makeRoot(): ProjectRoot {
  return { path: "/project", bmadFolderPath: "/project/_bmad", bmadOutputFolderPath: "/project/_bmad-output" };
}

function makeStubCache(): { cache: HierarchyCache; invalidateCalls: ProjectRoot[] } {
  const invalidateCalls: ProjectRoot[] = [];
  const cache: HierarchyCache = {
    async get() {
      return [];
    },
    invalidate(root: ProjectRoot) {
      invalidateCalls.push(root);
    },
  };
  return { cache, invalidateCalls };
}

test("getRefreshResponse() calls cache.invalidate(root) exactly once", async () => {
  const root = makeRoot();
  const { cache, invalidateCalls } = makeStubCache();

  await getRefreshResponse(root, cache);

  assert.equal(invalidateCalls.length, 1);
  assert.equal(invalidateCalls[0], root);
});

test("getRefreshResponse() resolves to status 200 with no body", async () => {
  const root = makeRoot();
  const { cache } = makeStubCache();

  const response = await getRefreshResponse(root, cache);

  assert.deepEqual(response, { status: 200 });
});
