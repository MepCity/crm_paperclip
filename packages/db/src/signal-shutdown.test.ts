import { type ChildProcess, fork } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir, userInfo } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  type CommandRunner,
  confirmedDead,
  parseIpcTable,
  removeSegment,
  runCommand,
  selectOrphans,
} from "./sysv-ipc";

function table() {
  const parsed = parseIpcTable(runCommand("ipcs", ["-m", "-a"]), Date.now());
  if (parsed.error) throw new Error(parsed.error);
  return parsed;
}
async function waitUntil(check: () => boolean) {
  const deadline = Date.now() + 15_000;
  while (!check()) {
    if (Date.now() > deadline) throw new Error("shutdown condition timed out");
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
function exited(child: ChildProcess): Promise<number | null> {
  return new Promise((resolve) => child.once("exit", resolve));
}

describe.skipIf(process.platform !== "darwin")("signal shutdown and owned SysV cleanup", () => {
  it("awaits SIGTERM cleanup and removes only its own SIGKILL orphan", async () => {
    const baseline = new Set(table().rows.map((row) => row.id));
    const dir = await mkdtemp(join(tmpdir(), "crm-shutdown-"));
    const ipcrmCalls: string[][] = [];
    const recordRun: CommandRunner = (command, args) => {
      if (command === "ipcrm") ipcrmCalls.push([...args]);
      return runCommand(command, args);
    };
    let child: ChildProcess | undefined;
    let ownId: number | undefined;
    let ownPid: number | undefined;
    let sigkillOwnId: number | undefined;
    try {
      // One cluster at a time, reusing the same initialized directory.
      for (const mode of ["SIGTERM", "SIGKILL"] as const) {
        child = fork(
          fileURLToPath(new URL("./shutdown-probe/cluster.ts", import.meta.url)),
          [dir],
          { execArgv: ["--import", "tsx"], stdio: ["ignore", "pipe", "pipe", "ipc"] },
        );
        let output = "";
        child.stderr?.on("data", (data) => {
          output += String(data);
        });
        ownPid = await new Promise<number>((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error(`cluster startup timed out: ${output}`)),
            30_000,
          );
          child?.once("message", (message) => {
            clearTimeout(timer);
            resolve((message as { pid: number }).pid);
          });
          child?.once("exit", () => {
            clearTimeout(timer);
            reject(new Error(`cluster exited before readiness: ${output}`));
          });
        });
        const markers = table().rows.filter((row) => row.cpid === ownPid && !baseline.has(row.id));
        expect(markers).toHaveLength(1);
        ownId = markers[0]?.id;
        if (ownId === undefined) throw new Error("missing owned marker");
        const exit = exited(child);
        if (mode === "SIGTERM") {
          child.kill("SIGTERM");
          expect(await exit).toBe(143);
          expect(table().rows.some((row) => row.id === ownId)).toBe(false);
        } else {
          // Kill the postmaster, not another cluster or its supervising test process.
          process.kill(ownPid, "SIGKILL");
          await waitUntil(() => confirmedDead(ownPid ?? 0));
          child.kill("SIGTERM");
          expect(await exit).toBe(143);
          await waitUntil(() => table().rows.find((row) => row.id === ownId)?.nattch === 0);
          const current = table();
          expect(current.rows.some((row) => row.id === ownId)).toBe(true);
          const selected = selectOrphans(current, {
            owner: userInfo().username,
            now: Date.now(),
            minimumAgeMs: 0,
            deadPids: new Set([ownPid]),
          }).filter((item) => item.selected);
          expect(selected.map((item) => item.row.id)).toEqual([ownId]);
          sigkillOwnId = ownId;
          removeSegment(ownId, recordRun);
          expect(table().rows.some((row) => row.id === ownId)).toBe(false);
        }
        child = undefined;
        ownId = undefined;
      }
      if (sigkillOwnId === undefined) throw new Error("missing SIGKILL segment id");
      expect(ipcrmCalls).toEqual([["-m", String(sigkillOwnId)]]);
    } finally {
      if (child && child.exitCode === null && child.signalCode === null) {
        const exit = exited(child);
        child.kill("SIGTERM");
        await exit;
      }
      if (ownId !== undefined && ownPid !== undefined && !baseline.has(ownId)) {
        const row = table().rows.find((row) => row.id === ownId);
        if (row && row.cpid === ownPid && row.nattch === 0 && confirmedDead(ownPid))
          removeSegment(ownId, recordRun);
      }
      await rm(dir, { recursive: true, force: true });
    }
  }, 90_000);
});
