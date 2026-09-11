import { readFile } from "node:fs/promises";
import type { ProjectRoot } from "../../artifacts/types.js";
import type { RouteResponse } from "../http-server.js";
import { getTabRootPath, isTabId, isWithinRoot } from "../tab-tree.js";

const MAX_BINARY_SCAN_BYTES = 8000;

/**
 * A file "looks binary" if a NUL byte appears within the first bytes scanned - the same
 * lightweight heuristic tools like `git`/`grep` use (research.md § 2).
 */
export function looksBinary(buffer: Buffer): boolean {
  const scanLength = Math.min(buffer.length, MAX_BINARY_SCAN_BYTES);
  for (let i = 0; i < scanLength; i += 1) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
}

export async function getFileResponse(
  tabParam: string,
  pathParam: string | undefined,
  root: ProjectRoot,
): Promise<RouteResponse> {
  if (!isTabId(tabParam)) {
    return { status: 400 };
  }

  if (!pathParam) {
    return { status: 400 };
  }

  const tabRootPath = getTabRootPath(tabParam, root);
  if (tabRootPath === null) {
    // Recognized tab, but its folder doesn't exist for this project - same convention as
    // /api/tree/:tab (feature 002), not 400.
    return { status: 404 };
  }

  if (!isWithinRoot(tabRootPath, pathParam)) {
    return { status: 403 };
  }

  let buffer: Buffer;
  try {
    buffer = await readFile(pathParam);
  } catch {
    return { status: 404 };
  }

  if (looksBinary(buffer)) {
    return { status: 415 };
  }

  return {
    status: 200,
    body: buffer.toString("utf8"),
    contentType: "text/plain; charset=utf-8",
  };
}
