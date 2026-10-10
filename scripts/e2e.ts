import { type ChildProcess, execFile, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { pickFreePort } from "@crm/db/ports";
import {
  createTemplateDatabase,
  createWorkerDatabase,
  startTestPostgres,
  type TestPostgres,
} from "@crm/db/testing";
import { acquireE2eLock, releaseE2eLock } from "./e2e-lock";

const execFileAsync = promisify(execFile);

const root = fileURLToPath(new URL("..", import.meta.url));
const worktreeRoot = root.endsWith("/") ? root : `${root}/`;
const webDir = `${root}apps/web`;

const baseEnv = {
  ...process.env,
  PATH: `${webDir}/node_modules/.bin:${root}node_modules/.bin:${process.env.PATH}`,
};

let current: ChildProcess | undefined;
let interrupted = false;
// `shutdown` stores the signal's code here too: main() can resume from the killed child
// before shutdown's cleanup finishes, and a hard-coded 130 there turned SIGTERM into 130.
let interruptedExitCode = 130;
let shuttingDown = false;
let postgres: TestPostgres | undefined;
let activePort: number | undefined;
let lockHeld = false;
let playwrightStageStarted = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isCwdUnderWorktree(cwd: string): boolean {
  return cwd === root || cwd.startsWith(worktreeRoot);
}

/** Reads a process cwd via lsof (macOS ps does not expose cwd). */
async function processCwd(pid: number): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"]);
    for (const line of stdout.split("\n")) {
      if (line.startsWith("n")) {
        const path = line.slice(1).trim();
        return path || null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function collectLaunchAncestorChain(): Promise<number[]> {
  const chain: number[] = [];
  let pid = process.ppid;
  while (pid > 0) {
    chain.push(pid);
    if (pid === 1) break;
    try {
      const { stdout } = await execFileAsync("ps", ["-p", String(pid), "-o", "ppid="]);
      const ppid = Number(stdout.trim());
      if (!Number.isFinite(ppid) || ppid === pid) break;
      pid = ppid;
    } catch {
      break;
    }
  }
  return chain;
}

/** Stops listeners on the E2E port when Playwright's webServer outlives the test driver. */
async function stopListenersOnPort(port: number): Promise<void> {
  let stdout = "";
  try {
    ({ stdout } = await execFileAsync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"]));
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    if (code === 1) return;
    console.log("e2e: port cleanup skipped (lsof failed)");
    return;
  }
  const pids = stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((value) => Number(value));
  const worktreePids: number[] = [];
  for (const pid of pids) {
    const cwd = await processCwd(pid);
    if (cwd && isCwdUnderWorktree(cwd)) worktreePids.push(pid);
  }
  for (const pid of worktreePids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // Process may already have exited.
    }
  }
  await sleep(500);
  for (const pid of worktreePids) {
    try {
      process.kill(pid, 0);
      process.kill(pid, "SIGKILL");
    } catch {
      // Already gone.
    }
  }
}

async function cleanupAfterRun(): Promise<void> {
  if (playwrightStageStarted && activePort !== undefined) {
    await stopListenersOnPort(activePort);
    activePort = undefined;
  }
  if (postgres) {
    await postgres.stop();
    postgres = undefined;
  }
  if (lockHeld) {
    await releaseE2eLock();
    lockHeld = false;
  }
}

async function shutdown(exitCode: number): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  interruptedExitCode = exitCode;
  interrupted = true;
  current?.kill("SIGTERM");
  await cleanupAfterRun();
  process.exit(exitCode);
}

function run(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: webDir, env, stdio: "inherit" });
    current = child;
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (current === child) current = undefined;
      resolve(code ?? (signal ? 1 : 0));
    });
  });
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void shutdown(signal === "SIGINT" ? 130 : 143);
  });
}

let parentWatch: ReturnType<typeof setInterval> | undefined;

async function startParentWatch(): Promise<void> {
  const chain = await collectLaunchAncestorChain();
  const watchPids = chain.length > 0 ? chain : [process.ppid];
  parentWatch = setInterval(() => {
    for (const pid of watchPids) {
      try {
        process.kill(pid, 0);
      } catch (error) {
        const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
        if (code === "ESRCH") {
          void shutdown(143);
          return;
        }
      }
    }
  }, 1_000);
}

async function main(): Promise<number> {
  await startParentWatch();
  console.log("e2e: starting a throwaway PostgreSQL");
  postgres = await startTestPostgres();
  try {
    await createTemplateDatabase(postgres.adminUrl);
    const database = await createWorkerDatabase(postgres.adminUrl, "e2e");

    // No-op when Chromium is already installed.
    const installCode = await run("playwright", ["install", "chromium"], baseEnv);
    if (interrupted) return interruptedExitCode;
    if (installCode !== 0) return 1;

    lockHeld = await acquireE2eLock({ shouldStop: () => interrupted });
    if (interrupted) return interruptedExitCode;

    const port = await pickFreePort();
    activePort = port;
    const env = {
      ...baseEnv,
      DATABASE_URL: database.url,
      APP_URL: `http://127.0.0.1:${port}`,
      APP_SECRET: randomBytes(32).toString("hex"),
      E2E_PORT: String(port),
    };

    try {
      console.log("e2e: building the production bundle");
      const buildCode = await run("next", ["build"], env);
      if (interrupted) return interruptedExitCode;
      if (buildCode !== 0) return 1;
      console.log(`e2e: running Playwright against http://127.0.0.1:${port}`);
      playwrightStageStarted = true;
      const playwrightArgs = ["test", ...process.argv.slice(2)];
      const code = await run("playwright", playwrightArgs, env);
      if (interrupted) return interruptedExitCode;
      return code;
    } finally {
      if (lockHeld) {
        await releaseE2eLock();
        lockHeld = false;
      }
    }
  } finally {
    if (parentWatch) clearInterval(parentWatch);
    if (playwrightStageStarted && activePort !== undefined) {
      try {
        await stopListenersOnPort(activePort);
      } catch {
        console.log("e2e: port cleanup skipped (unexpected error)");
      }
      activePort = undefined;
    }
    if (postgres) {
      await postgres.stop();
      postgres = undefined;
    }
  }
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error);
    void cleanupAfterRun().finally(() => process.exit(1));
  },
);
