import { test } from "node:test";
import assert from "node:assert/strict";
import { groupPrdFolders } from "../../../src/navigator/prd-grouping.js";

function entry(name: string) {
  return { name, path: `/project/_bmad-output/planning-artifacts/prds/${name}` };
}

test("groupPrdFolders() groups by project and sorts dates descending", () => {
  const result = groupPrdFolders(
    [
      "prd-foo-2028-08-28",
      "prd-foo-2028-08-29",
      "prd-foo-2028-08-30",
      "prd-bar-2028-08-30",
      "prd-bar-2028-09-01",
      "prd-bar-2028-09-14",
      "not-following-convention",
    ].map(entry),
  );

  assert.deepEqual(
    result.projects.map((p) => p.project),
    ["prd-bar", "prd-foo"],
  );

  const foo = result.projects.find((p) => p.project === "prd-foo");
  assert.deepEqual(
    foo?.dates.map((d) => d.date),
    ["2028-08-30", "2028-08-29", "2028-08-28"],
  );
  assert.deepEqual(
    foo?.dates.map((d) => d.folderName),
    ["prd-foo-2028-08-30", "prd-foo-2028-08-29", "prd-foo-2028-08-28"],
  );

  const bar = result.projects.find((p) => p.project === "prd-bar");
  assert.deepEqual(
    bar?.dates.map((d) => d.date),
    ["2028-09-14", "2028-09-01", "2028-08-30"],
  );

  assert.deepEqual(
    result.nonConforming.map((n) => n.folderName),
    ["not-following-convention"],
  );
});

test("groupPrdFolders() treats differing-case project names as separate groups, sorted by code-point order", () => {
  const result = groupPrdFolders(["prd-foo-2028-08-28", "PRD-foo-2028-08-28"].map(entry));

  assert.equal(result.projects.length, 2);
  // Uppercase-first code-point order: "PRD-foo" (P=80) sorts before "prd-foo" (p=112).
  assert.deepEqual(
    result.projects.map((p) => p.project),
    ["PRD-foo", "prd-foo"],
  );
});

test("groupPrdFolders() treats a bare date with no project text as non-conforming", () => {
  const result = groupPrdFolders(["2026-08-28"].map(entry));

  assert.equal(result.projects.length, 0);
  assert.deepEqual(
    result.nonConforming.map((n) => n.folderName),
    ["2026-08-28"],
  );
});

test("groupPrdFolders() does not require a calendar-valid date, only the naming shape", () => {
  const result = groupPrdFolders(["prd-foo-2026-13-40"].map(entry));

  assert.equal(result.projects.length, 1);
  assert.equal(result.projects[0]?.project, "prd-foo");
  assert.equal(result.projects[0]?.dates[0]?.date, "2026-13-40");
});

test("groupPrdFolders() sorts projects and non-conforming folders by code-point order", () => {
  const result = groupPrdFolders(
    ["prd-zeta-2026-01-01", "prd-alpha-2026-01-01", "zzz-non-conforming", "aaa-non-conforming"].map(entry),
  );

  assert.deepEqual(
    result.projects.map((p) => p.project),
    ["prd-alpha", "prd-zeta"],
  );
  assert.deepEqual(
    result.nonConforming.map((n) => n.folderName),
    ["aaa-non-conforming", "zzz-non-conforming"],
  );
});

test("groupPrdFolders() returns empty projects/nonConforming for an empty input list", () => {
  const result = groupPrdFolders([]);
  assert.deepEqual(result, { projects: [], nonConforming: [] });
});
