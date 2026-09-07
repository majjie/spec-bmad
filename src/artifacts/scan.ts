import { basename, join } from "node:path";
import { listRealEntries } from "./fs-entries.js";
import type { ArtifactNode } from "./types.js";

/**
 * Recursively builds an ArtifactNode tree rooted at `folderPath` (a `_bmad` or
 * `_bmad-output` folder). Only name/path/type/children are captured (FR-002); symlinked
 * entries are never followed or included (FR-003), via listRealEntries.
 */
export async function scan(folderPath: string): Promise<ArtifactNode> {
  const entries = await listRealEntries(folderPath);

  const children: ArtifactNode[] = [];
  for (const entry of entries) {
    const entryPath = join(folderPath, entry.name);
    if (entry.isDirectory) {
      children.push(await scan(entryPath));
    } else {
      children.push({ name: entry.name, path: entryPath, type: "file" });
    }
  }

  return {
    name: basename(folderPath),
    path: folderPath,
    type: "folder",
    children,
  };
}
