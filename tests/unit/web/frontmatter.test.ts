import { test } from "node:test";
import assert from "node:assert/strict";
import { stripFrontmatter, stringifyPreambleValue } from "../../../web/src/frontmatter.js";

test("stripFrontmatter() returns content unchanged when it doesn't start with a --- line", () => {
  const content = "# Just a heading\n\nSome body text.";
  const result = stripFrontmatter(content);
  assert.deepEqual(result, { body: content, preamble: null });
});

test("stripFrontmatter() returns content unchanged when the --- block is never closed", () => {
  const content = "---\ntitle: unterminated\n\n# Heading\n";
  const result = stripFrontmatter(content);
  assert.deepEqual(result, { body: content, preamble: null });
});

test("stripFrontmatter() returns content unchanged when the block doesn't parse as a YAML mapping (a scalar)", () => {
  const content = "---\njust a plain scalar string\n---\n\n# Heading\n";
  const result = stripFrontmatter(content);
  assert.deepEqual(result, { body: content, preamble: null });
});

test("stripFrontmatter() returns content unchanged when the block doesn't parse as a YAML mapping (a list)", () => {
  const content = "---\n- one\n- two\n---\n\n# Heading\n";
  const result = stripFrontmatter(content);
  assert.deepEqual(result, { body: content, preamble: null });
});

test("stripFrontmatter() returns content unchanged when the YAML between --- lines is invalid", () => {
  const content = "---\nkey: [unclosed\n---\n\n# Heading\n";
  const result = stripFrontmatter(content);
  assert.deepEqual(result, { body: content, preamble: null });
});

test("stripFrontmatter() strips a YAML-only preamble with no marker element", () => {
  const content = ["---", 'title: "YAML only"', "status: 'open'", "---", "", "# Heading", "", "Body text."].join(
    "\n",
  );
  const result = stripFrontmatter(content);
  assert.deepEqual(result.preamble, { title: "YAML only", status: "open" });
  assert.equal(result.body.includes("---"), false);
  assert.equal(result.body.includes("# Heading"), true);
  assert.equal(result.body.includes("Body text."), true);
});

test("stripFrontmatter() strips both tag lines of a marker element immediately after the YAML block, keeping content between them", () => {
  const content = [
    "---",
    "title: full example",
    "---",
    "",
    '<frozen-after-approval reason="do not modify">',
    "",
    "# Heading",
    "",
    "Body text.",
    "",
    "</frozen-after-approval>",
  ].join("\n");
  const result = stripFrontmatter(content);
  assert.deepEqual(result.preamble, { title: "full example" });
  assert.equal(result.body.includes("frozen-after-approval"), false);
  assert.equal(result.body.includes("# Heading"), true);
  assert.equal(result.body.includes("Body text."), true);
});

test("stripFrontmatter() tolerates blank lines around both tag lines", () => {
  const content = [
    "---",
    "title: full example",
    "---",
    "",
    "",
    '<frozen-after-approval reason="do not modify">',
    "",
    "",
    "# Heading",
    "",
    "",
    "</frozen-after-approval>",
  ].join("\n");
  const result = stripFrontmatter(content);
  assert.deepEqual(result.preamble, { title: "full example" });
  assert.equal(result.body.includes("frozen-after-approval"), false);
  assert.equal(result.body.includes("# Heading"), true);
});

test("stripFrontmatter() finds a closing tag after a substantial block of ordinary Markdown, far from the opening tag", () => {
  const paragraphs = Array.from({ length: 20 }, (_, i) => `Paragraph number ${i + 1} of ordinary Markdown body text.`);
  const content = [
    "---",
    "title: far apart tags",
    "---",
    "",
    '<frozen-after-approval reason="do not modify">',
    "",
    "# Heading",
    "",
    ...paragraphs,
    "",
    "</frozen-after-approval>",
  ].join("\n");
  const result = stripFrontmatter(content);
  assert.deepEqual(result.preamble, { title: "far apart tags" });
  assert.equal(result.body.includes("frozen-after-approval"), false);
  assert.equal(result.body.includes("# Heading"), true);
  for (const paragraph of paragraphs) {
    assert.equal(result.body.includes(paragraph), true);
  }
});

test("stripFrontmatter() removes only the opening tag line when no matching closing tag is found", () => {
  const content = [
    "---",
    "title: no closing tag",
    "---",
    "",
    '<frozen-after-approval reason="do not modify">',
    "",
    "# Heading",
    "",
    "Body text with no closing marker at all.",
  ].join("\n");
  const result = stripFrontmatter(content);
  assert.deepEqual(result.preamble, { title: "no closing tag" });
  assert.equal(result.body.includes("<frozen-after-approval"), false);
  assert.equal(result.body.includes("# Heading"), true);
  assert.equal(result.body.includes("Body text with no closing marker at all."), true);
});

test("stripFrontmatter() strips a YAML block that parses to an empty mapping, returning an empty preamble object", () => {
  const content = "---\n---\n\n# Heading\n";
  const result = stripFrontmatter(content);
  assert.deepEqual(result.preamble, {});
  assert.equal(result.body.includes("# Heading"), true);
});

test("stringifyPreambleValue() renders a string plainly", () => {
  assert.equal(stringifyPreambleValue("hello"), "hello");
});

test("stringifyPreambleValue() renders a number plainly", () => {
  assert.equal(stringifyPreambleValue(0), "0");
});

test("stringifyPreambleValue() renders a boolean plainly", () => {
  assert.equal(stringifyPreambleValue(true), "true");
});

test("stringifyPreambleValue() renders an empty array via JSON.stringify", () => {
  assert.equal(stringifyPreambleValue([]), "[]");
});

test("stringifyPreambleValue() renders a nested object via JSON.stringify", () => {
  assert.equal(stringifyPreambleValue({ a: 1 }), '{"a":1}');
});
