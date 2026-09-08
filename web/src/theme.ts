import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    // Pinning MUI's own dark-mode default explicitly (not a new hue) — this is the exact
    // blue already visible today (e.g. the active tab's indicator); declaring it here
    // makes that a deliberate choice this app's own theme owns, rather than an implicit
    // default that could silently shift on a future MUI upgrade (feature 011 FR-005,
    // research.md § 3).
    primary: {
      main: "#90caf9",
    },
  },
  typography: {
    // Raised from 13 (below MUI's own default of 14) to 15 — feature 011 FR-004.
    fontSize: 15,
  },
});

export default theme;
