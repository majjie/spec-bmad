import type { NavigatorTree, PrdDateEntry, PrdNonConformingEntry } from "./api.js";

/**
 * UI navigation sections (feature 018). Curated docs open from Requirements /
 * Architecture (artifact-type first); method/generated remain folder explorers.
 * Sprint is workspace-scoped. Slug lineages nest under a document type only when
 * more than one named slug exists in the tree.
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

export type DocSectionId = "requirements" | "architecture";

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

export function slugNavSummary(
  group: Pick<ProjectNavGroup, "key" | "requirements" | "architecture">,
): string | undefined {
  if (group.key === "_other") {
    return "Unsorted folders";
  }
  const parts: string[] = [];
  if (group.requirements.length > 0) {
    const n = group.requirements.length;
    parts.push(`${n} PRD${n === 1 ? "" : "s"}`);
  }
  if (group.architecture.length > 0) {
    const n = group.architecture.length;
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
 * Group PRD + architecture folders by slug lineage.
 * `prd-harbor` and `architecture-harbor` become a single "Harbor" group.
 * Used for nesting under Requirements/Architecture when multiple named slugs exist.
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

  return [...map.values()].sort((a, b) => {
    if (a.key === "_other") {
      return 1;
    }
    if (b.key === "_other") {
      return -1;
    }
    return a.title.localeCompare(b.title);
  });
}

export function namedSlugGroups(groups: ReadonlyArray<ProjectNavGroup>): ProjectNavGroup[] {
  return groups.filter((group) => group.key !== "_other");
}

export function hasMultipleNamedSlugs(groups: ReadonlyArray<ProjectNavGroup>): boolean {
  return namedSlugGroups(groups).length > 1;
}

/**
 * Single project label for the header / Overview.
 * Prefers sprint `project`, else the sole named slug; null when multi-slug and no sprint.
 */
export function workspaceProjectName(
  tree: NavigatorTree | null,
  sprintProject: string | null,
): string | null {
  if (sprintProject && sprintProject.trim()) {
    return titleCaseProject(sprintProject.trim());
  }
  const named = namedSlugGroups(buildProjectNav(tree));
  if (named.length === 1) {
    return named[0]!.title;
  }
  return null;
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

export function sectionForSelection(selection: ShellSelection): DocSectionId | undefined {
  if (selection.kind === "prd") {
    return "requirements";
  }
  if (selection.kind === "architecture") {
    return "architecture";
  }
  return undefined;
}

export function slugKeyForSelection(
  groups: ReadonlyArray<ProjectNavGroup>,
  selection: ShellSelection,
): string | undefined {
  if (selection.kind !== "prd" && selection.kind !== "architecture") {
    return undefined;
  }
  return groups.find(
    (group) =>
      group.requirements.some((leaf) => leaf.path === selection.path) ||
      group.architecture.some((leaf) => leaf.path === selection.path) ||
      group.other.some((entry) => entry.path === selection.path),
  )?.key;
}

export function expandKeyForSlug(section: DocSectionId, slugKey: string): string {
  return `${section}:${slugKey}`;
}

export function sectionHasLeaves(groups: ReadonlyArray<ProjectNavGroup>, section: DocSectionId): boolean {
  if (section === "requirements") {
    return groups.some((g) => g.requirements.length > 0 || g.other.length > 0);
  }
  return groups.some((g) => g.architecture.length > 0);
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
 * When selection moves into a document, open its section (and slug nest if multi).
 * Collapsing the same section/slug must not bounce it back open.
 */
export function expandForDocSelection(
  expanded: ReadonlySet<string>,
  previousKeys: ReadonlySet<string>,
  nextKeys: ReadonlyArray<string>,
): Set<string> {
  let next = new Set(expanded);
  for (const key of nextKeys) {
    if (!previousKeys.has(key)) {
      next = ensureExpandedForSelection(next, key);
    }
  }
  return next;
}

export function keysForDocSelection(
  groups: ReadonlyArray<ProjectNavGroup>,
  selection: ShellSelection,
): string[] {
  const section = sectionForSelection(selection);
  if (!section) {
    return [];
  }
  const keys: string[] = [section];
  if (hasMultipleNamedSlugs(groups)) {
    const slug = slugKeyForSelection(groups, selection);
    if (slug && slug !== "_other") {
      keys.push(expandKeyForSlug(section, slug));
    }
  }
  return keys;
}

/** Seed Requirements / Architecture (and first named slug nests when multi) once. */
export function seedExpandedIfNeeded(
  expanded: ReadonlySet<string>,
  groups: ReadonlyArray<ProjectNavGroup>,
  seeded: boolean,
): { expanded: Set<string>; seeded: boolean } {
  if (seeded) {
    return { expanded: new Set(expanded), seeded: true };
  }
  const next = new Set<string>();
  if (sectionHasLeaves(groups, "requirements")) {
    next.add("requirements");
  }
  if (sectionHasLeaves(groups, "architecture")) {
    next.add("architecture");
  }
  if (hasMultipleNamedSlugs(groups)) {
    const first = namedSlugGroups(groups)[0];
    if (first) {
      if (first.requirements.length > 0) {
        next.add(expandKeyForSlug("requirements", first.key));
      }
      if (first.architecture.length > 0) {
        next.add(expandKeyForSlug("architecture", first.key));
      }
    }
  }
  if (next.size === 0) {
    return { expanded: new Set(expanded), seeded: false };
  }
  return { expanded: next, seeded: true };
}
