import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import Typography from "@mui/material/Typography";
import type { NavigatorTree as NavigatorTreeData } from "../api.js";

interface NavigatorTreeProps {
  tree: NavigatorTreeData | null;
  expandedItems: Set<string>;
  selectedItemId: string | null;
  onExpandedChange: (expandedItems: Set<string>) => void;
  onItemSelected: (itemId: string) => void;
}

/**
 * Renders the Navigator tab's multi-root tree (contracts/ui-behavior.md): a "PRD" root
 * grouping projects/dates/non-conforming folders, an "Architecture" root grouping
 * architecture folders the exact same way (feature 015), and a "Sprint Status" root
 * (FR-011). The "PRD"/"Architecture" roots and each project node beneath them are
 * structural only (FR-010) — every click is reported up via `onItemSelected`, and it's the
 * caller's job (NavigatorView) to decide which itemIds actually change the detail pane.
 */
export default function NavigatorTree({
  tree,
  expandedItems,
  selectedItemId,
  onExpandedChange,
  onItemSelected,
}: NavigatorTreeProps) {
  if (!tree || (tree.prd === null && tree.architecture === null && !tree.sprintStatusAvailable)) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        Nothing to show yet.
      </Typography>
    );
  }

  return (
    <SimpleTreeView
      expandedItems={[...expandedItems]}
      selectedItems={selectedItemId}
      onExpandedItemsChange={(_event, itemIds) => onExpandedChange(new Set(itemIds))}
      onSelectedItemsChange={(_event, itemId) => {
        if (itemId) {
          onItemSelected(itemId);
        }
      }}
    >
      {tree.prd && (
        <TreeItem itemId="prd" label="PRD">
          {tree.prd.projects.map((projectGroup) => (
            <TreeItem key={projectGroup.project} itemId={`prd:${projectGroup.project}`} label={projectGroup.project}>
              {projectGroup.dates.map((dateEntry) => (
                <TreeItem key={dateEntry.path} itemId={dateEntry.path} label={dateEntry.date} />
              ))}
            </TreeItem>
          ))}
          {tree.prd.nonConforming.map((entry) => (
            <TreeItem key={entry.path} itemId={entry.path} label={entry.folderName} />
          ))}
        </TreeItem>
      )}
      {tree.architecture && (
        <TreeItem itemId="architecture" label="Architecture">
          {tree.architecture.projects.map((projectGroup) => (
            <TreeItem
              key={projectGroup.project}
              itemId={`architecture:${projectGroup.project}`}
              label={projectGroup.project}
            >
              {projectGroup.dates.map((dateEntry) => (
                <TreeItem key={dateEntry.path} itemId={dateEntry.path} label={dateEntry.date} />
              ))}
            </TreeItem>
          ))}
          {tree.architecture.nonConforming.map((entry) => (
            <TreeItem key={entry.path} itemId={entry.path} label={entry.folderName} />
          ))}
        </TreeItem>
      )}
      {tree.sprintStatusAvailable && <TreeItem itemId="sprint-status" label="Sprint Status" />}
    </SimpleTreeView>
  );
}
