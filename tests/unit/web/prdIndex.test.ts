import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRequirementCodeIndex, groupByPrefix } from "../../../web/src/prdIndex.js";

test("buildRequirementCodeIndex() detects a bullet-style code", () => {
  const content = "Some text.\n\n**FR-25** Documents are navigable.\n";
  const refs = buildRequirementCodeIndex(content);
  assert.equal(refs.length, 1);
  assert.equal(refs[0]?.code, "FR-25");
  assert.equal(refs[0]?.prefix, "FR");
  assert.equal(refs[0]?.number, 25);
  assert.equal(refs[0]?.style, "bullet");
  assert.equal(refs[0]?.id, "prd-ref-0");
});

test("buildRequirementCodeIndex() detects a header-style code", () => {
  const content = "### UJ-1 — Verifying a completed stage\n\nSome body text.\n";
  const refs = buildRequirementCodeIndex(content);
  assert.equal(refs.length, 1);
  assert.equal(refs[0]?.code, "UJ-1");
  assert.equal(refs[0]?.prefix, "UJ");
  assert.equal(refs[0]?.number, 1);
  assert.equal(refs[0]?.style, "header");
});

test("buildRequirementCodeIndex() counts a duplicated code as two distinct references", () => {
  const content = "**FR-25** First occurrence.\n\nSome text in between.\n\n**FR-25** Second occurrence.\n";
  const refs = buildRequirementCodeIndex(content);
  assert.equal(refs.length, 2);
  assert.equal(refs[0]?.code, "FR-25");
  assert.equal(refs[1]?.code, "FR-25");
  assert.notEqual(refs[0]?.id, refs[1]?.id);
});

test("buildRequirementCodeIndex() counts the same code in both styles as two distinct references", () => {
  const content = "### FR-25 — A heading\n\n**FR-25** A bullet mentioning the same code.\n";
  const refs = buildRequirementCodeIndex(content);
  assert.equal(refs.length, 2);
  assert.equal(refs[0]?.style, "header");
  assert.equal(refs[1]?.style, "bullet");
});

test("buildRequirementCodeIndex() ignores a plain heading that doesn't match the code pattern", () => {
  const content = "### Overview\n\nJust an ordinary section heading.\n";
  const refs = buildRequirementCodeIndex(content);
  assert.deepEqual(refs, []);
});

test("buildRequirementCodeIndex() does not match a lowercase or mixed-case prefix", () => {
  const content = "**fr-25** lowercase.\n\n**Fr-26** mixed case.\n";
  const refs = buildRequirementCodeIndex(content);
  assert.deepEqual(refs, []);
});

test("buildRequirementCodeIndex() returns an empty array for content with no requirement codes", () => {
  assert.deepEqual(buildRequirementCodeIndex("# Just a heading\n\nSome body text.\n"), []);
});

test("buildRequirementCodeIndex() preserves document order across mixed styles and prefixes", () => {
  const content = ["**FR-9** first.", "", "### UJ-2 — a scenario", "", "**FR-25** later."].join("\n");
  const refs = buildRequirementCodeIndex(content);
  assert.deepEqual(
    refs.map((r) => r.code),
    ["FR-9", "UJ-2", "FR-25"],
  );
});

test("groupByPrefix() sorts each group numerically, not lexically", () => {
  const content = "**FR-25** twenty-five.\n\n**FR-9** nine.\n";
  const refs = buildRequirementCodeIndex(content);
  const groups = groupByPrefix(refs);
  assert.equal(groups.length, 1);
  assert.deepEqual(
    groups[0]?.references.map((r) => r.code),
    ["FR-9", "FR-25"],
  );
});

test("groupByPrefix() orders groups by each prefix's first appearance in the document", () => {
  const content = ["**UJ-1** first prefix seen.", "", "**FR-25** second prefix seen.", "", "**UJ-2** back to UJ."].join(
    "\n",
  );
  const refs = buildRequirementCodeIndex(content);
  const groups = groupByPrefix(refs);
  assert.deepEqual(
    groups.map((g) => g.prefix),
    ["UJ", "FR"],
  );
});

test("groupByPrefix() returns an empty array when given no references", () => {
  assert.deepEqual(groupByPrefix([]), []);
});
