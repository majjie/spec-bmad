import { readdir } from "node:fs/promises";
import type { Dirent } from "node:fs";

export interface RealEntry {
  name: string;
  isDirectory: boolean;
}

/**
 * Lists a directory's entries, excluding symlinks entirely (FR-003) - a symlinked entry
 * is never returned, whether it points at a file or a directory.
 */
export async function listRealEntries(dirPath: string): Promise<RealEntry[]> {
  const dirents: Dirent[] = await readdir(dirPath, { withFileTypes: true });
  return dirents
    .filter((dirent) => !dirent.isSymbolicLink())
    .map((dirent) => ({
      name: dirent.name,
      isDirectory: dirent.isDirectory(),
    }));
}
