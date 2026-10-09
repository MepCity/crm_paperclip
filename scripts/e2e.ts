import { type ChildProcess, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { pickFreePort } from "@crm/db/ports";
import { registerSignalShutdown, stopApplicationChild } from "@crm/db/signal-shutdown";
import { createTemplateDatabase, createWorkerDatabase, startTestPostgres } from "@crm/db/testing";

const root = fileURLToPath(new URL("..", import.meta.url));
const webDir = `${root}apps/web`;

const baseEnv = {
  ...process.env,
  PATH: `${webDir}/node_modules/.bin:${root}node_modules/.bin:${process.env.PATH}`,
};

let current: ChildProcess | undefined;
let interrupted = false;

function run(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: webDir, env, stdio: "inherit" });
    current = child;
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

async function main(): Promise<number> {
  console.log("e2e: starting a throwaway PostgreSQL");
  const postgres = await startTestPostgres();
  const stop = registerSignalShutdown(async () => {
    interrupted = true;
    await stopApplicationChild(current);
    await postgres.stop();
  });
  try {
    await createTemplateDatabase(postgres.adminUrl);
    const database = await createWorkerDatabase(postgres.adminUrl, "e2e");
    const port = await pickFreePort();
    const env = {
      ...baseEnv,
      DATABASE_URL: database.url,
      APP_URL: `http://127.0.0.1:${port}`,
      APP_SECRET: randomBytes(32).toString("hex"),
      E2E_PORT: String(port),
    };

    // No-op when Chromium is already installed.
    if ((await run("playwright", ["install", "chromium"], env)) !== 0) return 1;
    console.log("e2e: building the production bundle");
    if ((await run("next", ["build"], env)) !== 0) return 1;
    if (interrupted) return 130;
    console.log(`e2e: running Playwright against http://127.0.0.1:${port}`);
    const playwrightArgs = ["test", ...process.argv.slice(2)];
    return await run("playwright", playwrightArgs, env);
  } finally {
    await stop();
  }
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
