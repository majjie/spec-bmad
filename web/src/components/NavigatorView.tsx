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
}

/**
 * The "PRD" root and every project itemId (`prd:${project}`) are structural only
 * (FR-010) — clicking them must not change the detail pane. `NavigatorTree` reports every
 * click uniformly; filtering out the non-selectable ones lives here rather than in
 * `App.tsx`, which has no reason to know this tab's itemId scheme.
 */
function isStructuralOnly(itemId: string): boolean {
  return itemId === "prd" || itemId.startsWith("prd:");
}

export default function NavigatorView({
  tree,
  expandedItems,
  selectedItemId,
  onExpandedChange,
  onNavigate,
  onOpenFile,
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
        <NavigatorDetailPane tree={tree} selectedItemId={selectedItemId} onOpenFile={onOpenFile} />
      </Box>
    </>
  );
}
