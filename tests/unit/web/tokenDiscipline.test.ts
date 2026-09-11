import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Feature 018 FR-027: all colour derives from the semantic token layer, never from a value
 * chosen in a component.
 *
 * This exists because FR-027 was believed satisfied, and was not, four separate times - each
 * time because the audit was narrower than the next spelling someone reached for:
 *
 *   1. hex literals            - missed `info.light` used to mean "this is a link"
 *   2. hex + intent slots      - missed an `rgba()` control-cluster background
 *   3. hex + slots + rgba()    - missed `grey.900` on the requirement-code tooltips
 *   4. all of the above        - which is why this list is deliberately wider than the
 *                                defects found so far
 *
 * Every one was invisible in the dark appearance, because a fixed dark value looks correct on
 * a dark page. Every one was found by a person looking at the light appearance. A mechanical
 * check is the only kind that does not depend on remembering every spelling a colour can have.
 */

const COMPONENTS_DIR = fileURLToPath(new URL("../../../web/src/components", import.meta.url));

/** Colours belong here. Everywhere else consumes them. */
const COLOUR_OWNING_FILES = ["theme.ts", "tokens.css"];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return sourceFiles(full);
    }
    return /\.(ts|tsx|css)$/.test(entry) && !COLOUR_OWNING_FILES.includes(entry) ? [full] : [];
  });
}

const files = sourceFiles(COMPONENTS_DIR);

test("the component tree is non-empty (guards against this test silently passing)", () => {
  assert.ok(files.length > 10, `expected to scan many components, found ${files.length}`);
});

test("no component defines a raw colour literal (FR-027)", () => {
  // Hex, rgb()/rgba(), hsl()/hsla(). A `var(--token)` on the same line is not a literal.
  const LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
  const offenders: string[] = [];

  for (const file of files) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (LITERAL.test(line) && !line.includes("var(--")) {
          offenders.push(`${file.replace(COMPONENTS_DIR, "components")}:${i + 1}  ${line.trim()}`);
        }
      });
  }

  assert.deepEqual(
    offenders,
    [],
    `colour literals must move to the semantic token layer:\n${offenders.join("\n")}`,
  );
});

test("no component uses a palette slot whose value ignores the appearance (FR-027)", () => {
  // The distinction that matters is not "theme slot vs literal" - it is whether the slot's
  // value changes with the appearance.
  //
  // Allowed, because the theme remaps them per appearance: `text.*`, `background.*`,
  // `action.*`, `divider`.
  //
  // Banned, because their value is fixed no matter which appearance is active:
  //   - `grey.900`, `common.white` - a fixed dark surface or a fixed light ink
  //   - the intent slots (`info.light`, `error.main`, …) when borrowed to mean something
  //     other than that intent, which in this codebase is every use of them
  //
  // This list is deliberately broader than the defects found so far. FR-027 has been
  // declared satisfied four times while it was not, and on three of those occasions the
  // audit was narrower than the next spelling someone reached for: hex, then palette
  // intent-slots, then `rgba()`, then `grey.900`. Each new spelling was invisible in dark,
  // because a fixed dark value looks correct on a dark page.
  const BORROWED =
    /"(grey|common)\.[a-zA-Z0-9]+"|"(primary|secondary|info|warning|success|error)\.(light|main|dark)"/;
  const offenders: string[] = [];

  for (const file of files) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (BORROWED.test(line)) {
          offenders.push(`${file.replace(COMPONENTS_DIR, "components")}:${i + 1}  ${line.trim()}`);
        }
      });
  }

  assert.deepEqual(
    offenders,
    [],
    `these resolve to the same value in both appearances - use a semantic token, or a theme\nslot that the theme remaps (text.*, background.*, action.*, divider):\n${offenders.join("\n")}`,
  );
});

test("both appearances define the scrim token", () => {
  // The scrim is the case this test was written for: defined once per appearance, so an
  // overlay on a sand page gets warm ink rather than the black that suits a charcoal one.
  const tokens = readFileSync(
    fileURLToPath(new URL("../../../web/src/tokens.css", import.meta.url)),
    "utf8",
  );
  const light = tokens.match(/:root\[data-color-scheme="light"\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";

  for (const name of ["--color-scrim:"]) {
    assert.ok(tokens.includes(name), `${name} must be defined for the default appearance`);
    assert.ok(light.includes(name), `${name} must be remapped for the light appearance`);
  }
});
