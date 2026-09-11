export const COLOR_SCHEME_STORAGE_KEY = "bmad-browser:color-scheme";

/** User preference - `system` follows the OS until the user chooses explicitly. */
export type ColorSchemePreference = "light" | "dark" | "system";

/** Resolved appearance applied to the document and MUI theme. */
export type ColorScheme = "light" | "dark";

export function readColorSchemePreference(): ColorSchemePreference {
  try {
    const raw = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") {
      return raw;
    }
  } catch {
    // private mode / blocked storage
  }
  return "system";
}

export function writeColorSchemePreference(preference: ColorSchemePreference): void {
  try {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, preference);
  } catch {
    // ignore
  }
}

export function clearColorSchemePreference(): void {
  try {
    localStorage.removeItem(COLOR_SCHEME_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function resolveColorScheme(
  preference: ColorSchemePreference,
  systemScheme: ColorScheme,
): ColorScheme {
  if (preference === "system") {
    return systemScheme;
  }
  return preference;
}

export function readSystemColorScheme(media: { matches: boolean } | null): ColorScheme {
  return media?.matches ? "dark" : "light";
}

/**
 * The parts of an element this module writes to. Structural, not `HTMLElement`, so this
 * module stays importable and testable without a DOM (constitution Principle IV); the
 * caller supplies `document.documentElement`.
 */
export interface ColorSchemeRoot {
  dataset: { [key: string]: string | undefined };
  style: { colorScheme: string };
}

/** Apply the resolved scheme to `<html>` for CSS semantic tokens (and native `color-scheme`). */
export function applyColorSchemeToDocument(scheme: ColorScheme, root: ColorSchemeRoot): void {
  root.dataset.colorScheme = scheme;
  root.style.colorScheme = scheme;
}

/** Next explicit preference when the header control is activated. */
export function nextColorSchemePreference(
  preference: ColorSchemePreference,
  systemScheme: ColorScheme,
): ColorSchemePreference {
  const current = resolveColorScheme(preference, systemScheme);
  return current === "dark" ? "light" : "dark";
}
