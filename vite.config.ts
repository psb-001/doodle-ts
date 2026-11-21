import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(__dirname, "demo"),
  resolve: {
    alias: {
      "@doodle": resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "demo/index.html"),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
});
