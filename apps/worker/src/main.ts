import { pathToFileURL } from "node:url";
import {
  type CadenceWorkerDeps,
  cadenceJobDefinitions,
  createCadenceJobCatalog,
  createCadenceStepHandler,
  createCadenceSweepHandler,
} from "@crm/core/cadences";
import { InMemoryJobQueue, JobCatalog } from "@crm/core/jobs";
import {
  createJourneyActionHandler,
  createJourneyJobCatalog,
  createJourneySweepHandler,
  createJourneyTransitionHandler,
  type JourneysWorkerDeps,
  journeyJobDefinitions,
} from "@crm/core/journeys";
import {
  createInMemoryMailRepository,
  createMailJobCatalog,
  createMailSendHandler,
  createMailSyncHandler,
  mailSendJobDefinition,
  mailSyncJobDefinition,
} from "@crm/core/mail";
import type { RecordService } from "@crm/core/records";
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

export function createEphemeralCadenceRuntime(
  deps?: CadenceWorkerDeps & { recordService?: RecordService },
) {
  const catalog = createCadenceJobCatalog();
  const queue = new InMemoryJobQueue(catalog);
  const handlers = new HandlerRegistry([
    createCadenceStepHandler({ ...deps, jobQueue: queue }),
    ...(deps?.recordService
      ? [createCadenceSweepHandler({ ...deps, recordService: deps.recordService, jobQueue: queue })]
      : []),
  ]);
  return { catalog, queue, handlers };
}

export function createEphemeralJourneyRuntime(
  deps?: JourneysWorkerDeps & { recordService?: RecordService },
) {
  const catalog = createJourneyJobCatalog();
  const queue = new InMemoryJobQueue(catalog);
  const handlers = new HandlerRegistry([
    createJourneyTransitionHandler({ ...deps, jobQueue: queue }),
    createJourneyActionHandler({ ...deps, jobQueue: queue }),
    createJourneySweepHandler({ ...deps, jobQueue: queue }),
  ]);
  return { catalog, queue, handlers };
}

export interface EphemeralWorkerOptions {
  recordService?: RecordService;
  cadenceDeps?: CadenceWorkerDeps;
  journeyDeps?: JourneysWorkerDeps;
  signals?: SignalSource;
  exit?: (forced: boolean) => void;
  workerId?: string;
  concurrency?: number;
}

export function createEphemeralRuntime(options?: {
  recordService?: RecordService;
  cadenceDeps?: CadenceWorkerDeps;
  journeyDeps?: JourneysWorkerDeps;
}) {
  const mailDefinitions = [mailSendJobDefinition, mailSyncJobDefinition];
  const catalog = new JobCatalog([
    ...mailDefinitions,
    ...cadenceJobDefinitions,
    ...journeyJobDefinitions,
  ]);
  const queue = new InMemoryJobQueue(catalog);
  const repository = createInMemoryMailRepository();
  const recordAddressLookup = {
    async findByAddress() {
      return [];
    },
  };
  const mailHandlers = [
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
  ];

  const cadenceDeps = { ...options?.cadenceDeps };
  const journeyDeps = { ...options?.journeyDeps };
  const recordService =
    options?.recordService ?? cadenceDeps.recordService ?? journeyDeps.recordService;

  const cadenceHandlers = [
    createCadenceStepHandler({ ...cadenceDeps, recordService, jobQueue: queue }),
    ...(recordService
      ? [createCadenceSweepHandler({ ...cadenceDeps, recordService, jobQueue: queue })]
      : []),
  ];

  const journeyHandlers = [
    createJourneyTransitionHandler({ ...journeyDeps, recordService, jobQueue: queue }),
    createJourneyActionHandler({ ...journeyDeps, recordService, jobQueue: queue }),
    createJourneySweepHandler({ ...journeyDeps, recordService, jobQueue: queue }),
  ];

  const handlers = new HandlerRegistry([...mailHandlers, ...cadenceHandlers, ...journeyHandlers]);
  return { catalog, queue, repository, handlers };
}

export function startEphemeralWorker(options?: EphemeralWorkerOptions) {
  const runtime = createEphemeralRuntime(options);
  const worker = new Worker({
    queue: runtime.queue,
    catalog: runtime.catalog,
    handlers: runtime.handlers,
    workerId: options?.workerId ?? `worker-${process.pid}`,
    ...(options?.concurrency ? { concurrency: options.concurrency } : {}),
  });
  if (options?.signals) {
    bindSignals(worker, options.signals, options.exit ?? (() => {}));
  } else if (typeof process !== "undefined") {
    bindSignals(worker, process, (forced) => {
      if (forced) process.exit(1);
      process.exitCode = 0;
    });
  }
  worker.start();
  return Object.assign(worker, { runtime });
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
