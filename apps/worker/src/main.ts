import { pathToFileURL } from "node:url";
import { InMemoryJobQueue } from "@crm/core/jobs";
import {
  createInMemoryMailRepository,
  createMailJobCatalog,
  createMailSendHandler,
  createMailSyncHandler,
} from "@crm/core/mail";
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

/** Explicit fake mode: no provider access and no restart durability. */
export function createEphemeralMailRuntime() {
  const catalog = createMailJobCatalog();
  const queue = new InMemoryJobQueue(catalog);
  const repository = createInMemoryMailRepository();
  const recordAddressLookup = {
    async findByAddress() {
      return [];
    },
  };
  const handlers = new HandlerRegistry([
    createMailSendHandler({
      repository,
      queue,
      recordAddressLookup,
      canReadRecord: () => false,
      sender: {
        async send() {
          return { status: "rejected", reason: "fake_provider", retryable: false };
        },
      },
    }),
    createMailSyncHandler({
      repository,
      recordAddressLookup,
      connector: {
        async listChanges(_mailbox, cursor) {
          return { messageIds: [], nextCursor: cursor ?? "fake-empty" };
        },
        async fetchMessage() {
          return null;
        },
        async sendRaw() {
          throw new Error("Fake connector cannot send");
        },
        async revoke() {},
        async disconnect() {},
      },
    }),
  ]);
  return { catalog, queue, repository, handlers };
}

export function startEphemeralWorker() {
  const { catalog, queue, handlers } = createEphemeralMailRuntime();
  const worker = new Worker({
    queue,
    catalog,
    handlers,
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
      "Starting ephemeral worker: jobs do not survive a restart; fake mail_send and mail_sync handlers; no provider access.",
    );
    startEphemeralWorker();
  }
}
