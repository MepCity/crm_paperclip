import { pathToFileURL } from "node:url";
import { InMemoryJobQueue, JobCatalog } from "@crm/core/jobs";
import { HandlerRegistry, Worker } from "./worker";

export interface SignalSource {
  on(signal: "SIGTERM" | "SIGINT", listener: () => void): unknown;
  off(signal: "SIGTERM" | "SIGINT", listener: () => void): unknown;
}
export function bindSignals(
  worker: Worker,
  signals: SignalSource,
  exit: (forced: boolean) => void,
): () => void {
  let stopping = false;
  const unbind = () => {
    signals.off("SIGTERM", stop);
    signals.off("SIGINT", stop);
  };
  const stop = () => {
    if (stopping) return;
    stopping = true;
    void worker.stop().then(
      ({ forced }) => {
        unbind();
        exit(forced);
      },
      () => {
        unbind();
        exit(true);
      },
    );
  };
  signals.on("SIGTERM", stop);
  signals.on("SIGINT", stop);
  return unbind;
}

export function startEphemeralWorker() {
  const catalog = new JobCatalog([]);
  const worker = new Worker({
    queue: new InMemoryJobQueue(catalog),
    catalog,
    handlers: new HandlerRegistry([]),
    workerId: `worker-${process.pid}`,
  });
  bindSignals(worker, process, (forced) => {
    if (forced) process.exit(1);
    process.exitCode = 0;
  });
  worker.start();
  return worker;
}

// Imports are inert. Production must not silently select ephemeral storage.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv.includes("--ephemeral")) {
    console.error("No durable queue configured. Explicit --ephemeral is required for fake mode.");
    process.exitCode = 1;
  } else {
    console.info(
      "Starting ephemeral worker: jobs do not survive a restart; no handlers configured.",
    );
    startEphemeralWorker();
  }
}
