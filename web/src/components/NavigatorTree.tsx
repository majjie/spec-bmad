import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import Typography from "@mui/material/Typography";
import type { NavigatorTree as NavigatorTreeData } from "../api.js";
import { humanizeProjectSlug } from "../shell.js";
import type { NavigatorFocusRoot } from "./NavigatorView.js";

interface NavigatorTreeProps {
  tree: NavigatorTreeData | null;
  expandedItems: Set<string>;
  selectedItemId: string | null;
  onExpandedChange: (expandedItems: Set<string>) => void;
  onItemSelected: (itemId: string) => void;
  focusRoot: NavigatorFocusRoot;
}

export default function NavigatorTree({
  tree,
  expandedItems,
  selectedItemId,
  onExpandedChange,
  onItemSelected,
  focusRoot,
}: NavigatorTreeProps) {
  if (!tree || (tree.prd === null && tree.architecture === null && !tree.sprintStatusAvailable)) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        No curated documents in this project yet. If BMAD has not produced planning or sprint
        artifacts, check Generated files for raw output.
      </Typography>
    );
  }

  const showPrd = focusRoot === "prd" && tree.prd;
  const showArchitecture = focusRoot === "architecture" && tree.architecture;
  const showSprint = focusRoot === "sprint" && tree.sprintStatusAvailable;

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
      sx={{ px: 1, py: 1, "& .MuiTreeItem-label": { fontSize: "0.875rem" } }}
    >
      {showPrd && tree.prd && (
        <TreeItem itemId="prd" label="Requirements">
          {tree.prd.projects.map((projectGroup) => (
            <TreeItem
              key={projectGroup.project}
              itemId={`prd:${projectGroup.project}`}
              label={
                <Typography component="span" sx={{ textTransform: "capitalize" }}>
                  {humanizeProjectSlug(projectGroup.project)}
                </Typography>
              }
            >
              {projectGroup.dates.map((dateEntry, index) => (
                <TreeItem
                  key={dateEntry.path}
                  itemId={dateEntry.path}
                  label={index === 0 ? `${dateEntry.date} · latest` : dateEntry.date}
                />
              ))}
            </TreeItem>
          ))}
          {tree.prd.nonConforming.map((entry) => (
            <TreeItem key={entry.path} itemId={entry.path} label={entry.folderName} />
          ))}
        </TreeItem>
      )}
      {showArchitecture && tree.architecture && (
        <TreeItem itemId="architecture" label="Architecture">
          {tree.architecture.projects.map((projectGroup) => (
            <TreeItem
              key={projectGroup.project}
              itemId={`architecture:${projectGroup.project}`}
              label={
                <Typography component="span" sx={{ textTransform: "capitalize" }}>
                  {humanizeProjectSlug(projectGroup.project)}
                </Typography>
              }
            >
              {projectGroup.dates.map((dateEntry, index) => (
                <TreeItem
                  key={dateEntry.path}
                  itemId={dateEntry.path}
                  label={index === 0 ? `${dateEntry.date} · latest` : dateEntry.date}
                />
              ))}
            </TreeItem>
          ))}
          {tree.architecture.nonConforming.map((entry) => (
            <TreeItem key={entry.path} itemId={entry.path} label={entry.folderName} />
          ))}
        </TreeItem>
      )}
      {showSprint && <TreeItem itemId="sprint-status" label="Sprint status" />}
    </SimpleTreeView>
  );
}
