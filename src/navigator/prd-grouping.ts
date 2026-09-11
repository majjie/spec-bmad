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

const PROJECT_DATE_PATTERN = /^(.+)-(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Groups PRD folder names by project and date, per data-model.md and research.md § 3.
 * Project grouping is case-sensitive (exact string key); a folder name matches only when
 * a non-empty project prefix precedes the trailing YYYY-MM-DD digits - a bare date alone
 * doesn't match, so it falls through to nonConforming.
 */
export function groupPrdFolders(entries: { name: string; path: string }[]): PrdGroupingResult {
  const projectMap = new Map<string, PrdDateEntry[]>();
  const nonConforming: PrdNonConformingEntry[] = [];

  for (const entry of entries) {
    const match = entry.name.match(PROJECT_DATE_PATTERN);
    if (!match) {
      nonConforming.push({ folderName: entry.name, path: entry.path });
      continue;
    }

    const [, project, year, month, day] = match;
    const dateEntry: PrdDateEntry = {
      date: `${year}-${month}-${day}`,
      folderName: entry.name,
      path: entry.path,
    };

    const existing = projectMap.get(project ?? "");
    if (existing) {
      existing.push(dateEntry);
    } else {
      projectMap.set(project ?? "", [dateEntry]);
    }
  }

  const projects: PrdProjectGroup[] = [...projectMap.entries()]
    .map(([project, dates]) => ({
      project,
      dates: [...dates].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    }))
    .sort((a, b) => (a.project < b.project ? -1 : a.project > b.project ? 1 : 0));

  nonConforming.sort((a, b) => (a.folderName < b.folderName ? -1 : a.folderName > b.folderName ? 1 : 0));

  return { projects, nonConforming };
}
