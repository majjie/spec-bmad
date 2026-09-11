export interface FileViewerMeta {
  title: string;
  status: string | null;
  type: string | null;
  created: string | null;
  fileName: string;
}

function fileNameOf(path: string): string {
  const segments = path.split("/");
  return segments[segments.length - 1] ?? path;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/**
 * Humanize a BMAD spec filename when frontmatter has no title.
 * `spec-2-2-render-sprint-status.md` → `Render sprint status`
 */
export function humanizeFileName(fileName: string): string {
  const bare = fileName.replace(/\.[^.]+$/, "");
  const withoutSpecPrefix = bare.replace(/^spec-\d+(?:-\d+[a-z]?)?-?/i, "");
  const words = (withoutSpecPrefix || bare).split(/[-_]+/).filter(Boolean);
  if (words.length === 0) {
    return bare;
  }
  return words
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase(),
    )
    .join(" ");
}

/** Derive the dialog header fields from path + optional YAML preamble. */
export function deriveFileViewerMeta(
  path: string,
  preamble: Record<string, unknown> | null,
): FileViewerMeta {
  const fileName = fileNameOf(path);
  const title = asString(preamble?.title) ?? humanizeFileName(fileName);
  return {
    title,
    status: asString(preamble?.status),
    type: asString(preamble?.type),
    created: asString(preamble?.created),
    fileName,
  };
}
