export type FileRenderMode =
  | { kind: "markdown" }
  | { kind: "syntax"; language: "yaml" | "toml" | "python" }
  | { kind: "csv-grid" }
  | { kind: "plain" };

const KNOWN_EXTENSIONLESS_FILES = new Set([".gitignore"]);

const SYNTAX_LANGUAGES_BY_EXTENSION: Record<string, "yaml" | "toml" | "python"> = {
  ".yaml": "yaml",
  ".toml": "toml",
  ".py": "python",
};

function extensionOf(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0) {
    return "";
  }
  return filename.slice(dotIndex).toLowerCase();
}

/**
 * Decides how a file should render in the viewer dialog, per data-model.md's derivation
 * table (first match wins).
 */
export function getFileRenderMode(filename: string): FileRenderMode {
  if (KNOWN_EXTENSIONLESS_FILES.has(filename)) {
    return { kind: "plain" };
  }

  const extension = extensionOf(filename);

  if (extension === ".md") {
    return { kind: "markdown" };
  }

  if (extension === ".csv") {
    return { kind: "csv-grid" };
  }

  const syntaxLanguage = SYNTAX_LANGUAGES_BY_EXTENSION[extension];
  if (syntaxLanguage) {
    return { kind: "syntax", language: syntaxLanguage };
  }

  return { kind: "plain" };
}
