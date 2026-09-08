import { parseActionItems, type ActionItem } from "./action-items.js";

export interface SprintStatusSummary {
  generated: string;
  lastUpdated: string;
  project: string;
  projectKey: string;
  trackingSystem: string;
  storyLocation: string;
  activeEpic: string;
}

export interface StoryStatus {
  key: string;
  status: string;
}

export interface EpicStatusGroup {
  epicKey: string;
  status: string;
  stories: StoryStatus[];
  retrospectiveStatus: string | null;
}

export interface SprintStatusResult {
  summary: SprintStatusSummary;
  epics: EpicStatusGroup[];
  actionItems: ActionItem[];
}

const EPIC_KEY_PATTERN = /^epic-(\d+)$/;
const EPIC_RETROSPECTIVE_PATTERN = /^epic-(\d+)-retrospective$/;
const STORY_NUMBER_PATTERN = /^(\d+)-/;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Feature 007 FR-009/FR-010: a calculated Summary field telling the user, at a glance,
 * whether everything is done, nothing has started, or which epic is currently active.
 * `epics` is already in file-declared order (parseSprintStatus's own guarantee), so "the
 * first in-progress epic" is simply the first array match.
 */
export function calculateActiveEpic(epics: EpicStatusGroup[]): string {
  if (epics.length === 0) {
    return "unknown";
  }
  if (epics.every((epic) => epic.status === "done")) {
    return "All complete";
  }
  if (epics.every((epic) => epic.status === "backlog")) {
    return "Not started";
  }
  const inProgress = epics.find((epic) => epic.status === "in-progress");
  return inProgress ? inProgress.epicKey : "unknown";
}

/**
 * Shapes an already-parsed YAML object into a Summary plus per-epic Status groups, per
 * data-model.md and research.md § 4's two-pass derivation. Tolerant of a missing/absent/
 * non-object `development_status` (yields `epics: []`) and of missing Summary fields
 * (each defaults to an empty string) — only a malformed YAML *document* is an error, and
 * that's caught one layer up, by the route that calls `js-yaml`'s `load()` before this.
 */
export function parseSprintStatus(parsedYaml: unknown, projectRootPath: string): SprintStatusResult {
  const root = (parsedYaml && typeof parsedYaml === "object" ? parsedYaml : {}) as Record<string, unknown>;

  const developmentStatusRaw = root.development_status;
  const developmentStatus: Record<string, unknown> =
    developmentStatusRaw && typeof developmentStatusRaw === "object" && !Array.isArray(developmentStatusRaw)
      ? (developmentStatusRaw as Record<string, unknown>)
      : {};

  const entries = Object.entries(developmentStatus);

  // First pass: an epic shell per epic-N key (in file order) plus each epic's own
  // retrospective status, keyed by epic number so the second pass can look epics up by
  // number rather than by "whichever epic was seen most recently."
  const epicsByNumber = new Map<string, EpicStatusGroup>();
  const epicOrder: string[] = [];
  const retrospectiveByNumber = new Map<string, string>();

  for (const [key, value] of entries) {
    const epicMatch = key.match(EPIC_KEY_PATTERN);
    if (epicMatch) {
      const epicNumber = epicMatch[1] ?? "";
      epicsByNumber.set(epicNumber, { epicKey: key, status: asString(value), stories: [], retrospectiveStatus: null });
      epicOrder.push(epicNumber);
      continue;
    }

    const retroMatch = key.match(EPIC_RETROSPECTIVE_PATTERN);
    if (retroMatch) {
      retrospectiveByNumber.set(retroMatch[1] ?? "", asString(value));
    }
  }

  // Second pass: attach every remaining numbered-story key to the epic whose number it
  // starts with (FR-013's delimiter-based match — "11-2-foo" starts with "11-", not "1-",
  // so epic 1 and epic 11 are never confused). No matching epic → left out (FR-015).
  for (const [key, value] of entries) {
    const storyMatch = key.match(STORY_NUMBER_PATTERN);
    if (!storyMatch) {
      continue;
    }
    const epic = epicsByNumber.get(storyMatch[1] ?? "");
    if (epic) {
      epic.stories.push({ key, status: asString(value) });
    }
  }

  for (const [epicNumber, epic] of epicsByNumber) {
    epic.retrospectiveStatus = retrospectiveByNumber.get(epicNumber) ?? null;
  }

  const epics = epicOrder
    .map((epicNumber) => epicsByNumber.get(epicNumber))
    .filter((epic): epic is EpicStatusGroup => epic !== undefined);

  const summary: SprintStatusSummary = {
    generated: asString(root.generated),
    lastUpdated: asString(root.last_updated),
    project: asString(root.project),
    projectKey: asString(root.project_key),
    trackingSystem: asString(root.tracking_system),
    storyLocation: asString(root.story_location),
    activeEpic: calculateActiveEpic(epics),
  };

  const actionItems = parseActionItems(root, projectRootPath);

  return { summary, epics, actionItems };
}
