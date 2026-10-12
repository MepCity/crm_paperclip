/**
 * Exit-code probe only needs the embedded-postgres import side effects from
 * local-postgres (including preserveFailureExitCode). Starting a throwaway
 * cluster here duplicates the integration project's global setup and can exhaust
 * shared-memory segments when verify runs every Vitest project at once.
 */
import "../local-postgres.js";

export default function setup(): () => Promise<void> {
  return async () => {};
}
