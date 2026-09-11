import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildProjectNav,
  countOpenActionItems,
  ensureExpandedForSelection,
  expandForSelectionChange,
  formatArtifactLeafLabel,
  formatRunDate,
  formatStatusLabel,
  humanizeProjectSlug,
  initialExpandedProjectKey,
  normalizeProjectKey,
  productNavSummary,
  projectKeyForSelection,
  seedExpandedIfNeeded,
  titleCaseProject,
  toggleExpandedKey,
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
  assert.equal(
    formatArtifactLeafLabel(
      { date: "2026-09-02", folderName: "architecture-harbor-2026-09-02", isLatest: true },
      "architecture",
    ),
    "2 Sep 2026 · latest architecture",
  );
});

test("buildProjectNav merges PRD + architecture under one product and does not nest sprint", () => {
  const groups = buildProjectNav(sampleTree);
  assert.deepEqual(
    groups.map((g) => g.key),
    ["harbor", "lumen", "_other"],
  );
  const harbor = groups.find((g) => g.key === "harbor");
  assert.equal(harbor?.title, "Harbor");
  assert.equal(harbor?.requirements.length, 2);
  assert.equal(harbor?.architecture.length, 1);
  assert.equal(groups.find((g) => g.key === "_other")?.other.length, 1);
  assert.equal(productNavSummary(harbor!), "2 PRDs · 1 architecture");
  assert.equal(productNavSummary(groups.find((g) => g.key === "lumen")!), "1 PRD");
  assert.equal(productNavSummary(groups.find((g) => g.key === "_other")!), "Unsorted folders");
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

test("initialExpandedProjectKey seeds the first named product, not Other", () => {
  assert.equal(initialExpandedProjectKey([]), null);
  assert.equal(initialExpandedProjectKey([{ key: "lumen" }, { key: "harbor" }]), "lumen");
  assert.equal(initialExpandedProjectKey([{ key: "_other" }, { key: "harbor" }]), "harbor");
});

test("toggleExpandedKey closes an open accordion and does not re-seed an empty set", () => {
  const closed = toggleExpandedKey(new Set(["harbor"]), "harbor");
  assert.equal(closed.has("harbor"), false);
  assert.equal(closed.size, 0);
  const opened = toggleExpandedKey(closed, "harbor");
  assert.equal(opened.has("harbor"), true);
});

test("ensureExpandedForSelection opens the owning product once, without reopening after collapse", () => {
  const projects = buildProjectNav(sampleTree);
  assert.equal(projectKeyForSelection(projects, { kind: "prd", path: "/p/prd-harbor-2026-09-01" }), "harbor");
  assert.equal(projectKeyForSelection(projects, { kind: "sprint" }), undefined);
  assert.equal(projectKeyForSelection(projects, { kind: "overview" }), undefined);

  const opened = ensureExpandedForSelection(new Set(), "harbor");
  assert.equal(opened.has("harbor"), true);

  const userCollapsed = toggleExpandedKey(opened, "harbor");
  assert.equal(userCollapsed.size, 0);
  const unchanged = ensureExpandedForSelection(userCollapsed, undefined);
  assert.equal(unchanged.size, 0);
});

test("expandForSelectionChange does not reopen after collapsing the same product", () => {
  const opened = expandForSelectionChange(new Set(), undefined, "harbor");
  assert.equal(opened.has("harbor"), true);

  const collapsed = toggleExpandedKey(opened, "harbor");
  const stillClosed = expandForSelectionChange(collapsed, "harbor", "harbor");
  assert.equal(stillClosed.size, 0);

  const switched = expandForSelectionChange(stillClosed, "harbor", "lumen");
  assert.equal(switched.has("lumen"), true);
  assert.equal(switched.has("harbor"), false);
});

test("seedExpandedIfNeeded only seeds once so a full collapse stays closed", () => {
  const first = seedExpandedIfNeeded(new Set(), [{ key: "harbor" }], false);
  assert.equal(first.seeded, true);
  assert.deepEqual([...first.expanded], ["harbor"]);

  const afterCollapse = seedExpandedIfNeeded(new Set(), [{ key: "harbor" }], true);
  assert.equal(afterCollapse.expanded.size, 0);
  assert.equal(afterCollapse.seeded, true);
});
