import { REQUIREMENT_CODE_PATTERN, type RequirementCodeReference } from "./prdIndex.js";

export type MemlogSegment =
  | { kind: "text"; value: string }
  | { kind: "code"; text: string; referenceId: string | null };

export interface MemlogEntry {
  category: string | null;
  segments: MemlogSegment[];
}

// A bullet's leading text is a single parenthetical word, e.g. "(decision)" — capitalized
// on extraction; anything else (no parens, or multiple words inside them) falls back to
// `category: null` (Edge Cases, data-model.md).
const CATEGORY_PATTERN = /^\(([a-zA-Z]+)\)\s*/;

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Splits `text` into an ordered sequence of plain-text and requirement-code segments,
 * resolving each code's `referenceId` against `prdReferences` — the currently-open PRD's
 * own detected requirement codes (feature 012) — by exact code match, first occurrence in
 * document order winning when a code matches more than one reference there (FR-015–FR-017,
 * Clarifications: every matching code in the text is resolved independently).
 */
function splitSegments(text: string, prdReferences: RequirementCodeReference[]): MemlogSegment[] {
  const segments: MemlogSegment[] = [];
  let lastIndex = 0;
  const pattern = new RegExp(REQUIREMENT_CODE_PATTERN);
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", value: text.slice(lastIndex, match.index) });
    }
    const code = match[0];
    const reference = prdReferences.find((r) => r.code === code);
    segments.push({ kind: "code", text: code, referenceId: reference?.id ?? null });
    lastIndex = match.index + code.length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return segments;
}

/**
 * Parses `.memlog.md`'s bullet-point body (already frontmatter-stripped) into an ordered
 * list of entries — one per top-level bullet line. Bullet-splitting is purely line-based:
 * every non-blank line starting with `- ` begins a new entry; no multi-line bullet
 * continuation is attempted (research.md § 5).
 */
export function parseMemlogEntries(body: string, prdReferences: RequirementCodeReference[]): MemlogEntry[] {
  const entries: MemlogEntry[] = [];

  for (const line of body.split("\n")) {
    if (!line.startsWith("- ")) {
      continue;
    }
    const raw = line.slice(2);
    const categoryMatch = raw.match(CATEGORY_PATTERN);
    const category = categoryMatch?.[1] ? capitalize(categoryMatch[1]) : null;
    const remainder = categoryMatch ? raw.slice(categoryMatch[0].length) : raw;
    entries.push({ category, segments: splitSegments(remainder, prdReferences) });
  }

  return entries;
}
