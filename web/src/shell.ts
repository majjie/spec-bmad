import type { TabId } from "./api.js";

/**
 * UI navigation sections (feature 018). Mapped onto API TabIds for fetches:
 * overview/requirements/architecture/sprint → navigator; method → infra; generated → output.
 */
export type ShellSection =
  | "overview"
  | "requirements"
  | "architecture"
  | "sprint"
  | "method"
  | "generated";

export function sectionToTab(section: ShellSection): TabId {
  if (section === "method") {
    return "infra";
  }
  if (section === "generated") {
    return "output";
  }
  return "navigator";
}

export function isFolderSection(section: ShellSection): section is "method" | "generated" {
  return section === "method" || section === "generated";
}

/** Strip conventional BMAD folder prefixes for human sidebar/tree labels. */
export function humanizeProjectSlug(slug: string): string {
  return slug
    .replace(/^prd-/i, "")
    .replace(/^architecture-/i, "")
    .replace(/-/g, " ");
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
