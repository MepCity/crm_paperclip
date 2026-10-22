import { describe, expect, it } from "vitest";
import { MAX_INBOUND_ATTACHMENT_BYTES } from "../../types";
import {
  folderOf,
  type GmailMessage,
  type GmailPart,
  mapGmailMessage,
  parseAddressList,
} from "./mapping";

const msg = (
  over: Partial<GmailMessage> = {},
  headers: Record<string, string> = {},
): GmailMessage => ({
  id: "m1",
  threadId: "t1",
  labelIds: ["INBOX"],
  internalDate: "1700000000000",
  payload: {
    headers: Object.entries({ From: "a@x.io", ...headers }).map(([name, value]) => ({
      name,
      value,
    })),
  },
  ...over,
});
const withParts = (parts: GmailPart[]): GmailMessage =>
  msg({ payload: { headers: [{ name: "From", value: "a@x.io" }], parts } });
const att = (size: number, extra: Partial<GmailPart> = {}): GmailPart => ({
  filename: "f.bin",
  mimeType: "application/pdf",
  body: { attachmentId: "A1", size },
  ...extra,
});

describe("parseAddressList edge cases", () => {
  it("returns [] for undefined and empty input", () => {
    expect(parseAddressList(undefined)).toEqual([]);
    expect(parseAddressList("")).toEqual([]);
    expect(parseAddressList(" , ,")).toEqual([]);
  });
  it("keeps a comma inside a quoted display name", () => {
    expect(parseAddressList('"Doe, Jane" <Jane@X.io>, b@y.io')).toEqual([
      { address: "jane@x.io", name: "Doe, Jane" },
      { address: "b@y.io" },
    ]);
  });
  it("accepts bare addresses without angle brackets and lowercases them", () => {
    expect(parseAddressList("  Bob@Example.COM ")).toEqual([{ address: "bob@example.com" }]);
  });
  it("drops invalid entries", () => {
    expect(parseAddressList("not-an-address, c@d.io, x@y")).toEqual([{ address: "c@d.io" }]);
  });
  it("omits name when display part is empty or only quotes", () => {
    expect(parseAddressList('"" <a@b.io>, <c@d.io>')).toEqual([
      { address: "a@b.io" },
      { address: "c@d.io" },
    ]);
  });
  it("pins group syntax behaviour (group label glued to first address is dropped)", () => {
    // Current behaviour: "Team: a@b.io" is not a valid address and is skipped, later members survive.
    expect(parseAddressList("Team: a@b.io, c@d.io;")).toEqual([]);
  });
  it("pins RFC 2047 encoded names as raw text (not decoded)", () => {
    expect(parseAddressList("=?UTF-8?B?w4dhxJ/EsXI=?= <a@b.io>")).toEqual([
      { address: "a@b.io", name: "=?UTF-8?B?w4dhxJ/EsXI=?=" },
    ]);
  });
});

describe("folderOf", () => {
  it("maps INBOX and SENT, SENT wins when both present", () => {
    expect(folderOf(["INBOX"])).toBe("inbox");
    expect(folderOf(["SENT"])).toBe("sent");
    expect(folderOf(["INBOX", "SENT"])).toBe("sent");
  });
  it("returns null for other or missing labels", () => {
    expect(folderOf(["DRAFT", "TRASH", "SPAM"])).toBeNull();
    expect(folderOf([])).toBeNull();
    expect(folderOf(undefined)).toBeNull();
  });
  it("ignores extra labels next to INBOX", () => {
    expect(folderOf(["UNREAD", "INBOX", "CATEGORY_UPDATES"])).toBe("inbox");
  });
});

describe("mapGmailMessage edge cases", () => {
  it("returns null for non INBOX/SENT labels and when From is missing or invalid", () => {
    expect(mapGmailMessage("o", "mb", msg({ labelIds: ["DRAFT"] }))).toBeNull();
    expect(mapGmailMessage("o", "mb", msg({ payload: { headers: [] } }))).toBeNull();
    expect(mapGmailMessage("o", "mb", msg({}, { From: "garbage" }))).toBeNull();
  });
  it("pins RFC 2047 subjects as raw text (not decoded)", () => {
    const m = mapGmailMessage("o", "mb", msg({}, { Subject: "=?UTF-8?Q?T=C3=BCrk=C3=A7e?=" }));
    expect(m?.message.subject).toBe("=?UTF-8?Q?T=C3=BCrk=C3=A7e?=");
  });
  it("defaults empty subject, snippet and references", () => {
    const m = mapGmailMessage("o", "mb", msg());
    expect(m?.message.subject).toBe("");
    expect(m?.message.summary).toBe("");
    expect(m?.message.references).toEqual([]);
    expect(m?.message.messageIdHeader).toBeNull();
  });
  it("uses first of duplicate headers case-insensitively and splits references", () => {
    const m = mapGmailMessage("o", "mb", {
      ...msg(),
      payload: {
        headers: [
          { name: "FROM", value: "a@x.io" },
          { name: "from", value: "z@x.io" },
          { name: "References", value: "<1@x>  <2@x>\n <3@x>" },
        ],
      },
    });
    expect(m?.message.from).toEqual([{ address: "a@x.io" }]);
    expect(m?.message.references).toEqual(["<1@x>", "<2@x>", "<3@x>"]);
  });
  it("uses internalDate only; Date header is ignored", () => {
    const m = mapGmailMessage("o", "mb", msg({}, { Date: "Mon, 01 Jan 2001 00:00:00 +0000" }));
    expect(m?.message.receivedAt).toBe("2023-11-14T22:13:20.000Z");
    expect(m?.message.sentAt).toBeNull();
  });
  it("sets sentAt for SENT and null times when internalDate is missing or bad", () => {
    const sent = mapGmailMessage("o", "mb", msg({ labelIds: ["SENT"] }));
    expect(sent?.message.sentAt).toBe("2023-11-14T22:13:20.000Z");
    expect(sent?.message.receivedAt).toBeNull();
    const none = mapGmailMessage("o", "mb", msg({ internalDate: undefined }));
    // Pins current behaviour: Number(undefined) is NaN -> null.
    expect(none?.message.receivedAt).toBeNull();
    expect(mapGmailMessage("o", "mb", msg({ internalDate: "abc" }))?.message.receivedAt).toBeNull();
  });
  it("prefixes ids with the mailbox id", () => {
    const m = mapGmailMessage("o", "mb", msg());
    expect(m?.message.id).toBe("mb:m1");
    expect(m?.thread.id).toBe("mb:t1");
    expect(m?.message.threadId).toBe("mb:t1");
  });
});

describe("mapGmailMessage attachments", () => {
  it("stores an attachment exactly at the size limit", () => {
    const m = mapGmailMessage("o", "mb", withParts([att(MAX_INBOUND_ATTACHMENT_BYTES)]));
    expect(m?.attachments[0]).toMatchObject({
      storage: "stored",
      blobRef: "gmail-attachment:mb:m1:A1",
      size: MAX_INBOUND_ATTACHMENT_BYTES,
    });
  });
  it("does not store an attachment one byte over the limit", () => {
    const m = mapGmailMessage("o", "mb", withParts([att(MAX_INBOUND_ATTACHMENT_BYTES + 1)]));
    expect(m?.attachments[0]).toMatchObject({ storage: "not_stored", blobRef: null });
  });
  it("limit is 20 MiB", () => {
    expect(MAX_INBOUND_ATTACHMENT_BYTES).toBe(20 * 1024 * 1024);
  });
  it("finds attachments in nested multipart", () => {
    const nested: GmailPart = {
      mimeType: "multipart/mixed",
      parts: [
        {
          mimeType: "multipart/alternative",
          parts: [{ mimeType: "text/plain" }, { mimeType: "text/html" }],
        },
        {
          mimeType: "multipart/mixed",
          parts: [att(10, { filename: "deep.pdf", body: { attachmentId: "D", size: 10 } })],
        },
      ],
    };
    const m = mapGmailMessage("o", "mb", withParts([nested]));
    expect(m?.attachments.map((a) => a.name)).toEqual(["deep.pdf"]);
  });
  it("skips parts without filename or attachmentId (inline bodies)", () => {
    const m = mapGmailMessage(
      "o",
      "mb",
      withParts([
        { mimeType: "text/plain", body: { size: 5 } },
        { filename: "", mimeType: "image/png", body: { attachmentId: "X", size: 5 } },
        { filename: "inline.png", mimeType: "image/png", body: { size: 5 } },
      ]),
    );
    expect(m?.attachments).toEqual([]);
  });
  it("keeps inline images that carry a filename and attachmentId", () => {
    const m = mapGmailMessage(
      "o",
      "mb",
      withParts([
        att(5, {
          filename: "logo.png",
          mimeType: "image/png",
          headers: [{ name: "Content-Disposition", value: "inline" }],
        }),
      ]),
    );
    expect(m?.attachments).toHaveLength(1);
  });
  it("defaults content type and size", () => {
    const m = mapGmailMessage(
      "o",
      "mb",
      withParts([{ filename: "a", mimeType: "", body: { attachmentId: "Z" } }]),
    );
    expect(m?.attachments[0]).toMatchObject({
      contentType: "application/octet-stream",
      size: 0,
      storage: "stored",
    });
  });
});
