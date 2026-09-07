import { test } from "node:test";
import assert from "node:assert/strict";
import { getFileRenderMode } from "../../../web/src/fileRenderMode.js";

test("getFileRenderMode() treats .gitignore as plain", () => {
  assert.deepEqual(getFileRenderMode(".gitignore"), { kind: "plain" });
});

test("getFileRenderMode() treats .md as markdown", () => {
  assert.deepEqual(getFileRenderMode("readme.md"), { kind: "markdown" });
});

test("getFileRenderMode() treats .yaml as syntax-highlighted yaml", () => {
  assert.deepEqual(getFileRenderMode("config.yaml"), { kind: "syntax", language: "yaml" });
});

test("getFileRenderMode() treats .toml as syntax-highlighted toml", () => {
  assert.deepEqual(getFileRenderMode("config.toml"), { kind: "syntax", language: "toml" });
});

test("getFileRenderMode() treats .py as syntax-highlighted python", () => {
  assert.deepEqual(getFileRenderMode("script.py"), { kind: "syntax", language: "python" });
});

test("getFileRenderMode() treats .txt as plain", () => {
  assert.deepEqual(getFileRenderMode("notes.txt"), { kind: "plain" });
});

test("getFileRenderMode() treats .csv as csv-grid", () => {
  assert.deepEqual(getFileRenderMode("data.csv"), { kind: "csv-grid" });
});

test("getFileRenderMode() falls back to plain for an unrecognized extension", () => {
  assert.deepEqual(getFileRenderMode("file.unknownext"), { kind: "plain" });
});

test("getFileRenderMode() falls back to plain for a file with no extension at all", () => {
  assert.deepEqual(getFileRenderMode("Makefile"), { kind: "plain" });
});
