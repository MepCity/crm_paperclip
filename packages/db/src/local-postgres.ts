import type { ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import { isPortFree, pickFreePort } from "./ports";

const USER = "postgres";
const PASSWORD = "postgres";
const HOST = "127.0.0.1";

// initdb otherwise follows libc locale from the environment (e.g. LATIN1 under
// ISO-8859-1), which conflicts with --encoding=UTF8. ICU collations such as
// und-x-icu exist only for UTF-8, so libc locale is pinned to C and ICU to und.
const UTF8_INITDB_FLAGS = [
  "--encoding=UTF8",
  "--locale=C",
  "--locale-provider=icu",
  "--icu-locale=und",
];

// macOS caps SysV IPC identifiers at kern.sysv.shmmni (32 here) and a postmaster that is
// killed keeps its identifiers until they are reclaimed, so with the default sysv shared
// memory initdb's bootstrap run fails on "could not create shared memory segment: No space
// left on device" while other clusters on the machine are up. mmap keeps the main shared
// area out of the identifier table: initdb then needs none, a running server still needs one.
const IPC_SETTINGS = { shared_memory_type: "mmap" };

/**
 * A full identifier table clears itself when another run's cluster stops, so only that
 * failure is retried. The waits stay under the integration project's 60s hook timeout.
 */
const IPC_RETRY_DELAYS_MS = [5_000, 10_000, 20_000];

const IPC_EXHAUSTION_HINT =
  "This host is out of SysV IPC identifiers (kern.sysv.shmmni): clusters still running, or leaked by killed postmasters, hold them.";

function toFlags(settings: Record<string, string>): string[] {
  return Object.entries(settings).flatMap(([name, value]) => ["-c", `${name}=${value}`]);
}

/** initdb arguments. initdb has no other way to reach the bootstrap run's shared memory type. */
export function buildInitdbFlags(): string[] {
  return [...UTF8_INITDB_FLAGS, ...toFlags(IPC_SETTINGS)];
}

/** `-c name=value` server arguments. A caller's setting wins over the default. */
export function buildServerFlags(settings: Record<string, string> = {}): string[] {
  return toFlags({ listen_addresses: HOST, ...IPC_SETTINGS, ...settings });
}

/** True when PostgreSQL failed because machine-wide SysV identifiers are taken. */
export function isIpcExhausted(message: string): boolean {
  return /could not create (shared memory segment|semaphore set)/.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const failureExitGuard = Symbol.for("crm.failureExitGuard");

/**
 * embedded-postgres registers async-exit-hook at import. That hook's beforeExit
 * listener always finishes by calling process.exit(0). Vitest stores a failed
 * run on process.exitCode and lets the event loop drain, so the listener reports
 * success. The hook still stops the cluster; a non-zero code already recorded
 * on the process is kept.
 */
function preserveFailureExitCode(): void {
  const current = process.exit as typeof process.exit & { [failureExitGuard]?: true };
  if (current[failureExitGuard]) return;
  const realExit = process.exit.bind(process);
  const guarded = ((code?: number) => {
    const recorded = process.exitCode;
    if ((code === undefined || code === 0) && typeof recorded === "number" && recorded !== 0) {
      return realExit(recorded);
    }
    return code === undefined ? realExit() : realExit(code);
  }) as typeof process.exit & { [failureExitGuard]?: true };
  guarded[failureExitGuard] = true;
  process.exit = guarded;
}

preserveFailureExitCode();

export type LocalPostgresOptions = {
  /** Cluster data directory. Created and initialised on first use. */
  dataDir: string;
  /** Fixed port. Default: a free port chosen by the OS. */
  port?: number;
  /** Extra `-c name=value` server settings. */
  settings?: Record<string, string>;
  /** Receives server and initdb output. Default: discarded (kept for error messages). */
  onLog?: (line: string) => void;
};

export type LocalPostgres = {
  port: number;
  /** True when a server already running on the data directory was reused. */
  adopted: boolean;
  /** Connection string for a database on this cluster. */
  urlFor(database: string): string;
  stop(): Promise<void>;
};

export function connectionUrl(port: number, database: string): string {
  return `postgres://${USER}:${PASSWORD}@${HOST}:${port}/${encodeURIComponent(database)}`;
}

/** Parses the first lines of `postmaster.pid`: line 1 is the PID, line 4 the port. */
export function parsePostmasterPid(contents: string): { pid: number; port: number } | null {
  const lines = contents.split("\n");
  const pid = Number.parseInt(lines[0] ?? "", 10);
  const port = Number.parseInt(lines[3] ?? "", 10);
  if (!Number.isInteger(pid) || pid <= 0 || !Number.isInteger(port) || port <= 0) return null;
  return { pid, port };
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

async function waitForExit(pid: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (isAlive(pid)) {
    if (Date.now() > deadline) throw new Error(`postgres process ${pid} did not stop in time`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

async function runningServer(dataDir: string): Promise<{ pid: number; port: number } | null> {
  const pidFile = join(dataDir, "postmaster.pid");
  if (!existsSync(pidFile)) return null;
  const parsed = parsePostmasterPid(await readFile(pidFile, "utf8"));
  return parsed && isAlive(parsed.pid) ? parsed : null;
}

/**
 * Starts (or re-attaches to) an embedded PostgreSQL server on `dataDir`.
 * Each call owns its own data directory; use different directories for parallel servers.
 */
export async function startLocalPostgres(options: LocalPostgresOptions): Promise<LocalPostgres> {
  const { dataDir } = options;

  const existing = await runningServer(dataDir);
  if (existing) {
    return {
      port: existing.port,
      adopted: true,
      urlFor: (database) => connectionUrl(existing.port, database),
      async stop() {
        process.kill(existing.pid, "SIGINT");
        await waitForExit(existing.pid, 30_000);
      },
    };
  }

  const tail: string[] = [];
  const onLog = (message: string) => {
    for (const line of message.split("\n")) {
      if (line.trim() === "") continue;
      tail.push(line);
      if (tail.length > 20) tail.shift();
      options.onLog?.(line);
    }
  };

  const port = options.port ?? (await pickFreePort());
  if (options.port !== undefined && !(await isPortFree(port))) {
    throw new Error(`port ${port} is already in use`);
  }

  const flags = buildServerFlags(options.settings);
  const createCluster = () =>
    new EmbeddedPostgres({
      databaseDir: dataDir,
      port,
      user: USER,
      password: PASSWORD,
      persistent: true,
      initdbFlags: buildInitdbFlags(),
      postgresFlags: flags,
      onLog,
      onError: (error) => onLog(error instanceof Error ? error.message : String(error)),
    });

  let server: EmbeddedPostgres | undefined;
  let reason = "server exited during start";
  for (let attempt = 0; attempt <= IPC_RETRY_DELAYS_MS.length; attempt += 1) {
    if (attempt > 0) {
      const delay = IPC_RETRY_DELAYS_MS[attempt - 1] ?? 0;
      onLog(`SysV IPC identifiers are taken, retrying in ${delay}ms`);
      await sleep(delay);
    }
    const candidate = createCluster();
    try {
      if (!existsSync(join(dataDir, "PG_VERSION"))) await candidate.initialise();
      await candidate.start();
      server = candidate;
      break;
    } catch (error) {
      await candidate.stop().catch(() => undefined);
      reason = error instanceof Error ? error.message : "server exited during start";
      if (!isIpcExhausted(reason)) break;
    }
  }

  if (!server) {
    const hint = isIpcExhausted(reason) ? `\n${IPC_EXHAUSTION_HINT}` : "";
    throw new Error(`could not start local PostgreSQL: ${reason}\n${tail.join("\n")}${hint}`);
  }
  const cluster = server;

  return {
    port,
    adopted: false,
    urlFor: (database) => connectionUrl(port, database),
    async stop() {
      // A Ctrl+C reaches the server directly (same process group) and it exits on its own;
      // embedded-postgres would then wait forever for an exit event it already missed.
      const child = (cluster as unknown as { process?: ChildProcess }).process;
      if (child && (child.exitCode !== null || child.signalCode !== null)) {
        (cluster as unknown as { process?: ChildProcess }).process = undefined;
        return;
      }
      await cluster.stop();
    },
  };
}

/** Creates the database when it does not exist yet. */
export async function ensureDatabase(adminUrl: string, name: string): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    const found = await client.query("select 1 from pg_database where datname = $1", [name]);
    if (found.rowCount === 0) {
      await client.query(`create database ${client.escapeIdentifier(name)}`);
    }
  } finally {
    await client.end();
  }
}
