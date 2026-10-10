import { userInfo } from "node:os";
import { pathToFileURL } from "node:url";
import {
  type CommandRunner,
  confirmedDead,
  parseIpcTable,
  removeSegment,
  runCommand,
  selectOrphans,
} from "@crm/db/sysv-ipc";

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
): number {
  const log = options.log ?? console.log;
  if ((options.platform ?? process.platform) !== "darwin") {
    log("SysV IPC sweep is unsupported on this platform.");
    return 0;
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
        log(`${fresh.row.id}: removed`);
      } catch (error) {
        failed = true;
        log(`${fresh.row.id}: removal failed: ${String(error)}`);
      }
    }
    return failed ? 1 : 0;
  } catch (error) {
    log(`IPC sweep refused: ${String(error)}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--apply")) {
    console.error("Usage: pnpm ipc:sweep [--apply]");
    process.exitCode = 1;
  } else {
    process.exitCode = sweep({ apply: args.includes("--apply") });
  }
}
