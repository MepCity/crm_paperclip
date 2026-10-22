import { z } from "zod";
import { resolveAllowedType } from "../attachments/file-policy";
import { ConflictError, NotFoundError, ValidationError } from "../errors";
import {
  type EnqueueJob,
  type Job,
  JobCatalog,
  JobExecutionError,
  type JobFence,
  type JobQueue,
} from "../jobs";
import type { OrgContext } from "../tenancy/types";
import { buildImportNotifyEmail } from "../transfer/notify-email";
import type { ImportJob } from "../transfer/types";
import { createMailService, type MailServiceOptions } from "./service";
import {
  MAX_INBOUND_ATTACHMENT_BYTES,
  type MailboxAccount,
  type MailMessage,
  type MailParticipant,
  type MailRepository,
  mailParticipantSchema,
  type OutboxItem,
} from "./types";

/** ADR 0009 Q7: total size of the attachments of one outgoing message. */
export const MAX_OUTBOUND_ATTACHMENT_BYTES = 20 * 1024 * 1024;
export const MAX_OUTBOUND_RECIPIENTS = 100;
/** The queue only allows [A-Za-z0-9_-] in kinds, so the issue's `mail.send` is `mail_send`. */
export const MAIL_SEND_JOB_KIND = "mail_send";
export const MAIL_SEND_JOB_VERSION = 1;
/** Stored in `OutboxItem.lastError` while a send outcome cannot be proved (ADR 0010 Q5). */
export const DELIVERY_UNKNOWN = "delivery_unknown";

export const mailSendJobDefinition = {
  kind: MAIL_SEND_JOB_KIND,
  version: MAIL_SEND_JOB_VERSION,
  referenceKeys: ["outboxId"],
  /** A crash after possible provider acceptance must never replay the effect. */
  retrySafe: false,
} as const;
export function createMailJobCatalog(): JobCatalog {
  return new JobCatalog([mailSendJobDefinition]);
}

export interface OutboundAttachment {
  id: string;
  name: string;
  size: number;
  contentType: string;
  blobRef: string;
}

/**
 * What the sender port receives. Never contains credentials; the adapter resolves them.
 * Contract: the adapter always sends with the mailbox's authenticated address; `message.from`
 * only supplies a display name and its address part is ignored.
 */
export interface MailSendRequest {
  organizationId: string;
  mailboxId: string;
  /** Stable intent key (the outbox id): use it as the provider idempotency key if supported. */
  idempotencyKey: string;
  message: Pick<MailMessage, "subject" | "from" | "to" | "cc" | "bcc" | "summary" | "bodyRef">;
  attachments: readonly OutboundAttachment[];
}
export type MailSendResult =
  | { status: "accepted"; providerMessageId: string }
  /** Provider certainly did not send. `reason` must be a safe public code. */
  | { status: "rejected"; reason: string; retryable: boolean }
  | { status: "unknown" };
/** Trusted provider port. No real adapter exists yet; tests use a fake. */
export interface MailSender {
  send(request: MailSendRequest, signal?: AbortSignal): Promise<MailSendResult>;
}

export interface OutboxOptions extends MailServiceOptions {
  queue: JobQueue;
  sender: MailSender;
  now?: () => Date;
  /** Development guard; invoked at compose and again at execution with every envelope recipient. */
  recipientGuard?: (recipients: readonly MailParticipant[]) => void;
}

const opaque = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
export const composeMailSchema = z
  .object({
    idempotencyKey: opaque,
    mailboxId: z.string().min(1).max(256),
    from: mailParticipantSchema,
    to: z.array(mailParticipantSchema).default([]),
    cc: z.array(mailParticipantSchema).default([]),
    bcc: z.array(mailParticipantSchema).default([]),
    subject: z.string().max(998),
    summary: z.string().max(2000).default(""),
    /** Private content-store reference to the body. */
    bodyRef: z.string().min(1).max(256).nullable().default(null),
    attachments: z
      .array(
        z
          .object({
            id: opaque,
            name: z.string().min(1).max(255),
            size: z.number().int().nonnegative(),
            contentType: z.string().min(1),
            blobRef: z.string().min(1).max(256),
          })
          .strict(),
      )
      .max(50)
      .default([]),
    scheduledAt: z.string().datetime({ offset: true }).nullable().default(null),
  })
  .strict();
export type ComposeMail = z.input<typeof composeMailSchema>;

const safeCode = /^[a-z_]{1,64}$/;

function invalid(field: string, message: string, reason: "invalid" | "limit" = "invalid") {
  return new ValidationError({ [field]: [message] }, message, reason);
}

export function createMailOutbox(context: OrgContext, options: OutboxOptions) {
  const ctx = { ...context };
  const repo: MailRepository = options.repository;
  async function ownConnectedMailbox(mailboxId: string): Promise<MailboxAccount> {
    const data = await repo.read(ctx.orgId);
    const box = data.mailboxes.find(
      (m) => m.organizationId === ctx.orgId && m.id === mailboxId && m.ownerUserId === ctx.userId,
    );
    // Not-yours and not-found look identical so mailbox ids cannot be probed.
    if (!box) throw new NotFoundError();
    if (box.status !== "connected") throw invalid("mailboxId", "The mailbox is not connected.");
    return box;
  }

  return {
    /** Validate, write the draft + outbox intent and enqueue `mail.send`. Replay-safe by key. */
    async compose(input: ComposeMail) {
      const parsed = composeMailSchema.safeParse(input);
      if (!parsed.success) {
        throw new ValidationError(
          Object.fromEntries(
            parsed.error.issues.map((i) => [i.path.join(".") || "input", [i.message]]),
          ),
        );
      }
      const body = parsed.data;
      const recipients = [...body.to, ...body.cc, ...body.bcc];
      if (recipients.length === 0) throw invalid("to", "Add at least one recipient.");
      if (recipients.length > MAX_OUTBOUND_RECIPIENTS) {
        throw invalid("to", "Too many recipients.", "limit");
      }
      let total = 0;
      for (const file of body.attachments) {
        try {
          resolveAllowedType({ fileName: file.name, mediaType: file.contentType });
        } catch {
          throw invalid("attachments", "This attachment type is not allowed.");
        }
        total += file.size;
      }
      if (
        total > MAX_OUTBOUND_ATTACHMENT_BYTES ||
        body.attachments.some((f) => f.size > MAX_INBOUND_ATTACHMENT_BYTES)
      ) {
        throw invalid("attachments", "Attachments exceed the 20 MB limit.", "limit");
      }
      options.recipientGuard?.(recipients);
      await ownConnectedMailbox(body.mailboxId);

      const outboxId = body.idempotencyKey;
      const existing = (await repo.read(ctx.orgId)).outbox.find((o) => o.id === outboxId);
      if (existing && existing.mailboxId !== body.mailboxId) {
        throw new ConflictError("This idempotency key was used for another mailbox.");
      }
      const signature = (v: unknown) => JSON.stringify(v);
      const wanted = signature({
        to: body.to,
        cc: body.cc,
        bcc: body.bcc,
        from: [body.from],
        subject: body.subject,
        summary: body.summary,
        bodyRef: body.bodyRef,
        scheduledAt: body.scheduledAt ? Date.parse(body.scheduledAt) : null,
        attachments: body.attachments.map((a) => [a.id, a.name, a.size, a.contentType, a.blobRef]),
      });
      let draftId = `${outboxId}-draft`;
      if (existing) {
        const data = await repo.read(ctx.orgId);
        const stored = data.messages.find((m) => m.id === existing.messageId);
        const files = data.attachments
          .filter((a) => a.messageId === existing.messageId)
          .map((a) => [a.id.slice(outboxId.length + 1), a.name, a.size, a.contentType, a.blobRef]);
        const have = signature({
          to: stored?.to,
          cc: stored?.cc,
          bcc: stored?.bcc,
          from: stored?.from,
          subject: stored?.subject,
          summary: stored?.summary,
          bodyRef: stored?.bodyRef,
          scheduledAt: existing.scheduledAt ? Date.parse(existing.scheduledAt) : null,
          attachments: files,
        });
        if (have !== wanted) {
          throw new ConflictError("This idempotency key was used for different content.");
        }
        draftId = existing.messageId;
      } else {
        const draft = await repo.upsertMessage({
          organizationId: ctx.orgId,
          id: `${outboxId}-draft`,
          mailboxId: body.mailboxId,
          threadId: null,
          providerMessageKey: `outbox:${outboxId}`,
          messageIdHeader: null,
          inReplyTo: null,
          references: [],
          subject: body.subject,
          from: [body.from],
          to: body.to,
          cc: body.cc,
          bcc: body.bcc,
          sentAt: null,
          receivedAt: null,
          folder: "draft",
          summary: body.summary,
          bodyRef: body.bodyRef,
        });
        for (const file of body.attachments) {
          await repo.putAttachment({
            organizationId: ctx.orgId,
            id: `${outboxId}-${file.id}`,
            messageId: draft.id,
            name: file.name,
            size: file.size,
            contentType: file.contentType,
            storage: "stored",
            blobRef: file.blobRef,
          });
        }
      }
      const item: OutboxItem = existing ?? {
        organizationId: ctx.orgId,
        id: outboxId,
        mailboxId: body.mailboxId,
        messageId: draftId,
        status: "queued",
        attempts: 0,
        nextAttemptAt: null,
        lastError: null,
        scheduledAt: body.scheduledAt,
      };
      if (!existing) await repo.putOutboxItem(item);
      const enqueue: EnqueueJob = {
        kind: MAIL_SEND_JOB_KIND,
        payloadVersion: MAIL_SEND_JOB_VERSION,
        payload: { outboxId },
        idempotencyKey: outboxId,
        ...(body.scheduledAt ? { runAt: Date.parse(body.scheduledAt) } : {}),
        // The attempt counter lives in the outbox; the queue must never re-run a send.
        maxAttempts: 5,
      };
      try {
        await options.queue.enqueue({ organizationId: ctx.orgId }, enqueue);
      } catch (error) {
        // No cross-store transaction in memory: compensate so no orphan "queued" item remains.
        if (!existing)
          await repo.putOutboxItem({ ...item, status: "cancelled", lastError: "enqueue_failed" });
        throw error;
      }
      return structuredClone(existing ?? item);
    },

    /** Notify Email (CSV-09): one system mail through the importing user's own mailbox. */
    async enqueueImportNotification(input: {
      job: ImportJob;
      recipient: { address: string; name?: string };
      historyUrl: string;
    }) {
      if (input.job.createdBy.id !== ctx.userId) throw new NotFoundError();
      const data = await repo.read(ctx.orgId);
      const box = data.mailboxes.find(
        (m) => m.ownerUserId === ctx.userId && m.status === "connected",
      );
      // Q6 (system sender) is deferred: without a connected mailbox nothing is sent.
      if (!box) return { status: "skipped" as const, reason: "no_connected_mailbox" };
      if (input.job.status === "undone") return { status: "skipped" as const, reason: "undone" };
      const mail = buildImportNotifyEmail(input.job, input.recipient, {
        historyUrl: input.historyUrl,
      });
      const item = await this.compose({
        idempotencyKey: `import-notify-${input.job.id}`
          .replace(/[^A-Za-z0-9_-]/g, "_")
          .slice(0, 128),
        mailboxId: box.id,
        from: {
          address: input.recipient.address,
          ...(input.recipient.name ? { name: input.recipient.name } : {}),
        },
        to: mail.to,
        subject: mail.subject,
        summary: mail.text.slice(0, 2000),
        bodyRef: null,
      });
      return { status: "queued" as const, outbox: item };
    },
  };
}

/** Structurally compatible with the worker's JobHandler. */
export function createMailSendHandler(options: OutboxOptions) {
  type Ctx = {
    organizationId: string;
    job: Job;
    fence: JobFence;
    signal: AbortSignal;
    checkpoint(): Promise<void>;
  };
  const repo = options.repository;
  const now = () => (options.now ?? (() => new Date()))();

  async function load(c: Ctx) {
    const outboxId = c.job.payload.outboxId;
    // Tenant always comes from the job row, never from the payload.
    const data = await repo.read(c.organizationId);
    const item = data.outbox.find((o) => o.id === outboxId);
    if (!item) return undefined;
    const box = data.mailboxes.find((m) => m.id === item.mailboxId);
    const draft = data.messages.find((m) => m.id === item.messageId);
    if (!box || !draft) return undefined;
    return { data, item, box, draft };
  }
  const put = (item: OutboxItem, patch: Partial<OutboxItem>) =>
    repo.putOutboxItem({ ...item, ...patch });
  function hold(item: OutboxItem) {
    return put(item, { status: "failed", lastError: DELIVERY_UNKNOWN, nextAttemptAt: null });
  }

  return {
    kind: MAIL_SEND_JOB_KIND,
    version: MAIL_SEND_JOB_VERSION,
    async isCurrent(c: Ctx): Promise<boolean> {
      const row = await load(c);
      if (!row) return false;
      if (row.box.status === "connected") return true;
      if (row.item.status === "queued")
        await put(row.item, { status: "cancelled", lastError: "mailbox_disconnected" });
      return false;
    },
    async run(c: Ctx): Promise<void> {
      const row = await load(c);
      if (!row) throw new JobExecutionError({ code: "resource_missing", retryable: false });
      const { item, box, draft, data } = row;
      if (item.status === "sent" || item.status === "cancelled") return;
      if (
        item.status === "sending" ||
        (item.status === "failed" && item.lastError === DELIVERY_UNKNOWN)
      ) {
        // Previous attempt may have reached the provider: hold, never resend.
        if (item.status === "sending") await hold(item);
        throw new JobExecutionError({ code: "delivery_unknown", retryable: false });
      }
      if (item.status === "failed") {
        throw new JobExecutionError({ code: "permanent", retryable: false });
      }
      if (box.status !== "connected") {
        await put(item, { status: "cancelled", lastError: "mailbox_disconnected" });
        return;
      }
      const recipients = [...draft.to, ...draft.cc, ...draft.bcc];
      try {
        options.recipientGuard?.(recipients);
      } catch {
        await put(item, { status: "failed", lastError: "recipient_not_allowed" });
        throw new JobExecutionError({ code: "permanent", retryable: false });
      }
      const attachments = data.attachments
        .filter((a) => a.messageId === draft.id && a.blobRef !== null)
        .map((a) => ({
          id: a.id,
          name: a.name,
          size: a.size,
          contentType: a.contentType,
          blobRef: a.blobRef as string,
        }));
      await c.checkpoint();
      // Persist `sending` BEFORE the effect so a crash leaves evidence of a possible send.
      const sending = await put(item, {
        status: "sending",
        attempts: item.attempts + 1,
        nextAttemptAt: null,
        lastError: null,
      });
      let result: Awaited<ReturnType<MailSender["send"]>>;
      try {
        result = await options.sender.send(
          {
            organizationId: c.organizationId,
            mailboxId: box.id,
            idempotencyKey: item.id,
            message: {
              subject: draft.subject,
              from: draft.from,
              to: draft.to,
              cc: draft.cc,
              bcc: draft.bcc,
              summary: draft.summary,
              bodyRef: draft.bodyRef,
            },
            attachments,
          },
          c.signal,
        );
      } catch {
        result = { status: "unknown" };
      }
      if (result.status === "rejected") {
        const reason = safeCode.test(result.reason) ? result.reason : "rejected";
        if (result.retryable) {
          const last = c.job.attempts >= c.job.maxAttempts;
          await put(sending, { status: last ? "failed" : "queued", lastError: reason });
          throw new JobExecutionError({ code: "transient", retryable: true });
        }
        await put(sending, { status: "failed", lastError: reason });
        throw new JobExecutionError({ code: "permanent", retryable: false });
      }
      if (result.status !== "accepted" || !result.providerMessageId) {
        await hold(sending);
        throw new JobExecutionError({ code: "delivery_unknown", retryable: false });
      }
      const sentAt = now().toISOString();
      const sent = await repo.upsertMessage({
        organizationId: c.organizationId,
        id: `${item.id}-sent`,
        mailboxId: box.id,
        threadId: null,
        providerMessageKey: result.providerMessageId,
        messageIdHeader: null,
        inReplyTo: null,
        references: [],
        subject: draft.subject,
        from: draft.from,
        to: draft.to,
        cc: draft.cc,
        bcc: draft.bcc,
        sentAt,
        receivedAt: null,
        folder: "sent",
        summary: draft.summary,
        bodyRef: draft.bodyRef,
      });
      for (const a of data.attachments.filter((x) => x.messageId === draft.id)) {
        await repo.putAttachment({ ...a, id: `${a.id}-sent`, messageId: sent.id });
      }
      // Q8: the Sent copy stays private (upsertMessage forces sharedByOwner=false).
      await createMailService(
        {
          orgId: c.organizationId,
          userId: box.ownerUserId,
          orgSlug: "",
          orgName: "",
          role: "member",
        } as OrgContext,
        options,
      ).linkParticipants(sent.id);
      await put(sending, { status: "sent", lastError: null });
    },
  };
}
