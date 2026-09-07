import { test } from "node:test";
import assert from "node:assert/strict";
import { looksBinary } from "../../../src/server/routes/file.js";

test("looksBinary() returns true for a buffer containing a null byte", () => {
  const buffer = Buffer.from([0x68, 0x65, 0x6c, 0x6c, 0x00, 0x6f]);

  assert.equal(looksBinary(buffer), true);
});

test("looksBinary() returns false for ordinary UTF-8 text content", () => {
  const buffer = Buffer.from("hello world\nsecond line\n", "utf8");

  assert.equal(looksBinary(buffer), false);
});

test("looksBinary() only scans the first 8000 bytes", () => {
  const textPrefix = Buffer.from("a".repeat(8000), "utf8");
  const nullSuffix = Buffer.from([0x00]);
  const buffer = Buffer.concat([textPrefix, nullSuffix]);

  assert.equal(looksBinary(buffer), false);
});
