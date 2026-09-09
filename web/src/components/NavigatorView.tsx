import Box from "@mui/material/Box";
import NavigatorTree from "./NavigatorTree.js";
import NavigatorDetailPane from "./NavigatorDetailPane.js";
import type { NavigatorTree as NavigatorTreeData } from "../api.js";

interface NavigatorViewProps {
  tree: NavigatorTreeData | null;
  expandedItems: Set<string>;
  selectedItemId: string | null;
  onExpandedChange: (expandedItems: Set<string>) => void;
  onNavigate: (itemId: string) => void;
  onOpenFile: (path: string) => void;
  // Bumped by App.tsx once per completed refresh (feature 014). Applied as `key` on
  // NavigatorDetailPane only (not the tree sidebar) so a refresh remounts just the detail
  // pane, forcing whichever view it owns (Sprint Status or the PRD detail view) to re-run
  // its own fetch effect from scratch — no changes needed inside either component.
  refreshToken: number;
}

/**
 * The "PRD"/"Architecture" roots and every project itemId (`prd:${project}`,
 * `architecture:${project}`) are structural only (FR-010, and feature 015's own FR-004) —
 * clicking them must not change the detail pane. `NavigatorTree` reports every click
 * uniformly; filtering out the non-selectable ones lives here rather than in `App.tsx`,
 * which has no reason to know this tab's itemId scheme.
 */
function isStructuralOnly(itemId: string): boolean {
  return itemId === "prd" || itemId.startsWith("prd:") || itemId === "architecture" || itemId.startsWith("architecture:");
}

export default function NavigatorView({
  tree,
  expandedItems,
  selectedItemId,
  onExpandedChange,
  onNavigate,
  onOpenFile,
  refreshToken,
}: NavigatorViewProps) {
  return (
    <>
      <Box sx={{ width: 280, overflow: "auto", borderRight: 1, borderColor: "divider" }}>
        <NavigatorTree
          tree={tree}
          expandedItems={expandedItems}
          selectedItemId={selectedItemId}
          onExpandedChange={onExpandedChange}
          onItemSelected={(itemId) => {
            if (!isStructuralOnly(itemId)) {
              onNavigate(itemId);
            }
          }}
        />
      </Box>
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <NavigatorDetailPane
          key={refreshToken}
          tree={tree}
          selectedItemId={selectedItemId}
          onOpenFile={onOpenFile}
        />
      </Box>
    </>
  );
}
