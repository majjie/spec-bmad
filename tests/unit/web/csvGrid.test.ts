import { test } from "node:test";
import assert from "node:assert/strict";
import { columnLetter, parseCsvGrid } from "../../../web/src/csvGrid.js";

test("columnLetter() produces spreadsheet-style bijective base-26 letters", () => {
  assert.equal(columnLetter(0), "A");
  assert.equal(columnLetter(25), "Z");
  assert.equal(columnLetter(26), "AA");
  assert.equal(columnLetter(27), "AB");
  assert.equal(columnLetter(51), "AZ");
  assert.equal(columnLetter(52), "BA");
  assert.equal(columnLetter(701), "ZZ");
  assert.equal(columnLetter(702), "AAA");
});

test("parseCsvGrid() splits a typical header + data rows", () => {
  const text = "Name,Age,City\nJane Doe,29,Anytown\n";
  assert.deepEqual(parseCsvGrid(text), {
    header: ["Name", "Age", "City"],
    rows: [["Jane Doe", "29", "Anytown"]],
  });
});

test("parseCsvGrid() keeps a quoted field containing a comma as one field", () => {
  const text = 'Name,Age,City\n"Smith, John",34,Springfield\n';
  const result = parseCsvGrid(text);
  assert.deepEqual(result.rows, [["Smith, John", "34", "Springfield"]]);
});

test("parseCsvGrid() keeps a quoted field containing a line break as one field, one row", () => {
  const text = 'Name,Notes\nAlice,"Line one\nLine two"\n';
  const result = parseCsvGrid(text);
  assert.equal(result.rows.length, 1);
  assert.deepEqual(result.rows[0], ["Alice", "Line one\nLine two"]);
});

test("parseCsvGrid() preserves a ragged row as a shorter array, without padding", () => {
  const text = "A,B,C\n1,2,3\n4,5\n";
  const result = parseCsvGrid(text);
  assert.deepEqual(result.rows, [
    ["1", "2", "3"],
    ["4", "5"],
  ]);
});

test("parseCsvGrid() returns a header with no rows for a header-only file", () => {
  const text = "OnlyHeader,Col2\n";
  assert.deepEqual(parseCsvGrid(text), { header: ["OnlyHeader", "Col2"], rows: [] });
});

test("parseCsvGrid() returns a null header and no rows for a completely empty file", () => {
  assert.deepEqual(parseCsvGrid(""), { header: null, rows: [] });
});
