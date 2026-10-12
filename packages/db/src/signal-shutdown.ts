import type { ChildProcess } from "node:child_process";
import "embedded-postgres";
import { createRequire } from "node:module";

const signals = { SIGHUP: 129, SIGINT: 130, SIGTERM: 143 } as const;
const cleanups = new Set<() => Promise<void>>();
let installed = false;
let shuttingDown = false;

/** Own these signals instead of embedded-postgres's timed async-exit-hook. */
function install(): void {
  if (installed) return;
  installed = true;
  const exit = process.exit.bind(process);
  // Entrypoint error handlers must not exit while signal cleanup is still pending.
  process.exit = ((code?: number) => {
    if (shuttingDown) return undefined as never;
    return exit(code);
  }) as typeof process.exit;
  const require = createRequire(import.meta.url);
  const embeddedRequire = createRequire(require.resolve("embedded-postgres"));
  const exitHook = embeddedRequire("async-exit-hook") as { unhookEvent(event: string): void };
  for (const signal of Object.keys(signals) as Array<keyof typeof signals>) {
    exitHook.unhookEvent(signal);
    process.on(signal, () => {
      if (shuttingDown) return;
      shuttingDown = true;
      process.exitCode = signals[signal];
      void Promise.allSettled([...cleanups].map((cleanup) => cleanup())).then((results) => {
        for (const result of results) {
          if (result.status === "rejected") console.error("shutdown failed:", result.reason);
        }
        exit(signals[signal]);
      });
    });
  }
}

/** Idempotent cleanup, also registered for SIGINT, SIGTERM and SIGHUP. */
export function registerSignalShutdown(cleanup: () => Promise<void>): () => Promise<void> {
  install();
  let stopping: Promise<void> | undefined;
  const stop = () => {
    stopping ??= Promise.resolve()
      .then(cleanup)
      .finally(() => cleanups.delete(stop));
    return stopping;
  };
  cleanups.add(stop);
  return stop;
}

/** Register before startup so a signal during startup still awaits the owned cluster. */
export async function startWithSignalShutdown<T extends { stop(): Promise<void> }>(
  start: () => Promise<T>,
): Promise<T> {
  let pending: Promise<T>;
  const stop = registerSignalShutdown(async () => {
    const resource = await pending.catch(() => undefined);
    await resource?.stop();
  });
  pending = Promise.resolve().then(start);
  try {
    const resource = await pending;
    return { ...resource, stop };
  } catch (error) {
    await stop();
    throw error;
  }
}

/** Stop an application child before its supervising process exits. Never used for PostgreSQL. */
export async function stopApplicationChild(child: ChildProcess | undefined): Promise<void> {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
  const timer = setTimeout(() => {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  }, 5000);
  try {
    child.kill("SIGTERM");
    await exited;
  } finally {
    clearTimeout(timer);
  }
}
