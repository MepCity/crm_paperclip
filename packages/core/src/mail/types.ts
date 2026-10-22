import { z } from "zod";

const id = z.string().min(1).max(256);
const instant = z.string().datetime({ offset: true });
export const mailFolderSchema = z.enum(["inbox", "sent", "draft"]);
export const mailRecordModuleSchema = z.enum(["leads", "contacts", "accounts", "deals"]);
export type MailFolder = z.infer<typeof mailFolderSchema>;
export type MailRecordModule = z.infer<typeof mailRecordModuleSchema>;
export const MAX_INBOUND_ATTACHMENT_BYTES = 20 * 1024 * 1024;

/** Strict schemas reject accidental credential-bearing input; only an opaque reference is allowed. */
export const mailboxAccountSchema = z
  .object({
    organizationId: id,
    id,
    ownerUserId: id,
    provider: z.enum(["google"]),
    status: z.enum(["connected", "error", "disconnected"]),
    credentialRef: id.nullable(),
    lastSyncAt: instant.nullable(),
    /** A safe public reason, never a raw provider error or secret. */
    lastError: z.string().nullable(),
    syncWindowDays: z.number().int().positive().default(30),
    folders: z.array(mailFolderSchema).min(1).default(["inbox", "sent"]),
  })
  .strict();
export type MailboxAccount = z.infer<typeof mailboxAccountSchema>;
export type CreateMailboxAccount = z.input<typeof mailboxAccountSchema>;

export const mailThreadSchema = z
  .object({
    organizationId: id,
    id,
    mailboxId: id,
    source: z.enum(["provider", "headers"]),
    providerThreadKey: id.nullable(),
  })
  .strict();
export type MailThread = z.infer<typeof mailThreadSchema>;

export const mailParticipantSchema = z
  .object({
    address: z.string().trim().email(),
    name: z.string().optional(),
  })
  .strict();
export type MailParticipant = z.infer<typeof mailParticipantSchema>;
export const mailMessageSchema = z
  .object({
    organizationId: id,
    id,
    mailboxId: id,
    threadId: id.nullable(),
    providerMessageKey: id,
    messageIdHeader: z.string().nullable(),
    inReplyTo: z.string().nullable(),
    references: z.array(z.string()),
    subject: z.string(),
    from: z.array(mailParticipantSchema).min(1),
    to: z.array(mailParticipantSchema),
    cc: z.array(mailParticipantSchema),
    bcc: z.array(mailParticipantSchema),
    sentAt: instant.nullable(),
    receivedAt: instant.nullable(),
    folder: mailFolderSchema,
    summary: z.string(),
    /** Private content-store reference; this module never fetches bytes. */
    bodyRef: id.nullable(),
    sharedByOwner: z.boolean().default(false),
  })
  .strict();
export type MailMessage = z.infer<typeof mailMessageSchema>;
export type UpsertMailMessage = z.input<typeof mailMessageSchema>;

export const mailAttachmentMetaSchema = z
  .object({
    organizationId: id,
    id,
    messageId: id,
    name: z.string().min(1),
    size: z.number().int().nonnegative(),
    contentType: z.string().min(1),
    storage: z.enum(["stored", "not_stored"]),
    blobRef: id.nullable(),
  })
  .strict()
  .refine(
    (row) =>
      row.storage === "stored"
        ? row.size <= MAX_INBOUND_ATTACHMENT_BYTES && row.blobRef !== null
        : row.blobRef === null,
    { message: "Invalid attachment storage metadata." },
  );
export type MailAttachmentMeta = z.infer<typeof mailAttachmentMetaSchema>;

export const mailRecordLinkSchema = z
  .object({
    organizationId: id,
    messageId: id,
    module: mailRecordModuleSchema,
    recordId: id,
    source: z.enum(["auto", "manual"]),
    ambiguous: z.boolean(),
  })
  .strict();
export type MailRecordLink = z.infer<typeof mailRecordLinkSchema>;

export const outboxItemSchema = z
  .object({
    organizationId: id,
    id,
    mailboxId: id,
    messageId: id,
    status: z.enum(["queued", "sending", "sent", "failed", "cancelled"]),
    attempts: z.number().int().nonnegative(),
    nextAttemptAt: instant.nullable(),
    /** A safe public reason, never a raw provider error or secret. */
    lastError: z.string().nullable(),
    scheduledAt: instant.nullable(),
  })
  .strict();
export type OutboxItem = z.infer<typeof outboxItemSchema>;

export interface MailSnapshot {
  mailboxes: readonly MailboxAccount[];
  threads: readonly MailThread[];
  messages: readonly MailMessage[];
  attachments: readonly MailAttachmentMeta[];
  links: readonly MailRecordLink[];
  outbox: readonly OutboxItem[];
}

/** Trusted connector/storage port; never expose directly to an HTTP caller. No persistence yet. */
export interface MailRepository {
  read(organizationId: string): Promise<MailSnapshot>;
  createMailbox(input: CreateMailboxAccount): Promise<MailboxAccount>;
  putThread(input: MailThread): Promise<MailThread>;
  /** Insert-only by tenant/mailbox/provider key. A replay returns the original unchanged. */
  upsertMessage(input: UpsertMailMessage): Promise<MailMessage>;
  putAttachment(input: MailAttachmentMeta): Promise<MailAttachmentMeta>;
  putOutboxItem(input: OutboxItem): Promise<OutboxItem>;
  setShared(organizationId: string, messageId: string, shared: boolean): Promise<void>;
  putLink(input: MailRecordLink): Promise<MailRecordLink>;
  removeLink(
    organizationId: string,
    messageId: string,
    module: MailRecordModule,
    recordId: string,
  ): Promise<void>;
}

export interface RecordAddressMatch {
  organizationId: string;
  module: MailRecordModule;
  recordId: string;
  address: string;
}
/** Return email-field matches only; service independently verifies tenant and exact address. */
export interface RecordAddressLookup {
  findByAddress(
    organizationId: string,
    normalizedAddress: string,
  ): Promise<readonly RecordAddressMatch[]>;
}
