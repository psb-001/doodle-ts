import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  root: __dirname,
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@doodle": resolve(__dirname, "src"),
    },
  },
});
