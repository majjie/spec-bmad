import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildProjectCoverage,
  buildProjectNav,
  countOpenActionItems,
  ensureExpandedForSelection,
  formatStatusLabel,
  humanizeProjectSlug,
  initialExpandedProjectKey,
  normalizeProjectKey,
  projectKeyForSelection,
  titleCaseProject,
  toggleExpandedKey,
} from "../../../web/src/shell.js";
import type { NavigatorTree } from "../../../web/src/api.js";

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

test("buildProjectNav merges PRD + architecture under one project and attaches sprint", () => {
  const tree: NavigatorTree = {
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

  const groups = buildProjectNav(tree, "harbor");
  assert.deepEqual(
    groups.map((g) => g.key),
    ["harbor", "lumen", "_other"],
  );
  const harbor = groups.find((g) => g.key === "harbor");
  assert.equal(harbor?.title, "Harbor");
  assert.equal(harbor?.requirements.length, 2);
  assert.equal(harbor?.architecture.length, 1);
  assert.equal(harbor?.hasSprint, true);
  assert.equal(groups.find((g) => g.key === "lumen")?.hasSprint, false);
  assert.equal(groups.find((g) => g.key === "_other")?.other.length, 1);
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

test("buildProjectCoverage skips unsorted folders and uses newest dates", () => {
  const tree: NavigatorTree = {
    prd: {
      projects: [
        {
          project: "prd-harbor",
          dates: [
            { date: "2026-09-01", folderName: "prd-harbor-2026-09-01", path: "/p/a" },
            { date: "2026-08-15", folderName: "prd-harbor-2026-08-15", path: "/p/b" },
          ],
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
              path: "/a/a",
            },
          ],
        },
      ],
      nonConforming: [],
    },
    sprintStatusAvailable: true,
  };

  const rows = buildProjectCoverage(buildProjectNav(tree, "harbor"));
  assert.deepEqual(
    rows.map((row) => row.key),
    ["harbor"],
  );
  assert.equal(rows[0]?.requirementsCount, 2);
  assert.equal(rows[0]?.latestRequirementDate, "2026-09-01");
  assert.equal(rows[0]?.architectureCount, 1);
  assert.equal(rows[0]?.latestArchitectureDate, "2026-09-02");
  assert.equal(rows[0]?.hasSprint, true);
});

test("initialExpandedProjectKey prefers the sprint project then the first project", () => {
  assert.equal(initialExpandedProjectKey([]), null);
  assert.equal(
    initialExpandedProjectKey([
      { key: "lumen", hasSprint: false },
      { key: "harbor", hasSprint: true },
    ]),
    "harbor",
  );
  assert.equal(initialExpandedProjectKey([{ key: "lumen", hasSprint: false }]), "lumen");
});

test("toggleExpandedKey closes an open accordion and does not re-seed an empty set", () => {
  const closed = toggleExpandedKey(new Set(["harbor"]), "harbor");
  assert.equal(closed.has("harbor"), false);
  assert.equal(closed.size, 0);
  const opened = toggleExpandedKey(closed, "harbor");
  assert.equal(opened.has("harbor"), true);
});

test("ensureExpandedForSelection opens the owning project once, without reopening after collapse", () => {
  const tree: NavigatorTree = {
    prd: {
      projects: [
        {
          project: "prd-harbor",
          dates: [{ date: "2026-09-01", folderName: "prd-harbor-2026-09-01", path: "/p/prd" }],
        },
      ],
      nonConforming: [],
    },
    architecture: { projects: [], nonConforming: [] },
    sprintStatusAvailable: true,
  };
  const projects = buildProjectNav(tree, "harbor");
  assert.equal(projectKeyForSelection(projects, { kind: "prd", path: "/p/prd" }), "harbor");
  assert.equal(projectKeyForSelection(projects, { kind: "sprint" }), "harbor");
  assert.equal(projectKeyForSelection(projects, { kind: "overview" }), undefined);

  const opened = ensureExpandedForSelection(new Set(), "harbor");
  assert.equal(opened.has("harbor"), true);

  const userCollapsed = toggleExpandedKey(opened, "harbor");
  assert.equal(userCollapsed.size, 0);
  const unchanged = ensureExpandedForSelection(userCollapsed, undefined);
  assert.equal(unchanged.size, 0);
});
