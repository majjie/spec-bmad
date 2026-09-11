// IBM Plex, bundled at build time rather than fetched from a font CDN, so the tool
// renders as designed offline and never announces itself to a third party while
// displaying a user's project documents (constitution Principle III, feature 018 T037).
// Latin subset only, and only the weights theme.ts actually maps.
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./tokens.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import { ColorSchemeProvider } from "./components/shell/ColorSchemeProvider.js";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

createRoot(container).render(
  <StrictMode>
    <ColorSchemeProvider>
      <App />
    </ColorSchemeProvider>
  </StrictMode>,
);
