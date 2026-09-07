import type { ArtifactNode, HierarchyCache, ProjectRoot } from "../../artifacts/types.js";
import type { RouteResponse } from "../http-server.js";
import { getCachedTabTree, isTabId } from "../tab-tree.js";
import type { FolderTreeNode } from "../types.js";

/**
 * Converts an ArtifactNode tree into a folders-only FolderTreeNode tree, dropping file
 * entries at every level (FR-003).
 */
export function toFolderTreeNode(node: ArtifactNode): FolderTreeNode {
  return {
    name: node.name,
    path: node.path,
    children: (node.children ?? [])
      .filter((child) => child.type === "folder")
      .map(toFolderTreeNode),
  };
}

export async function getTreeResponse(
  tabParam: string,
  root: ProjectRoot,
  cache: HierarchyCache,
): Promise<RouteResponse> {
  if (!isTabId(tabParam)) {
    return { status: 404 };
  }

  const tabTree = await getCachedTabTree(tabParam, root, cache);
  if (!tabTree) {
    return { status: 404 };
  }

  return { status: 200, body: toFolderTreeNode(tabTree) };
}
