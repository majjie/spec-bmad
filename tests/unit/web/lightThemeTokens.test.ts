import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const tokens = readFileSync(new URL("../../../web/src/tokens.css", import.meta.url), "utf8");
const lightTheme = tokens.match(/:root\[data-color-scheme="light"\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";

test("light theme uses distinct muted surfaces instead of white and grey", () => {
  assert.match(lightTheme, /--color-bg-canvas:\s*var\(--color-sand-100\)/);
  assert.match(lightTheme, /--color-bg-surface:\s*var\(--color-sand-50\)/);
  assert.match(lightTheme, /--color-bg-raised:\s*var\(--color-sand-50\)/);
  assert.match(lightTheme, /--color-bg-subtle:\s*var\(--color-mist-100\)/);
  assert.match(lightTheme, /--color-bg-sidebar:\s*var\(--color-mist-50\)/);
  assert.match(lightTheme, /--color-accent:\s*var\(--color-slate-blue-600\)/);
  assert.match(lightTheme, /--color-brand:\s*var\(--color-slate-blue-600\)/);
});

test("brand mark uses the brand token for its spine", () => {
  const mark = readFileSync(
    new URL("../../../web/src/components/shell/BrandMark.tsx", import.meta.url),
    "utf8",
  );
  assert.match(mark, /fill="var\(--color-brand\)"/);
  assert.doesNotMatch(mark, /fill="var\(--color-accent\)"/);
});

test("light theme defines soft, layered elevation", () => {
  assert.match(
    lightTheme,
    /--shadow-md:[\s\S]*?0 12px 32px[\s\S]*?0 3px 10px[\s\S]*?0 1px 2px/,
  );
  assert.match(
    lightTheme,
    /--shadow-lg:[\s\S]*?0 28px 64px[\s\S]*?0 10px 24px[\s\S]*?0 2px 6px/,
  );
  assert.match(
    lightTheme,
    /--elevation-card:[\s\S]*?0 14px 36px[\s\S]*?0 4px 12px[\s\S]*?0 1px 3px/,
  );
});
