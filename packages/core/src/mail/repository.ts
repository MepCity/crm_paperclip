import { ConflictError, NotFoundError, parseInput } from "../errors";
import {
  type MailRepository,
  type MailSnapshot,
  mailAttachmentMetaSchema,
  mailboxAccountSchema,
  mailMessageSchema,
  mailRecordLinkSchema,
  mailThreadSchema,
  outboxItemSchema,
} from "./types";

/** Process-local adapter. All returned rows are detached and all keys are tenant-leading. */
export function createInMemoryMailRepository(): MailRepository {
  const data: { [K in keyof MailSnapshot]: Array<MailSnapshot[K][number]> } = {
    mailboxes: [],
    threads: [],
    messages: [],
    attachments: [],
    links: [],
    outbox: [],
  };
  function mailbox(organizationId: string, id: string) {
    const row = data.mailboxes.find((m) => m.organizationId === organizationId && m.id === id);
    if (!row) throw new NotFoundError();
    return row;
  }
  function message(organizationId: string, id: string) {
    const row = data.messages.find((m) => m.organizationId === organizationId && m.id === id);
    if (!row) throw new NotFoundError();
    return row;
  }
  return {
    async read(organizationId) {
      return structuredClone({
        mailboxes: data.mailboxes.filter((r) => r.organizationId === organizationId),
        threads: data.threads.filter((r) => r.organizationId === organizationId),
        messages: data.messages.filter((r) => r.organizationId === organizationId),
        attachments: data.attachments.filter((r) => r.organizationId === organizationId),
        links: data.links.filter((r) => r.organizationId === organizationId),
        outbox: data.outbox.filter((r) => r.organizationId === organizationId),
      });
    },
    async createMailbox(input) {
      const row = parseInput(mailboxAccountSchema, input);
      if (
        data.mailboxes.some(
          (r) =>
            r.organizationId === row.organizationId &&
            (r.id === row.id || r.ownerUserId === row.ownerUserId),
        )
      ) {
        throw new ConflictError("A personal mailbox already exists.");
      }
      data.mailboxes.push(row);
      return structuredClone(row);
    },
    async putThread(input) {
      const row = parseInput(mailThreadSchema, input);
      mailbox(row.organizationId, row.mailboxId);
      const index = data.threads.findIndex(
        (r) => r.organizationId === row.organizationId && r.id === row.id,
      );
      if (index >= 0 && data.threads[index]?.mailboxId !== row.mailboxId) {
        throw new ConflictError("A thread cannot move between mailboxes.");
      }
      if (index < 0) data.threads.push(row);
      else data.threads[index] = row;
      return structuredClone(row);
    },
    async upsertMessage(input) {
      const row = parseInput(mailMessageSchema, input);
      mailbox(row.organizationId, row.mailboxId);
      const existing = data.messages.find(
        (r) =>
          r.organizationId === row.organizationId &&
          r.mailboxId === row.mailboxId &&
          r.providerMessageKey === row.providerMessageKey,
      );
      if (existing) return structuredClone(existing);
      if (data.messages.some((r) => r.organizationId === row.organizationId && r.id === row.id)) {
        throw new ConflictError("A message with this ID already exists.");
      }
      if (
        row.threadId !== null &&
        !data.threads.some(
          (r) =>
            r.organizationId === row.organizationId &&
            r.mailboxId === row.mailboxId &&
            r.id === row.threadId,
        )
      )
        throw new NotFoundError();
      // Only the owner action may publish mail; connector input cannot bypass Q8.
      row.sharedByOwner = false;
      data.messages.push(row);
      return structuredClone(row);
    },
    async putAttachment(input) {
      const row = parseInput(mailAttachmentMetaSchema, input);
      message(row.organizationId, row.messageId);
      const index = data.attachments.findIndex(
        (r) => r.organizationId === row.organizationId && r.id === row.id,
      );
      if (index >= 0 && data.attachments[index]?.messageId !== row.messageId) {
        throw new ConflictError("An attachment cannot move between messages.");
      }
      if (index < 0) data.attachments.push(row);
      else data.attachments[index] = row;
      return structuredClone(row);
    },
    async putOutboxItem(input) {
      const row = parseInput(outboxItemSchema, input);
      const parent = message(row.organizationId, row.messageId);
      if (parent.mailboxId !== row.mailboxId) throw new NotFoundError();
      const index = data.outbox.findIndex(
        (r) => r.organizationId === row.organizationId && r.id === row.id,
      );
      if (
        index >= 0 &&
        (data.outbox[index]?.messageId !== row.messageId ||
          data.outbox[index]?.mailboxId !== row.mailboxId)
      ) {
        throw new ConflictError("An outbox item cannot move between messages.");
      }
      if (index < 0) data.outbox.push(row);
      else data.outbox[index] = row;
      return structuredClone(row);
    },
    async setShared(organizationId, messageId, shared) {
      message(organizationId, messageId).sharedByOwner = shared;
    },
    async putLink(input) {
      const row = parseInput(mailRecordLinkSchema, input);
      message(row.organizationId, row.messageId);
      const index = data.links.findIndex(
        (r) =>
          r.organizationId === row.organizationId &&
          r.messageId === row.messageId &&
          r.module === row.module &&
          r.recordId === row.recordId,
      );
      // Automatic relinking must not replace a deliberate manual association.
      const existing = data.links[index];
      if (existing?.source === "manual" && row.source === "auto") {
        return structuredClone(existing);
      }
      if (index < 0) data.links.push(row);
      else data.links[index] = row;
      return structuredClone(row);
    },
    async removeLink(organizationId, messageId, module, recordId) {
      message(organizationId, messageId);
      const index = data.links.findIndex(
        (r) =>
          r.organizationId === organizationId &&
          r.messageId === messageId &&
          r.module === module &&
          r.recordId === recordId,
      );
      if (index >= 0) data.links.splice(index, 1);
    },
  };
}
