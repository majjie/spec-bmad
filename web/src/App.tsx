import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import FolderTree from "./components/FolderTree.js";
import ContentsTable from "./components/ContentsTable.js";
import FileViewerDialog from "./components/FileViewerDialog.js";
import NavigatorView from "./components/NavigatorView.js";
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
import { type ShellSection } from "./shell.js";

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

function inferSectionFromHistory(
  state: NavigationState,
  tree: NavigatorTree | null,
): ShellSection {
  if (state.tab === "infra") {
    return "method";
  }
  if (state.tab === "output") {
    return "generated";
  }
  if (state.path === "sprint-status") {
    return "sprint";
  }
  if (state.path === "" || state.path === "overview") {
    return "overview";
  }
  if (findFolderEntry(tree?.prd ?? null, state.path)) {
    return "requirements";
  }
  if (findFolderEntry(tree?.architecture ?? null, state.path)) {
    return "architecture";
  }
  return "overview";
}

export default function App() {
  const [activeSection, setActiveSection] = useState<ShellSection>("overview");
  const [availability, setAvailability] = useState<TabAvailability | null>(null);
  const [tabStates, setTabStates] = useState<Record<FolderTabId, TabViewState>>({
    infra: createEmptyTabState(),
    output: createEmptyTabState(),
  });
  const [openFile, setOpenFile] = useState<FileDialogState | null>(null);

  const [navigatorTree, setNavigatorTree] = useState<NavigatorTree | null>(null);
  const [navigatorExpandedItems, setNavigatorExpandedItems] = useState<Set<string>>(new Set());
  const [navigatorSelectedItemId, setNavigatorSelectedItemId] = useState<string | null>(null);

  const [sprintStatus, setSprintStatus] = useState<SprintStatusResult | null>(null);
  const [sprintStatusError, setSprintStatusError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);

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

  const navigateFolder = useCallback(
    (tab: FolderTabId, path: string, options: { fromHistory?: boolean } = {}) => {
      setActiveSection(tab === "infra" ? "method" : "generated");
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

  const navigateNavigator = useCallback(
    (section: ShellSection, itemId: string, options: { fromHistory?: boolean } = {}) => {
      setActiveSection(section);
      setNavigatorSelectedItemId(itemId === "overview" || itemId === "" ? null : itemId);
      const path = itemId === "" ? "overview" : itemId;
      pushHistory({ tab: "navigator", path }, options.fromHistory);
    },
    [pushHistory],
  );

  function loadFileContent(tab: TabId, path: string) {
    void fetchFileContent(tab, path).then(
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
      if (result.summary.project) {
        setProjectName(result.summary.project);
      }
    } catch (error: unknown) {
      setSprintStatusError(error instanceof Error ? error.message : String(error));
    }
  }

  function handleSelectSection(section: ShellSection, itemId?: string) {
    if (section === "overview") {
      navigateNavigator("overview", "overview");
      if (navigatorTree?.sprintStatusAvailable) {
        void loadSprintIfNeeded();
      }
      return;
    }
    if (section === "sprint") {
      navigateNavigator("sprint", "sprint-status");
      void loadSprintIfNeeded();
      return;
    }
    if (section === "requirements") {
      navigateNavigator("requirements", itemId ?? "");
      return;
    }
    if (section === "architecture") {
      navigateNavigator("architecture", itemId ?? "");
      return;
    }
    if (section === "method") {
      navigateFolder("infra", tabStates.infra.selectedPath ?? tabStates.infra.tree?.path ?? "");
      return;
    }
    if (section === "generated") {
      navigateFolder("output", tabStates.output.selectedPath ?? tabStates.output.tree?.path ?? "");
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
      setNavigatorSelectedItemId((current) => {
        if (current === null) {
          return null;
        }
        if (current === "sprint-status") {
          return tree.sprintStatusAvailable ? current : null;
        }
        return findFolderEntry(tree.prd, current) || findFolderEntry(tree.architecture, current)
          ? current
          : null;
      });

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
        setActiveSection(tabs.infra ? "method" : "generated");
      } else if (!baselineEstablishedRef.current) {
        baselineEstablishedRef.current = true;
        const baseline = createBaselineState("navigator", "overview");
        currentNavStateRef.current = baseline;
        window.history.replaceState(baseline, "");
        setActiveSection("overview");
      }

      if (tabs.navigator) {
        const tree = await fetchNavigatorTree();
        if (cancelled) {
          return;
        }
        setNavigatorTree(tree);
        setNavigatorExpandedItems(
          new Set([
            ...(tree.prd ? ["prd"] : []),
            ...(tree.architecture ? ["architecture"] : []),
            ...(tree.sprintStatusAvailable ? ["sprint-status"] : []),
          ]),
        );
        if (tree.sprintStatusAvailable) {
          try {
            const result = await fetchSprintStatus();
            if (!cancelled) {
              setSprintStatus(result);
              if (result.summary.project) {
                setProjectName(result.summary.project);
              }
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
      const section = inferSectionFromHistory(state, navigatorTree);
      setActiveSection(section);
      currentNavStateRef.current = state;
      if (state.tab === "navigator") {
        setNavigatorSelectedItemId(
          state.path === "overview" || state.path === "" ? null : state.path,
        );
      } else {
        const folder = state.tab;
        updateTabState(folder, { selectedPath: state.path });
        void fetchContents(folder, state.path).then((contents) => {
          updateTabState(folder, { contents });
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
    activeSection === "method" ? "infra" : activeSection === "generated" ? "output" : null;

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
          borderRadius: 1,
          "&:focus": { left: 8 },
        }}
      >
        Skip to main content
      </Link>
      <AppHeader
        projectName={projectName}
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
          activeSection={activeSection}
          onSelect={(section) => handleSelectSection(section)}
        />
        <Box
          component="main"
          id="main-stage"
          data-tour="main-stage"
          sx={{ flex: 1, display: "flex", overflow: "hidden", bgcolor: "var(--color-bg-canvas)" }}
        >
          {activeSection === "overview" && (
            <Box sx={{ flex: 1, overflow: "auto" }}>
              <OverviewView
                tree={navigatorTree}
                sprintStatus={sprintStatus}
                sprintStatusError={sprintStatusError}
                onOpenSection={(section, itemId) => handleSelectSection(section, itemId)}
                onOpenFile={(path) => openFileDialog("navigator", "overview", path)}
              />
            </Box>
          )}
          {(activeSection === "requirements" ||
            activeSection === "architecture" ||
            activeSection === "sprint") && (
            <NavigatorView
              tree={navigatorTree}
              expandedItems={navigatorExpandedItems}
              selectedItemId={navigatorSelectedItemId}
              onExpandedChange={setNavigatorExpandedItems}
              onNavigate={(itemId) => {
                if (itemId === "sprint-status") {
                  navigateNavigator("sprint", itemId);
                  void loadSprintIfNeeded();
                } else if (findFolderEntry(navigatorTree?.architecture ?? null, itemId)) {
                  navigateNavigator("architecture", itemId);
                } else {
                  navigateNavigator("requirements", itemId);
                }
              }}
              onOpenFile={(path) =>
                openFileDialog("navigator", navigatorSelectedItemId ?? "", path)
              }
              refreshToken={refreshToken}
              focusRoot={
                activeSection === "requirements"
                  ? "prd"
                  : activeSection === "architecture"
                    ? "architecture"
                    : "sprint"
              }
              sprintStatus={sprintStatus}
              sprintStatusError={sprintStatusError}
            />
          )}
          {folderTab && (
            <>
              <Box
                sx={{
                  width: 280,
                  overflow: "auto",
                  borderRight: "1px solid var(--color-border-default)",
                  bgcolor: "var(--color-bg-surface)",
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
