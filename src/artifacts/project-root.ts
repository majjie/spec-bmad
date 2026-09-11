import { join } from "node:path";
import { listRealEntries } from "./fs-entries.js";
import type { ProjectRoot } from "./types.js";

const BMAD_FOLDER_NAME = "_bmad";
const BMAD_OUTPUT_FOLDER_NAME = "_bmad-output";

/**
 * Checks `folderPath` for a real (non-symlink) `_bmad` and/or `_bmad-output` child
 * directory (FR-007). Returns `null` when neither is present. Rejects if `folderPath`
 * itself cannot be read (e.g. it does not exist, or a permissions error) - callers that
 * need to treat an unreadable folder as "not a candidate" instead (the discovery crawl)
 * must catch that themselves.
 */
export async function buildProjectRoot(
  folderPath: string,
): Promise<ProjectRoot | null> {
  const entries = await listRealEntries(folderPath);

  const bmadEntry = entries.find(
    (entry) => entry.isDirectory && entry.name === BMAD_FOLDER_NAME,
  );
  const bmadOutputEntry = entries.find(
    (entry) => entry.isDirectory && entry.name === BMAD_OUTPUT_FOLDER_NAME,
  );

  if (!bmadEntry && !bmadOutputEntry) {
    return null;
  }

  return {
    path: folderPath,
    bmadFolderPath: bmadEntry ? join(folderPath, BMAD_FOLDER_NAME) : null,
    bmadOutputFolderPath: bmadOutputEntry
      ? join(folderPath, BMAD_OUTPUT_FOLDER_NAME)
      : null,
  };
}
