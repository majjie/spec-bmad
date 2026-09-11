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
  // Reuses the exact same PRD grouping shape for architecture folders too - a deliberate
  // choice, not an oversight (research.md § 2, feature 015): the underlying grouping is
  // already artifact-agnostic, so a parallel, differently-named type would be purely
  // cosmetic.
  architecture: PrdGroupingResult | null;
  sprintStatusAvailable: boolean;
}
