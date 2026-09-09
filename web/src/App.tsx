import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import RefreshIcon from "@mui/icons-material/Refresh";
import FolderTree from "./components/FolderTree.js";
import ContentsTable from "./components/ContentsTable.js";
import FileViewerDialog from "./components/FileViewerDialog.js";
import NavigatorView from "./components/NavigatorView.js";
import {
  fetchContents,
  fetchFileContent,
  fetchRefresh,
  fetchTabs,
  fetchTree,
  type ContentsEntry,
  type FolderTreeNode,
  type NavigatorTree,
  type TabAvailability,
  type TabId,
} from "./api.js";
import { fetchNavigatorTree, findFolderEntry } from "./navigatorApi.js";
import { createBaselineState, statesEqual, type NavigationState } from "./navigationHistory.js";

interface FileDialogState {
  path: string;
  content: string | null;
  error: string | null;
}

// The folder-tree/contents-table state shape only ever applies to "infra"/"output" — the
// "navigator" tab has a fundamentally different model (a curated multi-root tree, not a
// folder mirror) and keeps its own separate state below, so it's deliberately excluded
// from this type rather than given a meaningless empty entry.
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

const TAB_IDS: TabId[] = ["navigator", "infra", "output"];
const FOLDER_TAB_IDS: FolderTabId[] = ["infra", "output"];
const TAB_LABELS: Record<TabId, string> = { navigator: "Navigator", infra: "Infra", output: "Output" };

export default function App() {
  // Optimistic default (feature 007 FR-001) — corrected to "infra" in the mount effect
  // below if the Navigator tab turns out not to be available (FR-002).
  const [activeTab, setActiveTab] = useState<TabId>("navigator");
  const [availability, setAvailability] = useState<TabAvailability | null>(null);
  const [tabStates, setTabStates] = useState<Record<FolderTabId, TabViewState>>({
    infra: createEmptyTabState(),
    output: createEmptyTabState(),
  });
  const [openFile, setOpenFile] = useState<FileDialogState | null>(null);

  // Navigator's own state — separate from `tabStates` (see `FolderTabId` above).
  const [navigatorTree, setNavigatorTree] = useState<NavigatorTree | null>(null);
  const [navigatorExpandedItems, setNavigatorExpandedItems] = useState<Set<string>>(new Set());
  const [navigatorSelectedItemId, setNavigatorSelectedItemId] = useState<string | null>(null);

  // Refresh control state (feature 014). `refreshToken` is bumped once per completed
  // refresh and applied as `key` on NavigatorDetailPane (via NavigatorView) so it remounts
  // and re-runs its own fetch effect (Sprint Status's or PrdDetailView's) from scratch —
  // contracts/ui-behavior.md.
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  // The NavigationState the history stack is currently at, so `navigate` can tell whether
  // a call is a real change worth pushing (statesEqual) or a redundant re-click of the
  // already-active tab/folder (data-model.md's `statesEqual` row).
  const currentNavStateRef = useRef<NavigationState | null>(null);
  const baselineEstablishedRef = useRef(false);

  function updateTabState(tabId: FolderTabId, patch: Partial<TabViewState>) {
    setTabStates((prev) => ({
      ...prev,
      [tabId]: { ...prev[tabId], ...patch },
    }));
  }

  // Single entry point for every folder-tab selection change (Tabs' onChange for
  // Infra/Output, tree clicks, table row clicks, and popstate restoration) —
  // contracts/ui-behavior.md. The Navigator tab uses `navigateNavigator` instead (below):
  // it doesn't have a folder path to fetch contents for.
  const navigate = useCallback(
    (tab: FolderTabId, path: string, options: { fromHistory?: boolean } = {}) => {
      const nextState: NavigationState = { tab, path };
      const isRedundant =
        currentNavStateRef.current !== null && statesEqual(currentNavStateRef.current, nextState);
      currentNavStateRef.current = nextState;

      setActiveTab(tab);
      if (path) {
        updateTabState(tab, { selectedPath: path });
        void fetchContents(tab, path).then((contents) => {
          updateTabState(tab, { contents });
        });
      }

      if (!options.fromHistory && !isRedundant) {
        window.history.pushState(nextState, "");
      }
    },
    [],
  );

  // Navigator's own equivalent of `navigate` — same NavigationState/pushState/redundancy
  // mechanism (contracts/ui-behavior.md's History integration section), but `itemId` is an
  // opaque node id (a PRD folder's real path, or "sprint-status"), never a folder to fetch
  // contents for.
  const navigateNavigator = useCallback(
    (itemId: string, options: { fromHistory?: boolean } = {}) => {
      const nextState: NavigationState = { tab: "navigator", path: itemId };
      const isRedundant =
        currentNavStateRef.current !== null && statesEqual(currentNavStateRef.current, nextState);
      currentNavStateRef.current = nextState;

      setActiveTab("navigator");
      if (itemId) {
        setNavigatorSelectedItemId(itemId);
      }

      if (!options.fromHistory && !isRedundant) {
        window.history.pushState(nextState, "");
      }
    },
    [],
  );

  // Fetches one file's content and applies it to `openFile` state, ignoring the result if
  // a different file has since been opened (matches the same stale-response guard the
  // initial-load effect already uses for tabs/trees/contents). `GET /api/file/:tab` only
  // recognizes "infra"/"output" (feature 004) — "navigator" isn't a folder root, so an
  // action item's resolved path (always an Output-tab path by construction, research.md
  // § 1/§ 3) is fetched through "output" under the hood, while the caller's own
  // NavigationState still records "navigator" so Back/X/Escape return there.
  function loadFileContent(tab: TabId, path: string) {
    const fetchTab = tab === "navigator" ? "output" : tab;
    void fetchFileContent(fetchTab, path).then(
      (content) => {
        setOpenFile((prev) => (prev && prev.path === path ? { ...prev, content } : prev));
      },
      (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        setOpenFile((prev) => (prev && prev.path === path ? { ...prev, error: message } : prev));
      },
    );
  }

  // Opening a file pushes a new history entry carrying the *current* tab/path plus
  // openFile (research.md § 6) — it never changes which folder/tab is active. `currentPath`
  // is supplied explicitly by the caller (Infra/Output pass `tabStates[tab].selectedPath`;
  // Navigator has no `tabStates` entry to look it up from, so it passes
  // `navigatorSelectedItemId` instead) so this works for any `TabId`, not just the
  // Infra/Output `FolderTabId` (research.md § 3).
  function openFileDialog(tab: TabId, currentPath: string, path: string) {
    const nextState: NavigationState = {
      tab,
      path: currentPath,
      openFile: path,
    };
    currentNavStateRef.current = nextState;
    window.history.pushState(nextState, "");
    setOpenFile({ path, content: null, error: null });
    loadFileContent(tab, path);
  }

  // Closing — from the "X" icon, Escape, or backdrop-click — always steps history back
  // rather than clearing `openFile` directly (Clarifications session): the resulting
  // `popstate` event is what actually clears it, keeping history and UI in sync.
  function closeFileDialog() {
    window.history.back();
  }

  // Invalidates the server's cached folder structure for every tab at once
  // (Clarifications) and re-fetches whatever is currently displayed
  // (contracts/ui-behavior.md). Each re-fetch below applies its own state update
  // independently as it resolves — no rollback if a sibling re-fetch later fails
  // ("Partial-failure semantics").
  async function handleRefresh() {
    if (refreshing) {
      return;
    }
    setRefreshing(true);
    setRefreshFailed(false);
    try {
      await fetchRefresh();

      const tabsPromise = fetchTabs().then((tabs) => setAvailability(tabs));

      const folderTabPromises = FOLDER_TAB_IDS.map(async (tabId) => {
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
          // The previously selected folder no longer exists post-refresh — fall back to
          // the tab's own root, matching the mount-time initial-load effect's own
          // fallback (FR-006).
          const contents = await fetchContents(tabId, tree.path);
          updateTabState(tabId, { tree, contents, selectedPath: tree.path });
        }
      });

      const navigatorPromise = fetchNavigatorTree().then((tree) => {
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
      });

      await Promise.all([tabsPromise, ...folderTabPromises, navigatorPromise]);
      setRefreshToken((token) => token + 1);
    } catch {
      setRefreshFailed(true);
      setTimeout(() => setRefreshFailed(false), 2000);
    } finally {
      setRefreshing(false);
    }
  }

  // Load tab availability, then each available tab's tree + its root's contents, once on
  // mount — so the Infra tab already shows its root contents as soon as it loads (FR-002).
  // Once the resolved default tab is known, establish the FR-012 baseline history entry
  // (feature 007: that's Navigator when available — immediately, since its "nothing
  // selected" state needs no further fetch — or Infra, once its root path is known, when
  // falling back).
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const tabs = await fetchTabs();
      if (cancelled) {
        return;
      }
      setAvailability(tabs);

      if (!tabs.navigator) {
        setActiveTab("infra");
      } else if (!baselineEstablishedRef.current) {
        baselineEstablishedRef.current = true;
        const baseline = createBaselineState("navigator", "");
        currentNavStateRef.current = baseline;
        window.history.replaceState(baseline, "");
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
            tree,
            expandedPaths: new Set([tree.path]),
            selectedPath: tree.path,
            contents,
          },
        }));

        if (tabId === "infra" && !baselineEstablishedRef.current) {
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

  // Restore state on Back/Forward without pushing a new entry (research.md § 4). Does not
  // read any pre-existing history.state on mount — a reload always starts at the default
  // view via the effect above (research.md § 3).
  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const state = event.state as NavigationState | null;
      if (!state) {
        return;
      }
      if (state.tab === "navigator") {
        navigateNavigator(state.path, { fromHistory: true });
      } else {
        navigate(state.tab, state.path, { fromHistory: true });
      }
      if (state.openFile) {
        const filePath = state.openFile;
        setOpenFile({ path: filePath, content: null, error: null });
        loadFileContent(state.tab, filePath);
      } else {
        setOpenFile(null);
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, navigateNavigator]);

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Refresh control sits in the same row as the tabs, on the right, vertically
          centered against their own height rather than a hardcoded pixel value
          (feature 014, research.md § 5). */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Tabs
          value={activeTab}
          onChange={(_event, value: TabId) => {
            if (value === "navigator") {
              navigateNavigator(navigatorSelectedItemId ?? "");
            } else {
              navigate(value, tabStates[value].selectedPath ?? "");
            }
          }}
        >
          {/* Hides a tab whose folder isn't present (feature 006/007 FR-002) — shows all
              three optimistically before `/api/tabs` resolves (`availability === null`),
              matching this app's existing tolerance for a brief loading flash elsewhere. */}
          {TAB_IDS.filter((tabId) => availability === null || availability[tabId]).map((tabId) => (
            <Tab key={tabId} value={tabId} label={TAB_LABELS[tabId]} />
          ))}
        </Tabs>
        <IconButton
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh"
          sx={{
            mr: 1,
            color: refreshFailed ? "error.main" : "inherit",
            "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
            animation: refreshing ? "spin 1s linear infinite" : "none",
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {activeTab === "navigator" ? (
          <NavigatorView
            tree={navigatorTree}
            expandedItems={navigatorExpandedItems}
            selectedItemId={navigatorSelectedItemId}
            onExpandedChange={setNavigatorExpandedItems}
            onNavigate={(itemId) => navigateNavigator(itemId)}
            onOpenFile={(path) => openFileDialog("navigator", navigatorSelectedItemId ?? "", path)}
            refreshToken={refreshToken}
          />
        ) : (
          <>
            <Box sx={{ width: 280, overflow: "auto", borderRight: 1, borderColor: "divider" }}>
              <FolderTree
                tree={tabStates[activeTab].tree}
                expandedPaths={tabStates[activeTab].expandedPaths}
                selectedPath={tabStates[activeTab].selectedPath}
                onExpandedChange={(expandedPaths) => updateTabState(activeTab, { expandedPaths })}
                onSelect={(path) => navigate(activeTab, path)}
              />
            </Box>
            <Box sx={{ flex: 1, overflow: "auto" }}>
              <ContentsTable
                key={`${activeTab}:${tabStates[activeTab].selectedPath ?? ""}`}
                entries={tabStates[activeTab].contents}
                onSelectFolder={(path) => navigate(activeTab, path)}
                onOpenFile={(path) => openFileDialog(activeTab, tabStates[activeTab].selectedPath ?? "", path)}
              />
            </Box>
          </>
        )}
      </Box>
      <FileViewerDialog
        path={openFile?.path ?? null}
        content={openFile?.content ?? null}
        error={openFile?.error ?? null}
        onClose={closeFileDialog}
      />
    </Box>
  );
}
