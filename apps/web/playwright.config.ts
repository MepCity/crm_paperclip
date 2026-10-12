import { defineConfig, devices } from "@playwright/test";

// scripts/e2e.ts builds the app, starts a throwaway database and sets these variables.
const port = Number(process.env.E2E_PORT ?? 0);
if (!port)
  throw new Error("Run the end-to-end tests through `pnpm test:e2e` (E2E_PORT is not set).");

export default defineConfig({
  // Default 30s is too tight when other agents run verify on the same machine.
  timeout: 90_000,
  expect: {
    // Default 5s flakes when several verify runs share one machine (see MEP-213).
    timeout: 30_000,
  },
  testDir: "./e2e",
  fullyParallel: true,
  // Several agents share one machine; cap browsers per run. Override with MEP_TEST_WORKERS.
  workers: Number(process.env.MEP_TEST_WORKERS ?? 2),
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
