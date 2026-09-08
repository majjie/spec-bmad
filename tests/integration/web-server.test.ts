import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildProjectRoot } from "../../src/artifacts/project-root.js";
import { createHierarchyCache } from "../../src/artifacts/cache.js";
import { startHttpServer, type HttpServerHandle } from "../../src/server/http-server.js";
import { createApiRequestHandler } from "../../src/server/api-router.js";

async function makeFixture(): Promise<string> {
  const projectPath = await mkdtemp(join(tmpdir(), "bmad-web-server-"));
  await mkdir(join(projectPath, "_bmad", "specs"), { recursive: true });
  await writeFile(join(projectPath, "_bmad", "specs", "spec.md"), "content");
  return projectPath;
}

async function startServerFor(projectPath: string): Promise<HttpServerHandle> {
  const root = await buildProjectRoot(projectPath);
  assert.ok(root, "fixture must be a valid BMAD project");
  const cache = createHierarchyCache();
  return startHttpServer(createApiRequestHandler(root, cache));
}

test("GET /api/tabs, /api/tree/infra, /api/contents/infra match the valid-folder contract", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const tabsRes = await fetch(`${server.url}/api/tabs`);
    assert.equal(tabsRes.status, 200);
    assert.deepEqual(await tabsRes.json(), { navigator: false, infra: true, output: false });

    const treeRes = await fetch(`${server.url}/api/tree/infra`);
    assert.equal(treeRes.status, 200);
    const tree = (await treeRes.json()) as { name: string; children: unknown[] };
    assert.equal(tree.name, "_bmad");
    assert.equal(tree.children.length, 1);

    const bmadPath = join(projectPath, "_bmad");
    const contentsRes = await fetch(
      `${server.url}/api/contents/infra?path=${encodeURIComponent(bmadPath)}`,
    );
    assert.equal(contentsRes.status, 200);
    const entries = (await contentsRes.json()) as Array<{ name: string }>;
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.name, "specs");
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/tree/bogus-tab returns 404 for an unrecognized tab", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const res = await fetch(`${server.url}/api/tree/bogus-tab`);
    assert.equal(res.status, 404);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/contents/infra with no path query param returns 400", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const res = await fetch(`${server.url}/api/contents/infra`);
    assert.equal(res.status, 400);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/contents/infra?path=<nonexistent> returns 404", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const missingPath = join(projectPath, "_bmad", "does-not-exist");
    const res = await fetch(
      `${server.url}/api/contents/infra?path=${encodeURIComponent(missingPath)}`,
    );
    assert.equal(res.status, 404);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/tree/output returns the missing-folder response when only _bmad exists", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const tabsRes = await fetch(`${server.url}/api/tabs`);
    assert.deepEqual(await tabsRes.json(), { navigator: false, infra: true, output: false });

    const treeRes = await fetch(`${server.url}/api/tree/output`);
    assert.equal(treeRes.status, 404);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/contents/infra?path=<outside infra's tree> returns 403", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  const outsidePath = await mkdtemp(join(tmpdir(), "bmad-web-server-outside-"));
  try {
    const res = await fetch(
      `${server.url}/api/contents/infra?path=${encodeURIComponent(outsidePath)}`,
    );
    assert.equal(res.status, 403);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
    await rm(outsidePath, { recursive: true, force: true });
  }
});

test("GET /api/file/infra?path=<a real text file> returns 200 with its exact contents", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const specPath = join(projectPath, "_bmad", "specs", "spec.md");
    const res = await fetch(`${server.url}/api/file/infra?path=${encodeURIComponent(specPath)}`);

    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") ?? "", /text\/plain/);
    assert.equal(await res.text(), "content");
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/file/infra with no path query param returns 400", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const res = await fetch(`${server.url}/api/file/infra`);
    assert.equal(res.status, 400);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/file/bogus-tab returns 400 for an unrecognized tab", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const specPath = join(projectPath, "_bmad", "specs", "spec.md");
    const res = await fetch(
      `${server.url}/api/file/bogus-tab?path=${encodeURIComponent(specPath)}`,
    );
    assert.equal(res.status, 400);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/file/output returns 404 when output's folder doesn't exist for this project", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const somePath = join(projectPath, "_bmad-output", "whatever.md");
    const res = await fetch(
      `${server.url}/api/file/output?path=${encodeURIComponent(somePath)}`,
    );
    assert.equal(res.status, 404);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/file/infra?path=<outside infra's tree> returns 403", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  const outsidePath = await mkdtemp(join(tmpdir(), "bmad-web-server-outside-"));
  try {
    const outsideFile = join(outsidePath, "secret.txt");
    await writeFile(outsideFile, "shh");
    const res = await fetch(
      `${server.url}/api/file/infra?path=${encodeURIComponent(outsideFile)}`,
    );
    assert.equal(res.status, 403);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
    await rm(outsidePath, { recursive: true, force: true });
  }
});

test("GET /api/file/infra?path=<nonexistent> returns 404", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const missingPath = join(projectPath, "_bmad", "does-not-exist.md");
    const res = await fetch(
      `${server.url}/api/file/infra?path=${encodeURIComponent(missingPath)}`,
    );
    assert.equal(res.status, 404);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/file/infra?path=<a file with a null byte> returns 415", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const binaryPath = join(projectPath, "_bmad", "specs", "binary.dat");
    await writeFile(binaryPath, Buffer.from([0x00, 0x01, 0x02]));
    const res = await fetch(
      `${server.url}/api/file/infra?path=${encodeURIComponent(binaryPath)}`,
    );
    assert.equal(res.status, 415);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

async function makeOutputFixture(): Promise<string> {
  const projectPath = await mkdtemp(join(tmpdir(), "bmad-web-server-output-"));
  await mkdir(join(projectPath, "_bmad-output", "planning-artifacts", "prds"), {
    recursive: true,
  });
  await mkdir(join(projectPath, "_bmad-output", "implementation-artifacts"), {
    recursive: true,
  });
  return projectPath;
}

test("GET /api/tabs reports navigator: true only when _bmad-output exists", async () => {
  const projectPath = await makeOutputFixture();
  const server = await startServerFor(projectPath);
  try {
    const res = await fetch(`${server.url}/api/tabs`);
    assert.deepEqual(await res.json(), { navigator: true, infra: false, output: true });
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/navigator/tree groups PRD folders and reports sprintStatusAvailable", async () => {
  const projectPath = await makeOutputFixture();
  const prdsPath = join(projectPath, "_bmad-output", "planning-artifacts", "prds");
  await mkdir(join(prdsPath, "prd-foo-2028-08-28"));
  await mkdir(join(prdsPath, "prd-foo-2028-08-30"));
  await mkdir(join(prdsPath, "not-following-convention"));
  await writeFile(
    join(projectPath, "_bmad-output", "implementation-artifacts", "sprint-status.yaml"),
    "generated: today\n",
  );
  const server = await startServerFor(projectPath);
  try {
    const res = await fetch(`${server.url}/api/navigator/tree`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      prd: { projects: { project: string; dates: { date: string }[] }[]; nonConforming: { folderName: string }[] } | null;
      sprintStatusAvailable: boolean;
    };
    assert.equal(body.sprintStatusAvailable, true);
    assert.ok(body.prd);
    assert.deepEqual(
      body.prd.projects.map((p) => p.project),
      ["prd-foo"],
    );
    assert.deepEqual(
      body.prd.projects[0]?.dates.map((d) => d.date),
      ["2028-08-30", "2028-08-28"],
    );
    assert.deepEqual(
      body.prd.nonConforming.map((n) => n.folderName),
      ["not-following-convention"],
    );
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/navigator/tree returns prd: null and sprintStatusAvailable: false when neither exists", async () => {
  const projectPath = await makeOutputFixture();
  const server = await startServerFor(projectPath);
  try {
    const res = await fetch(`${server.url}/api/navigator/tree`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { prd: unknown; sprintStatusAvailable: boolean };
    assert.equal(body.prd, null);
    assert.equal(body.sprintStatusAvailable, false);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/navigator/tree returns 404 when _bmad-output doesn't exist", async () => {
  const projectPath = await makeFixture();
  const server = await startServerFor(projectPath);
  try {
    const res = await fetch(`${server.url}/api/navigator/tree`);
    assert.equal(res.status, 404);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/navigator/sprint-status returns 200 with the parsed Summary and epics", async () => {
  const projectPath = await makeOutputFixture();
  await writeFile(
    join(projectPath, "_bmad-output", "implementation-artifacts", "sprint-status.yaml"),
    [
      "generated: today",
      "project: bmad-dash",
      "development_status:",
      "  epic-1: done",
      "  1-1-run-the-command: done",
      "  epic-1-retrospective: done",
    ].join("\n"),
  );
  const server = await startServerFor(projectPath);
  try {
    const res = await fetch(`${server.url}/api/navigator/sprint-status`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      summary: { project: string; activeEpic: string };
      epics: { epicKey: string; status: string; stories: { key: string }[]; retrospectiveStatus: string | null }[];
      actionItems: unknown[];
    };
    assert.equal(body.summary.project, "bmad-dash");
    assert.equal(body.summary.activeEpic, "All complete");
    assert.equal(body.epics.length, 1);
    assert.equal(body.epics[0]?.epicKey, "epic-1");
    assert.equal(body.epics[0]?.status, "done");
    assert.deepEqual(body.epics[0]?.stories.map((s) => s.key), ["1-1-run-the-command"]);
    assert.equal(body.epics[0]?.retrospectiveStatus, "done");
    assert.deepEqual(body.actionItems, []);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/navigator/sprint-status returns actionItems with each ref resolved against the project root", async () => {
  const projectPath = await makeOutputFixture();
  await writeFile(
    join(projectPath, "_bmad-output", "implementation-artifacts", "sprint-status.yaml"),
    [
      "generated: today",
      "project: bmad-dash",
      "action_items:",
      "  - id: item-1",
      "    epic: 1",
      "    action: Do the thing",
      "    owner: dev loop",
      "    status: done",
      "    ref: _bmad-output/implementation-artifacts/retro.md",
      "  - id: item-2",
      "    action: An item missing several properties",
    ].join("\n"),
  );
  const server = await startServerFor(projectPath);
  try {
    const res = await fetch(`${server.url}/api/navigator/sprint-status`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      actionItems: {
        id: string;
        epic: number | null;
        action: string | null;
        owner: string | null;
        status: string | null;
        ref: string | null;
        resolvedPath: string | null;
      }[];
    };
    // item-2 (non-"done") sorts before item-1 (status "done") — FR-009's post-implementation
    // stable partition by done-status.
    assert.equal(body.actionItems.length, 2);
    assert.equal(body.actionItems[0]?.id, "item-2");
    assert.equal(body.actionItems[0]?.owner, null);
    assert.equal(body.actionItems[0]?.status, null);
    assert.equal(body.actionItems[0]?.ref, null);
    assert.equal(body.actionItems[0]?.resolvedPath, null);
    assert.equal(body.actionItems[1]?.id, "item-1");
    assert.equal(body.actionItems[1]?.epic, 1);
    assert.equal(body.actionItems[1]?.action, "Do the thing");
    assert.equal(body.actionItems[1]?.owner, "dev loop");
    assert.equal(body.actionItems[1]?.status, "done");
    assert.equal(body.actionItems[1]?.ref, "_bmad-output/implementation-artifacts/retro.md");
    assert.equal(
      body.actionItems[1]?.resolvedPath,
      join(projectPath, "_bmad-output/implementation-artifacts/retro.md"),
    );
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/navigator/sprint-status returns 404 when the file doesn't exist", async () => {
  const projectPath = await makeOutputFixture();
  const server = await startServerFor(projectPath);
  try {
    const res = await fetch(`${server.url}/api/navigator/sprint-status`);
    assert.equal(res.status, 404);
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("GET /api/navigator/sprint-status returns 422 when the file can't be parsed as YAML", async () => {
  const projectPath = await makeOutputFixture();
  await writeFile(
    join(projectPath, "_bmad-output", "implementation-artifacts", "sprint-status.yaml"),
    "key: [unclosed",
  );
  const server = await startServerFor(projectPath);
  try {
    const res = await fetch(`${server.url}/api/navigator/sprint-status`);
    assert.equal(res.status, 422);
    const body = (await res.json()) as { error: string };
    assert.equal(typeof body.error, "string");
  } finally {
    await server.close();
    await rm(projectPath, { recursive: true, force: true });
  }
});
