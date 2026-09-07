import { scan } from "./scan.js";
import type { ArtifactNode, CacheEntry, HierarchyCache, ProjectRoot } from "./types.js";

function rootFolderPaths(root: ProjectRoot): string[] {
  return [root.bmadFolderPath, root.bmadOutputFolderPath].filter(
    (path): path is string => path !== null,
  );
}

export function createHierarchyCache(): HierarchyCache {
  const entries = new Map<string, CacheEntry>();

  return {
    async get(root: ProjectRoot): Promise<ArtifactNode[]> {
      const trees: ArtifactNode[] = [];

      for (const folderPath of rootFolderPaths(root)) {
        const existing = entries.get(folderPath);
        if (existing && existing.status === "fresh") {
          trees.push(existing.tree);
          continue;
        }

        const tree = await scan(folderPath);
        entries.set(folderPath, { tree, status: "fresh" });
        trees.push(tree);
      }

      return trees;
    },

    invalidate(root: ProjectRoot): void {
      for (const folderPath of rootFolderPaths(root)) {
        const existing = entries.get(folderPath);
        if (existing) {
          existing.status = "stale";
        }
      }
    },
  };
}
