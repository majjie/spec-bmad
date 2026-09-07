import { test } from "node:test";
import assert from "node:assert/strict";
import { getTabsResponse } from "../../../src/server/routes/tabs.js";
import type { ProjectRoot } from "../../../src/artifacts/types.js";

test("getTabsResponse() reports false for a tab whose folder is absent from the ProjectRoot", () => {
  const root: ProjectRoot = {
    path: "/project",
    bmadFolderPath: "/project/_bmad",
    bmadOutputFolderPath: null,
  };

  const response = getTabsResponse(root);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { infra: true, output: false });
});

test("getTabsResponse() reports true for both when both folders are present", () => {
  const root: ProjectRoot = {
    path: "/project",
    bmadFolderPath: "/project/_bmad",
    bmadOutputFolderPath: "/project/_bmad-output",
  };

  const response = getTabsResponse(root);

  assert.deepEqual(response.body, { infra: true, output: true });
});
