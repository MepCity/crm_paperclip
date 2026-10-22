import { describe, expect, it } from "vitest";
import {
  MAX_INBOUND_ATTACHMENT_BYTES,
  mailAttachmentMetaSchema,
  mailMessageSchema,
} from "../../types";
import {
  folderOf,
  type GmailMessage,
  type GmailPart,
  mapGmailMessage,
  parseAddressList,
} from "./mapping";

const ORG_ID = "org-synthetic-test";
const MAILBOX_ID = "box-synthetic-test";

interface CreateMessageOptions {
  id?: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  headers?: { name: string; value: string }[];
  payload?: GmailPart;
}

function createGmailMessage(options: CreateMessageOptions = {}): GmailMessage {
  const id = options.id ?? "msg-edge-1";
  return {
    id,
    threadId: options.threadId ?? `thread-${id}`,
    labelIds: options.labelIds ?? ["INBOX"],
    snippet: options.snippet ?? "Synthetic snippet preview",
    internalDate: options.internalDate ?? "1760000000000",
    payload: options.payload ?? {
      headers: options.headers ?? [
        { name: "From", value: '"Alice Example" <alice@example.com>' },
        { name: "To", value: '"Bob Example" <bob@example.com>' },
        { name: "Subject", value: "Synthetic Edge Case Subject" },
        { name: "Message-ID", value: `<${id}@example.com>` },
      ],
    },
  };
}

describe("mapping edge cases", () => {
  describe("1. RFC 2047 encoded-word subject and display names", () => {
    // Note: mapping.ts does not decode RFC 2047 encoded words in headers.
    // It preserves the raw encoded-word text for both subject and display names.
    it("preserves raw RFC 2047 Base64 (B-encoded) subject and display names without decoding", () => {
      // "Toplantı özeti" in UTF-8 Base64
      const bEncodedSubject = "=?UTF-8?B?VG9wbGFudMSxIMO2emV0aQ==?=";
      // "Alice Example" in UTF-8 Base64
      const bEncodedFromName = "=?UTF-8?B?QWxpY2UgRXhhbXBsZQ==?=";
      // "Bob Example" in UTF-8 Base64
      const bEncodedToName = "=?UTF-8?B?Qm9iIEV4YW1wbGU=?=";

      const rawFrom = `${bEncodedFromName} <alice@example.com>`;
      const rawTo = `${bEncodedToName} <bob@example.com>`;

      // Verify parseAddressList keeps the raw encoded string as display name
      const parsedFrom = parseAddressList(rawFrom);
      expect(parsedFrom).toEqual([{ address: "alice@example.com", name: bEncodedFromName }]);

      const parsedTo = parseAddressList(rawTo);
      expect(parsedTo).toEqual([{ address: "bob@example.com", name: bEncodedToName }]);

      const gm = createGmailMessage({
        headers: [
          { name: "From", value: rawFrom },
          { name: "To", value: rawTo },
          { name: "Subject", value: bEncodedSubject },
          { name: "Message-ID", value: "<rfc2047-b@example.com>" },
        ],
      });

      const mapped = mapGmailMessage(ORG_ID, MAILBOX_ID, gm);
      expect(mapped).not.toBeNull();
      if (!mapped) return;

      expect(mapped.message.subject).toBe(bEncodedSubject);
      expect(mapped.message.from).toEqual([
        { address: "alice@example.com", name: bEncodedFromName },
      ]);
      expect(mapped.message.to).toEqual([{ address: "bob@example.com", name: bEncodedToName }]);

      expect(() => mailMessageSchema.parse(mapped.message)).not.toThrow();
    });

    it("preserves raw RFC 2047 Quoted-Printable (Q-encoded) subject and display names without decoding", () => {
      // "Café Meeting" in UTF-8 Quoted-Printable
      const qEncodedSubject = "=?UTF-8?Q?Caf=C3=A9_Meeting?=";
      // "Alice Example" in UTF-8 Quoted-Printable
      const qEncodedFromName = "=?UTF-8?Q?Alice_Example?=";
      // "Bob Example" in UTF-8 Quoted-Printable
      const qEncodedToName = "=?UTF-8?Q?Bob_Example?=";

      const rawFrom = `${qEncodedFromName} <alice@example.com>`;
      const rawTo = `${qEncodedToName} <bob@example.com>`;

      const parsedFrom = parseAddressList(rawFrom);
      expect(parsedFrom).toEqual([{ address: "alice@example.com", name: qEncodedFromName }]);

      const parsedTo = parseAddressList(rawTo);
      expect(parsedTo).toEqual([{ address: "bob@example.com", name: qEncodedToName }]);

      const gm = createGmailMessage({
        headers: [
          { name: "From", value: rawFrom },
          { name: "To", value: rawTo },
          { name: "Subject", value: qEncodedSubject },
          { name: "Message-ID", value: "<rfc2047-q@example.com>" },
        ],
      });

      const mapped = mapGmailMessage(ORG_ID, MAILBOX_ID, gm);
      expect(mapped).not.toBeNull();
      if (!mapped) return;

      expect(mapped.message.subject).toBe(qEncodedSubject);
      expect(mapped.message.from).toEqual([
        { address: "alice@example.com", name: qEncodedFromName },
      ]);
      expect(mapped.message.to).toEqual([{ address: "bob@example.com", name: qEncodedToName }]);

      expect(() => mailMessageSchema.parse(mapped.message)).not.toThrow();
    });
  });

  describe("2. Nested multipart/mixed -> multipart/alternative bodies", () => {
    // As mapping.ts documents, bodyRef is null and message body bytes are not fetched or stored.
    // Body parts in multipart/alternative (text/plain and text/html) lack filename and attachmentId,
    // so collectAttachments ignores them and only extracts real attachments.
    it("collects file attachments while ignoring body text/html parts and keeping bodyRef null", () => {
      const gm = createGmailMessage({
        id: "nested-mixed-alt",
        snippet: "This is a synthetic body preview snippet",
        payload: {
          mimeType: "multipart/mixed",
          headers: [
            { name: "From", value: '"Alice Example" <alice@example.com>' },
            { name: "To", value: "bob@example.com" },
            { name: "Subject", value: "Nested Multipart Message" },
            { name: "Message-ID", value: "<nested-1@example.com>" },
          ],
          parts: [
            {
              mimeType: "multipart/alternative",
              parts: [
                {
                  mimeType: "text/plain",
                  body: { size: 30 },
                },
                {
                  mimeType: "text/html",
                  body: { size: 85 },
                },
              ],
            },
            {
              filename: "report.pdf",
              mimeType: "application/pdf",
              body: { attachmentId: "att-pdf-1", size: 4096 },
            },
          ],
        },
      });

      const mapped = mapGmailMessage(ORG_ID, MAILBOX_ID, gm);
      expect(mapped).not.toBeNull();
      if (!mapped) return;

      // Summary is picked from snippet; bodyRef remains null
      expect(mapped.message.summary).toBe("This is a synthetic body preview snippet");
      expect(mapped.message.bodyRef).toBeNull();

      // Only the attachment part with filename and attachmentId is collected
      expect(mapped.attachments).toHaveLength(1);
      const att = mapped.attachments[0];
      expect(att).toMatchObject({
        organizationId: ORG_ID,
        id: `${MAILBOX_ID}:nested-mixed-alt:att-pdf-1`,
        messageId: `${MAILBOX_ID}:nested-mixed-alt`,
        name: "report.pdf",
        size: 4096,
        contentType: "application/pdf",
        storage: "stored",
        blobRef: `gmail-attachment:${MAILBOX_ID}:nested-mixed-alt:att-pdf-1`,
      });

      expect(() => mailMessageSchema.parse(mapped.message)).not.toThrow();
      expect(() => mailAttachmentMetaSchema.parse(att)).not.toThrow();
    });

    it("produces empty attachments list when nested multipart message contains only body alternatives", () => {
      const gm = createGmailMessage({
        id: "nested-no-attachments",
        snippet: "Plain alternative message",
        payload: {
          mimeType: "multipart/mixed",
          headers: [
            { name: "From", value: "alice@example.com" },
            { name: "To", value: "bob@example.com" },
            { name: "Subject", value: "No File Attachments" },
            { name: "Message-ID", value: "<no-files@example.com>" },
          ],
          parts: [
            {
              mimeType: "multipart/alternative",
              parts: [
                { mimeType: "text/plain", body: { size: 100 } },
                { mimeType: "text/html", body: { size: 250 } },
              ],
            },
          ],
        },
      });

      const mapped = mapGmailMessage(ORG_ID, MAILBOX_ID, gm);
      expect(mapped).not.toBeNull();
      if (!mapped) return;

      expect(mapped.attachments).toEqual([]);
      expect(mapped.message.bodyRef).toBeNull();
      expect(mapped.message.summary).toBe("Plain alternative message");
      expect(() => mailMessageSchema.parse(mapped.message)).not.toThrow();
    });

    it("recursively collects multiple attachments from deeply nested MIME subtrees", () => {
      const gm = createGmailMessage({
        id: "deeply-nested",
        payload: {
          mimeType: "multipart/mixed",
          headers: [
            { name: "From", value: "alice@example.com" },
            { name: "Subject", value: "Deeply Nested" },
          ],
          parts: [
            {
              mimeType: "multipart/related",
              parts: [
                {
                  mimeType: "multipart/alternative",
                  parts: [
                    { mimeType: "text/plain", body: { size: 12 } },
                    { mimeType: "text/html", body: { size: 45 } },
                  ],
                },
                {
                  filename: "inline-image.png",
                  mimeType: "image/png",
                  body: { attachmentId: "inline-1", size: 1024 },
                },
              ],
            },
            {
              filename: "contract.pdf",
              mimeType: "application/pdf",
              body: { attachmentId: "contract-1", size: 2048 },
            },
          ],
        },
      });

      const mapped = mapGmailMessage(ORG_ID, MAILBOX_ID, gm);
      expect(mapped).not.toBeNull();
      if (!mapped) return;

      expect(mapped.attachments.map((a) => a.name)).toEqual(["inline-image.png", "contract.pdf"]);
      expect(mapped.attachments.every((a) => a.storage === "stored")).toBe(true);
      for (const att of mapped.attachments) {
        expect(() => mailAttachmentMetaSchema.parse(att)).not.toThrow();
      }
    });
  });

  describe("3. Attachment exactly at 20 MiB and 20 MiB + 1 byte", () => {
    it("marks attachment exactly at 20 MiB as stored with locator blobRef", () => {
      const EXACT_LIMIT_BYTES = MAX_INBOUND_ATTACHMENT_BYTES; // 20 * 1024 * 1024 = 20,971,520 bytes
      const gm = createGmailMessage({
        id: "msg-exact-limit",
        payload: {
          headers: [
            { name: "From", value: "alice@example.com" },
            { name: "Subject", value: "Exact limit test" },
          ],
          parts: [
            {
              filename: "exact-20mib.dat",
              mimeType: "application/octet-stream",
              body: { attachmentId: "att-exact-limit", size: EXACT_LIMIT_BYTES },
            },
          ],
        },
      });

      const mapped = mapGmailMessage(ORG_ID, MAILBOX_ID, gm);
      expect(mapped).not.toBeNull();
      if (!mapped) return;

      expect(mapped.attachments).toHaveLength(1);
      const att = mapped.attachments[0];
      expect(att?.size).toBe(EXACT_LIMIT_BYTES);
      expect(att?.storage).toBe("stored");
      expect(att?.blobRef).toBe(`gmail-attachment:${MAILBOX_ID}:msg-exact-limit:att-exact-limit`);

      // Verify that this satisfies domain schema validation
      expect(() => mailAttachmentMetaSchema.parse(att)).not.toThrow();
    });

    it("marks attachment at 20 MiB + 1 byte as not_stored with null blobRef", () => {
      const OVER_LIMIT_BYTES = MAX_INBOUND_ATTACHMENT_BYTES + 1; // 20,971,521 bytes
      const gm = createGmailMessage({
        id: "msg-over-limit",
        payload: {
          headers: [
            { name: "From", value: "alice@example.com" },
            { name: "Subject", value: "Over limit test" },
          ],
          parts: [
            {
              filename: "over-20mib.dat",
              mimeType: "application/octet-stream",
              body: { attachmentId: "att-over-limit", size: OVER_LIMIT_BYTES },
            },
          ],
        },
      });

      const mapped = mapGmailMessage(ORG_ID, MAILBOX_ID, gm);
      expect(mapped).not.toBeNull();
      if (!mapped) return;

      expect(mapped.attachments).toHaveLength(1);
      const att = mapped.attachments[0];
      expect(att?.size).toBe(OVER_LIMIT_BYTES);
      expect(att?.storage).toBe("not_stored");
      expect(att?.blobRef).toBeNull();

      // Verify that this satisfies domain schema validation
      expect(() => mailAttachmentMetaSchema.parse(att)).not.toThrow();
    });

    it("handles both exact 20 MiB and over 20 MiB attachments in the same message", () => {
      const EXACT_LIMIT_BYTES = MAX_INBOUND_ATTACHMENT_BYTES;
      const OVER_LIMIT_BYTES = MAX_INBOUND_ATTACHMENT_BYTES + 1;

      const gm = createGmailMessage({
        id: "msg-both-limits",
        payload: {
          headers: [
            { name: "From", value: "alice@example.com" },
            { name: "Subject", value: "Both limits" },
          ],
          parts: [
            {
              filename: "exact.dat",
              mimeType: "application/octet-stream",
              body: { attachmentId: "att-exact", size: EXACT_LIMIT_BYTES },
            },
            {
              filename: "over.dat",
              mimeType: "application/octet-stream",
              body: { attachmentId: "att-over", size: OVER_LIMIT_BYTES },
            },
          ],
        },
      });

      const mapped = mapGmailMessage(ORG_ID, MAILBOX_ID, gm);
      expect(mapped).not.toBeNull();
      if (!mapped) return;

      expect(mapped.attachments).toHaveLength(2);
      expect(mapped.attachments[0]?.storage).toBe("stored");
      expect(mapped.attachments[0]?.blobRef).not.toBeNull();
      expect(mapped.attachments[1]?.storage).toBe("not_stored");
      expect(mapped.attachments[1]?.blobRef).toBeNull();

      for (const att of mapped.attachments) {
        expect(() => mailAttachmentMetaSchema.parse(att)).not.toThrow();
      }
    });
  });

  describe("4. Missing Message-ID / In-Reply-To headers and message with no subject", () => {
    it("maps missing Message-ID and In-Reply-To to null and missing subject to empty string", () => {
      const gm = createGmailMessage({
        id: "msg-missing-headers",
        headers: [
          { name: "From", value: '"Alice Example" <alice@example.com>' },
          { name: "To", value: "bob@example.com" },
          // Notice: Message-ID, In-Reply-To, References, and Subject are all intentionally omitted
        ],
      });

      const mapped = mapGmailMessage(ORG_ID, MAILBOX_ID, gm);
      expect(mapped).not.toBeNull();
      if (!mapped) return;

      expect(mapped.message.messageIdHeader).toBeNull();
      expect(mapped.message.inReplyTo).toBeNull();
      expect(mapped.message.references).toEqual([]);
      expect(mapped.message.subject).toBe("");

      // Validate against strict domain schema
      expect(() => mailMessageSchema.parse(mapped.message)).not.toThrow();
    });

    it("maps explicit empty Subject header value to empty string", () => {
      const gm = createGmailMessage({
        headers: [
          { name: "From", value: "alice@example.com" },
          { name: "Subject", value: "" },
        ],
      });

      const mapped = mapGmailMessage(ORG_ID, MAILBOX_ID, gm);
      expect(mapped).not.toBeNull();
      if (!mapped) return;

      expect(mapped.message.subject).toBe("");
      expect(() => mailMessageSchema.parse(mapped.message)).not.toThrow();
    });

    it("handles whitespace-only References header by producing an empty array", () => {
      const gm = createGmailMessage({
        headers: [
          { name: "From", value: "alice@example.com" },
          { name: "References", value: "   \t  \n  " },
        ],
      });

      const mapped = mapGmailMessage(ORG_ID, MAILBOX_ID, gm);
      expect(mapped).not.toBeNull();
      if (!mapped) return;

      expect(mapped.message.references).toEqual([]);
      expect(() => mailMessageSchema.parse(mapped.message)).not.toThrow();
    });
  });

  describe("5. Message carrying both INBOX and SENT labels", () => {
    // Current mapping.ts behaviour:
    // folderOf checks `labels?.includes("SENT")` first, then `labels?.includes("INBOX")`.
    // When both labels are present, SENT has priority and the message folder becomes "sent".
    it("folderOf decides 'sent' when both SENT and INBOX labels are present regardless of label order", () => {
      expect(folderOf(["INBOX", "SENT"])).toBe("sent");
      expect(folderOf(["SENT", "INBOX"])).toBe("sent");
      expect(folderOf(["UNREAD", "INBOX", "STARRED", "SENT"])).toBe("sent");
    });

    it("maps message with both INBOX and SENT labels to folder 'sent' with sentAt populated and receivedAt null", () => {
      const internalDate = "1760000000000";
      const expectedIso = new Date(Number(internalDate)).toISOString();

      const gmInboxSent = createGmailMessage({
        id: "msg-inbox-sent",
        labelIds: ["INBOX", "SENT"],
        internalDate,
      });

      const mappedInboxSent = mapGmailMessage(ORG_ID, MAILBOX_ID, gmInboxSent);
      expect(mappedInboxSent).not.toBeNull();
      if (!mappedInboxSent) return;

      expect(mappedInboxSent.message.folder).toBe("sent");
      expect(mappedInboxSent.message.sentAt).toBe(expectedIso);
      expect(mappedInboxSent.message.receivedAt).toBeNull();
      expect(() => mailMessageSchema.parse(mappedInboxSent.message)).not.toThrow();

      const gmSentInbox = createGmailMessage({
        id: "msg-sent-inbox",
        labelIds: ["SENT", "INBOX"],
        internalDate,
      });

      const mappedSentInbox = mapGmailMessage(ORG_ID, MAILBOX_ID, gmSentInbox);
      expect(mappedSentInbox).not.toBeNull();
      if (!mappedSentInbox) return;

      expect(mappedSentInbox.message.folder).toBe("sent");
      expect(mappedSentInbox.message.sentAt).toBe(expectedIso);
      expect(mappedSentInbox.message.receivedAt).toBeNull();
      expect(() => mailMessageSchema.parse(mappedSentInbox.message)).not.toThrow();
    });

    it("contrasts with single-label messages where INBOX sets receivedAt and SENT sets sentAt", () => {
      const internalDate = "1760000000000";
      const expectedIso = new Date(Number(internalDate)).toISOString();

      const gmInboxOnly = createGmailMessage({
        id: "msg-inbox-only",
        labelIds: ["INBOX"],
        internalDate,
      });
      const mappedInbox = mapGmailMessage(ORG_ID, MAILBOX_ID, gmInboxOnly);
      expect(mappedInbox?.message.folder).toBe("inbox");
      expect(mappedInbox?.message.receivedAt).toBe(expectedIso);
      expect(mappedInbox?.message.sentAt).toBeNull();

      const gmSentOnly = createGmailMessage({
        id: "msg-sent-only",
        labelIds: ["SENT"],
        internalDate,
      });
      const mappedSent = mapGmailMessage(ORG_ID, MAILBOX_ID, gmSentOnly);
      expect(mappedSent?.message.folder).toBe("sent");
      expect(mappedSent?.message.sentAt).toBe(expectedIso);
      expect(mappedSent?.message.receivedAt).toBeNull();
    });
  });
});
