import { defineConfig, devices } from "@playwright/test";

// scripts/e2e.ts builds the app, starts a throwaway database and sets these variables.
const port = Number(process.env.E2E_PORT ?? 0);
if (!port)
  throw new Error("Run the end-to-end tests through `pnpm test:e2e` (E2E_PORT is not set).");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"]],
  outputDir: "./test-results",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `next start --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/api/health`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
