import { load } from "js-yaml";

export interface FrontmatterResult {
  body: string;
  preamble: Record<string, unknown> | null;
}

// A single opening-tag-like line, e.g. `<frozen-after-approval reason="...">` — this is a
// narrow, purpose-built match (not a general XML parser): just a tag name plus an optional
// attribute blob, terminated by `>` at the end of the (trimmed) line.
const OPENING_TAG_PATTERN = /^<([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^>]*)?>$/;

/**
 * Detects and strips a YAML frontmatter preamble (delimited by `---` lines at the very
 * start of the content) and, when present, a marker element's opening/closing tag lines —
 * per data-model.md's derivation table. The closing tag is searched for anywhere later in
 * the document (never assumed adjacent to the opening tag, research.md § 3) — content
 * between and after the tag lines renders unchanged; only the tag lines themselves are
 * removed. Tolerant of anything that doesn't match this exact shape (FR-003/FR-004): an
 * unterminated block, a non-mapping YAML document, or no leading `---` at all all return
 * the content completely unchanged.
 */
export function stripFrontmatter(content: string): FrontmatterResult {
  const lines = content.split("\n");
  if (lines[0] !== "---") {
    return { body: content, preamble: null };
  }

  let closingIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      closingIndex = i;
      break;
    }
  }
  if (closingIndex === -1) {
    return { body: content, preamble: null };
  }

  const yamlText = lines.slice(1, closingIndex).join("\n");

  // An empty (or whitespace-only) block is a YAML mapping with zero keys for this
  // feature's purposes, not a type mismatch (data-model.md's "zero keys" row) — `js-yaml`
  // itself throws on an empty document rather than returning an empty value, so this is
  // checked before calling `load()` at all.
  let preamble: Record<string, unknown>;
  if (yamlText.trim() === "") {
    preamble = {};
  } else {
    let parsed: unknown;
    try {
      parsed = load(yamlText);
    } catch {
      return { body: content, preamble: null };
    }

    if (parsed === null || parsed === undefined || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { body: content, preamble: null };
    }
    preamble = parsed as Record<string, unknown>;
  }

  const remainingLines = lines.slice(closingIndex + 1);

  let openingLineIndex = -1;
  for (let i = 0; i < remainingLines.length; i++) {
    if ((remainingLines[i] ?? "").trim() !== "") {
      openingLineIndex = i;
      break;
    }
  }

  if (openingLineIndex === -1) {
    return { body: remainingLines.join("\n"), preamble };
  }

  const openingMatch = (remainingLines[openingLineIndex] ?? "").trim().match(OPENING_TAG_PATTERN);
  if (!openingMatch) {
    return { body: remainingLines.join("\n"), preamble };
  }

  const tagName = openingMatch[1];
  const closingTagLine = `</${tagName}>`;

  let closingLineIndex = -1;
  for (let i = openingLineIndex + 1; i < remainingLines.length; i++) {
    if ((remainingLines[i] ?? "").trim() === closingTagLine) {
      closingLineIndex = i;
      break;
    }
  }

  const resultLines = remainingLines.filter((_, index) => index !== openingLineIndex && index !== closingLineIndex);

  return { body: resultLines.join("\n"), preamble };
}

/**
 * Renders a preamble value as plain, readable text (FR-007) — scalars in their natural
 * form, arrays/objects via `JSON.stringify` (e.g. `context: []` → the literal text `[]`).
 */
export function stringifyPreambleValue(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}
