import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(__dirname, "site"),
  resolve: {
    alias: {
      "@doodle": resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: resolve(__dirname, "dist-site"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "site/index.html"),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
});
