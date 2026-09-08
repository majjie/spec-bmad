import type { PrdGroupingResult } from "../navigator/prd-grouping.js";

export type TabId = "navigator" | "infra" | "output";

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

export interface NavigatorTree {
  prd: PrdGroupingResult | null;
  sprintStatusAvailable: boolean;
}
