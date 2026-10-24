import type { ComposeMail } from "../../../../../../packages/core/src/mail/outbox";

export type ComposeMailInput = Omit<ComposeMail, "bodyRef"> & { body: string };
export interface MailComposePort {
  send(input: ComposeMailInput): Promise<{ id: string }>;
}
export type ComposeMailbox = { id: string; address: string; name?: string };

// Fixture-only configuration. Never reads a real mailbox or invokes a transport.
export const fixtureComposeMailboxes: readonly ComposeMailbox[] = [
  { id: "fixture-mailbox", address: "alex@example.com", name: "Alex Morgan" },
];
export const fixtureComposePort: MailComposePort = {
  async send(input) {
    return { id: input.idempotencyKey };
  },
};

// outbox.ts also imports server services. Keep its runtime graph out of the browser;
// a contract test pins this browser limit to MAX_OUTBOUND_ATTACHMENT_BYTES.
export const composeAttachmentByteLimit = 20 * 1024 * 1024;
