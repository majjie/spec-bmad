import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { COLOR_SCHEME_STORAGE_KEY } from "../../../web/src/colorScheme.js";

const html = readFileSync(new URL("../../../web/index.html", import.meta.url), "utf8");

/**
 * `web/index.html` carries two things nothing else can assert.
 *
 * The pre-paint appearance script is the entirety of feature 019's FR-007 - a module bundle
 * is deferred by definition, so nothing loaded by the app can run before the first frame.
 * It duplicates a little resolution logic out of necessity, which makes it look removable to
 * anyone tidying up, and its loss is a flash of the wrong appearance on every load: invisible
 * to every other test in this project.
 *
 * The absence of a font CDN is feature 018's FR (T037) and constitution Principle III. A
 * remote `<link>` is passed through the build untouched, so the source is where it has to be
 * caught.
 */

test("index.html resolves the appearance before the bundle loads (019 FR-007)", () => {
  const scriptEnd = html.indexOf("</script>");
  const moduleScript = html.indexOf('<script type="module"');

  assert.ok(scriptEnd > -1, "expected an inline script in index.html");
  assert.ok(moduleScript > -1, "expected the module bundle script tag");
  assert.ok(
    scriptEnd < moduleScript,
    "the appearance script must precede the module bundle, or it cannot run before first paint",
  );
});

test("the pre-paint script reads the same storage key as colorScheme.ts", () => {
  // The key is this feature's one genuine coupling: it is read in two places written in two
  // different ways, and only this assertion ties them together.
  assert.ok(
    html.includes(COLOR_SCHEME_STORAGE_KEY),
    `index.html must read "${COLOR_SCHEME_STORAGE_KEY}" - the key colorScheme.ts writes`,
  );
});

test("the pre-paint script stamps both the attribute and the native colour-scheme", () => {
  // Setting only the data attribute leaves scrollbars and native controls in the other
  // appearance - a subtle bug with no other guard.
  assert.match(html, /colorScheme\s*=/);
  assert.match(html, /style\.colorScheme\s*=/);
});

test("the pre-paint script tolerates blocked storage (019 FR-008)", () => {
  assert.match(html, /try\s*\{/, "expected the storage read to be guarded");
  assert.match(html, /catch/, "expected a fallback when storage throws");
});

test("index.html loads no third-party fonts (Principle III, 018 T037)", () => {
  // The fonts are bundled as build assets via main.tsx. A remote link here would restore the
  // violation silently: the page looks correct to anyone online.
  assert.doesNotMatch(html, /fonts\.googleapis\.com/);
  assert.doesNotMatch(html, /fonts\.gstatic\.com/);
});

test("index.html requests nothing from any external origin", () => {
  // Broader than the font check: the tool renders private project documents, so no outbound
  // request belongs on this page at all.
  //
  // XML namespace URIs are excluded deliberately - `http://www.w3.org/2000/svg` in the inline
  // favicon is an identifier, never a fetch. Excluding it by exact prefix rather than by
  // hostname keeps the assertion honest: a real request to w3.org would still fail.
  const NAMESPACE_URIS = ["http://www.w3.org/2000/svg", "http://www.w3.org/1999/xhtml"];
  const externalUrls = [...html.matchAll(/https?:\/\/[^"'\s)]+/g)]
    .map((m) => m[0])
    .filter((url) => !NAMESPACE_URIS.includes(url));

  assert.deepEqual(
    externalUrls,
    [],
    `index.html must not reference external origins, found: ${externalUrls.join(", ")}`,
  );
});
