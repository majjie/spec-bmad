import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import FolderTree from "./components/FolderTree.js";
import ContentsTable from "./components/ContentsTable.js";
import FileViewerDialog from "./components/FileViewerDialog.js";
import PrdDetailView from "./components/PrdDetailView.js";
import ArchitectureDetailView from "./components/ArchitectureDetailView.js";
import SprintStatusView from "./components/SprintStatusView.js";
import AppHeader from "./components/shell/AppHeader.js";
import AppSidebar from "./components/shell/AppSidebar.js";
import OverviewView from "./components/shell/OverviewView.js";
import WelcomeModal from "./components/shell/WelcomeModal.js";
import GuidedTour from "./components/shell/GuidedTour.js";
import {
  fetchContents,
  fetchFileContent,
  fetchRefresh,
  fetchTabs,
  fetchTree,
  type ContentsEntry,
  type FolderTreeNode,
  type NavigatorTree,
  type SprintStatusResult,
  type TabAvailability,
  type TabId,
} from "./api.js";
import { fetchNavigatorTree, fetchSprintStatus, findFolderEntry } from "./navigatorApi.js";
import { createBaselineState, statesEqual, type NavigationState } from "./navigationHistory.js";
import { shouldShowWelcome, writeOnboardingState } from "./onboarding/onboarding.js";
import { workspaceProjectName, type ShellSelection } from "./shell.js";

interface FileDialogState {
  path: string;
  content: string | null;
  error: string | null;
}

type FolderTabId = "infra" | "output";

interface TabViewState {
  tree: FolderTreeNode | null;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  contents: ContentsEntry[] | null;
}

function createEmptyTabState(): TabViewState {
  return { tree: null, expandedPaths: new Set(), selectedPath: null, contents: null };
}

const FOLDER_TAB_IDS: FolderTabId[] = ["infra", "output"];

function selectionFromHistory(state: NavigationState, tree: NavigatorTree | null): ShellSelection {
  if (state.tab === "infra") {
    return { kind: "method" };
  }
  if (state.tab === "output") {
    return { kind: "generated" };
  }
  if (state.path === "sprint-status") {
    return { kind: "sprint" };
  }
  if (state.path === "" || state.path === "overview") {
    return { kind: "overview" };
  }
  if (findFolderEntry(tree?.architecture ?? null, state.path)) {
    return { kind: "architecture", path: state.path };
  }
  if (findFolderEntry(tree?.prd ?? null, state.path)) {
    return { kind: "prd", path: state.path };
  }
  return { kind: "overview" };
}

function historyPathFor(selection: ShellSelection, folderPath: string): NavigationState {
  switch (selection.kind) {
    case "overview":
      return { tab: "navigator", path: "overview" };
    case "sprint":
      return { tab: "navigator", path: "sprint-status" };
    case "prd":
    case "architecture":
      return { tab: "navigator", path: selection.path };
    case "method":
      return { tab: "infra", path: folderPath };
    case "generated":
      return { tab: "output", path: folderPath };
  }
}

export default function App() {
  const [selection, setSelection] = useState<ShellSelection>({ kind: "overview" });
  const [availability, setAvailability] = useState<TabAvailability | null>(null);
  const [tabStates, setTabStates] = useState<Record<FolderTabId, TabViewState>>({
    infra: createEmptyTabState(),
    output: createEmptyTabState(),
  });
  const [openFile, setOpenFile] = useState<FileDialogState | null>(null);

  const [navigatorTree, setNavigatorTree] = useState<NavigatorTree | null>(null);

  const [sprintStatus, setSprintStatus] = useState<SprintStatusResult | null>(null);
  const [sprintStatusError, setSprintStatusError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const [welcomeOpen, setWelcomeOpen] = useState(() => shouldShowWelcome());
  const [tourOpen, setTourOpen] = useState(false);

  const currentNavStateRef = useRef<NavigationState | null>(null);
  const baselineEstablishedRef = useRef(false);

  function updateTabState(tabId: FolderTabId, patch: Partial<TabViewState>) {
    setTabStates((prev) => ({
      ...prev,
      [tabId]: { ...prev[tabId], ...patch },
    }));
  }

  const pushHistory = useCallback((nextState: NavigationState, fromHistory?: boolean) => {
    const isRedundant =
      currentNavStateRef.current !== null && statesEqual(currentNavStateRef.current, nextState);
    currentNavStateRef.current = nextState;
    if (!fromHistory && !isRedundant) {
      window.history.pushState(nextState, "");
    }
  }, []);

  function applySelection(next: ShellSelection, options: { fromHistory?: boolean } = {}) {
    setSelection(next);
    if (next.kind === "method") {
      const path = tabStates.infra.selectedPath ?? tabStates.infra.tree?.path ?? "";
      pushHistory(historyPathFor(next, path), options.fromHistory);
      if (path) {
        updateTabState("infra", { selectedPath: path });
        void fetchContents("infra", path).then((contents) => updateTabState("infra", { contents }));
      }
      return;
    }
    if (next.kind === "generated") {
      const path = tabStates.output.selectedPath ?? tabStates.output.tree?.path ?? "";
      pushHistory(historyPathFor(next, path), options.fromHistory);
      if (path) {
        updateTabState("output", { selectedPath: path });
        void fetchContents("output", path).then((contents) => updateTabState("output", { contents }));
      }
      return;
    }
    if (next.kind === "sprint") {
      void loadSprintIfNeeded();
    }
    pushHistory(historyPathFor(next, ""), options.fromHistory);
  }

  const navigateFolder = useCallback(
    (tab: FolderTabId, path: string, options: { fromHistory?: boolean } = {}) => {
      setSelection({ kind: tab === "infra" ? "method" : "generated" });
      pushHistory({ tab, path }, options.fromHistory);
      if (path) {
        updateTabState(tab, { selectedPath: path });
        void fetchContents(tab, path).then((contents) => {
          updateTabState(tab, { contents });
        });
      }
    },
    [pushHistory],
  );

  function loadFileContent(tab: TabId, path: string) {
    // Navigator isn't a folder tab - its opened files live under `_bmad-output`, so
    // content always goes through `/api/file/output` while history keeps `tab: "navigator"`.
    const fileTab: FolderTabId = tab === "navigator" ? "output" : tab;
    void fetchFileContent(fileTab, path).then(
      (content) => setOpenFile({ path, content, error: null }),
      (error: unknown) =>
        setOpenFile({
          path,
          content: null,
          error: error instanceof Error ? error.message : String(error),
        }),
    );
  }

  function openFileDialog(tab: TabId, navPath: string, filePath: string) {
    const base = currentNavStateRef.current ?? createBaselineState(tab, navPath);
    pushHistory({ ...base, tab, openFile: filePath });
    setOpenFile({ path: filePath, content: null, error: null });
    loadFileContent(tab, filePath);
  }

  function closeFileDialog() {
    const current = currentNavStateRef.current;
    if (current?.openFile) {
      const { openFile: _removed, ...rest } = current;
      pushHistory(rest);
    }
    setOpenFile(null);
  }

  async function loadSprintIfNeeded(force = false) {
    if (!force && (sprintStatus !== null || sprintStatusError !== null)) {
      return;
    }
    try {
      const result = await fetchSprintStatus();
      setSprintStatus(result);
      setSprintStatusError(null);
    } catch (error: unknown) {
      setSprintStatusError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshFailed(false);
    try {
      await fetchRefresh();
      const tabs = await fetchTabs();
      setAvailability(tabs);

      await Promise.all(
        FOLDER_TAB_IDS.map(async (tabId) => {
          const currentState = tabStates[tabId];
          if (!currentState.tree) {
            return;
          }
          const tree = await fetchTree(tabId);
          if (!tree) {
            return;
          }
          const selectedPath = currentState.selectedPath ?? tree.path;
          try {
            const contents = await fetchContents(tabId, selectedPath);
            updateTabState(tabId, { tree, contents });
          } catch {
            const contents = await fetchContents(tabId, tree.path);
            updateTabState(tabId, { tree, contents, selectedPath: tree.path });
          }
        }),
      );

      const tree = await fetchNavigatorTree();
      setNavigatorTree(tree);
      setSprintStatus(null);
      setSprintStatusError(null);
      if (tree.sprintStatusAvailable) {
        await loadSprintIfNeeded(true);
      }
      setRefreshToken((token) => token + 1);
    } catch {
      setRefreshFailed(true);
      setTimeout(() => setRefreshFailed(false), 2000);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const tabs = await fetchTabs();
      if (cancelled) {
        return;
      }
      setAvailability(tabs);

      if (!tabs.navigator) {
        setSelection({ kind: tabs.infra ? "method" : "generated" });
      } else if (!baselineEstablishedRef.current) {
        baselineEstablishedRef.current = true;
        const baseline = createBaselineState("navigator", "overview");
        currentNavStateRef.current = baseline;
        window.history.replaceState(baseline, "");
        setSelection({ kind: "overview" });
      }

      if (tabs.navigator) {
        const tree = await fetchNavigatorTree();
        if (cancelled) {
          return;
        }
        setNavigatorTree(tree);
        if (tree.sprintStatusAvailable) {
          try {
            const result = await fetchSprintStatus();
            if (!cancelled) {
              setSprintStatus(result);
            }
          } catch (error: unknown) {
            if (!cancelled) {
              setSprintStatusError(error instanceof Error ? error.message : String(error));
            }
          }
        }
      }

      for (const tabId of FOLDER_TAB_IDS) {
        if (!tabs[tabId]) {
          continue;
        }
        const tree = await fetchTree(tabId);
        if (cancelled || !tree) {
          continue;
        }
        const contents = await fetchContents(tabId, tree.path);
        if (cancelled) {
          return;
        }
        setTabStates((prev) => ({
          ...prev,
          [tabId]: {
            ...prev[tabId],
            tree,
            contents,
            selectedPath: tree.path,
            expandedPaths: new Set([tree.path]),
          },
        }));
        if (!tabs.navigator && tabId === "infra" && !baselineEstablishedRef.current) {
          baselineEstablishedRef.current = true;
          const baseline = createBaselineState("infra", tree.path);
          currentNavStateRef.current = baseline;
          window.history.replaceState(baseline, "");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const state = event.state as NavigationState | null;
      if (!state) {
        return;
      }
      currentNavStateRef.current = state;
      const next = selectionFromHistory(state, navigatorTree);
      setSelection(next);
      if (state.tab === "infra" || state.tab === "output") {
        const folderTabId: FolderTabId = state.tab;
        updateTabState(folderTabId, { selectedPath: state.path });
        void fetchContents(folderTabId, state.path).then((contents) => {
          updateTabState(folderTabId, { contents });
        });
      }
      if (state.openFile) {
        setOpenFile({ path: state.openFile, content: null, error: null });
        loadFileContent(state.tab, state.openFile);
      } else {
        setOpenFile(null);
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigatorTree]);

  const folderTab: FolderTabId | null =
    selection.kind === "method" ? "infra" : selection.kind === "generated" ? "output" : null;

  const prdEntry =
    selection.kind === "prd" ? findFolderEntry(navigatorTree?.prd ?? null, selection.path) : undefined;
  const architectureEntry =
    selection.kind === "architecture"
      ? findFolderEntry(navigatorTree?.architecture ?? null, selection.path)
      : undefined;

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "var(--color-bg-canvas)",
      }}
    >
      <Link
        href="#main-stage"
        sx={{
          position: "absolute",
          left: -9999,
          top: 8,
          zIndex: 2000,
          bgcolor: "var(--color-bg-raised)",
          color: "var(--color-text-default)",
          px: 2,
          py: 1,
          borderRadius: "var(--radius-control)",
          "&:focus": { left: 8 },
        }}
      >
        Skip to main content
      </Link>
      <AppHeader
        projectName={workspaceProjectName(navigatorTree, sprintStatus?.summary.project ?? null)}
        refreshing={refreshing}
        refreshFailed={refreshFailed}
        onRefresh={() => void handleRefresh()}
        onHelp={() => {
          setWelcomeOpen(false);
          setTourOpen(true);
        }}
      />
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <AppSidebar
          availability={availability}
          navigatorTree={navigatorTree}
          selection={selection}
          onSelect={(next) => applySelection(next)}
        />
        <Box
          component="main"
          id="main-stage"
          data-tour="main-stage"
          key={refreshToken}
          sx={{ flex: 1, display: "flex", overflow: "hidden", bgcolor: "var(--color-bg-canvas)" }}
        >
          {selection.kind === "overview" && (
            <Box sx={{ flex: 1, overflow: "auto" }}>
              <OverviewView
                tree={navigatorTree}
                sprintStatus={sprintStatus}
                sprintStatusError={sprintStatusError}
                onOpenSelection={(next) => applySelection(next)}
                onOpenFile={(path) => openFileDialog("navigator", "overview", path)}
              />
            </Box>
          )}
          {selection.kind === "sprint" && (
            <Box sx={{ flex: 1, overflow: "auto" }}>
              {sprintStatusError && !sprintStatus && (
                <Typography variant="body2" color="error" sx={{ p: 2 }}>
                  {sprintStatusError}
                </Typography>
              )}
              {!sprintStatus && !sprintStatusError && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  Loading sprint status…
                </Typography>
              )}
              {sprintStatus && (
                <SprintStatusView
                  data={sprintStatus}
                  onOpenFile={(path) => openFileDialog("navigator", "sprint-status", path)}
                />
              )}
            </Box>
          )}
          {selection.kind === "prd" && prdEntry && (
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <PrdDetailView
                entry={prdEntry}
                onOpenFile={(path) => openFileDialog("navigator", selection.path, path)}
              />
            </Box>
          )}
          {selection.kind === "architecture" && architectureEntry && (
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <ArchitectureDetailView
                entry={architectureEntry}
                onOpenFile={(path) => openFileDialog("navigator", selection.path, path)}
              />
            </Box>
          )}
          {folderTab && (
            <>
              <Box
                sx={{
                  width: 280,
                  overflow: "auto",
                  borderRight: "1px solid var(--color-border-default)",
                  bgcolor: "var(--color-bg-sidebar)",
                }}
              >
                <FolderTree
                  tree={tabStates[folderTab].tree}
                  expandedPaths={tabStates[folderTab].expandedPaths}
                  selectedPath={tabStates[folderTab].selectedPath}
                  onExpandedChange={(expandedPaths) => updateTabState(folderTab, { expandedPaths })}
                  onSelect={(path) => navigateFolder(folderTab, path)}
                />
              </Box>
              <Box sx={{ flex: 1, overflow: "auto" }}>
                <ContentsTable
                  key={`${folderTab}:${tabStates[folderTab].selectedPath ?? ""}`}
                  entries={tabStates[folderTab].contents}
                  onSelectFolder={(path) => navigateFolder(folderTab, path)}
                  onOpenFile={(path) =>
                    openFileDialog(folderTab, tabStates[folderTab].selectedPath ?? "", path)
                  }
                />
              </Box>
            </>
          )}
        </Box>
      </Box>
      <FileViewerDialog
        path={openFile?.path ?? null}
        content={openFile?.content ?? null}
        error={openFile?.error ?? null}
        onClose={closeFileDialog}
      />
      <WelcomeModal
        open={welcomeOpen}
        onStartTour={() => {
          writeOnboardingState("completed");
          setWelcomeOpen(false);
          setTourOpen(true);
        }}
        onSkip={() => {
          writeOnboardingState("skipped");
          setWelcomeOpen(false);
        }}
      />
      <GuidedTour
        open={tourOpen}
        onClose={(completed) => {
          writeOnboardingState(completed ? "completed" : "skipped");
          setTourOpen(false);
        }}
      />
    </Box>
  );
}
