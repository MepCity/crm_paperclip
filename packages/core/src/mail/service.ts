import { NotFoundError } from "../errors";
import type { OrgContext } from "../tenancy/types";
import type {
  MailMessage,
  MailRecordLink,
  MailRecordModule,
  MailRepository,
  MailSnapshot,
  RecordAddressLookup,
} from "./types";

export interface MailServiceOptions {
  repository: MailRepository;
  recordAddressLookup: RecordAddressLookup;
  canReadRecord: (
    ctx: OrgContext,
    module: MailRecordModule,
    id: string,
  ) => boolean | Promise<boolean>;
}

export function normalizeMailAddress(address: string): string {
  return address.trim().toLowerCase();
}

/** User boundary: no admin bypass; mutations always require the mailbox owner. */
export function createMailService(context: OrgContext, options: MailServiceOptions) {
  const ctx = { ...context };
  async function snapshot(): Promise<MailSnapshot> {
    const source = await options.repository.read(ctx.orgId);
    // Defense in depth even when an adapter returns unrelated tenant rows.
    return {
      mailboxes: source.mailboxes.filter((r) => r.organizationId === ctx.orgId),
      threads: source.threads.filter((r) => r.organizationId === ctx.orgId),
      messages: source.messages.filter((r) => r.organizationId === ctx.orgId),
      attachments: source.attachments.filter((r) => r.organizationId === ctx.orgId),
      links: source.links.filter((r) => r.organizationId === ctx.orgId),
      outbox: source.outbox.filter((r) => r.organizationId === ctx.orgId),
    };
  }
  function owned(data: MailSnapshot, row: MailMessage) {
    return data.mailboxes.some((m) => m.id === row.mailboxId && m.ownerUserId === ctx.userId);
  }
  async function visibleLink(link: MailRecordLink) {
    return options.canReadRecord({ ...ctx }, link.module, link.recordId);
  }
  async function readable(data: MailSnapshot, row: MailMessage) {
    if (owned(data, row)) return true;
    if (!row.sharedByOwner || !data.mailboxes.some((m) => m.id === row.mailboxId)) return false;
    for (const link of data.links) {
      if (link.messageId === row.id && (await visibleLink(link))) return true;
    }
    return false;
  }
  async function requireMessage(id: string, ownerOnly = false) {
    const data = await snapshot();
    const row = data.messages.find((m) => m.id === id);
    if (!row || !(ownerOnly ? owned(data, row) : await readable(data, row))) {
      throw new NotFoundError();
    }
    return { data, row };
  }
  return {
    async getMessage(id: string) {
      return structuredClone((await requireMessage(id)).row);
    },
    async listMessages() {
      const data = await snapshot();
      const rows: MailMessage[] = [];
      for (const row of data.messages) if (await readable(data, row)) rows.push(row);
      return structuredClone(rows);
    },
    async listAttachments(messageId: string) {
      const { data } = await requireMessage(messageId);
      return structuredClone(data.attachments.filter((a) => a.messageId === messageId));
    },
    async listLinks(messageId: string) {
      const { data, row } = await requireMessage(messageId);
      const links: MailRecordLink[] = [];
      for (const link of data.links) {
        if (link.messageId === messageId && (owned(data, row) || (await visibleLink(link))))
          links.push(link);
      }
      return structuredClone(links);
    },
    async setShared(messageId: string, shared: boolean) {
      await requireMessage(messageId, true);
      await options.repository.setShared(ctx.orgId, messageId, shared);
    },
    async linkParticipants(messageId: string) {
      const { row } = await requireMessage(messageId, true);
      // ADR 0009 Topic 4 deliberately excludes BCC from automatic associations.
      const addresses = new Set(
        [...row.from, ...row.to, ...row.cc].map((p) => normalizeMailAddress(p.address)),
      );
      const matches = new Map<
        string,
        { module: MailRecordModule; recordId: string; ambiguous: boolean }
      >();
      for (const address of addresses) {
        const addressMatches = new Map<string, { module: MailRecordModule; recordId: string }>();
        for (const match of await options.recordAddressLookup.findByAddress(ctx.orgId, address)) {
          if (
            match.organizationId !== ctx.orgId ||
            normalizeMailAddress(match.address) !== address ||
            !["leads", "contacts", "accounts"].includes(match.module)
          )
            continue;
          addressMatches.set(JSON.stringify([match.module, match.recordId]), match);
        }
        for (const [key, match] of addressMatches) {
          matches.set(key, {
            module: match.module,
            recordId: match.recordId,
            ambiguous: addressMatches.size > 1 || matches.get(key)?.ambiguous === true,
          });
        }
      }
      const links: MailRecordLink[] = [];
      for (const match of matches.values()) {
        links.push(
          await options.repository.putLink({
            organizationId: ctx.orgId,
            messageId,
            module: match.module,
            recordId: match.recordId,
            source: "auto",
            ambiguous: match.ambiguous,
          }),
        );
      }
      return links;
    },
    async linkRecord(messageId: string, module: MailRecordModule, recordId: string) {
      await requireMessage(messageId, true);
      if (!(await options.canReadRecord({ ...ctx }, module, recordId))) throw new NotFoundError();
      return options.repository.putLink({
        organizationId: ctx.orgId,
        messageId,
        module,
        recordId,
        source: "manual",
        ambiguous: false,
      });
    },
    async unlinkRecord(messageId: string, module: MailRecordModule, recordId: string) {
      await requireMessage(messageId, true);
      await options.repository.removeLink(ctx.orgId, messageId, module, recordId);
    },
  };
}
