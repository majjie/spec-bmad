import type { NavigatorTree, PrdDateEntry, PrdGroupingResult, PrdNonConformingEntry, SprintStatusResult } from "./api.js";

/**
 * Finds the folder entry (a date node or a non-conforming node) matching `itemId` by its
 * `path`, returning the whole entry - not just `folderName` - so callers can also read its
 * `path`. Takes a grouping result directly (not a whole `NavigatorTree`) so the identical
 * traversal serves both `tree.prd` and `tree.architecture` lookups (feature 015) rather
 * than duplicating it. Shared by `NavigatorDetailPane.tsx` (to render a PRD or
 * architecture leaf's own detail view) and `App.tsx`'s refresh handler (to check whether
 * the currently selected leaf still exists after a refresh, feature 014). Returns
 * `undefined` if `itemId` doesn't match any entry in `grouping` (e.g. `grouping` is `null`,
 * or `itemId` is a "sprint-status"/structural selection).
 */
export function findFolderEntry(
  grouping: PrdGroupingResult | null,
  itemId: string,
): PrdDateEntry | PrdNonConformingEntry | undefined {
  if (!grouping) {
    return undefined;
  }
  for (const projectGroup of grouping.projects) {
    const dateEntry = projectGroup.dates.find((entry) => entry.path === itemId);
    if (dateEntry) {
      return dateEntry;
    }
  }
  return grouping.nonConforming.find((entry) => entry.path === itemId);
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
