import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir, userInfo } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type CommandRunner,
  confirmedDead,
  parseIpcTable,
  parseSemaphoreProbes,
  parseSemaphoreTable,
  removeSegment,
  runCommand,
  selectOrphans,
  selectSemaphoreOrphans,
} from "./sysv-ipc";

export function sweep(
  options: {
    apply?: boolean;
    platform?: string;
    owner?: string;
    uid?: number;
    now?: () => number;
    dead?: (pid: number) => boolean;
    run?: CommandRunner;
    log?: (message: string) => void;
  } = {},
): { exitCode: number; removed: number } {
  let removed = 0;
  const log = options.log ?? console.log;
  if ((options.platform ?? process.platform) !== "darwin") {
    log("SysV IPC sweep is unsupported on this platform.");
    return { exitCode: 0, removed };
  }
  const run = options.run ?? runCommand;
  const now = options.now ?? Date.now;
  const owner = options.owner ?? userInfo().username;
  const dead = options.dead ?? confirmedDead;
  const read = () => {
    const output = run("ipcs", ["-m", "-a"]);
    const timestamp = now();
    const table = parseIpcTable(output, timestamp);
    if (table.error) throw new Error(table.error);
    return {
      table,
      decisions: selectOrphans(table, {
        owner,
        now: timestamp,
        deadPids: new Set(table.rows.filter((row) => dead(row.cpid)).map((row) => row.cpid)),
      }),
    };
  };
  try {
    const limit = Number(run("sysctl", ["-n", "kern.sysv.shmmni"]).trim());
    if (!Number.isSafeInteger(limit) || limit <= 0)
      throw new Error("Invalid SysV identifier limit");
    const initial = read();
    log(
      `${options.apply ? "Apply" : "Dry run"}: limit=${limit}, occupied=${initial.table.rows.length}, free=${Math.max(0, limit - initial.table.rows.length)}`,
    );
    let failed = false;
    for (const decision of initial.decisions) {
      log(`${decision.row.id}: ${decision.selected ? "candidate" : "keep"}: ${decision.reason}`);
      if (!options.apply || !decision.selected) continue;
      const fresh = read().decisions.find((item) => item.row.id === decision.row.id);
      // Guard identifier reuse as well as all eligibility criteria.
      if (
        !fresh?.selected ||
        fresh.row.cpid !== decision.row.cpid ||
        fresh.row.key !== decision.row.key ||
        fresh.row.createdAt !== decision.row.createdAt
      ) {
        log(`${decision.row.id}: skipped after recheck`);
        continue;
      }
      try {
        removeSegment(fresh.row.id, run);
        removed += 1;
        log(`${fresh.row.id}: removed`);
      } catch (error) {
        failed = true;
        log(`${fresh.row.id}: removal failed: ${String(error)}`);
      }
    }
    const semaphores = sweepSemaphores({
      apply: options.apply,
      run,
      log,
      now,
      owner,
      uid: options.uid ?? userInfo().uid,
    });
    removed += semaphores.removed;
    return { exitCode: failed || semaphores.exitCode ? 1 : 0, removed };
  } catch (error) {
    log(`IPC sweep refused: ${String(error)}`);
    return { exitCode: 1, removed };
  }
}

/** One bulk native probe avoids thousands of subprocesses and guessed ctypes layouts. */
function sweepSemaphores(options: {
  apply?: boolean;
  run: CommandRunner;
  log: (line: string) => void;
  now: () => number;
  owner: string;
  uid: number;
}): { exitCode: number; removed: number } {
  let directory: string | undefined;
  let removed = 0;
  try {
    const table = parseSemaphoreTable(options.run("ipcs", ["-s", "-a"]), options.now());
    if (table.error) throw new Error(table.error);
    const possible = table.rows.filter((row) => row.owner === options.owner && row.nsems === 17);
    options.log(`Semaphores: occupied=${table.rows.length}, inspect=${possible.length}`);
    if (possible.length === 0) return { exitCode: 0, removed };
    directory = mkdtempSync(join(tmpdir(), "crm-ipc-helper-"));
    const helper = join(directory, "semaphores");
    options.run("cc", [
      "-Wall",
      "-Wextra",
      "-Werror",
      "-o",
      helper,
      fileURLToPath(new URL("./sysv-semaphore.c", import.meta.url)),
    ]);
    const probes = parseSemaphoreProbes(
      options.run(helper, ["inspect", ...possible.map((row) => `${row.id}:0:0:0`)]),
    );
    const selected = selectSemaphoreOrphans(table, probes, {
      owner: options.owner,
      uid: options.uid,
      now: options.now(),
    });
    const ids = new Set(selected.map((probe) => probe.id));
    for (const row of table.rows)
      options.log(
        `semaphore ${row.id}: ${ids.has(row.id) ? "candidate: orphan PostgreSQL marker" : "keep: ineligible or unconfirmed"}`,
      );
    if (!options.apply || selected.length === 0) return { exitCode: 0, removed };
    const result = options.run(helper, [
      "remove",
      ...selected.map((probe) => `${probe.id}:${probe.createdAt / 1000}:${probe.pid}:${probe.key}`),
    ]);
    const reported = new Set<number>();
    let failed = false;
    for (const line of result.trim().split("\n").filter(Boolean)) {
      const match = /^(\d+) (removed|failed)$/.exec(line);
      if (!match || !ids.has(Number(match[1])) || reported.has(Number(match[1])))
        throw new Error("Invalid semaphore removal result");
      reported.add(Number(match[1]));
      if (match[2] === "removed") removed++;
      else failed = true;
      options.log(`semaphore ${match[1]}: ${match[2]}`);
    }
    for (const id of ids)
      if (!reported.has(id)) options.log(`semaphore ${id}: skipped after recheck`);
    return { exitCode: failed ? 1 : 0, removed };
  } catch (error) {
    options.log(`Semaphore sweep refused: ${String(error)}`);
    return { exitCode: 1, removed };
  } finally {
    if (directory) rmSync(directory, { recursive: true, force: true });
  }
}
