import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import FolderTree from "./components/FolderTree.js";
import ContentsTable from "./components/ContentsTable.js";
import FileViewerDialog from "./components/FileViewerDialog.js";
import {
  fetchContents,
  fetchFileContent,
  fetchTabs,
  fetchTree,
  type ContentsEntry,
  type FolderTreeNode,
  type TabAvailability,
  type TabId,
} from "./api.js";
import { createBaselineState, statesEqual, type NavigationState } from "./navigationHistory.js";

interface FileDialogState {
  path: string;
  content: string | null;
  error: string | null;
}

interface TabViewState {
  tree: FolderTreeNode | null;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  contents: ContentsEntry[] | null;
}

function createEmptyTabState(): TabViewState {
  return { tree: null, expandedPaths: new Set(), selectedPath: null, contents: null };
}

const TAB_IDS: TabId[] = ["infra", "output"];
const TAB_LABELS: Record<TabId, string> = { infra: "Infra", output: "Output" };

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("infra");
  const [, setAvailability] = useState<TabAvailability | null>(null);
  const [tabStates, setTabStates] = useState<Record<TabId, TabViewState>>({
    infra: createEmptyTabState(),
    output: createEmptyTabState(),
  });
  const [openFile, setOpenFile] = useState<FileDialogState | null>(null);

  // The NavigationState the history stack is currently at, so `navigate` can tell whether
  // a call is a real change worth pushing (statesEqual) or a redundant re-click of the
  // already-active tab/folder (data-model.md's `statesEqual` row).
  const currentNavStateRef = useRef<NavigationState | null>(null);
  const baselineEstablishedRef = useRef(false);

  function updateTabState(tabId: TabId, patch: Partial<TabViewState>) {
    setTabStates((prev) => ({
      ...prev,
      [tabId]: { ...prev[tabId], ...patch },
    }));
  }

  // Single entry point for every tab/folder-selection change (Tabs' onChange, tree
  // clicks, table row clicks, and popstate restoration) — contracts/ui-behavior.md.
  const navigate = useCallback(
    (tab: TabId, path: string, options: { fromHistory?: boolean } = {}) => {
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

  // Fetches one file's content and applies it to `openFile` state, ignoring the result if
  // a different file has since been opened (matches the same stale-response guard the
  // initial-load effect already uses for tabs/trees/contents).
  function loadFileContent(tab: TabId, path: string) {
    void fetchFileContent(tab, path).then(
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
  // openFile (research.md § 6) — it never changes which folder/tab is active.
  function openFileDialog(path: string) {
    const nextState: NavigationState = {
      tab: activeTab,
      path: tabStates[activeTab].selectedPath ?? "",
      openFile: path,
    };
    currentNavStateRef.current = nextState;
    window.history.pushState(nextState, "");
    setOpenFile({ path, content: null, error: null });
    loadFileContent(activeTab, path);
  }

  // Closing — from the "X" icon, Escape, or backdrop-click — always steps history back
  // rather than clearing `openFile` directly (Clarifications session): the resulting
  // `popstate` event is what actually clears it, keeping history and UI in sync.
  function closeFileDialog() {
    window.history.back();
  }

  // Load tab availability, then each available tab's tree + its root's contents, once on
  // mount — so the Infra tab already shows its root contents as soon as it loads (FR-002).
  // Once Infra's root is known, establish the FR-012 baseline history entry.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const tabs = await fetchTabs();
      if (cancelled) {
        return;
      }
      setAvailability(tabs);

      for (const tabId of TAB_IDS) {
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
          const baseline = createBaselineState(tree.path);
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
      navigate(state.tab, state.path, { fromHistory: true });
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
  }, [navigate]);

  const activeState = tabStates[activeTab];

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Tabs
        value={activeTab}
        onChange={(_event, value: TabId) => navigate(value, tabStates[value].selectedPath ?? "")}
      >
        {TAB_IDS.map((tabId) => (
          <Tab key={tabId} value={tabId} label={TAB_LABELS[tabId]} />
        ))}
      </Tabs>
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Box sx={{ width: 280, overflow: "auto", borderRight: 1, borderColor: "divider" }}>
          <FolderTree
            tree={activeState.tree}
            expandedPaths={activeState.expandedPaths}
            selectedPath={activeState.selectedPath}
            onExpandedChange={(expandedPaths) => updateTabState(activeTab, { expandedPaths })}
            onSelect={(path) => navigate(activeTab, path)}
          />
        </Box>
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <ContentsTable
            key={`${activeTab}:${activeState.selectedPath ?? ""}`}
            entries={activeState.contents}
            onSelectFolder={(path) => navigate(activeTab, path)}
            onOpenFile={(path) => openFileDialog(path)}
          />
        </Box>
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
