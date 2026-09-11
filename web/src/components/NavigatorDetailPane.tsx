import { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import ArchitectureDetailView from "./ArchitectureDetailView.js";
import PrdDetailView from "./PrdDetailView.js";
import SprintStatusView from "./SprintStatusView.js";
import type { NavigatorTree, SprintStatusResult } from "../api.js";
import { fetchSprintStatus, findFolderEntry } from "../navigatorApi.js";
import type { NavigatorFocusRoot } from "./NavigatorView.js";

interface NavigatorDetailPaneProps {
  tree: NavigatorTree | null;
  selectedItemId: string | null;
  onOpenFile: (path: string) => void;
  focusRoot: NavigatorFocusRoot;
  sprintStatus: SprintStatusResult | null;
  sprintStatusError: string | null;
}

export default function NavigatorDetailPane({
  tree,
  selectedItemId,
  onOpenFile,
  focusRoot,
  sprintStatus: sprintFromParent,
  sprintStatusError: sprintErrorFromParent,
}: NavigatorDetailPaneProps) {
  const [sprintStatus, setSprintStatus] = useState<SprintStatusResult | null>(sprintFromParent);
  const [sprintStatusError, setSprintStatusError] = useState<string | null>(sprintErrorFromParent);

  useEffect(() => {
    setSprintStatus(sprintFromParent);
    setSprintStatusError(sprintErrorFromParent);
  }, [sprintFromParent, sprintErrorFromParent]);

  useEffect(() => {
    if (selectedItemId !== "sprint-status") {
      return;
    }
    if (sprintStatus !== null || sprintStatusError !== null) {
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

  const showSprint =
    selectedItemId === "sprint-status" ||
    (focusRoot === "sprint" && (sprintStatus !== null || sprintStatusError !== null));

  if (showSprint) {
    if (sprintStatusError && sprintStatus === null) {
      return (
        <Typography variant="body2" color="error" sx={{ p: 2 }}>
          {sprintStatusError}
        </Typography>
      );
    }
    if (sprintStatus === null) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          Loading sprint status…
        </Typography>
      );
    }
    return <SprintStatusView data={sprintStatus} onOpenFile={onOpenFile} />;
  }

  if (selectedItemId === null) {
    const hint =
      focusRoot === "prd"
        ? "Select a dated Requirements folder on the left to read its PRD."
        : focusRoot === "architecture"
          ? "Select a dated Architecture folder on the left to read its spine."
          : "Open Sprint from the sidebar to see status and stories.";
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 3, maxWidth: "42ch" }}>
        {hint}
      </Typography>
    );
  }

  const prdEntry = findFolderEntry(tree?.prd ?? null, selectedItemId);
  if (prdEntry !== undefined) {
    return <PrdDetailView entry={prdEntry} onOpenFile={onOpenFile} />;
  }

  const architectureEntry = findFolderEntry(tree?.architecture ?? null, selectedItemId);
  if (architectureEntry !== undefined) {
    return <ArchitectureDetailView entry={architectureEntry} onOpenFile={onOpenFile} />;
  }

  return (
    <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
      Select an item on the left to see its details.
    </Typography>
  );
}
