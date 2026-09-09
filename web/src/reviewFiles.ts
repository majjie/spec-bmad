import type { ContentsEntry } from "./api.js";

export interface ReviewFileReference {
  fileName: string;
  path: string;
  displayName: string;
}

/**
 * Derives a review file's friendly display name (FR-003, Clarifications): the `review-`
 * prefix removed, every `-` replaced with a space, Title Case applied (every word
 * capitalized).
 */
function toDisplayName(fileName: string): string {
  const withoutPrefix = fileName.slice("review-".length, fileName.length - ".md".length);
  return withoutPrefix
    .split("-")
    .map((word) => (word.length === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join(" ");
}

/**
 * Detects every `review-*.md` file among a PRD folder's own contents entries (already
 * fetched via `fetchContents`), deriving each one's friendly display name and sorting the
 * result alphabetically by that name — not by raw filename, since the two can diverge
 * once casing/prefix transforms are applied (FR-001/FR-003/FR-004).
 */
export function buildReviewFileList(entries: ContentsEntry[]): ReviewFileReference[] {
  const matches = entries.filter(
    (entry) => entry.type === "file" && entry.name.startsWith("review-") && entry.name.endsWith(".md"),
  );

  const references = matches.map((entry) => ({
    fileName: entry.name,
    path: entry.path,
    displayName: toDisplayName(entry.name),
  }));

  return references.sort((a, b) => a.displayName.localeCompare(b.displayName));
}
