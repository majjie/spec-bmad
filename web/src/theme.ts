import { createTheme, type Theme } from "@mui/material/styles";
import type { ColorScheme } from "./colorScheme.js";

const sharedTypography = {
  fontFamily: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
  fontSize: 15,
  h6: { fontWeight: 600, letterSpacing: "-0.01em" },
  subtitle1: { fontWeight: 600 },
  subtitle2: { fontWeight: 600, letterSpacing: "0.01em" },
  button: { textTransform: "none" as const, fontWeight: 600 },
  overline: {
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    fontSize: "0.65rem",
    fontWeight: 650,
  },
};

const sharedComponents = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: "var(--color-bg-canvas)",
        color: "var(--color-text-default)",
      },
      "*:focus-visible": {
        outline: "2px solid var(--color-focus-ring)",
        outlineOffset: 2,
      },
      code: {
        fontFamily: "var(--font-mono)",
      },
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        borderRadius: "var(--radius-full)",
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: "var(--radius-full)",
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      outlined: {
        borderColor: "var(--color-border-default)",
        backgroundImage: "none",
        backgroundColor: "var(--color-bg-raised)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--elevation-card)",
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: "var(--radius-overlay)",
        boxShadow: "var(--elevation-overlay)",
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: "var(--radius-full)",
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 0,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: "var(--color-bg-subtle)",
        color: "var(--color-text-default)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-control)",
        boxShadow: "var(--shadow-md)",
        fontSize: "0.85rem",
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: "none" as const,
        minHeight: 40,
        fontWeight: 500,
      },
    },
  },
};

/**
 * Maps semantic CSS tokens (tokens.css) into MUI. Components should prefer theme
 * palette / typography over hardcoded hex. Accent is amber - used sparingly.
 */
export function createAppTheme(mode: ColorScheme): Theme {
  if (mode === "light") {
    return createTheme({
      palette: {
        mode: "light",
        primary: {
          main: "#876216",
          light: "#a98237",
          dark: "#65470f",
          contrastText: "#faf8f2",
        },
        secondary: {
          main: "#52705a",
        },
        background: {
          default: "#f3f0e7",
          paper: "#faf8f2",
        },
        text: {
          primary: "#302d28",
          secondary: "#58534b",
          disabled: "#969087",
        },
        divider: "#ded8ca",
        success: { main: "#2f8a55" },
        warning: { main: "#c56f2c" },
        info: { main: "#3b78b0" },
        error: { main: "#c44747" },
        action: {
          hover: "rgba(65, 91, 67, 0.08)",
          selected: "rgba(135, 98, 22, 0.12)",
          disabled: "#969087",
        },
      },
      typography: sharedTypography,
      shape: { borderRadius: 12 },
      components: sharedComponents,
    });
  }

  return createTheme({
    palette: {
      mode: "dark",
      primary: {
        main: "#e8b84a",
        light: "#f0cc78",
        dark: "#d4a017",
        contrastText: "#0c0f12",
      },
      secondary: {
        main: "#5b9a9a",
      },
      background: {
        default: "#0c0f12",
        paper: "#12161b",
      },
      text: {
        primary: "#e8ebef",
        secondary: "#a8b1bd",
        disabled: "#3d4652",
      },
      divider: "#2a323c",
      success: { main: "#6bbf8a" },
      warning: { main: "#e09a5a" },
      info: { main: "#6a9fd4" },
      error: { main: "#e07070" },
      action: {
        hover: "rgba(255, 255, 255, 0.06)",
        selected: "rgba(232, 184, 74, 0.14)",
        disabled: "#3d4652",
      },
    },
    typography: sharedTypography,
    shape: { borderRadius: 12 },
    components: sharedComponents,
  });
}

/** Default export kept for any import that still expects a static theme (dark). */
const theme = createAppTheme("dark");
export default theme;
