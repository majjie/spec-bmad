import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import {
  applyColorSchemeToDocument,
  nextColorSchemePreference,
  readColorSchemePreference,
  readSystemColorScheme,
  resolveColorScheme,
  writeColorSchemePreference,
  type ColorScheme,
  type ColorSchemePreference,
} from "../../colorScheme.js";
import { createAppTheme } from "../../theme.js";

interface ColorSchemeContextValue {
  preference: ColorSchemePreference;
  scheme: ColorScheme;
  toggleScheme: () => void;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

export function useColorScheme(): ColorSchemeContextValue {
  const value = useContext(ColorSchemeContext);
  if (!value) {
    throw new Error("useColorScheme must be used within ColorSchemeProvider");
  }
  return value;
}

export function ColorSchemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ColorSchemePreference>(() => readColorSchemePreference());
  const [systemScheme, setSystemScheme] = useState<ColorScheme>(() => readSystemColorScheme());

  const scheme = resolveColorScheme(preference, systemScheme);

  useEffect(() => {
    applyColorSchemeToDocument(scheme);
  }, [scheme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemScheme(readSystemColorScheme(media));
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggleScheme = useCallback(() => {
    setPreference((current: ColorSchemePreference) => {
      const next = nextColorSchemePreference(current, systemScheme);
      writeColorSchemePreference(next);
      return next;
    });
  }, [systemScheme]);

  const value = useMemo(
    () => ({
      preference,
      scheme,
      toggleScheme,
    }),
    [preference, scheme, toggleScheme],
  );

  const theme = useMemo(() => createAppTheme(scheme), [scheme]);

  return (
    <ColorSchemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorSchemeContext.Provider>
  );
}
