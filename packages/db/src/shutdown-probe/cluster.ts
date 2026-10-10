import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { startLocalPostgres } from "../local-postgres";
import { startWithSignalShutdown } from "../signal-shutdown";

const dataDir = process.argv[2];
if (!dataDir) throw new Error("missing data directory");
await startWithSignalShutdown(() => startLocalPostgres({ dataDir }));
const pid = Number((await readFile(join(dataDir, "postmaster.pid"), "utf8")).split("\n")[0]);
process.send?.({ pid });
setInterval(() => {}, 1000);
