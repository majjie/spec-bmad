import { test } from "node:test";
import assert from "node:assert/strict";
import { formatStatusLabel, humanizeProjectSlug, sectionToTab } from "../../../web/src/shell.js";

test("humanizeProjectSlug strips prd- and architecture- prefixes", () => {
  assert.equal(humanizeProjectSlug("prd-harbor"), "harbor");
  assert.equal(humanizeProjectSlug("architecture-harbor"), "harbor");
  assert.equal(humanizeProjectSlug("scratch-workshop-notes"), "scratch workshop notes");
});

test("sectionToTab maps shell sections to API tabs", () => {
  assert.equal(sectionToTab("overview"), "navigator");
  assert.equal(sectionToTab("requirements"), "navigator");
  assert.equal(sectionToTab("architecture"), "navigator");
  assert.equal(sectionToTab("sprint"), "navigator");
  assert.equal(sectionToTab("method"), "infra");
  assert.equal(sectionToTab("generated"), "output");
});

test("formatStatusLabel uses human phrasing for known statuses", () => {
  assert.equal(formatStatusLabel("in-progress"), "In progress");
  assert.equal(formatStatusLabel("review"), "In review");
  assert.equal(formatStatusLabel("done"), "Done");
  assert.equal(formatStatusLabel("ready-for-dev"), "ready-for-dev");
});
