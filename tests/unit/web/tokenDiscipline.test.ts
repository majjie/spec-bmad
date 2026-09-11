import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Feature 018 FR-027: all colour derives from the semantic token layer, never from a value
 * chosen in a component.
 *
 * This exists because FR-027 was twice believed satisfied when it was not. The first audit
 * grepped for hex literals and missed `info.light` being used to mean "this is a link"; the
 * second grepped for hex and palette slots and missed two `rgba()` modal scrims. Both were
 * found by eye, months of commits apart, and both were invisible in dark - a black scrim on a
 * near-black page looks like nothing at all.
 *
 * A mechanical check is the only kind that does not depend on remembering every spelling a
 * colour can have.
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

test("no component borrows a status palette slot to mean something else (FR-027)", () => {
  // `text.secondary` and `divider` are semantic and fine. The status slots are the ones that
  // get borrowed for an unrelated meaning - `info.light` for a link, `error.main` for a
  // failure state that has its own `--color-status-error` token.
  const BORROWED = /"(info|warning|success|error)\.(light|main|dark)"/;
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
    `use a --color-status-* token instead of a borrowed palette slot:\n${offenders.join("\n")}`,
  );
});

test("both appearances define every scrim token", () => {
  // Scrims are the case this test was written for: defined once per appearance, so a modal
  // over a sand page gets warm ink rather than the black that suits a charcoal one.
  const tokens = readFileSync(
    fileURLToPath(new URL("../../../web/src/tokens.css", import.meta.url)),
    "utf8",
  );
  const light = tokens.match(/:root\[data-color-scheme="light"\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";

  for (const name of ["--color-scrim:", "--color-scrim-soft:"]) {
    assert.ok(tokens.includes(name), `${name} must be defined for the default appearance`);
    assert.ok(light.includes(name), `${name} must be remapped for the light appearance`);
  }
});
