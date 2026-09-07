import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, symlink, chmod, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveProjectFolder } from "../../../src/discovery/resolve-project-folder.js";

test("resolveProjectFolder() defaults to process.cwd() when no target is given", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "bmad-discovery-"));
  try {
    await mkdir(join(workspace, "_bmad"), { recursive: true });
    const originalCwd = process.cwd();
    process.chdir(workspace);
    try {
      const result = await resolveProjectFolder();
      assert.equal(result.kind, "valid");
      assert.equal(result.target, workspace);
    } finally {
      process.chdir(originalCwd);
    }
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("resolveProjectFolder() returns kind: 'valid' for a folder with a real _bmad folder", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "bmad-discovery-"));
  try {
    await mkdir(join(workspace, "_bmad"), { recursive: true });
    const result = await resolveProjectFolder(workspace);
    assert.equal(result.kind, "valid");
    assert.ok(result.root);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("resolveProjectFolder() treats a symlinked _bmad folder as still invalid", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "bmad-discovery-"));
  try {
    await mkdir(join(workspace, "real-bmad"), { recursive: true });
    await symlink(join(workspace, "real-bmad"), join(workspace, "_bmad"));

    const result = await resolveProjectFolder(workspace);

    assert.notEqual(result.kind, "valid");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("resolveProjectFolder() finds a candidate in the parent itself", async () => {
  const parent = await mkdtemp(join(tmpdir(), "bmad-discovery-"));
  try {
    await mkdir(join(parent, "_bmad-output"), { recursive: true });
    const invalidTarget = join(parent, "not-a-project");
    await mkdir(invalidTarget, { recursive: true });

    const result = await resolveProjectFolder(invalidTarget);

    assert.equal(result.kind, "invalid-with-candidates");
    assert.equal(result.candidates.length, 1);
    assert.equal(result.candidates[0]!.root.path, parent);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("resolveProjectFolder() finds candidates one and two levels below the parent", async () => {
  const parent = await mkdtemp(join(tmpdir(), "bmad-discovery-"));
  try {
    const invalidTarget = join(parent, "not-a-project");
    await mkdir(invalidTarget, { recursive: true });

    const level1Candidate = join(parent, "sibling-project");
    await mkdir(join(level1Candidate, "_bmad"), { recursive: true });

    const level2Candidate = join(parent, "group", "nested-project");
    await mkdir(join(level2Candidate, "_bmad-output"), { recursive: true });

    const result = await resolveProjectFolder(invalidTarget);

    assert.equal(result.kind, "invalid-with-candidates");
    const foundPaths = result.candidates.map((c) => c.root.path).sort();
    assert.deepEqual(foundPaths, [level1Candidate, level2Candidate].sort());
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("resolveProjectFolder() skips hidden and node_modules folders during the crawl", async () => {
  const parent = await mkdtemp(join(tmpdir(), "bmad-discovery-"));
  try {
    const invalidTarget = join(parent, "not-a-project");
    await mkdir(invalidTarget, { recursive: true });

    await mkdir(join(parent, ".hidden-project", "_bmad"), { recursive: true });
    await mkdir(join(parent, "node_modules", "some-pkg-project", "_bmad"), {
      recursive: true,
    });

    const result = await resolveProjectFolder(invalidTarget);

    assert.equal(result.kind, "invalid-no-candidates");
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("resolveProjectFolder() skips a directory it cannot read during the crawl, without aborting", async () => {
  const parent = await mkdtemp(join(tmpdir(), "bmad-discovery-"));
  try {
    const invalidTarget = join(parent, "not-a-project");
    await mkdir(invalidTarget, { recursive: true });

    const unreadable = join(parent, "unreadable");
    await mkdir(unreadable, { recursive: true });
    await chmod(unreadable, 0o000);

    const goodCandidate = join(parent, "good-project");
    await mkdir(join(goodCandidate, "_bmad"), { recursive: true });

    try {
      const result = await resolveProjectFolder(invalidTarget);
      assert.equal(result.kind, "invalid-with-candidates");
      assert.equal(result.candidates.length, 1);
      assert.equal(result.candidates[0]!.root.path, goodCandidate);
    } finally {
      await chmod(unreadable, 0o755);
    }
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("resolveProjectFolder() returns 'invalid-no-candidates' when nothing is found nearby", async () => {
  const parent = await mkdtemp(join(tmpdir(), "bmad-discovery-"));
  try {
    const invalidTarget = join(parent, "not-a-project");
    await mkdir(invalidTarget, { recursive: true });

    const result = await resolveProjectFolder(invalidTarget);

    assert.equal(result.kind, "invalid-no-candidates");
    assert.equal(result.candidates.length, 0);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});
