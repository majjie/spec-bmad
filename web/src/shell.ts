import type { NavigatorTree, PrdDateEntry, PrdNonConformingEntry } from "./api.js";

/**
 * UI navigation sections (feature 018/019). Curated docs open from the product accordion;
 * method/generated remain folder explorers. Sprint is workspace-scoped.
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
  other: PrdNonConformingEntry[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** ISO `YYYY-MM-DD` → `1 Sep 2026`; anything else is returned unchanged. */
export function formatRunDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return isoDate;
  }
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) {
    return isoDate;
  }
  return `${Number(match[3])} ${month} ${match[1]}`;
}

export function formatArtifactLeafLabel(
  leaf: Pick<ProjectNavLeaf, "date" | "folderName" | "isLatest">,
  kind: "prd" | "architecture",
): string {
  const date = leaf.date ? formatRunDate(leaf.date) : leaf.folderName;
  if (!leaf.isLatest) {
    return date;
  }
  return kind === "prd" ? `${date} · latest PRD` : `${date} · latest architecture`;
}

export function productNavSummary(
  product: Pick<ProjectNavGroup, "key" | "requirements" | "architecture">,
): string | undefined {
  if (product.key === "_other") {
    return "Unsorted folders";
  }
  const parts: string[] = [];
  if (product.requirements.length > 0) {
    const n = product.requirements.length;
    parts.push(`${n} PRD${n === 1 ? "" : "s"}`);
  }
  if (product.architecture.length > 0) {
    const n = product.architecture.length;
    parts.push(`${n} architecture${n === 1 ? "" : "s"}`);
  }
  return parts.length > 0 ? parts.join(" · ") : undefined;
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
 * Merge PRD + architecture groupings into one product accordion model.
 * `prd-harbor` and `architecture-harbor` become a single "Harbor" product.
 * Sprint is workspace-scoped and is not attached here.
 */
export function buildProjectNav(tree: NavigatorTree | null): ProjectNavGroup[] {
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

/** First named product to seed open — skip the unsorted bucket. */
export function initialExpandedProjectKey(
  projects: ReadonlyArray<Pick<ProjectNavGroup, "key">>,
): string | null {
  if (projects.length === 0) {
    return null;
  }
  const named = projects.find((project) => project.key !== "_other");
  return (named ?? projects[0]!).key;
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
  return undefined;
}

/**
 * Open the product that owns a newly chosen selection. Passing `undefined` leaves
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
 * Expand only when the selection moves to a different product. Collapsing the
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
  projects: ReadonlyArray<Pick<ProjectNavGroup, "key">>,
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
