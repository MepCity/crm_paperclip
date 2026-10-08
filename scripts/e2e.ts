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
const webDir = `${root}apps/web`;

const baseEnv = {
  ...process.env,
  PATH: `${webDir}/node_modules/.bin:${root}node_modules/.bin:${process.env.PATH}`,
};

let current: ChildProcess | undefined;
let interrupted = false;
let postgres: TestPostgres | undefined;
let activePort: number | undefined;
let lockHeld = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Stops listeners on the E2E port when Playwright's webServer outlives the test driver. */
async function stopListenersOnPort(port: number): Promise<void> {
  let stdout = "";
  try {
    ({ stdout } = await execFileAsync("lsof", ["-ti", `:${port}`]));
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    if (code === 1) return;
    throw error;
  }
  const pids = stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((value) => Number(value));
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // Process may already have exited.
    }
  }
  await sleep(500);
  for (const pid of pids) {
    try {
      process.kill(pid, 0);
      process.kill(pid, "SIGKILL");
    } catch {
      // Already gone.
    }
  }
}

async function cleanupAfterRun(): Promise<void> {
  if (activePort !== undefined) {
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
    interrupted = true;
    current?.kill(signal);
  });
}

async function main(): Promise<number> {
  console.log("e2e: starting a throwaway PostgreSQL");
  postgres = await startTestPostgres();
  try {
    await createTemplateDatabase(postgres.adminUrl);
    const database = await createWorkerDatabase(postgres.adminUrl, "e2e");
    const port = await pickFreePort();
    activePort = port;
    const env = {
      ...baseEnv,
      DATABASE_URL: database.url,
      APP_URL: `http://127.0.0.1:${port}`,
      APP_SECRET: randomBytes(32).toString("hex"),
      E2E_PORT: String(port),
    };

    // No-op when Chromium is already installed.
    if ((await run("playwright", ["install", "chromium"], env)) !== 0) return 1;

    await acquireE2eLock();
    lockHeld = true;
    try {
      console.log("e2e: building the production bundle");
      if ((await run("next", ["build"], env)) !== 0) return 1;
      if (interrupted) return 130;
      console.log(`e2e: running Playwright against http://127.0.0.1:${port}`);
      const playwrightArgs = ["test", ...process.argv.slice(2)];
      const code = await run("playwright", playwrightArgs, env);
      if (interrupted) return 130;
      return code;
    } finally {
      if (lockHeld) {
        await releaseE2eLock();
        lockHeld = false;
      }
    }
  } finally {
    if (activePort !== undefined) {
      await stopListenersOnPort(activePort);
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
