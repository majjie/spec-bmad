import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import Typography from "@mui/material/Typography";
import type { FolderTreeNode } from "../api.js";

interface FolderTreeProps {
  tree: FolderTreeNode | null;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  onExpandedChange: (expandedPaths: Set<string>) => void;
  onSelect: (path: string) => void;
}

function renderNode(node: FolderTreeNode) {
  return (
    <TreeItem key={node.path} itemId={node.path} label={node.name}>
      {node.children.map(renderNode)}
    </TreeItem>
  );
}

export default function FolderTree({
  tree,
  expandedPaths,
  selectedPath,
  onExpandedChange,
  onSelect,
}: FolderTreeProps) {
  if (!tree) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        No folder found for this tab.
      </Typography>
    );
  }

  return (
    <SimpleTreeView
      expandedItems={[...expandedPaths]}
      selectedItems={selectedPath}
      onExpandedItemsChange={(_event, itemIds) => onExpandedChange(new Set(itemIds))}
      onSelectedItemsChange={(_event, itemId) => {
        if (itemId) {
          onSelect(itemId);
        }
      }}
    >
      {renderNode(tree)}
    </SimpleTreeView>
  );
}
