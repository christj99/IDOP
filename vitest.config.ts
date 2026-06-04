import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["packages/engine/src/**/*.ts"],
      exclude: ["packages/engine/src/**/*.test.ts", "packages/engine/src/index.ts"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    environment: "node",
    include: ["apps/**/*.test.{ts,tsx}", "packages/**/*.test.ts"],
  },
});
