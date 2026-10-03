import { afterAll, beforeAll, inject } from "vitest";
import { createWorkerDatabase } from "./testing";

let worker: Awaited<ReturnType<typeof createWorkerDatabase>> | undefined;

// Every Vitest worker (one per test file) gets its own clone of the migrated template.
beforeAll(async () => {
  const workerId = `${process.env.VITEST_POOL_ID ?? "0"}_${process.env.VITEST_WORKER_ID ?? "0"}`;
  worker = await createWorkerDatabase(inject("crmAdminUrl"), workerId);
  process.env.DATABASE_URL = worker.url;
});

afterAll(async () => {
  await worker?.drop();
});
