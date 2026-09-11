import Box from "@mui/material/Box";
import NavigatorTree from "./NavigatorTree.js";
import NavigatorDetailPane from "./NavigatorDetailPane.js";
import type { NavigatorTree as NavigatorTreeData, SprintStatusResult } from "../api.js";

export type NavigatorFocusRoot = "prd" | "architecture" | "sprint";

interface NavigatorViewProps {
  tree: NavigatorTreeData | null;
  expandedItems: Set<string>;
  selectedItemId: string | null;
  onExpandedChange: (expandedItems: Set<string>) => void;
  onNavigate: (itemId: string) => void;
  onOpenFile: (path: string) => void;
  refreshToken: number;
  focusRoot: NavigatorFocusRoot;
  sprintStatus: SprintStatusResult | null;
  sprintStatusError: string | null;
}

function isStructuralOnly(itemId: string): boolean {
  return (
    itemId === "prd" ||
    itemId.startsWith("prd:") ||
    itemId === "architecture" ||
    itemId.startsWith("architecture:")
  );
}

export default function NavigatorView({
  tree,
  expandedItems,
  selectedItemId,
  onExpandedChange,
  onNavigate,
  onOpenFile,
  refreshToken,
  focusRoot,
  sprintStatus,
  sprintStatusError,
}: NavigatorViewProps) {
  return (
    <>
      <Box
        sx={{
          width: 280,
          overflow: "auto",
          borderRight: "1px solid var(--color-border-default)",
          bgcolor: "var(--color-bg-surface)",
        }}
      >
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
          focusRoot={focusRoot}
        />
      </Box>
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <NavigatorDetailPane
          key={refreshToken}
          tree={tree}
          selectedItemId={selectedItemId}
          onOpenFile={onOpenFile}
          focusRoot={focusRoot}
          sprintStatus={sprintStatus}
          sprintStatusError={sprintStatusError}
        />
      </Box>
    </>
  );
}
