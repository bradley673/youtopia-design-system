import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    // The design system sources live one level up, outside this package, so
    // pin react resolution to this package's copy for files imported from there.
    dedupe: ["react", "react-dom"],
    alias: {
      "@youtopia/design-system": path.resolve(__dirname, "../src/index.ts"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
});
