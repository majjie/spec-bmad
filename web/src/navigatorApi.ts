import type { NavigatorTree, SprintStatusResult } from "./api.js";

export async function fetchNavigatorTree(): Promise<NavigatorTree> {
  const response = await fetch("/api/navigator/tree");
  if (!response.ok) {
    throw new Error(`GET /api/navigator/tree failed with ${response.status}`);
  }
  return (await response.json()) as NavigatorTree;
}

export async function fetchSprintStatus(): Promise<SprintStatusResult> {
  const response = await fetch("/api/navigator/sprint-status");
  if (!response.ok) {
    if (response.status === 422) {
      const body = (await response.json()) as { error: string };
      throw new Error(body.error);
    }
    throw new Error(`GET /api/navigator/sprint-status failed with ${response.status}`);
  }
  return (await response.json()) as SprintStatusResult;
}
