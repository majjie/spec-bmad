import { test } from "node:test";
import assert from "node:assert/strict";
import { toFolderTreeNode } from "../../../src/server/routes/tree.js";
import type { ArtifactNode } from "../../../src/artifacts/types.js";

test("toFolderTreeNode() drops file entries at every level, keeping only folders", () => {
  const artifactTree: ArtifactNode = {
    name: "_bmad",
    path: "/project/_bmad",
    type: "folder",
    children: [
      { name: "top-level.md", path: "/project/_bmad/top-level.md", type: "file" },
      {
        name: "specs",
        path: "/project/_bmad/specs",
        type: "folder",
        children: [
          { name: "spec.md", path: "/project/_bmad/specs/spec.md", type: "file" },
          {
            name: "checklists",
            path: "/project/_bmad/specs/checklists",
            type: "folder",
            children: [],
          },
        ],
      },
    ],
  };

  const tree = toFolderTreeNode(artifactTree);

  assert.deepEqual(tree, {
    name: "_bmad",
    path: "/project/_bmad",
    children: [
      {
        name: "specs",
        path: "/project/_bmad/specs",
        children: [
          {
            name: "checklists",
            path: "/project/_bmad/specs/checklists",
            children: [],
          },
        ],
      },
    ],
  });
});

test("toFolderTreeNode() returns an empty children array for a folder with no subfolders", () => {
  const artifactTree: ArtifactNode = {
    name: "_bmad-output",
    path: "/project/_bmad-output",
    type: "folder",
    children: [
      { name: "summary.md", path: "/project/_bmad-output/summary.md", type: "file" },
    ],
  };

  const tree = toFolderTreeNode(artifactTree);

  assert.deepEqual(tree.children, []);
});
