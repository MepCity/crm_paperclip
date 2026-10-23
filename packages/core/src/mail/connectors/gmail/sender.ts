import { composeMime, type MimeAttachment } from "../../mime";
import type { MailSender, MailSendRequest, MailSendResult } from "../../outbox";
import type { MailParticipant } from "../../types";
import type { createGmailConnector } from "./gmail-connector";
import { ConnectorError, type ConnectorMailbox } from "./port";

export interface GmailMailSenderOptions {
  connector: ReturnType<typeof createGmailConnector>;
  /** Trusted tenant-scoped lookup; address must come from the authenticated mailbox. */
  resolveMailbox(
    organizationId: string,
    mailboxId: string,
  ): Promise<ConnectorMailbox & { address: string }>;
  /** Trusted content loader; resolves bodyRef and attachment blobRefs within this tenant. */
  loadContent(request: MailSendRequest): Promise<{
    text?: string;
    html?: string;
    attachments: MimeAttachment[];
  }>;
  recipientGuard(recipients: readonly MailParticipant[]): void;
}

/** No worker or real network wiring. BCC delivery awaits the provider-contract decision. */
export function createGmailMailSender(options: GmailMailSenderOptions): MailSender {
  const rejected = (reason: string, retryable = false): MailSendResult => ({
    status: "rejected",
    reason,
    retryable,
  });
  return {
    async send(request, signal) {
      if (signal?.aborted) return rejected("send_cancelled", true);
      const recipients = [...request.message.to, ...request.message.cc, ...request.message.bcc];
      try {
        options.recipientGuard(recipients);
      } catch {
        return rejected("recipient_not_allowed");
      }
      // Gmail has no separate envelope field. Never silently drop blind recipients.
      if (request.message.bcc.length) return rejected("bcc_delivery_unavailable");
      let mailbox: Awaited<ReturnType<GmailMailSenderOptions["resolveMailbox"]>>;
      let content: Awaited<ReturnType<GmailMailSenderOptions["loadContent"]>>;
      try {
        mailbox = await options.resolveMailbox(request.organizationId, request.mailboxId);
        if (mailbox.organizationId !== request.organizationId || mailbox.id !== request.mailboxId) {
          return rejected("mailbox_unavailable");
        }
        content = await options.loadContent(request);
      } catch {
        return rejected("content_unavailable", true);
      }
      let raw: string;
      try {
        raw = composeMime({
          from: { address: mailbox.address, name: request.message.from[0]?.name },
          to: request.message.to,
          cc: request.message.cc,
          subject: request.message.subject,
          text: content.text ?? (content.html === undefined ? request.message.summary : undefined),
          html: content.html,
          attachments: content.attachments,
        });
      } catch {
        return rejected("invalid_message");
      }
      if (signal?.aborted) return rejected("send_cancelled", true);
      try {
        const sent = await options.connector.sendRaw(mailbox, raw, signal);
        return { status: "accepted", providerMessageId: sent.providerMessageKey };
      } catch (error) {
        if (!(error instanceof ConnectorError)) return { status: "unknown" };
        return rejected(
          error.code === "permanent" ? "provider_rejected" : error.code,
          error.code === "retryable",
        );
      }
    },
  };
}
