import { fork, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const probe = fileURLToPath(new URL("./shutdown-probe/lifecycle.ts", import.meta.url));
describe("shared signal lifecycle", () => {
  it.each([
    ["SIGHUP", 129],
    ["SIGINT", 130],
    ["SIGTERM", 143],
  ] as const)("awaits startup and cleanup for %s", async (signal, code) => {
    const child = fork(probe, ["startup"], {
      execArgv: ["--import", "tsx"],
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    });
    let output = "";
    child.stdout?.on("data", (data) => {
      output += String(data);
    });
    const exit = new Promise<number | null>((resolve) => child.once("exit", resolve));
    try {
      await new Promise<void>((resolve, reject) => {
        child.once("message", () => resolve());
        child.once("error", reject);
        child.once("exit", () => reject(new Error("probe exited before readiness")));
      });
      child.kill(signal);
      expect(await exit).toBe(code);
      expect(output).toContain("auxiliary stopped");
      expect(output.indexOf("started")).toBeLessThan(output.indexOf("cluster stopped"));
      expect(output.match(/cluster stopped/g)).toHaveLength(1);
    } finally {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGTERM");
        await exit;
      }
    }
  });
  it("returns a startup failure without a dangling shutdown promise", () => {
    const result = spawnSync(process.execPath, ["--import", "tsx", probe, "failure"], {
      encoding: "utf8",
      timeout: 5000,
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("failure returned");
  });
});
