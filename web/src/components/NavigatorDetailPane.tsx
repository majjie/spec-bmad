import { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import SprintStatusView from "./SprintStatusView.js";
import type { NavigatorTree, SprintStatusResult } from "../api.js";
import { fetchSprintStatus } from "../navigatorApi.js";

interface NavigatorDetailPaneProps {
  tree: NavigatorTree | null;
  selectedItemId: string | null;
  onOpenFile: (path: string) => void;
}

/**
 * Finds the PRD folder entry (a date node or a non-conforming node) matching
 * `selectedItemId` by its `path`, so FR-009's placeholder text can show that folder's own
 * `folderName`. Returns `undefined` if `selectedItemId` doesn't match any known PRD folder
 * (e.g. it's a "sprint-status" or `null` selection, both handled by the caller instead).
 */
function findPrdFolderName(tree: NavigatorTree | null, selectedItemId: string): string | undefined {
  if (!tree?.prd) {
    return undefined;
  }
  for (const projectGroup of tree.prd.projects) {
    const dateEntry = projectGroup.dates.find((entry) => entry.path === selectedItemId);
    if (dateEntry) {
      return dateEntry.folderName;
    }
  }
  return tree.prd.nonConforming.find((entry) => entry.path === selectedItemId)?.folderName;
}

/**
 * Dispatches on `selectedItemId` per contracts/ui-behavior.md. Note that "PRD" root and
 * project itemIds (FR-010) never reach this component as `selectedItemId` at all —
 * NavigatorView only updates it for a selectable leaf, so this component never needs to
 * special-case them; the pane simply keeps rendering whatever it last rendered.
 */
export default function NavigatorDetailPane({ tree, selectedItemId, onOpenFile }: NavigatorDetailPaneProps) {
  const [sprintStatus, setSprintStatus] = useState<SprintStatusResult | null>(null);
  const [sprintStatusError, setSprintStatusError] = useState<string | null>(null);

  // Fetches once per "sprint-status" selection, not once per click — re-selecting an
  // already-fetched (or already-failed) result doesn't trigger another request.
  useEffect(() => {
    if (selectedItemId !== "sprint-status" || sprintStatus !== null || sprintStatusError !== null) {
      return;
    }
    let cancelled = false;
    fetchSprintStatus().then(
      (result) => {
        if (!cancelled) {
          setSprintStatus(result);
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setSprintStatusError(error instanceof Error ? error.message : String(error));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [selectedItemId, sprintStatus, sprintStatusError]);

  if (selectedItemId === "sprint-status") {
    if (sprintStatusError) {
      return (
        <Typography variant="body2" color="error" sx={{ p: 2 }}>
          {sprintStatusError}
        </Typography>
      );
    }
    if (sprintStatus === null) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          Loading…
        </Typography>
      );
    }
    return <SprintStatusView data={sprintStatus} onOpenFile={onOpenFile} />;
  }

  if (selectedItemId === null) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        Select an item on the left to see its details.
      </Typography>
    );
  }

  const folderName = findPrdFolderName(tree, selectedItemId);
  if (folderName !== undefined) {
    return (
      <Typography variant="body2" sx={{ p: 2 }}>
        {folderName}
      </Typography>
    );
  }

  return (
    <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
      Select an item on the left to see its details.
    </Typography>
  );
}
