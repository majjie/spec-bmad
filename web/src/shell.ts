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

/** Action items still open - anything other than exactly "done". */
export function countOpenActionItems(items: { status: string | null }[]): number {
  return items.filter((item) => item.status !== "done").length;
}

export interface ProjectCoverageRow {
  key: string;
  title: string;
  requirementsCount: number;
  latestRequirementDate: string;
  architectureCount: number;
  latestArchitectureDate: string;
  hasSprint: boolean;
}

/** First project to seed open - sprint owner if present, otherwise the first group. */
export function initialExpandedProjectKey(
  projects: ReadonlyArray<Pick<ProjectNavGroup, "key" | "hasSprint">>,
): string | null {
  if (projects.length === 0) {
    return null;
  }
  const withSprint = projects.find((project) => project.hasSprint);
  return (withSprint ?? projects[0]!).key;
}

export function toggleExpandedKey(expanded: ReadonlySet<string>, key: string): Set<string> {
  const next = new Set(expanded);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  return next;
}

export function projectKeyForSelection(
  projects: ReadonlyArray<ProjectNavGroup>,
  selection: ShellSelection,
): string | undefined {
  if (selection.kind === "prd" || selection.kind === "architecture") {
    return projects.find(
      (project) =>
        project.requirements.some((leaf) => leaf.path === selection.path) ||
        project.architecture.some((leaf) => leaf.path === selection.path) ||
        project.other.some((entry) => entry.path === selection.path),
    )?.key;
  }
  if (selection.kind === "sprint") {
    return projects.find((project) => project.hasSprint)?.key;
  }
  return undefined;
}

/**
 * Open the project that owns a newly chosen selection. Passing `undefined` leaves
 * the set unchanged so a user collapse is not re-seeded.
 */
export function ensureExpandedForSelection(
  expanded: ReadonlySet<string>,
  key: string | undefined,
): Set<string> {
  if (!key || expanded.has(key)) {
    return new Set(expanded);
  }
  const next = new Set(expanded);
  next.add(key);
  return next;
}

/**
 * Expand only when the selection moves to a different project. Collapsing the
 * accordion for the current selection must not bounce it back open.
 */
export function expandForSelectionChange(
  expanded: ReadonlySet<string>,
  previousOwnerKey: string | undefined,
  nextOwnerKey: string | undefined,
): Set<string> {
  if (!nextOwnerKey || nextOwnerKey === previousOwnerKey) {
    return new Set(expanded);
  }
  return ensureExpandedForSelection(expanded, nextOwnerKey);
}

/** Seed the first open accordion once. Later empty sets are a user collapse. */
export function seedExpandedIfNeeded(
  expanded: ReadonlySet<string>,
  projects: ReadonlyArray<Pick<ProjectNavGroup, "key" | "hasSprint">>,
  seeded: boolean,
): { expanded: Set<string>; seeded: boolean } {
  if (seeded) {
    return { expanded: new Set(expanded), seeded: true };
  }
  const key = initialExpandedProjectKey(projects);
  if (!key) {
    return { expanded: new Set(expanded), seeded: false };
  }
  return { expanded: new Set([key]), seeded: true };
}

/** Named products only - unsorted folders stay out of the overview scan. */
export function buildProjectCoverage(groups: ProjectNavGroup[]): ProjectCoverageRow[] {
  return groups
    .filter((group) => group.key !== "_other")
    .map((group) => ({
      key: group.key,
      title: group.title,
      requirementsCount: group.requirements.length,
      latestRequirementDate: group.requirements[0]?.date ?? "",
      architectureCount: group.architecture.length,
      latestArchitectureDate: group.architecture[0]?.date ?? "",
      hasSprint: group.hasSprint,
    }));
}
