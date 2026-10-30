import { createHash, randomUUID } from "node:crypto";
import {
  type InvitationProcessor,
  processMessageCalendarParts,
} from "../calendar/invitation-store";
import { type Job, JobExecutionError, type JobQueue } from "../jobs";
import { matchRecordLinks } from "../mail-threading/links";
import type { RecordEmail } from "../mail-threading/types";
import { ConnectorError, type MailConnector } from "./connectors/gmail/port";
import { syncMailbox } from "./connectors/gmail/sync";
import type { MailMessage, MailRepository, RecordAddressLookup } from "./types";

export const MAIL_SYNC_JOB_KIND = "mail_sync";
export const mailSyncJobDefinition = {
  kind: MAIL_SYNC_JOB_KIND,
  version: 1,
  referenceKeys: ["mailboxId"],
  retrySafe: true,
} as const;

export interface MailSyncOptions {
  repository: MailRepository;
  connector: MailConnector;
  recordAddressLookup: RecordAddressLookup;
  now?: () => Date;
  /** Incoming iTIP handling. `calendarParts` returns the text/calendar bodies of a stored message. */
  invitations?: {
    processor: InvitationProcessor;
    calendarParts(message: MailMessage): Promise<readonly string[]>;
  };
}

/** Trusted inbound boundary: exact tenant/address matching, excluding BCC (ADR 0009). */
async function linkMessage(
  options: MailSyncOptions,
  message: MailMessage,
  checkpoint: () => Promise<void>,
) {
  const kinds: Partial<Record<string, "lead" | "contact" | "account">> = {
    leads: "lead",
    contacts: "contact",
    accounts: "account",
  };
  const modules = { lead: "leads", contact: "contacts", account: "accounts" } as const;
  const addresses = [
    ...new Set(
      [...message.from, ...message.to, ...message.cc].map((p) => p.address.trim().toLowerCase()),
    ),
  ];
  const records: RecordEmail[] = [];
  for (const address of addresses) {
    for (const match of await options.recordAddressLookup.findByAddress(
      message.organizationId,
      address,
    )) {
      if (
        match.organizationId !== message.organizationId ||
        match.address.trim().toLowerCase() !== address ||
        !Object.hasOwn(kinds, match.module)
      )
        continue;
      const kind = kinds[match.module];
      if (!kind) continue;
      records.push({ kind, recordId: match.recordId, email: match.address });
    }
  }
  const result = matchRecordLinks(addresses, records);
  for (const match of result.matches) {
    await checkpoint();
    await options.repository.putLink({
      organizationId: message.organizationId,
      messageId: message.id,
      module: modules[match.kind],
      recordId: match.recordId,
      source: "auto",
      ambiguous: result.ambiguous,
    });
  }
}

/** Calendar problems never fail the sync: they are counted in the processor stats. */
async function processInvitations(options: MailSyncOptions, message: MailMessage) {
  const inv = options.invitations;
  if (!inv || message.folder !== "inbox") return;
  let parts: readonly string[];
  try {
    parts = await inv.calendarParts(message);
  } catch {
    inv.processor.stats.parseFailures++;
    return;
  }
  // The mailbox record has no address field: its own addresses are the recipients of its inbox mail.
  await processMessageCalendarParts(inv.processor, message.organizationId, message.id, parts, {
    sender: message.from[0]?.address ?? "",
    mailboxAddresses: [...message.to, ...message.cc, ...message.bcc].map((x) => x.address),
  });
}

type SyncContext = {
  organizationId: string;
  job: Job;
  signal: AbortSignal;
  checkpoint(): Promise<void>;
};

export function createMailSyncHandler(options: MailSyncOptions) {
  const repo = options.repository;
  const load = async (c: SyncContext) =>
    (await repo.read(c.organizationId)).mailboxes.find(
      (box) => box.organizationId === c.organizationId && box.id === c.job.payload.mailboxId,
    );
  return {
    kind: MAIL_SYNC_JOB_KIND,
    version: 1,
    async isCurrent(c: SyncContext) {
      const box = await load(c);
      return box?.status === "connected" && box.credentialRef !== null;
    },
    async run(c: SyncContext) {
      const box = await load(c);
      if (!box) throw new JobExecutionError({ code: "resource_missing", retryable: false });
      if (box.status !== "connected" || !box.credentialRef) return;
      for (const folder of box.folders) {
        // Drafts are local compose state, not part of inbound synchronization.
        if (folder === "draft") continue;
        const state = await repo.getSyncState(c.organizationId, box.id, folder);
        try {
          const result = await syncMailbox(
            options.connector,
            repo,
            {
              organizationId: c.organizationId,
              id: box.id,
              credentialRef: box.credentialRef,
              folder,
            },
            state.cursor,
            async (message) => {
              await linkMessage(options, message, c.checkpoint);
              await processInvitations(options, message);
            },
            c.checkpoint,
          );
          await c.checkpoint();
          await repo.putSyncState({
            ...state,
            cursor: result.nextCursor,
            lastSyncedAt: (options.now?.() ?? new Date()).toISOString(),
            lastError: null,
          });
        } catch (error) {
          // Lease/cancellation failures must not overwrite state owned by another attempt.
          c.signal.throwIfAborted();
          await c.checkpoint();
          const code = error instanceof ConnectorError ? error.code : "storage_failed";
          await repo.putSyncState({ ...state, lastError: code });
          if (code === "auth_revoked" || code === "disconnected") {
            await repo.setMailboxStatus(
              c.organizationId,
              box.id,
              code === "disconnected" ? "disconnected" : "error",
              code,
            );
          }
          const retryable = code === "retryable" || code === "storage_failed";
          const delay = error instanceof ConnectorError ? error.retryAfterSeconds : null;
          throw new JobExecutionError({
            code: retryable
              ? "transient"
              : code === "auth_revoked"
                ? "authorization_revoked"
                : "permanent",
            retryable,
            ...(retryable && delay !== null && Number.isFinite(delay) && delay >= 0
              ? { retryAfter: (options.now?.() ?? new Date()).getTime() + delay * 1000 }
              : {}),
          });
        }
      }
    },
  };
}

const syncRequests = new WeakMap<JobQueue, Map<string, Promise<Job>>>();

/** Process-local pending exclusion. Retained terminal jobs never suppress a later sync. */
export function createMailboxSyncScheduler(context: { organizationId: string }, queue: JobQueue) {
  const org = { ...context };
  let pending = syncRequests.get(queue);
  if (!pending) {
    pending = new Map();
    syncRequests.set(queue, pending);
  }
  const requests = pending;
  const requestKey = (mailboxId: string) => JSON.stringify([org.organizationId, mailboxId]);
  return {
    async enqueueMailboxSync(mailboxId: string): Promise<Job> {
      const previous = requests.get(requestKey(mailboxId));
      if (previous) {
        const job = await previous;
        const current = await queue.get(org, job.id);
        if (current?.status === "queued" || current?.status === "running") return current;
        // A competing caller may have already installed the next generation.
        if (requests.get(requestKey(mailboxId)) !== previous)
          return this.enqueueMailboxSync(mailboxId);
      }
      const key = createHash("sha256").update(mailboxId).digest("hex");
      const next = queue.enqueue(org, {
        kind: MAIL_SYNC_JOB_KIND,
        payloadVersion: 1,
        payload: { mailboxId },
        idempotencyKey: `sync-${key}-${randomUUID()}`,
      });
      requests.set(requestKey(mailboxId), next);
      try {
        return await next;
      } catch (error) {
        if (requests.get(requestKey(mailboxId)) === next) requests.delete(requestKey(mailboxId));
        throw error;
      }
    },
  };
}
