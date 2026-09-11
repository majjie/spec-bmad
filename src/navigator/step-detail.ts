import { join } from "node:path";

export interface StepDetail {
  key: string;
  index: string;
  title: string;
  status: string;
  specPath: string | null;
}

// The same "<epic>-<story>[letter]-" shape sprint-status keys already follow elsewhere in
// this codebase (STORY_NUMBER_PATTERN in sprint-status.ts), extended to capture the full
// index (not just the epic number) plus the descriptive text that follows it.
const STEP_INDEX_PATTERN = /^(\d+-\d+[a-zA-Z]?)-(.+)$/;

/**
 * Splits a step's raw key into its index and a human-readable title (FR-005/FR-006).
 * Falls back to the raw key for both when it doesn't match the expected
 * `<epic>-<story>[letter]-<descriptive-text>` shape (FR-013) - never hidden, never an
 * error.
 */
export function deriveStepDisplay(key: string): { index: string; title: string } {
  const match = key.match(STEP_INDEX_PATTERN);
  if (!match) {
    return { index: key, title: key };
  }
  const index = match[1] ?? key;
  const rest = match[2] ?? "";
  return { index, title: rest.replace(/-/g, " ") };
}

/**
 * Finds the spec document matching a step's index among a folder's already-listed
 * filenames (FR-008): a match starts with `spec-<index>-` (the index plus its own trailing
 * dash), so index "1-1" never matches a filename meant for "1-10" or "1-1a". When more than
 * one filename matches, the alphabetically-first one wins (FR-012).
 */
export function matchSpecFileName(index: string, fileNames: string[]): string | null {
  const prefix = `spec-${index}-`;
  const matches = fileNames.filter((name) => name.startsWith(prefix)).sort();
  return matches[0] ?? null;
}

/**
 * Builds each step's full `StepDetail` - index/title derivation plus spec-file matching -
 * from an epic's raw stories and the implementation-artifacts folder's file listing.
 * `specPath` is an absolute path built the same way the sprint-status route itself already
 * locates that folder (research.md § 1) - never guessed or reconstructed a different way.
 */
export function buildStepDetails(
  stories: { key: string; status: string }[],
  specFileNames: string[],
  projectRootPath: string,
): StepDetail[] {
  return stories.map(({ key, status }) => {
    const { index, title } = deriveStepDisplay(key);
    const matchedFileName = matchSpecFileName(index, specFileNames);
    const specPath =
      matchedFileName === null
        ? null
        : join(projectRootPath, "_bmad-output", "implementation-artifacts", matchedFileName);
    return { key, index, title, status, specPath };
  });
}
