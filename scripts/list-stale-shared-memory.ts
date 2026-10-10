import {
  readSysVSharedMemoryTable,
  stalePostgresMarkers,
  staleSysVSegments,
} from "@crm/db/shared-memory";

/**
 * Lists the System V shared memory IDs that killed processes left behind on this machine.
 *
 * macOS keeps an ID after the process that created it dies, and PostgreSQL needs one while
 * `initdb` runs its bootstrap and while a server is up, so test runs that were killed instead
 * of stopped fill the small kernel table until `shmget` fails with ENOSPC and no run can start
 * a database any more.
 *
 * This tool names those leftovers and removes nothing. The kernel report says a segment has no
 * attachment and which PID created it, but it does not say which program made the segment: the
 * size a PostgreSQL placeholder has is a hint, not proof, and an attachment can appear between
 * this listing and a removal. Freeing an ID is therefore left to a person who checked each one
 * (`ipcrm -m <id>`); see scripts/list-stale-shared-memory.test.ts for the guard that keeps it
 * that way.
 */
function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

async function main(): Promise<void> {
  if (process.platform !== "darwin") {
    console.log("not macOS: the System V table is not what blocks a server start here");
    return;
  }

  const rows = await readSysVSharedMemoryTable();
  const stale = staleSysVSegments(rows, isPidAlive);
  const markers = stalePostgresMarkers(rows, isPidAlive);
  console.log(
    `${rows.length} System V shared memory IDs in use, ` +
      `${stale.length} unattached with their creator process gone, ` +
      `${markers.length} of them the size a PostgreSQL placeholder has`,
  );

  for (const row of markers) {
    console.log(`  id ${row.id}: creator ${row.creatorPid} is gone, nothing attached`);
  }

  if (markers.length > 0) {
    console.log(
      "Nothing was removed. The size does not prove which program created a segment and a new " +
        "attachment can appear after this listing, so check each creator before `ipcrm -m <id>`.",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
