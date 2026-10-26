import type { OrgContext } from "@crm/core";
import { createInMemoryMailRepository } from "@crm/core/mail/repository";
import type { MailMessage } from "@crm/core/mail/types";

/** Synthetic, request-local staging data; never a connected provider account. */
export async function createMailSeed(ctx: OrgContext) {
  const repository = createInMemoryMailRepository();
  await repository.createMailbox({
    organizationId: ctx.orgId,
    id: "mailbox-demo",
    ownerUserId: ctx.userId,
    provider: "google",
    status: "connected",
    credentialRef: null,
    lastSyncAt: null,
    lastError: null,
  });
  await repository.putThread({
    organizationId: ctx.orgId,
    id: "thread-demo",
    mailboxId: "mailbox-demo",
    source: "headers",
    providerThreadKey: null,
  });
  const content = new Map<string, { body: string; unread: boolean }>();
  for (const [id, folder, date] of [
    ["message-demo-1", "inbox", "2026-01-01T10:00:00Z"],
    ["message-demo-2", "inbox", "2026-01-02T10:00:00Z"],
    ["message-demo-sent", "sent", "2026-01-03T10:00:00Z"],
  ] as const) {
    const row: MailMessage = {
      organizationId: ctx.orgId,
      id,
      mailboxId: "mailbox-demo",
      threadId: folder === "inbox" ? "thread-demo" : null,
      providerMessageKey: id,
      messageIdHeader: null,
      inReplyTo: null,
      references: [],
      subject: "Example conversation",
      summary: "Message preview.",
      from: [{ name: "Example Sender", address: "sender@example.test" }],
      to: [{ name: "Example Recipient", address: "recipient@example.test" }],
      cc: [],
      bcc: [],
      sentAt: date,
      receivedAt: date,
      folder,
      bodyRef: null,
      sharedByOwner: false,
    };
    await repository.upsertMessage(row);
    content.set(id, { body: "Message content.", unread: id === "message-demo-1" });
  }
  await repository.putAttachment({
    organizationId: ctx.orgId,
    id: "attachment-demo",
    messageId: "message-demo-1",
    name: "example.txt",
    size: 1200,
    contentType: "text/plain",
    storage: "not_stored",
    blobRef: null,
  });
  return { repository, content };
}
