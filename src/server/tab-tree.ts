import { isAbsolute, relative } from "node:path";
import type { ArtifactNode, HierarchyCache, ProjectRoot } from "../artifacts/types.js";
import type { TabId } from "./types.js";

export function isTabId(value: string): value is TabId {
  return value === "infra" || value === "output";
}

export function getTabRootPath(tab: TabId, root: ProjectRoot): string | null {
  return tab === "infra" ? root.bmadFolderPath : root.bmadOutputFolderPath;
}

/**
 * Returns the cached ArtifactNode tree for a tab (feature 001's HierarchyCache), or
 * `undefined` if the tab's folder doesn't exist for this project, or the cache didn't
 * return an entry for it.
 */
export async function getCachedTabTree(
  tab: TabId,
  root: ProjectRoot,
  cache: HierarchyCache,
): Promise<ArtifactNode | undefined> {
  const tabRootPath = getTabRootPath(tab, root);
  if (tabRootPath === null) {
    return undefined;
  }
  const trees = await cache.get(root);
  return trees.find((tree) => tree.path === tabRootPath);
}

/** Recursively finds the node at `targetPath` within `node`'s folder subtree. */
export function findFolderNodeByPath(
  node: ArtifactNode,
  targetPath: string,
): ArtifactNode | undefined {
  if (node.path === targetPath) {
    return node;
  }
  for (const child of node.children ?? []) {
    if (child.type === "folder") {
      const found = findFolderNodeByPath(child, targetPath);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/** True iff `target` is equal to, or a descendant of, `root` (path containment check). */
export function isWithinRoot(root: string, target: string): boolean {
  const rel = relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}
