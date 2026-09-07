import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CLI_PATH = resolve(
  fileURLToPath(new URL("../../src/cli.ts", import.meta.url)),
);
// An absolute path (rather than the bare specifier "tsx") so module resolution works
// even when the child process's cwd has no node_modules of its own (as in the fixture
// directories these tests spawn the CLI against).
const TSX_LOADER = resolve(
  fileURLToPath(new URL("../../node_modules/tsx/dist/loader.mjs", import.meta.url)),
);

function runCli(args: string[], options: { cwd?: string } = {}) {
  return spawnSync(process.execPath, ["--import", TSX_LOADER, CLI_PATH, ...args], {
    encoding: "utf8",
    cwd: options.cwd,
  });
}

test("valid folder: exits 0 with no error output", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "bmad-cli-it-"));
  try {
    await mkdir(join(workspace, "_bmad"), { recursive: true });

    const result = runCli([workspace]);

    assert.equal(result.status, 0);
    assert.equal(result.stderr.trim(), "");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("invalid folder with one nearby candidate: reports invalid and suggests the candidate", async () => {
  const parent = await mkdtemp(join(tmpdir(), "bmad-cli-it-"));
  try {
    const invalidTarget = join(parent, "not-a-project");
    await mkdir(invalidTarget, { recursive: true });
    const candidate = join(parent, "sibling-project");
    await mkdir(join(candidate, "_bmad"), { recursive: true });

    const result = runCli([invalidTarget]);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /not a recognizable BMAD project/i);
    assert.match(result.stderr, new RegExp(candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("invalid folder with multiple nearby candidates: suggests each of them", async () => {
  const parent = await mkdtemp(join(tmpdir(), "bmad-cli-it-"));
  try {
    const invalidTarget = join(parent, "not-a-project");
    await mkdir(invalidTarget, { recursive: true });
    const candidateA = join(parent, "project-a");
    const candidateB = join(parent, "project-b");
    await mkdir(join(candidateA, "_bmad"), { recursive: true });
    await mkdir(join(candidateB, "_bmad-output"), { recursive: true });

    const result = runCli([invalidTarget]);

    assert.notEqual(result.status, 0);
    for (const candidate of [candidateA, candidateB]) {
      assert.match(result.stderr, new RegExp(candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("invalid folder with nothing nearby: reports invalid and that nothing was found", async () => {
  const parent = await mkdtemp(join(tmpdir(), "bmad-cli-it-"));
  try {
    const invalidTarget = join(parent, "not-a-project");
    await mkdir(invalidTarget, { recursive: true });

    const result = runCli([invalidTarget]);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /not a recognizable BMAD project/i);
    assert.match(result.stderr, /no .* (could|can) be (located|found)/i);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("no folder argument: defaults to the current working directory", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "bmad-cli-it-"));
  try {
    await mkdir(join(workspace, "_bmad"), { recursive: true });

    const result = runCli([], { cwd: workspace });

    assert.equal(result.status, 0);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
