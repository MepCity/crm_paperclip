import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const probeDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(probeDir, "../../../..");

// Runs the sample with the embedded-postgres exit guard loaded (see probe
// global setup). The root config never includes this file.
export default defineConfig({
  root: repoRoot,
  test: {
    include: ["packages/db/src/exit-code-probe/forced-failure.sample.ts"],
    globalSetup: [path.resolve(probeDir, "vitest-global-setup.ts")],
    hookTimeout: 60_000,
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
