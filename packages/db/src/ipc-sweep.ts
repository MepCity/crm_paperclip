import { userInfo } from "node:os";
import {
  type CommandRunner,
  confirmedDead,
  parseIpcTable,
  removeSegment,
  runCommand,
  selectOrphans,
} from "./sysv-ipc";

export function sweep(
  options: {
    apply?: boolean;
    platform?: string;
    owner?: string;
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
    return { exitCode: failed ? 1 : 0, removed };
  } catch (error) {
    log(`IPC sweep refused: ${String(error)}`);
    return { exitCode: 1, removed };
  }
}
