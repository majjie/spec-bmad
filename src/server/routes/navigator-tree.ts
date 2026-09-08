import { stat } from "node:fs/promises";
import { join } from "node:path";
import type { HierarchyCache, ProjectRoot } from "../../artifacts/types.js";
import { groupPrdFolders } from "../../navigator/prd-grouping.js";
import type { RouteResponse } from "../http-server.js";
import { findFolderNodeByPath, getCachedTabTree } from "../tab-tree.js";
import type { NavigatorTree } from "../types.js";

/**
 * Builds the Navigator tab's tree: PRD grouping (data-model.md) plus whether a Sprint
 * Status root should appear (FR-011). Reuses the existing `_bmad-output` HierarchyCache
 * entry (the same one the "output" tab's own tree route reads) rather than scanning the
 * filesystem again — research.md § 2.
 */
export async function getNavigatorTreeResponse(
  root: ProjectRoot,
  cache: HierarchyCache,
): Promise<RouteResponse> {
  if (root.bmadOutputFolderPath === null) {
    return { status: 404 };
  }

  const outputTree = await getCachedTabTree("output", root, cache);
  if (!outputTree) {
    return { status: 404 };
  }

  const prdsPath = join(root.bmadOutputFolderPath, "planning-artifacts", "prds");
  const prdsNode = findFolderNodeByPath(outputTree, prdsPath);
  const subfolders = (prdsNode?.children ?? []).filter((child) => child.type === "folder");
  const prd = subfolders.length > 0 ? groupPrdFolders(subfolders) : null;

  const sprintStatusPath = join(
    root.bmadOutputFolderPath,
    "implementation-artifacts",
    "sprint-status.yaml",
  );
  let sprintStatusAvailable: boolean;
  try {
    await stat(sprintStatusPath);
    sprintStatusAvailable = true;
  } catch {
    sprintStatusAvailable = false;
  }

  const body: NavigatorTree = { prd, sprintStatusAvailable };
  return { status: 200, body };
}
