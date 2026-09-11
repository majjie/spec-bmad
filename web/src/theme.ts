import { createTheme } from "@mui/material/styles";

/**
 * Maps semantic CSS tokens (tokens.css) into MUI. Components should prefer theme
 * palette / typography over hardcoded hex. Accent is amber — used sparingly.
 */
const theme = createTheme({
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
  typography: {
    fontFamily: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    fontSize: 15,
    h6: { fontWeight: 600, letterSpacing: "-0.01em" },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, letterSpacing: "0.01em" },
    button: { textTransform: "none", fontWeight: 600 },
    overline: {
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      fontSize: "0.7rem",
      fontWeight: 600,
    },
  },
  shape: { borderRadius: 8 },
  components: {
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
        root: { borderRadius: 6 },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        outlined: {
          borderColor: "var(--color-border-default)",
          backgroundImage: "none",
          backgroundColor: "var(--color-bg-raised)",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "var(--color-bg-subtle)",
          border: "1px solid var(--color-border-default)",
          fontSize: "0.85rem",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          minHeight: 40,
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
