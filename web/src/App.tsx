import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import FolderTree from "./components/FolderTree.js";
import ContentsTable from "./components/ContentsTable.js";
import {
  fetchContents,
  fetchTabs,
  fetchTree,
  type ContentsEntry,
  type FolderTreeNode,
  type TabAvailability,
  type TabId,
} from "./api.js";

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

  // Load tab availability, then each available tab's tree + its root's contents, once on
  // mount — so the Infra tab already shows its root contents as soon as it loads (FR-002).
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
          [tabId]: { tree, expandedPaths: new Set(), selectedPath: tree.path, contents },
        }));
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeState = tabStates[activeTab];

  function updateTabState(tabId: TabId, patch: Partial<TabViewState>) {
    setTabStates((prev) => ({
      ...prev,
      [tabId]: { ...prev[tabId], ...patch },
    }));
  }

  async function handleSelect(tabId: TabId, path: string) {
    updateTabState(tabId, { selectedPath: path });
    const contents = await fetchContents(tabId, path);
    updateTabState(tabId, { contents });
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Tabs
        value={activeTab}
        onChange={(_event, value: TabId) => setActiveTab(value)}
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
            onSelect={(path) => void handleSelect(activeTab, path)}
          />
        </Box>
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <ContentsTable
            key={`${activeTab}:${activeState.selectedPath ?? ""}`}
            entries={activeState.contents}
            onSelectFolder={(path) => void handleSelect(activeTab, path)}
          />
        </Box>
      </Box>
    </Box>
  );
}
