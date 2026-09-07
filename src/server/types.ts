export type TabId = "infra" | "output";

export interface TabAvailability {
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
