import type { TabId } from "./api.js";

export interface NavigationState {
  tab: TabId;
  path: string;
  /** Absolute path of the file currently shown in the viewer dialog, if any (feature 004). */
  openFile?: string;
}

/** Builds the FR-012 baseline state: the Infra tab, its root folder selected. */
export function createBaselineState(infraRootPath: string): NavigationState {
  return { tab: "infra", path: infraRootPath };
}

/**
 * True when `tab`, `path`, and `openFile` all match. Used to detect a redundant
 * navigation — e.g. re-clicking the tab or folder that's already active/selected, or
 * re-opening the file that's already open (MUI's `Tabs onChange` fires even for the
 * already-active tab) — so it doesn't push a no-op duplicate history entry (FR-001/
 * FR-002's "a *different* folder"/"*switching* tabs" wording). Expand/collapse never
 * reaches this check at all: `FolderTree.tsx`'s `onExpandedItemsChange` is a separate
 * callback from `onSelectedItemsChange` and never calls `navigate()`, which is what
 * actually satisfies FR-005 (feature 003).
 */
export function statesEqual(a: NavigationState, b: NavigationState): boolean {
  return a.tab === b.tab && a.path === b.path && a.openFile === b.openFile;
}
