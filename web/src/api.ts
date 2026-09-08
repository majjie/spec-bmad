export interface TabAvailability {
  navigator: boolean;
  infra: boolean;
  output: boolean;
}

export interface FolderTreeNode {
  name: string;
  path: string;
  children: FolderTreeNode[];
}

export type ContentsEntryType = "file" | "folder";

export interface ContentsEntry {
  name: string;
  path: string;
  type: ContentsEntryType;
  size: number | null;
  createdAt: string;
  updatedAt: string;
}

export type TabId = "navigator" | "infra" | "output";

export interface PrdDateEntry {
  date: string;
  folderName: string;
  path: string;
}

export interface PrdProjectGroup {
  project: string;
  dates: PrdDateEntry[];
}

export interface PrdNonConformingEntry {
  folderName: string;
  path: string;
}

export interface PrdGroupingResult {
  projects: PrdProjectGroup[];
  nonConforming: PrdNonConformingEntry[];
}

export interface NavigatorTree {
  prd: PrdGroupingResult | null;
  sprintStatusAvailable: boolean;
}

export interface SprintStatusSummary {
  generated: string;
  lastUpdated: string;
  project: string;
  projectKey: string;
  trackingSystem: string;
  storyLocation: string;
  activeEpic: string;
}

export interface StoryStatus {
  key: string;
  status: string;
}

export interface EpicStatusGroup {
  epicKey: string;
  status: string;
  stories: StoryStatus[];
  retrospectiveStatus: string | null;
}

export interface SprintStatusResult {
  summary: SprintStatusSummary;
  epics: EpicStatusGroup[];
}

export async function fetchTabs(): Promise<TabAvailability> {
  const response = await fetch("/api/tabs");
  if (!response.ok) {
    throw new Error(`GET /api/tabs failed with ${response.status}`);
  }
  return (await response.json()) as TabAvailability;
}

export async function fetchTree(tab: TabId): Promise<FolderTreeNode | null> {
  const response = await fetch(`/api/tree/${tab}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`GET /api/tree/${tab} failed with ${response.status}`);
  }
  return (await response.json()) as FolderTreeNode;
}

export async function fetchContents(tab: TabId, path: string): Promise<ContentsEntry[]> {
  const response = await fetch(`/api/contents/${tab}?path=${encodeURIComponent(path)}`);
  if (!response.ok) {
    throw new Error(`GET /api/contents/${tab} failed with ${response.status}`);
  }
  return (await response.json()) as ContentsEntry[];
}

export async function fetchFileContent(tab: TabId, path: string): Promise<string> {
  const response = await fetch(`/api/file/${tab}?path=${encodeURIComponent(path)}`);
  if (!response.ok) {
    if (response.status === 415) {
      throw new Error("This file doesn't look like text, so it can't be previewed.");
    }
    throw new Error(`GET /api/file/${tab} failed with ${response.status}`);
  }
  return await response.text();
}
