import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const script = resolve(repoRoot, "packages/db/src/cluster-encoding-check.ts");
const tsx = resolve(repoRoot, "node_modules/tsx/dist/cli.mjs");

function envWithoutLibcLocale(overrides: Record<string, string>): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key === "LANG" || key === "LC_ALL" || key.startsWith("LC_")) {
      delete env[key];
    }
  }
  return { ...env, ...overrides };
}

function runEncodingCheck(env: NodeJS.ProcessEnv) {
  return spawnSync(process.execPath, [tsx, script], {
    cwd: repoRoot,
    encoding: "utf8",
    env,
    timeout: 60_000,
  });
}

describe("test cluster encoding", () => {
  it("is UTF-8 when LANG and LC_ALL are empty", () => {
    const result = runEncodingCheck(envWithoutLibcLocale({ LANG: "", LC_ALL: "" }));
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    expect(output, output).toContain('"serverEncoding":"UTF8"');
    expect(output, output).toContain('"icuCollationOk":true');
    expect(result.status, output).toBe(0);
  }, 90_000);

  it("is UTF-8 when libc locale is ISO-8859-1", () => {
    const result = runEncodingCheck(
      envWithoutLibcLocale({ LANG: "en_US.ISO8859-1", LC_ALL: "en_US.ISO8859-1" }),
    );
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    expect(output, output).toContain('"serverEncoding":"UTF8"');
    expect(output, output).toContain('"icuCollationOk":true');
    expect(result.status, output).toBe(0);
  }, 90_000);
});
