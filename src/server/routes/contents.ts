import { stat } from "node:fs/promises";
import type { ArtifactNode, HierarchyCache, ProjectRoot } from "../../artifacts/types.js";
import type { RouteResponse } from "../http-server.js";
import { findFolderNodeByPath, getCachedTabTree, getTabRootPath, isTabId, isWithinRoot } from "../tab-tree.js";
import type { ContentsEntry } from "../types.js";

/**
 * Enriches a folder node's direct children with fs.stat()-derived size/created/updated
 * metadata (research.md § 4/§5). A child that no longer exists on disk is skipped rather
 * than failing the whole request.
 */
export async function buildContentsEntries(folderNode: ArtifactNode): Promise<ContentsEntry[]> {
  const entries: ContentsEntry[] = [];

  for (const child of folderNode.children ?? []) {
    try {
      const stats = await stat(child.path);
      entries.push({
        name: child.name,
        path: child.path,
        type: child.type,
        size: child.type === "folder" ? null : stats.size,
        createdAt: stats.birthtime.toISOString(),
        updatedAt: stats.mtime.toISOString(),
      });
    } catch {
      continue;
    }
  }

  return entries;
}

export async function getContentsResponse(
  tabParam: string,
  pathParam: string | undefined,
  root: ProjectRoot,
  cache: HierarchyCache,
): Promise<RouteResponse> {
  if (!isTabId(tabParam)) {
    return { status: 404 };
  }

  const tabRootPath = getTabRootPath(tabParam, root);
  if (tabRootPath === null) {
    return { status: 404 };
  }

  if (!pathParam) {
    return { status: 400 };
  }

  if (!isWithinRoot(tabRootPath, pathParam)) {
    return { status: 403 };
  }

  try {
    await stat(pathParam);
  } catch {
    return { status: 404 };
  }

  const tabTree = await getCachedTabTree(tabParam, root, cache);
  if (!tabTree) {
    return { status: 404 };
  }

  const folderNode = findFolderNodeByPath(tabTree, pathParam);
  if (!folderNode) {
    return { status: 404 };
  }

  const entries = await buildContentsEntries(folderNode);
  return { status: 200, body: entries };
}
