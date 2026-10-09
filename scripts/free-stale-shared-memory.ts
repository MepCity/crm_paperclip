import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readSysVSharedMemoryTable, stalePostgresMarkers } from "@crm/db/shared-memory";

const run = promisify(execFile);

/**
 * Lists the System V shared memory IDs a killed PostgreSQL server left behind and, with
 * --apply, gives them back to the kernel.
 *
 * macOS keeps such an ID after its creator dies, and PostgreSQL needs one both while `initdb`
 * runs its bootstrap and while a server is up, so killed test runs slowly fill the table until
 * `shmget` fails with ENOSPC and no run can start a database any more. Only segments with no
 * attached process and a creator PID that is gone are selected, so a server that is still
 * running keeps its ID. Without --apply nothing is changed.
 */
function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

async function main(): Promise<number> {
  const apply = process.argv.includes("--apply");
  if (process.platform !== "darwin") {
    console.log("not macOS: the System V table is not what blocks a server start here");
    return 0;
  }

  const rows = await readSysVSharedMemoryTable();
  const stale = stalePostgresMarkers(rows, isPidAlive);
  console.log(
    `${rows.length} System V shared memory IDs in use, ${stale.length} left behind by servers that did not stop cleanly${
      apply ? "" : " (dry run)"
    }`,
  );

  for (const row of stale) {
    console.log(`  id ${row.id}: creator ${row.creatorPid} is gone, nothing attached`);
    if (!apply) continue;
    try {
      await run("ipcrm", ["-m", String(row.id)]);
      console.log("    freed");
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.log(`    not freed: ${reason}`);
      return 1;
    }
  }

  if (!apply && stale.length > 0) console.log("Run with --apply to free these IDs.");
  return 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
