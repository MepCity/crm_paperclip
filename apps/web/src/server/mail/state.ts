import type { OrgContext } from "@crm/core";
import { InMemoryJobQueue } from "@crm/core/jobs";
import { createMailJobCatalog } from "@crm/core/mail/outbox";
import { createMailSeed } from "./seed";

/** Ephemeral staging state only. No worker consumes this queue and no provider is connected. */
export async function createMailState(
  ctx: OrgContext,
  options: { includeMessages?: boolean } = {},
) {
  const seed = await createMailSeed(ctx, { includeMessages: options.includeMessages ?? false });
  let tail = Promise.resolve();
  return {
    ...seed,
    bodies: new Map<string, string>(),
    queue: new InMemoryJobQueue(createMailJobCatalog()),
    // Serialize compose's multi-step repository writes, including concurrent key replays.
    async exclusive<T>(work: () => Promise<T>): Promise<T> {
      const previous = tail;
      let release = () => {};
      tail = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;
      try {
        return await work();
      } finally {
        release();
      }
    },
  };
}

const states = new Map<string, ReturnType<typeof createMailState>>();
export function getMailState(ctx: OrgContext) {
  let state = states.get(ctx.orgId);
  if (!state) {
    state = createMailState(ctx);
    states.set(ctx.orgId, state);
    void state.catch(() => states.delete(ctx.orgId));
  }
  return state;
}
