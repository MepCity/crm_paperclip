import type { OrgContext } from "@crm/core";
import { NotFoundError } from "@crm/core/errors";
import { createMailService, type MailServiceOptions } from "@crm/core/mail/service";
import type { MailParticipant } from "@crm/core/mail/types";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import type { EmailConversation, EmailFolder } from "@/modules/emails/inbox/view-model";
import { getMailState } from "./state";

export interface MailReadSource extends MailServiceOptions {
  /** Interim body/read-state adapter, consulted only after core authorizes a message. */
  readContent(messageId: string): Promise<{ body: string; unread: boolean }>;
}

async function fixtureSource(ctx: OrgContext): Promise<MailReadSource> {
  const { repository, content } = await getMailState(ctx);
  return {
    repository,
    recordAddressLookup: { findByAddress: async () => [] },
    async canReadRecord(actor, module, id) {
      try {
        await createFixtureRecordService(actor).get(
          { leads: "Leads", contacts: "Contacts", accounts: "Accounts" }[module] as
            | "Leads"
            | "Contacts"
            | "Accounts",
          id,
        );
        return true;
      } catch (error) {
        if (error instanceof NotFoundError) return false;
        throw error;
      }
    },
    async readContent(id) {
      return content.get(id) ?? { body: "", unread: false };
    },
  };
}

export const mailReadSource = { create: fixtureSource };

const address = (p: MailParticipant) => ({ name: p.name ?? "", address: p.address });
// Same decimal size convention as the record attachment formatter; no client component import.
const sizeLabel = (bytes: number) =>
  bytes < 1_000_000 ? `${(bytes / 1000).toFixed(1)} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`;

export async function listMailConversations(ctx: OrgContext, folder: EmailFolder) {
  const source = await mailReadSource.create(ctx);
  const snapshot = await source.repository.read(ctx.orgId);
  const connected = snapshot.mailboxes.some(
    (m) =>
      m.organizationId === ctx.orgId && m.ownerUserId === ctx.userId && m.status === "connected",
  );
  if (!connected) return { connected: false, data: [] };
  // Drafts and scheduled mail have no core read model in this slice.
  if (folder === "drafts" || folder === "scheduled") return { connected: true, data: [] };
  const service = createMailService(ctx, source);
  const groups = new Map<string, EmailConversation>();
  const rows = (await service.listMessages()).filter((m) => m.folder === folder);
  rows.sort(
    (a, b) =>
      Date.parse(a.sentAt ?? a.receivedAt ?? "1970-01-01T00:00:00Z") -
        Date.parse(b.sentAt ?? b.receivedAt ?? "1970-01-01T00:00:00Z") || a.id.localeCompare(b.id),
  );
  for (const row of rows) {
    const sender = row.from[0];
    if (!sender) throw new Error("Mail message is missing its sender.");
    const content = await source.readContent(row.id);
    // Separate singleton/thread keys avoid collisions; never combine different mailboxes.
    const key = JSON.stringify([
      row.mailboxId,
      row.threadId === null ? "message" : "thread",
      row.threadId ?? row.id,
    ]);
    const previous = groups.get(key);
    const message = {
      id: row.id,
      from: address(sender),
      to: row.to.map(address),
      cc: row.cc.map(address),
      date: row.sentAt ?? row.receivedAt ?? "1970-01-01T00:00:00Z",
      body: content.body,
      attachments: (await service.listAttachments(row.id)).map((a) => ({
        id: a.id,
        name: a.name,
        sizeLabel: sizeLabel(a.size),
      })),
    };
    groups.set(key, {
      id: row.threadId ?? row.id,
      folder,
      subject: row.subject,
      snippet: row.summary,
      unread: content.unread || (previous?.unread ?? false),
      messages: [...(previous?.messages ?? []), message],
    });
  }
  const data = [...groups.values()].sort((a, b) => {
    const latest = (c: EmailConversation) =>
      Date.parse(c.messages.at(-1)?.date ?? "1970-01-01T00:00:00Z");
    return latest(b) - latest(a) || a.id.localeCompare(b.id);
  });
  return { connected: true, data };
}
