import type { HierarchyCache, ProjectRoot } from "../../artifacts/types.js";
import type { RouteResponse } from "../http-server.js";

/**
 * Invalidates the project's cached folder structure (feature 001's
 * `HierarchyCache.invalidate()`, FR-005 there - built for exactly this purpose, but
 * unused until now). Invalidation is synchronous and covers every underlying root at
 * once; the next request that goes through `cache.get()` performs the actual re-scan
 * lazily.
 */
export async function getRefreshResponse(root: ProjectRoot, cache: HierarchyCache): Promise<RouteResponse> {
  cache.invalidate(root);
  return { status: 200 };
}
