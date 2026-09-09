import type { NavigatorTree, PrdDateEntry, PrdNonConformingEntry, SprintStatusResult } from "./api.js";

/**
 * Finds the PRD folder entry (a date node or a non-conforming node) matching `itemId` by
 * its `path`, returning the whole entry — not just `folderName` — so callers can also read
 * its `path`. Shared by `NavigatorDetailPane.tsx` (to render a PRD leaf's own detail view)
 * and `App.tsx`'s refresh handler (to check whether the currently selected PRD leaf still
 * exists after a refresh, feature 014). Returns `undefined` if `itemId` doesn't match any
 * known PRD folder (e.g. it's a "sprint-status" or `null` selection).
 */
export function findPrdFolderEntry(
  tree: NavigatorTree | null,
  itemId: string,
): PrdDateEntry | PrdNonConformingEntry | undefined {
  if (!tree?.prd) {
    return undefined;
  }
  for (const projectGroup of tree.prd.projects) {
    const dateEntry = projectGroup.dates.find((entry) => entry.path === itemId);
    if (dateEntry) {
      return dateEntry;
    }
  }
  return tree.prd.nonConforming.find((entry) => entry.path === itemId);
}

export async function fetchNavigatorTree(): Promise<NavigatorTree> {
  const response = await fetch("/api/navigator/tree");
  if (!response.ok) {
    throw new Error(`GET /api/navigator/tree failed with ${response.status}`);
  }
  return (await response.json()) as NavigatorTree;
}

export async function fetchSprintStatus(): Promise<SprintStatusResult> {
  const response = await fetch("/api/navigator/sprint-status");
  if (!response.ok) {
    if (response.status === 422) {
      const body = (await response.json()) as { error: string };
      throw new Error(body.error);
    }
    throw new Error(`GET /api/navigator/sprint-status failed with ${response.status}`);
  }
  return (await response.json()) as SprintStatusResult;
}
