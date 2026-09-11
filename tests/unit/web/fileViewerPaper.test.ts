import { test } from "node:test";
import assert from "node:assert/strict";
import { fileViewerPaperSize } from "../../../web/src/fileViewerPaper.js";

test("fileViewerPaperSize returns the compact reading panel dimensions by default", () => {
  const size = fileViewerPaperSize(false);
  assert.equal(size.width, "min(880px, calc(100% - 32px))");
  assert.equal(size.maxWidth, "880px");
  assert.equal(size.height, "min(820px, calc(100% - 48px))");
  assert.equal(size.maxHeight, "calc(100% - 48px)");
});

test("fileViewerPaperSize expands to 98% of the viewport", () => {
  const size = fileViewerPaperSize(true);
  assert.equal(size.width, "98%");
  assert.equal(size.maxWidth, "98%");
  assert.equal(size.height, "98%");
  assert.equal(size.maxHeight, "98%");
  assert.equal(size.margin, "1%");
});
