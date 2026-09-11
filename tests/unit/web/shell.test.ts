import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildProjectNav,
  countOpenActionItems,
  expandForDocSelection,
  expandKeyForSlug,
  formatArtifactLeafLabel,
  formatRunDate,
  formatStatusLabel,
  hasMultipleNamedSlugs,
  humanizeProjectSlug,
  keysForDocSelection,
  namedSlugGroups,
  normalizeProjectKey,
  seedExpandedIfNeeded,
  sectionForSelection,
  slugKeyForSelection,
  slugNavSummary,
  titleCaseProject,
  toggleExpandedKey,
  workspaceProjectName,
} from "../../../web/src/shell.js";
import type { NavigatorTree } from "../../../web/src/api.js";

const sampleTree: NavigatorTree = {
  prd: {
    projects: [
      {
        project: "prd-harbor",
        dates: [
          { date: "2026-09-01", folderName: "prd-harbor-2026-09-01", path: "/p/prd-harbor-2026-09-01" },
          { date: "2026-08-15", folderName: "prd-harbor-2026-08-15", path: "/p/prd-harbor-2026-08-15" },
        ],
      },
      {
        project: "prd-lumen",
        dates: [{ date: "2026-08-28", folderName: "prd-lumen-2026-08-28", path: "/p/prd-lumen-2026-08-28" }],
      },
    ],
    nonConforming: [{ folderName: "scratch-workshop-notes", path: "/p/scratch" }],
  },
  architecture: {
    projects: [
      {
        project: "architecture-harbor",
        dates: [
          {
            date: "2026-09-02",
            folderName: "architecture-harbor-2026-09-02",
            path: "/a/architecture-harbor-2026-09-02",
          },
        ],
      },
    ],
    nonConforming: [],
  },
  sprintStatusAvailable: true,
};

const harborOnlyTree: NavigatorTree = {
  prd: {
    projects: [
      {
        project: "prd-harbor",
        dates: [
          { date: "2026-09-01", folderName: "prd-harbor-2026-09-01", path: "/p/prd-harbor-2026-09-01" },
        ],
      },
    ],
    nonConforming: [],
  },
  architecture: {
    projects: [
      {
        project: "architecture-harbor",
        dates: [
          {
            date: "2026-09-02",
            folderName: "architecture-harbor-2026-09-02",
            path: "/a/architecture-harbor-2026-09-02",
          },
        ],
      },
    ],
    nonConforming: [],
  },
  sprintStatusAvailable: true,
};

test("humanizeProjectSlug strips prd- and architecture- prefixes", () => {
  assert.equal(humanizeProjectSlug("prd-harbor"), "harbor");
  assert.equal(humanizeProjectSlug("architecture-harbor"), "harbor");
  assert.equal(humanizeProjectSlug("scratch-workshop-notes"), "scratch workshop notes");
});

test("normalizeProjectKey merges prd and architecture slugs", () => {
  assert.equal(normalizeProjectKey("prd-harbor"), "harbor");
  assert.equal(normalizeProjectKey("architecture-harbor"), "harbor");
  assert.equal(titleCaseProject("harbor"), "Harbor");
});

test("formatRunDate uses a short document date, not ISO", () => {
  assert.equal(formatRunDate("2026-09-01"), "1 Sep 2026");
  assert.equal(formatRunDate("2026-08-15"), "15 Aug 2026");
  assert.equal(formatRunDate("scratch-workshop-notes"), "scratch-workshop-notes");
});

test("formatArtifactLeafLabel names the document type on the latest run", () => {
  assert.equal(
    formatArtifactLeafLabel(
      { date: "2026-09-01", folderName: "prd-harbor-2026-09-01", isLatest: true },
      "prd",
    ),
    "1 Sep 2026 · latest PRD",
  );
  assert.equal(
    formatArtifactLeafLabel(
      { date: "2026-08-15", folderName: "prd-harbor-2026-08-15", isLatest: false },
      "prd",
    ),
    "15 Aug 2026",
  );
});

test("buildProjectNav still groups multi-slug fixtures for nested Requirements/Architecture", () => {
  const groups = buildProjectNav(sampleTree);
  assert.deepEqual(
    groups.map((g) => g.key),
    ["harbor", "lumen", "_other"],
  );
  assert.equal(hasMultipleNamedSlugs(groups), true);
  assert.equal(namedSlugGroups(groups).length, 2);
  assert.equal(slugNavSummary(groups.find((g) => g.key === "harbor")!), "2 PRDs · 1 architecture");
});

test("harbor-only tree is a single named slug (flat dates under Requirements)", () => {
  const groups = buildProjectNav(harborOnlyTree);
  assert.equal(hasMultipleNamedSlugs(groups), false);
  assert.equal(namedSlugGroups(groups)[0]?.title, "Harbor");
});

test("workspaceProjectName prefers sprint project, else sole named slug", () => {
  assert.equal(workspaceProjectName(harborOnlyTree, "harbor"), "Harbor");
  assert.equal(workspaceProjectName(harborOnlyTree, null), "Harbor");
  assert.equal(workspaceProjectName(sampleTree, "harbor"), "Harbor");
  assert.equal(workspaceProjectName(sampleTree, null), null);
});

test("keysForDocSelection open the document section and multi-slug nest", () => {
  const groups = buildProjectNav(sampleTree);
  assert.equal(sectionForSelection({ kind: "prd", path: "/p/prd-lumen-2026-08-28" }), "requirements");
  assert.equal(slugKeyForSelection(groups, { kind: "prd", path: "/p/prd-lumen-2026-08-28" }), "lumen");
  assert.deepEqual(keysForDocSelection(groups, { kind: "prd", path: "/p/prd-lumen-2026-08-28" }), [
    "requirements",
    expandKeyForSlug("requirements", "lumen"),
  ]);

  const harborGroups = buildProjectNav(harborOnlyTree);
  assert.deepEqual(keysForDocSelection(harborGroups, { kind: "prd", path: "/p/prd-harbor-2026-09-01" }), [
    "requirements",
  ]);
});

test("formatStatusLabel uses human phrasing for known statuses", () => {
  assert.equal(formatStatusLabel("in-progress"), "In progress");
  assert.equal(formatStatusLabel("review"), "In review");
  assert.equal(formatStatusLabel("done"), "Done");
  assert.equal(formatStatusLabel("ready-for-dev"), "ready-for-dev");
});

test("countOpenActionItems ignores done items and missing status", () => {
  assert.equal(
    countOpenActionItems([
      { status: "open" },
      { status: "done" },
      { status: "in-progress" },
      { status: null },
    ]),
    3,
  );
  assert.equal(countOpenActionItems([]), 0);
});

test("toggleExpandedKey closes an open accordion", () => {
  const closed = toggleExpandedKey(new Set(["requirements"]), "requirements");
  assert.equal(closed.has("requirements"), false);
  assert.equal(closed.size, 0);
});

test("expandForDocSelection opens newly selected section without reopening the same keys", () => {
  const opened = expandForDocSelection(new Set(), new Set(), ["requirements"]);
  assert.equal(opened.has("requirements"), true);

  const collapsed = toggleExpandedKey(opened, "requirements");
  const stillClosed = expandForDocSelection(collapsed, new Set(["requirements"]), ["requirements"]);
  assert.equal(stillClosed.size, 0);

  const switched = expandForDocSelection(
    stillClosed,
    new Set(["requirements"]),
    ["architecture", expandKeyForSlug("architecture", "harbor")],
  );
  assert.equal(switched.has("architecture"), true);
  assert.equal(switched.has(expandKeyForSlug("architecture", "harbor")), true);
});

test("seedExpandedIfNeeded opens document sections once for harbor-only", () => {
  const groups = buildProjectNav(harborOnlyTree);
  const first = seedExpandedIfNeeded(new Set(), groups, false);
  assert.equal(first.seeded, true);
  assert.equal(first.expanded.has("requirements"), true);
  assert.equal(first.expanded.has("architecture"), true);
  assert.equal([...first.expanded].some((k) => k.includes(":")), false);

  const afterCollapse = seedExpandedIfNeeded(new Set(), groups, true);
  assert.equal(afterCollapse.expanded.size, 0);
});

test("seedExpandedIfNeeded nests the first named slug when multi-slug", () => {
  const groups = buildProjectNav(sampleTree);
  const first = seedExpandedIfNeeded(new Set(), groups, false);
  assert.equal(first.expanded.has("requirements"), true);
  assert.equal(first.expanded.has(expandKeyForSlug("requirements", "harbor")), true);
});
