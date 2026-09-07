import type { ContentsEntry } from "./api.js";

export type SortColumn = "name" | "createdAt" | "updatedAt" | "size";
export type SortDirection = "asc" | "desc";

function compareValues(a: ContentsEntry, b: ContentsEntry, column: SortColumn): number {
  if (column === "size") {
    return (a.size ?? 0) - (b.size ?? 0);
  }
  if (column === "name") {
    return a.name.localeCompare(b.name);
  }
  return a[column].localeCompare(b[column]);
}

/**
 * Groups folder entries before file entries (Clarifications session), sorting each group
 * by `column`/`direction` independently.
 */
export function sortContentsEntries(
  entries: ContentsEntry[],
  column: SortColumn,
  direction: SortDirection,
): ContentsEntry[] {
  const folders = entries.filter((entry) => entry.type === "folder");
  const files = entries.filter((entry) => entry.type === "file");

  const sortGroup = (group: ContentsEntry[]): ContentsEntry[] => {
    const sorted = [...group].sort((a, b) => compareValues(a, b, column));
    return direction === "desc" ? sorted.reverse() : sorted;
  };

  return [...sortGroup(folders), ...sortGroup(files)];
}
