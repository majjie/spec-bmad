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
 * filesystem again - research.md § 2.
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

  // Architecture folders follow the exact same <project>-YYYY-MM-DD naming convention as
  // PRD folders, so the same already-generic groupPrdFolders() applies unmodified - a
  // deliberate reuse, not a coincidence (research.md § 1/§ 2, feature 015).
  const architecturePath = join(root.bmadOutputFolderPath, "planning-artifacts", "architecture");
  const architectureNode = findFolderNodeByPath(outputTree, architecturePath);
  const architectureSubfolders = (architectureNode?.children ?? []).filter((child) => child.type === "folder");
  const architecture = architectureSubfolders.length > 0 ? groupPrdFolders(architectureSubfolders) : null;

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

  const body: NavigatorTree = { prd, architecture, sprintStatusAvailable };
  return { status: 200, body };
}
