import type { NavigatorTree, PrdDateEntry, PrdNonConformingEntry } from "./api.js";

/**
 * UI navigation sections (feature 018/019). Curated docs open from the project accordion;
 * method/generated remain folder explorers.
 */
export type ShellSection =
  | "overview"
  | "requirements"
  | "architecture"
  | "sprint"
  | "method"
  | "generated";

export type ShellSelection =
  | { kind: "overview" }
  | { kind: "sprint" }
  | { kind: "prd"; path: string }
  | { kind: "architecture"; path: string }
  | { kind: "method" }
  | { kind: "generated" };

export interface ProjectNavLeaf {
  path: string;
  date: string;
  folderName: string;
  isLatest: boolean;
}

export interface ProjectNavGroup {
  /** Stable key, e.g. "harbor" (prefixes stripped) */
  key: string;
  /** Display title, e.g. "Harbor" */
  title: string;
  requirements: ProjectNavLeaf[];
  architecture: ProjectNavLeaf[];
  /** Whether workspace sprint-status belongs under this project */
  hasSprint: boolean;
  other: PrdNonConformingEntry[];
}

/** Strip conventional BMAD folder prefixes for human sidebar/tree labels. */
export function humanizeProjectSlug(slug: string): string {
  return slug
    .replace(/^prd-/i, "")
    .replace(/^architecture-/i, "")
    .replace(/-/g, " ");
}

export function normalizeProjectKey(folderProjectSlug: string): string {
  return folderProjectSlug.replace(/^prd-/i, "").replace(/^architecture-/i, "").toLowerCase();
}

export function titleCaseProject(slugOrKey: string): string {
  return humanizeProjectSlug(slugOrKey)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function toLeaves(dates: PrdDateEntry[]): ProjectNavLeaf[] {
  return dates.map((entry, index) => ({
    path: entry.path,
    date: entry.date,
    folderName: entry.folderName,
    isLatest: index === 0,
  }));
}

/**
 * Merge PRD + architecture groupings into one project accordion model.
 * `prd-harbor` and `architecture-harbor` become a single "Harbor" project.
 * Sprint attaches to the project whose key matches `sprintProject` (case-insensitive),
 * otherwise to the first project when a sprint file exists.
 */
export function buildProjectNav(
  tree: NavigatorTree | null,
  sprintProject: string | null,
): ProjectNavGroup[] {
  if (!tree) {
    return [];
  }

  const map = new Map<string, ProjectNavGroup>();

  function ensure(key: string): ProjectNavGroup {
    let group = map.get(key);
    if (!group) {
      group = {
        key,
        title: titleCaseProject(key),
        requirements: [],
        architecture: [],
        hasSprint: false,
        other: [],
      };
      map.set(key, group);
    }
    return group;
  }

  if (tree.prd) {
    for (const project of tree.prd.projects) {
      const key = normalizeProjectKey(project.project);
      const group = ensure(key);
      group.requirements = toLeaves(project.dates);
    }
    for (const entry of tree.prd.nonConforming) {
      const key = "_other";
      const group = ensure(key);
      group.title = "Other";
      group.other.push(entry);
    }
  }

  if (tree.architecture) {
    for (const project of tree.architecture.projects) {
      const key = normalizeProjectKey(project.project);
      const group = ensure(key);
      group.architecture = toLeaves(project.dates);
    }
    for (const entry of tree.architecture.nonConforming) {
      const key = "_other";
      const group = ensure(key);
      group.title = "Other";
      if (!group.other.some((o) => o.path === entry.path)) {
        group.other.push(entry);
      }
    }
  }

  const groups = [...map.values()].sort((a, b) => {
    if (a.key === "_other") {
      return 1;
    }
    if (b.key === "_other") {
      return -1;
    }
    return a.title.localeCompare(b.title);
  });

  if (tree.sprintStatusAvailable) {
    const sprintKey = sprintProject ? normalizeProjectKey(sprintProject) : null;
    const match = sprintKey ? groups.find((g) => g.key === sprintKey) : undefined;
    const target = match ?? groups.find((g) => g.key !== "_other") ?? groups[0];
    if (target) {
      target.hasSprint = true;
    }
  }

  return groups;
}

export function formatStatusLabel(status: string): string {
  switch (status) {
    case "done":
      return "Done";
    case "review":
      return "In review";
    case "in-progress":
      return "In progress";
    case "backlog":
      return "Backlog";
    default:
      return status;
  }
}
