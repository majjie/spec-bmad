import { join } from "node:path";

export interface ActionItem {
  id: string;
  epic: number | null;
  action: string | null;
  owner: string | null;
  status: string | null;
  ref: string | null;
  resolvedPath: string | null;
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * Shapes an already-parsed YAML object's `action_items` list into `ActionItem[]`, per
 * data-model.md's derivation rules. Tolerant of a missing/non-array `action_items` (yields
 * `[]`) and of a non-object entry within it (skipped) — matching `parseSprintStatus`'s own
 * tolerant-parsing style. Each entry's `ref`, when present, is resolved against
 * `projectRootPath` at parse time (research.md § 1) rather than left for the client to
 * guess at.
 */
export function parseActionItems(parsedYaml: unknown, projectRootPath: string): ActionItem[] {
  const root = (parsedYaml && typeof parsedYaml === "object" ? parsedYaml : {}) as Record<string, unknown>;
  const rawItems = root.action_items;
  if (!Array.isArray(rawItems)) {
    return [];
  }

  const items: ActionItem[] = [];
  rawItems.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") {
      return;
    }
    const record = entry as Record<string, unknown>;

    const id = typeof record.id === "string" ? record.id : String(index);
    const epic = typeof record.epic === "number" ? record.epic : null;
    const action = asStringOrNull(record.action);
    const owner = asStringOrNull(record.owner);
    const status = asStringOrNull(record.status);
    const ref = asStringOrNull(record.ref);
    const resolvedPath = ref === null ? null : join(projectRootPath, ref);

    items.push({ id, epic, action, owner, status, ref, resolvedPath });
  });

  // FR-009: every non-"done" item before every "done" item; `sort`'s stability (guaranteed
  // since ES2019) preserves file-declared order within each of those two groups.
  items.sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0));

  return items;
}
