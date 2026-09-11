import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { load, YAMLException } from "js-yaml";
import { listRealEntries } from "../../artifacts/fs-entries.js";
import type { ProjectRoot } from "../../artifacts/types.js";
import { parseSprintStatus } from "../../navigator/sprint-status.js";
import type { RouteResponse } from "../http-server.js";

/**
 * Reads and parses `implementation-artifacts/sprint-status.yaml` fresh on every request
 * (no caching - the file's own content, not just its existence, is what this route
 * serves) per contracts/http-api.md.
 */
export async function getNavigatorSprintStatusResponse(root: ProjectRoot): Promise<RouteResponse> {
  if (root.bmadOutputFolderPath === null) {
    return { status: 404 };
  }

  const implementationArtifactsPath = join(root.bmadOutputFolderPath, "implementation-artifacts");
  const sprintStatusPath = join(implementationArtifactsPath, "sprint-status.yaml");

  let text: string;
  try {
    text = await readFile(sprintStatusPath, "utf8");
  } catch {
    return { status: 404 };
  }

  let parsed: unknown;
  try {
    parsed = load(text);
  } catch (error) {
    if (error instanceof YAMLException) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }

  // Step-detail spec-file matching (research.md § 2 of feature 009) needs this same
  // folder's file listing - reusing `listRealEntries` keeps the symlink-exclusion
  // guarantee it already provides for the Infra/Output content routes.
  const entries = await listRealEntries(implementationArtifactsPath);
  const specFileNames = entries.filter((entry) => !entry.isDirectory).map((entry) => entry.name);

  return { status: 200, body: parseSprintStatus(parsed, root.path, specFileNames) };
}
