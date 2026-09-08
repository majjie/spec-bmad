import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSprintStatus } from "../../../src/navigator/sprint-status.js";

const SAMPLE = {
  generated: "08-28-2026 20:15",
  last_updated: "09-04-2026 10:02",
  project: "bmad-dash",
  project_key: "NOKEY",
  tracking_system: "file-system",
  story_location: "_bmad-output/implementation-artifacts",
  development_status: {
    "epic-1": "done",
    "1-1-run-the-command": "done",
    "1-6a-walk-safely": "done",
    "epic-1-retrospective": "done",
    "epic-2": "in-progress",
    "2-1-serve": "review",
    "orphan-not-numbered": "done",
    "epic-10": "backlog",
    "10-1-something": "backlog",
  },
};

test("parseSprintStatus() extracts the six Summary fields", () => {
  const result = parseSprintStatus(SAMPLE);
  assert.deepEqual(result.summary, {
    generated: "08-28-2026 20:15",
    lastUpdated: "09-04-2026 10:02",
    project: "bmad-dash",
    projectKey: "NOKEY",
    trackingSystem: "file-system",
    storyLocation: "_bmad-output/implementation-artifacts",
  });
});

test("parseSprintStatus() groups stories under their own epic, in file order", () => {
  const result = parseSprintStatus(SAMPLE);
  const epicKeys = result.epics.map((e) => e.epicKey);
  assert.deepEqual(epicKeys, ["epic-1", "epic-2", "epic-10"]);

  const epic1 = result.epics.find((e) => e.epicKey === "epic-1");
  assert.equal(epic1?.status, "done");
  assert.deepEqual(
    epic1?.stories.map((s) => s.key),
    ["1-1-run-the-command", "1-6a-walk-safely"],
  );
  assert.equal(epic1?.retrospectiveStatus, "done");
});

test("parseSprintStatus() does not confuse epic 1's stories with epic 10's", () => {
  const result = parseSprintStatus(SAMPLE);
  const epic10 = result.epics.find((e) => e.epicKey === "epic-10");
  assert.deepEqual(
    epic10?.stories.map((s) => s.key),
    ["10-1-something"],
  );
});

test("parseSprintStatus() sets retrospectiveStatus to null when no epic-N-retrospective key exists", () => {
  const result = parseSprintStatus(SAMPLE);
  const epic2 = result.epics.find((e) => e.epicKey === "epic-2");
  assert.equal(epic2?.retrospectiveStatus, null);
});

test("parseSprintStatus() excludes an entry matching neither an epic key nor any epic's story grouping", () => {
  const result = parseSprintStatus(SAMPLE);
  const allStoryKeys = result.epics.flatMap((e) => e.stories.map((s) => s.key));
  assert.ok(!allStoryKeys.includes("orphan-not-numbered"));
});

test("parseSprintStatus() returns epics: [] when development_status is absent", () => {
  const result = parseSprintStatus({ project: "x" });
  assert.deepEqual(result.epics, []);
  assert.equal(result.summary.project, "x");
});

test("parseSprintStatus() returns epics: [] when development_status is empty", () => {
  const result = parseSprintStatus({ development_status: {} });
  assert.deepEqual(result.epics, []);
});

test("parseSprintStatus() tolerates a non-object development_status without throwing", () => {
  const result = parseSprintStatus({ development_status: "not an object" });
  assert.deepEqual(result.epics, []);
});

test("parseSprintStatus() defaults missing Summary fields to an empty string", () => {
  const result = parseSprintStatus({});
  assert.deepEqual(result.summary, {
    generated: "",
    lastUpdated: "",
    project: "",
    projectKey: "",
    trackingSystem: "",
    storyLocation: "",
  });
});
