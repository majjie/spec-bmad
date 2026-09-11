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

test("light theme borders and icon ink stay readable on sand surfaces", () => {
  assert.match(lightTheme, /--color-border-default:\s*var\(--color-sand-300\)/);
  assert.match(lightTheme, /--color-text-subtle:\s*var\(--color-ink-700\)/);
  const theme = readFileSync(new URL("../../../web/src/theme.ts", import.meta.url), "utf8");
  assert.match(theme, /MuiIconButton:[\s\S]*?color:\s*"var\(--color-text-muted\)"/);
  assert.match(theme, /active:\s*"rgba\(48,\s*45,\s*40,\s*0\.72\)"/);
});

test("memory log dialog uses semantic chrome instead of dark-mode hardcodes", () => {
  const memlog = readFileSync(
    new URL("../../../web/src/components/MemoryLogDialog.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(memlog, /common\.white/);
  assert.doesNotMatch(memlog, /rgba\(0,\s*0,\s*0,\s*0\.6\)/);
  assert.doesNotMatch(memlog, /info\.light/);
  assert.doesNotMatch(memlog, /primary\.light/);
  assert.match(memlog, /var\(--color-text-muted\)/);
  assert.match(memlog, /var\(--color-accent-strong\)/);
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
