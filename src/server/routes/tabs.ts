import type { ProjectRoot } from "../../artifacts/types.js";
import type { RouteResponse } from "../http-server.js";
import type { TabAvailability } from "../types.js";

export function getTabsResponse(root: ProjectRoot): RouteResponse {
  const availability: TabAvailability = {
    infra: root.bmadFolderPath !== null,
    output: root.bmadOutputFolderPath !== null,
  };
  return { status: 200, body: availability };
}
