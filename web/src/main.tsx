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
