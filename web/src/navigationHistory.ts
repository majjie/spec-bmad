import type { TabId } from "./api.js";

export interface NavigationState {
  tab: TabId;
  path: string;
}

/** Builds the FR-012 baseline state: the Infra tab, its root folder selected. */
export function createBaselineState(infraRootPath: string): NavigationState {
  return { tab: "infra", path: infraRootPath };
}

/**
 * True when both `tab` and `path` match. Used to detect a redundant navigation (re-
 * clicking the tab or folder that's already active/selected) so it doesn't push a no-op
 * duplicate history entry — see data-model.md's `statesEqual` row for why this is not
 * about expand/collapse, which never reaches this check.
 */
export function statesEqual(a: NavigationState, b: NavigationState): boolean {
  return a.tab === b.tab && a.path === b.path;
}
