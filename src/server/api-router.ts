import type { HierarchyCache, ProjectRoot } from "../artifacts/types.js";
import type { ApiRequestHandler, RouteResponse } from "./http-server.js";
import { getContentsResponse } from "./routes/contents.js";
import { getFileResponse } from "./routes/file.js";
import { getTabsResponse } from "./routes/tabs.js";
import { getTreeResponse } from "./routes/tree.js";

const TREE_PATH_PATTERN = /^\/api\/tree\/([^/]+)$/;
const CONTENTS_PATH_PATTERN = /^\/api\/contents\/([^/]+)$/;
const FILE_PATH_PATTERN = /^\/api\/file\/([^/]+)$/;

/**
 * Wires the `/api/tabs`, `/api/tree/:tab`, and `/api/contents/:tab` routes together for
 * a specific resolved project, in the shape `startHttpServer` (src/server/http-server.ts)
 * expects. Used by both `src/cli.ts` and the integration tests, so tests exercise the
 * exact same wiring the CLI runs.
 */
export function createApiRequestHandler(
  root: ProjectRoot,
  cache: HierarchyCache,
): ApiRequestHandler {
  return async (pathname: string, searchParams: URLSearchParams): Promise<RouteResponse | undefined> => {
    if (pathname === "/api/tabs") {
      return getTabsResponse(root);
    }

    const treeMatch = pathname.match(TREE_PATH_PATTERN);
    if (treeMatch) {
      return getTreeResponse(treeMatch[1] ?? "", root, cache);
    }

    const contentsMatch = pathname.match(CONTENTS_PATH_PATTERN);
    if (contentsMatch) {
      const pathParam = searchParams.get("path") ?? undefined;
      return getContentsResponse(contentsMatch[1] ?? "", pathParam, root, cache);
    }

    const fileMatch = pathname.match(FILE_PATH_PATTERN);
    if (fileMatch) {
      const pathParam = searchParams.get("path") ?? undefined;
      return getFileResponse(fileMatch[1] ?? "", pathParam, root);
    }

    return undefined;
  };
}
