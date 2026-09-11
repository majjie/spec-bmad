export type RequirementCodeStyle = "bullet" | "header";

export interface RequirementCodeReference {
  id: string;
  code: string;
  prefix: string;
  number: number;
  style: RequirementCodeStyle;
}

export interface PrefixGroup {
  prefix: string;
  references: RequirementCodeReference[];
}

// The shape of a requirement code itself - two-or-more uppercase letters, a dash,
// one-or-more digits (Assumptions, spec.md) - exported so other modules (e.g. feature
// 013's memlogParser.ts, which detects bare inline mentions with no wrapping syntax) reuse
// this exact definition rather than a second, potentially-drifting copy.
export const REQUIREMENT_CODE_PATTERN = /\b[A-Z]{2,}-\d+\b/g;

// Bullet style: two-or-more letters, a dash, one-or-more digits, wrapped in **...** (e.g.
// `**FR-25**`). Header style: a level-3 heading starting with the same code shape,
// followed by a space and an em dash or hyphen (e.g. `### UJ-1 - Verifying a completed
// stage`); both separators are accepted, since BMAD documents use either.
// Both require the letter portion to be uppercase (Assumptions, spec.md).
const BULLET_PATTERN = /\*\*([A-Z]{2,})-(\d+)\*\*/g;
const HEADER_PATTERN = /^###[ \t]+([A-Z]{2,})-(\d+)[ \t]+[—-]/gm;

interface RawMatch {
  index: number;
  prefix: string;
  digits: string;
  style: RequirementCodeStyle;
}

function collectMatches(content: string, pattern: RegExp, style: RequirementCodeStyle): RawMatch[] {
  const matches: RawMatch[] = [];
  let match: RegExpExecArray | null;
  pattern.lastIndex = 0;
  while ((match = pattern.exec(content)) !== null) {
    const [, prefix, digits] = match;
    if (prefix && digits) {
      matches.push({ index: match.index, prefix, digits, style });
    }
  }
  return matches;
}

/**
 * Scans the (already frontmatter-stripped) Markdown text left to right for the requested
 * requirement-code style(s) - defaulting to both, PRD's own established behavior -
 * returning one reference per occurrence in document order. Duplicates - the same code
 * appearing twice, or appearing in both styles - each get their own distinct reference;
 * this feature never assumes codes are unique (data-model.md, Edge Cases). Feature 016
 * (Architecture Detail View) calls this with `["header"]` only, since architecture
 * documents never use bullet-style codes (spec.md FR-005).
 */
export function buildRequirementCodeIndex(
  content: string,
  styles: RequirementCodeStyle[] = ["bullet", "header"],
): RequirementCodeReference[] {
  const raw = [
    ...(styles.includes("bullet") ? collectMatches(content, BULLET_PATTERN, "bullet") : []),
    ...(styles.includes("header") ? collectMatches(content, HEADER_PATTERN, "header") : []),
  ].sort((a, b) => a.index - b.index);

  return raw.map((m, i) => ({
    id: `prd-ref-${i}`,
    code: `${m.prefix}-${m.digits}`,
    prefix: m.prefix,
    number: Number.parseInt(m.digits, 10),
    style: m.style,
  }));
}

/**
 * Groups references by prefix, sorting each group's references ascending by numeric value
 * (not lexical, so `FR-9` sorts before `FR-25`), and ordering the groups themselves by
 * their prefix's first appearance in the original (ungrouped) array - not alphabetically
 * (data-model.md, Assumptions).
 */
export function groupByPrefix(references: RequirementCodeReference[]): PrefixGroup[] {
  const order: string[] = [];
  const byPrefix = new Map<string, RequirementCodeReference[]>();

  for (const reference of references) {
    let group = byPrefix.get(reference.prefix);
    if (!group) {
      group = [];
      byPrefix.set(reference.prefix, group);
      order.push(reference.prefix);
    }
    group.push(reference);
  }

  return order.map((prefix) => ({
    prefix,
    references: [...(byPrefix.get(prefix) ?? [])].sort((a, b) => a.number - b.number),
  }));
}
