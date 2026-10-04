import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const script = resolve(repoRoot, "packages/db/src/cluster-encoding-check.ts");
const tsx = resolve(repoRoot, "node_modules/tsx/dist/cli.mjs");

describe("test cluster encoding", () => {
  it("is UTF-8 when LANG and LC_ALL are empty", () => {
    const result = spawnSync(process.execPath, [tsx, script], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, LANG: "", LC_ALL: "" },
      timeout: 60_000,
    });
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    expect(output, output).toContain('"serverEncoding":"UTF8"');
    expect(output, output).toContain('"collations":1');
    expect(result.status, output).toBe(0);
  }, 90_000);
});
