import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { calculateActiveEpic, parseSprintStatus, type EpicStatusGroup } from "../../../src/navigator/sprint-status.js";

const PROJECT_ROOT = "/tmp/bmad-fixture-project";
const NO_SPEC_FILES: string[] = [];

function epic(epicKey: string, status: string): EpicStatusGroup {
  return { epicKey, status, steps: [], retrospectiveStatus: null };
}

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

test("parseSprintStatus() extracts the six Summary fields, plus the calculated Active Epic", () => {
  const result = parseSprintStatus(SAMPLE, PROJECT_ROOT, NO_SPEC_FILES);
  assert.deepEqual(result.summary, {
    generated: "08-28-2026 20:15",
    lastUpdated: "09-04-2026 10:02",
    project: "bmad-dash",
    projectKey: "NOKEY",
    trackingSystem: "file-system",
    storyLocation: "_bmad-output/implementation-artifacts",
    activeEpic: "epic-2",
  });
});

test("parseSprintStatus() groups stories under their own epic, in file order", () => {
  const result = parseSprintStatus(SAMPLE, PROJECT_ROOT, NO_SPEC_FILES);
  const epicKeys = result.epics.map((e) => e.epicKey);
  assert.deepEqual(epicKeys, ["epic-1", "epic-2", "epic-10"]);

  const epic1 = result.epics.find((e) => e.epicKey === "epic-1");
  assert.equal(epic1?.status, "done");
  assert.deepEqual(
    epic1?.steps.map((s) => s.key),
    ["1-1-run-the-command", "1-6a-walk-safely"],
  );
  assert.equal(epic1?.retrospectiveStatus, "done");
});

test("parseSprintStatus() does not confuse epic 1's stories with epic 10's", () => {
  const result = parseSprintStatus(SAMPLE, PROJECT_ROOT, NO_SPEC_FILES);
  const epic10 = result.epics.find((e) => e.epicKey === "epic-10");
  assert.deepEqual(
    epic10?.steps.map((s) => s.key),
    ["10-1-something"],
  );
});

test("parseSprintStatus() sets retrospectiveStatus to null when no epic-N-retrospective key exists", () => {
  const result = parseSprintStatus(SAMPLE, PROJECT_ROOT, NO_SPEC_FILES);
  const epic2 = result.epics.find((e) => e.epicKey === "epic-2");
  assert.equal(epic2?.retrospectiveStatus, null);
});

test("parseSprintStatus() excludes an entry matching neither an epic key nor any epic's story grouping", () => {
  const result = parseSprintStatus(SAMPLE, PROJECT_ROOT, NO_SPEC_FILES);
  const allStepKeys = result.epics.flatMap((e) => e.steps.map((s) => s.key));
  assert.ok(!allStepKeys.includes("orphan-not-numbered"));
});

test("parseSprintStatus() returns epics: [] when development_status is absent", () => {
  const result = parseSprintStatus({ project: "x" }, PROJECT_ROOT, NO_SPEC_FILES);
  assert.deepEqual(result.epics, []);
  assert.equal(result.summary.project, "x");
});

test("parseSprintStatus() returns epics: [] when development_status is empty", () => {
  const result = parseSprintStatus({ development_status: {} }, PROJECT_ROOT, NO_SPEC_FILES);
  assert.deepEqual(result.epics, []);
});

test("parseSprintStatus() tolerates a non-object development_status without throwing", () => {
  const result = parseSprintStatus({ development_status: "not an object" }, PROJECT_ROOT, NO_SPEC_FILES);
  assert.deepEqual(result.epics, []);
});

test("parseSprintStatus() defaults missing Summary fields to an empty string", () => {
  const result = parseSprintStatus({}, PROJECT_ROOT, NO_SPEC_FILES);
  assert.deepEqual(result.summary, {
    generated: "",
    lastUpdated: "",
    project: "",
    projectKey: "",
    trackingSystem: "",
    storyLocation: "",
    activeEpic: "unknown",
  });
});

test("parseSprintStatus() returns actionItems: [] when action_items is absent (SAMPLE has none)", () => {
  const result = parseSprintStatus(SAMPLE, PROJECT_ROOT, NO_SPEC_FILES);
  assert.deepEqual(result.actionItems, []);
});

test("parseSprintStatus() parses action_items and resolves each ref against projectRootPath", () => {
  const result = parseSprintStatus(
    {
      action_items: [
        {
          id: "item-1",
          epic: 1,
          action: "Do the thing",
          owner: "dev loop",
          status: "done",
          ref: "_bmad-output/implementation-artifacts/retro.md",
        },
      ],
    },
    PROJECT_ROOT,
    NO_SPEC_FILES,
  );
  assert.equal(result.actionItems.length, 1);
  assert.equal(result.actionItems[0]?.id, "item-1");
  assert.equal(result.actionItems[0]?.epic, 1);
  assert.equal(result.actionItems[0]?.action, "Do the thing");
  assert.equal(result.actionItems[0]?.owner, "dev loop");
  assert.equal(result.actionItems[0]?.status, "done");
  assert.equal(result.actionItems[0]?.ref, "_bmad-output/implementation-artifacts/retro.md");
  assert.equal(
    result.actionItems[0]?.resolvedPath,
    join(PROJECT_ROOT, "_bmad-output/implementation-artifacts/retro.md"),
  );
});

test("parseSprintStatus() derives each step's index/title, and falls back to the raw key for a malformed one", () => {
  const result = parseSprintStatus(
    {
      development_status: {
        "epic-1": "done",
        "1-1-run-the-command": "done",
        "1-fix-a-thing-with-no-story-number": "open",
      },
    },
    PROJECT_ROOT,
    NO_SPEC_FILES,
  );
  const epic1 = result.epics.find((e) => e.epicKey === "epic-1");
  assert.deepEqual(epic1?.steps, [
    { key: "1-1-run-the-command", index: "1-1", title: "run the command", status: "done", specPath: null },
    {
      key: "1-fix-a-thing-with-no-story-number",
      index: "1-fix-a-thing-with-no-story-number",
      title: "1-fix-a-thing-with-no-story-number",
      status: "open",
      specPath: null,
    },
  ]);
});

test("parseSprintStatus() resolves a step's specPath when a matching spec file is listed", () => {
  const result = parseSprintStatus(
    {
      development_status: {
        "epic-1": "done",
        "1-1-run-the-command": "done",
      },
    },
    PROJECT_ROOT,
    ["spec-1-1-run-the-command-and-reach-a-served-page.md"],
  );
  const epic1 = result.epics.find((e) => e.epicKey === "epic-1");
  assert.equal(
    epic1?.steps[0]?.specPath,
    join(PROJECT_ROOT, "_bmad-output", "implementation-artifacts", "spec-1-1-run-the-command-and-reach-a-served-page.md"),
  );
});

test("calculateActiveEpic() returns 'All complete' when every epic is done", () => {
  const result = calculateActiveEpic([epic("epic-1", "done"), epic("epic-2", "done")]);
  assert.equal(result, "All complete");
});

test("calculateActiveEpic() returns 'Not started' when every epic is backlog", () => {
  const result = calculateActiveEpic([epic("epic-1", "backlog"), epic("epic-2", "backlog")]);
  assert.equal(result, "Not started");
});

test("calculateActiveEpic() returns the first in-progress epic's key, in file order", () => {
  const result = calculateActiveEpic([
    epic("epic-1", "done"),
    epic("epic-2", "in-progress"),
    epic("epic-3", "in-progress"),
  ]);
  assert.equal(result, "epic-2");
});

test("calculateActiveEpic() returns 'unknown' for a mix with none in-progress and not all done/backlog", () => {
  const result = calculateActiveEpic([epic("epic-1", "done"), epic("epic-2", "backlog")]);
  assert.equal(result, "unknown");
});

test("calculateActiveEpic() returns 'unknown' for an empty epics array, not 'All complete'/'Not started'", () => {
  const result = calculateActiveEpic([]);
  assert.equal(result, "unknown");
});
