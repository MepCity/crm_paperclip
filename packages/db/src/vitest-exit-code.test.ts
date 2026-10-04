import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const config = resolve(repoRoot, "packages/db/src/exit-code-probe/vitest.config.ts");
const vitest = resolve(repoRoot, "node_modules/vitest/vitest.mjs");

describe("integration project exit code", () => {
  it("is non-zero when an integration test fails", () => {
    const result = spawnSync(process.execPath, [vitest, "run", "--config", config], {
      cwd: repoRoot,
      encoding: "utf8",
      env: process.env,
      timeout: 90_000,
    });
    const output = stripVTControlCharacters(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
    expect(output, output).toMatch(/Tests\s+1 failed/);
    expect(result.status, output).toBe(1);
  }, 120_000);
});
