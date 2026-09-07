import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const webDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: webDir,
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
