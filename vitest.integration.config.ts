import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(projectRoot, "src"),
      "server-only": path.join(projectRoot, "tests/helpers/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    fileParallelism: false,
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["tests/integration/setup.ts"],
    passWithNoTests: false,
  },
});
