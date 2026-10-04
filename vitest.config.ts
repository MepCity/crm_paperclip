import path from "node:path";
import { defineConfig } from "vitest/config";

const exclude = ["**/node_modules/**", "**/.next/**", "**/e2e/**"];

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["{apps,packages,scripts}/**/*.test.ts"],
          exclude: [...exclude, "**/*.int.test.ts"],
        },
      },
      {
        test: {
          name: "component",
          include: ["apps/web/**/*.test.tsx"],
          exclude,
          environment: "jsdom",
          // Keyboard flows in jsdom sit just over the 5s default when the full
          // suite runs in parallel. A short overrun was failing verify.
          testTimeout: 15_000,
          alias: {
            "@": path.resolve(__dirname, "./apps/web/src"),
          },
        },
      },
      {
        test: {
          name: "integration",
          include: ["{apps,packages,scripts}/**/*.int.test.ts"],
          exclude,
          globalSetup: ["./packages/db/src/vitest-global-setup.ts"],
          setupFiles: [
            "./packages/db/src/vitest-setup.ts",
            "./packages/core/src/vitest-auth-setup.ts",
          ],
          alias: {
            "@": path.resolve(__dirname, "./apps/web/src"),
          },
          maxWorkers: 2,
          sequence: { groupOrder: 1 },
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
