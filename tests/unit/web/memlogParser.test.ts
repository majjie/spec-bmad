import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMemlogEntries } from "../../../web/src/memlogParser.js";
import type { RequirementCodeReference } from "../../../web/src/prdIndex.js";

function ref(id: string, code: string, number: number): RequirementCodeReference {
  const prefix = code.split("-")[0] ?? "";
  return { id, code, prefix, number, style: "bullet" };
}

test("parseMemlogEntries() extracts a category from a valid (word) prefix", () => {
  const entries = parseMemlogEntries("- (decision) Stakes: public launch.", []);
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.category, "Decision");
  assert.deepEqual(entries[0]?.segments, [{ kind: "text", value: "Stakes: public launch." }]);
});

test("parseMemlogEntries() falls back to category: null when there's no parenthetical prefix", () => {
  const entries = parseMemlogEntries("- Just a plain bullet with no category.", []);
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.category, null);
  assert.deepEqual(entries[0]?.segments, [{ kind: "text", value: "Just a plain bullet with no category." }]);
});

test("parseMemlogEntries() falls back to category: null when the parentheses contain multiple words", () => {
  const entries = parseMemlogEntries("- (a decision) Multiple words inside parens.", []);
  assert.equal(entries[0]?.category, null);
});

test("parseMemlogEntries() splits multiple bullets into separate entries", () => {
  const content = ["- (decision) First entry.", "- (change) Second entry.", "- (assumption) Third entry."].join(
    "\n",
  );
  const entries = parseMemlogEntries(content, []);
  assert.deepEqual(
    entries.map((e) => e.category),
    ["Decision", "Change", "Assumption"],
  );
});

test("parseMemlogEntries() detects a bare inline requirement code with a word boundary, splitting off a trailing possessive", () => {
  const entries = parseMemlogEntries("- (decision) FR-56's silence preference now has a floor.", [
    ref("prd-ref-0", "FR-56", 56),
  ]);
  assert.deepEqual(entries[0]?.segments, [
    { kind: "code", text: "FR-56", referenceId: "prd-ref-0" },
    { kind: "text", value: "'s silence preference now has a floor." },
  ]);
});

test("parseMemlogEntries() resolves every distinct requirement code in a bullet independently", () => {
  const prdReferences = [ref("prd-ref-0", "FR-76", 76), ref("prd-ref-1", "FR-56", 56)];
  const entries = parseMemlogEntries(
    "- (decision) FR-76 added answering the finding: FR-56's silence preference now has a floor.",
    prdReferences,
  );
  const codeSegments = entries[0]?.segments.filter((s) => s.kind === "code");
  assert.deepEqual(
    codeSegments?.map((s) => (s.kind === "code" ? [s.text, s.referenceId] : null)),
    [
      ["FR-76", "prd-ref-0"],
      ["FR-56", "prd-ref-1"],
    ],
  );
});

test("parseMemlogEntries() sets referenceId to null for a code not present in prdReferences", () => {
  const entries = parseMemlogEntries("- (decision) Mentions FR-999 which doesn't exist.", [ref("prd-ref-0", "FR-1", 1)]);
  const codeSegment = entries[0]?.segments.find((s) => s.kind === "code");
  assert.equal(codeSegment?.kind, "code");
  assert.equal(codeSegment && codeSegment.kind === "code" ? codeSegment.referenceId : undefined, null);
});

test("parseMemlogEntries() resolves a code that matches more than one prdReferences entry to the first one in document order", () => {
  const prdReferences = [ref("prd-ref-0", "FR-25", 25), ref("prd-ref-5", "FR-25", 25)];
  const entries = parseMemlogEntries("- (decision) See FR-25 for details.", prdReferences);
  const codeSegment = entries[0]?.segments.find((s) => s.kind === "code");
  assert.equal(codeSegment && codeSegment.kind === "code" ? codeSegment.referenceId : undefined, "prd-ref-0");
});

test("parseMemlogEntries() returns an empty array for empty content", () => {
  assert.deepEqual(parseMemlogEntries("", []), []);
});

test("parseMemlogEntries() ignores blank lines between bullets", () => {
  const content = ["- (decision) First.", "", "- (decision) Second."].join("\n");
  const entries = parseMemlogEntries(content, []);
  assert.equal(entries.length, 2);
});
