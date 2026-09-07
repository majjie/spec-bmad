export type ArtifactNodeType = "file" | "folder";

export interface ArtifactNode {
  name: string;
  path: string;
  type: ArtifactNodeType;
  children?: ArtifactNode[];
}

export interface ProjectRoot {
  path: string;
  bmadFolderPath: string | null;
  bmadOutputFolderPath: string | null;
}

export type CacheEntryStatus = "fresh" | "stale";

export interface CacheEntry {
  tree: ArtifactNode;
  status: CacheEntryStatus;
}

export interface HierarchyCache {
  get(root: ProjectRoot): Promise<ArtifactNode[]>;
  invalidate(root: ProjectRoot): void;
}

export type DiscoveryResultKind =
  | "valid"
  | "invalid-with-candidates"
  | "invalid-no-candidates";

export interface DiscoveryCandidate {
  root: ProjectRoot;
  suggestedInvocation: string;
}

export interface DiscoveryResult {
  kind: DiscoveryResultKind;
  target: string;
  root: ProjectRoot | null;
  candidates: DiscoveryCandidate[];
}
