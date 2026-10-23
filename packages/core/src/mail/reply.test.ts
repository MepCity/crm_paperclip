import { describe, expect, it } from "vitest";
import {
  forwardRecipients,
  forwardSubject,
  INTERIM_REPLY_ATTRIBUTION,
  normalizeSubject,
  quotePlainText,
  replyHeaders,
  replyRecipients,
  replySubject,
} from "./reply";
import type { MailMessage } from "./types";

describe("mail reply helpers", () => {
  describe("normalizeSubject", () => {
    it("returns empty string for empty or missing subject", () => {
      expect(normalizeSubject("")).toBe("");
      expect(normalizeSubject("   ")).toBe("");
      expect(normalizeSubject(null)).toBe("");
      expect(normalizeSubject(undefined)).toBe("");
    });

    it("leaves subjects without reply/forward prefixes unchanged (trimmed)", () => {
      expect(normalizeSubject("Hello world")).toBe("Hello world");
      expect(normalizeSubject("  Project status update  ")).toBe("Project status update");
    });

    it("does not strip words that happen to start with re or fw", () => {
      expect(normalizeSubject("Regarding the contract")).toBe("Regarding the contract");
      expect(normalizeSubject("Forward looking statements")).toBe("Forward looking statements");
      expect(normalizeSubject("Reply to inquiry")).toBe("Reply to inquiry");
      expect(normalizeSubject("Framework architecture")).toBe("Framework architecture");
    });

    it("strips standard Re: and Fwd: prefixes case-insensitively", () => {
      expect(normalizeSubject("Re: Proposal")).toBe("Proposal");
      expect(normalizeSubject("RE: Proposal")).toBe("Proposal");
      expect(normalizeSubject("re: Proposal")).toBe("Proposal");
      expect(normalizeSubject("Fwd: Proposal")).toBe("Proposal");
      expect(normalizeSubject("FW: Proposal")).toBe("Proposal");
      expect(normalizeSubject("Fw: Proposal")).toBe("Proposal");
      expect(normalizeSubject("fwd: Proposal")).toBe("Proposal");
      expect(normalizeSubject("fw: Proposal")).toBe("Proposal");
    });

    it("handles variations in whitespace around prefixes", () => {
      expect(normalizeSubject("Re:   Proposal")).toBe("Proposal");
      expect(normalizeSubject("RE : Proposal")).toBe("Proposal");
      expect(normalizeSubject("  Fwd:   Proposal   ")).toBe("Proposal");
    });

    it("strips numbered prefixes such as Re[2]:, Re[10]:, Fwd[3]:", () => {
      expect(normalizeSubject("Re[2]: Contract review")).toBe("Contract review");
      expect(normalizeSubject("RE[10]: Contract review")).toBe("Contract review");
      expect(normalizeSubject("Fwd[3]: Contract review")).toBe("Contract review");
      expect(normalizeSubject("Fw[2]: Contract review")).toBe("Contract review");
      expect(normalizeSubject("Re [2]: Contract review")).toBe("Contract review");
    });

    it("strips stacked prefixes of mixed types and cases", () => {
      const stacked = "Re: Fwd: RE: Fw: Re[2]: FW: Final deliverable";
      expect(normalizeSubject(stacked)).toBe("Final deliverable");
    });

    it("strips prefixes with no whitespace between them", () => {
      expect(normalizeSubject("Re:Re:Fwd:Subject")).toBe("Subject");
    });

    it("returns empty string if subject consists only of prefixes", () => {
      expect(normalizeSubject("Re:")).toBe("");
      expect(normalizeSubject("Re: Fwd: FW:")).toBe("");
    });
  });

  describe("replySubject & forwardSubject", () => {
    it("prefixes normalized subject with 'Re: ' without stacking", () => {
      expect(replySubject("New deal")).toBe("Re: New deal");
      expect(replySubject("Re: New deal")).toBe("Re: New deal");
      expect(replySubject("RE: Re[2]: New deal")).toBe("Re: New deal");
      expect(replySubject("Fwd: New deal")).toBe("Re: New deal");
    });

    it("prefixes normalized subject with 'Fwd: ' without stacking", () => {
      expect(forwardSubject("New deal")).toBe("Fwd: New deal");
      expect(forwardSubject("Fwd: New deal")).toBe("Fwd: New deal");
      expect(forwardSubject("FW: Fwd[2]: New deal")).toBe("Fwd: New deal");
      expect(forwardSubject("Re: New deal")).toBe("Fwd: New deal");
    });

    it("switching between reply and forward does not stack", () => {
      const replied = replySubject("Meeting notes");
      expect(replied).toBe("Re: Meeting notes");

      const forwarded = forwardSubject(replied);
      expect(forwarded).toBe("Fwd: Meeting notes");

      const repliedAgain = replySubject(forwarded);
      expect(repliedAgain).toBe("Re: Meeting notes");
    });
  });

  describe("replyHeaders", () => {
    it("returns inReplyTo = messageIdHeader and references including original messageIdHeader", () => {
      const headers = replyHeaders({
        messageIdHeader: "<msg-101@mail.example.com>",
        references: ["<msg-100@mail.example.com>"],
      });

      expect(headers.inReplyTo).toBe("<msg-101@mail.example.com>");
      expect(headers.references).toEqual([
        "<msg-100@mail.example.com>",
        "<msg-101@mail.example.com>",
      ]);
    });

    it("initializes references with messageIdHeader when original references is empty", () => {
      const headers = replyHeaders({
        messageIdHeader: "<msg-101@mail.example.com>",
        references: [],
      });

      expect(headers.inReplyTo).toBe("<msg-101@mail.example.com>");
      expect(headers.references).toEqual(["<msg-101@mail.example.com>"]);
    });

    it("handles missing or empty messageIdHeader: inReplyTo null and references unchanged", () => {
      const headersNull = replyHeaders({
        messageIdHeader: null,
        references: ["<ref-1@example.com>", "<ref-2@example.com>"],
      });

      expect(headersNull.inReplyTo).toBeNull();
      expect(headersNull.references).toEqual(["<ref-1@example.com>", "<ref-2@example.com>"]);

      const headersEmpty = replyHeaders({
        messageIdHeader: "   ",
        references: ["<ref-1@example.com>"],
      });

      expect(headersEmpty.inReplyTo).toBeNull();
      expect(headersEmpty.references).toEqual(["<ref-1@example.com>"]);
    });

    it("deduplicates references while preserving original order", () => {
      const headers = replyHeaders({
        messageIdHeader: "<msg-2@mail.example.com>",
        references: [
          "<msg-1@mail.example.com>",
          "<msg-2@mail.example.com>",
          "<msg-1@mail.example.com>",
        ],
      });

      expect(headers.inReplyTo).toBe("<msg-2@mail.example.com>");
      expect(headers.references).toEqual(["<msg-1@mail.example.com>", "<msg-2@mail.example.com>"]);
    });

    it("caps references to the last 20 ids when combined list exceeds 20", () => {
      const longReferences = Array.from({ length: 25 }, (_, i) => `<id-${i + 1}@example.com>`);
      const headers = replyHeaders({
        messageIdHeader: "<id-26@example.com>",
        references: longReferences,
      });

      expect(headers.inReplyTo).toBe("<id-26@example.com>");
      expect(headers.references).toHaveLength(20);
      // The last 20 ids should be id-7 through id-26
      expect(headers.references[0]).toBe("<id-7@example.com>");
      expect(headers.references[19]).toBe("<id-26@example.com>");
    });
  });

  describe("replyRecipients", () => {
    const baseMessage: Pick<MailMessage, "from" | "to" | "cc" | "bcc" | "folder"> = {
      folder: "inbox",
      from: [{ address: "customer@example.com", name: "Customer Name" }],
      to: [{ address: "agent@crm.example.com", name: "Agent Name" }],
      cc: [{ address: "manager@crm.example.com", name: "Manager" }],
      bcc: [{ address: "secret-audit@crm.example.com", name: "Secret" }],
    };

    it("reply mode on inbound message sets to = original from and cc = []", () => {
      const recipients = replyRecipients(baseMessage, "agent@crm.example.com", "reply");

      expect(recipients.to).toEqual([{ address: "customer@example.com", name: "Customer Name" }]);
      expect(recipients.cc).toEqual([]);
      expect(recipients.bcc).toEqual([]);
    });

    it("reply_all mode on inbound message sets to = original from, cc = original to + cc minus new to and minus ownAddress", () => {
      const recipients = replyRecipients(baseMessage, "agent@crm.example.com", "reply_all");

      expect(recipients.to).toEqual([{ address: "customer@example.com", name: "Customer Name" }]);
      // original to was agent@crm.example.com (ownAddress, removed)
      // original cc was manager@crm.example.com (kept)
      expect(recipients.cc).toEqual([{ address: "manager@crm.example.com", name: "Manager" }]);
      expect(recipients.bcc).toEqual([]);
    });

    it("never includes original bcc recipients in reply or reply_all", () => {
      const reply = replyRecipients(baseMessage, "agent@crm.example.com", "reply");
      const replyAll = replyRecipients(baseMessage, "agent@crm.example.com", "reply_all");

      const allReplyRecipients = [...reply.to, ...reply.cc, ...reply.bcc];
      const allReplyAllRecipients = [...replyAll.to, ...replyAll.cc, ...replyAll.bcc];

      expect(allReplyRecipients.some((r) => r.address === "secret-audit@crm.example.com")).toBe(
        false,
      );
      expect(allReplyAllRecipients.some((r) => r.address === "secret-audit@crm.example.com")).toBe(
        false,
      );
    });

    it("self-sent reply (folder: sent) sets to = original to", () => {
      const sentMessage: Pick<MailMessage, "from" | "to" | "cc" | "bcc" | "folder"> = {
        folder: "sent",
        from: [{ address: "agent@crm.example.com", name: "Agent" }],
        to: [{ address: "client@example.com", name: "Client" }],
        cc: [{ address: "boss@example.com", name: "Boss" }],
        bcc: [],
      };

      const reply = replyRecipients(sentMessage, "agent@crm.example.com", "reply");
      expect(reply.to).toEqual([{ address: "client@example.com", name: "Client" }]);
      expect(reply.cc).toEqual([]);

      const replyAll = replyRecipients(sentMessage, "agent@crm.example.com", "reply_all");
      expect(replyAll.to).toEqual([{ address: "client@example.com", name: "Client" }]);
      expect(replyAll.cc).toEqual([{ address: "boss@example.com", name: "Boss" }]);
    });

    it("self-sent reply detected by from matching ownAddress even if folder is inbox", () => {
      const sentMessage: Pick<MailMessage, "from" | "to" | "cc" | "bcc" | "folder"> = {
        folder: "inbox",
        from: [{ address: "agent@crm.example.com", name: "Agent" }],
        to: [{ address: "client@example.com", name: "Client" }],
        cc: [],
        bcc: [],
      };

      const reply = replyRecipients(sentMessage, "agent@crm.example.com", "reply");
      expect(reply.to).toEqual([{ address: "client@example.com", name: "Client" }]);
    });

    it("self-sent reply removes ownAddress from to if other recipients exist", () => {
      const sentMessage: Pick<MailMessage, "from" | "to" | "cc" | "bcc" | "folder"> = {
        folder: "sent",
        from: [{ address: "agent@crm.example.com", name: "Agent" }],
        to: [
          { address: "agent@crm.example.com", name: "Agent" },
          { address: "client@example.com", name: "Client" },
        ],
        cc: [],
        bcc: [],
      };

      const reply = replyRecipients(sentMessage, "agent@crm.example.com", "reply");
      expect(reply.to).toEqual([{ address: "client@example.com", name: "Client" }]);
    });

    it("self-sent note to self retains ownAddress when no other recipients exist", () => {
      const selfNote: Pick<MailMessage, "from" | "to" | "cc" | "bcc" | "folder"> = {
        folder: "sent",
        from: [{ address: "agent@crm.example.com", name: "Agent" }],
        to: [{ address: "agent@crm.example.com", name: "Agent" }],
        cc: [],
        bcc: [],
      };

      const reply = replyRecipients(selfNote, "agent@crm.example.com", "reply");
      expect(reply.to).toEqual([{ address: "agent@crm.example.com", name: "Agent" }]);
    });

    it("deduplicates recipients case-insensitively and keeps the first display name", () => {
      const messageWithDupes: Pick<MailMessage, "from" | "to" | "cc" | "bcc" | "folder"> = {
        folder: "inbox",
        from: [{ address: "sender@example.com", name: "Original Sender" }],
        to: [
          { address: "agent@crm.example.com" },
          { address: "colleague@example.com", name: "First Display Name" },
        ],
        cc: [
          { address: "COLLEAGUE@example.com", name: "Second Display Name" },
          { address: "other@example.com" },
          { address: "OTHER@example.com", name: "Other Found Later" },
        ],
        bcc: [],
      };

      const replyAll = replyRecipients(messageWithDupes, "agent@crm.example.com", "reply_all");

      expect(replyAll.cc).toEqual([
        { address: "colleague@example.com", name: "First Display Name" },
        { address: "other@example.com", name: "Other Found Later" },
      ]);
    });
  });

  describe("forwardRecipients", () => {
    it("returns empty to, cc, and bcc arrays", () => {
      expect(forwardRecipients()).toEqual({
        to: [],
        cc: [],
        bcc: [],
      });
    });
  });

  describe("quotePlainText & INTERIM_REPLY_ATTRIBUTION", () => {
    it("exports INTERIM_REPLY_ATTRIBUTION constant", () => {
      expect(INTERIM_REPLY_ATTRIBUTION).toBe("On {date} UTC, {author} wrote:");
    });

    it("formats ISO date and time in UTC as YYYY-MM-DD HH:mm", () => {
      const quoted = quotePlainText("Hello world", {
        sentAt: "2026-10-22T02:05:00Z",
        fromName: "Alice Smith",
      });

      expect(quoted).toBe("On 2026-10-22 02:05 UTC, Alice Smith wrote:\n> Hello world");
    });

    it("correctly converts non-UTC offsets to UTC", () => {
      // 05:05 at +03:00 is 02:05 UTC
      const quoted = quotePlainText("Meeting confirmed", {
        sentAt: "2026-10-22T05:05:00+03:00",
        fromName: "Bob Jones",
      });

      expect(quoted).toBe("On 2026-10-22 02:05 UTC, Bob Jones wrote:\n> Meeting confirmed");
    });

    it("supports Date object for sentAt", () => {
      const date = new Date(Date.UTC(2026, 4, 15, 14, 30));
      const quoted = quotePlainText("Quoted body", {
        sentAt: date,
        fromName: "Charlie",
      });

      expect(quoted).toBe("On 2026-05-15 14:30 UTC, Charlie wrote:\n> Quoted body");
    });

    it("prefixes every line in multi-line body with '> '", () => {
      const body = "First line\nSecond line\n\nFourth line after blank";
      const quoted = quotePlainText(body, {
        sentAt: "2026-01-01T10:00:00Z",
        fromName: "Diana",
      });

      const expected = [
        "On 2026-01-01 10:00 UTC, Diana wrote:",
        "> First line",
        "> Second line",
        "> ",
        "> Fourth line after blank",
      ].join("\n");

      expect(quoted).toBe(expected);
    });

    it("handles fallback when fromName or sentAt is missing", () => {
      const withoutName = quotePlainText("Some text", {
        sentAt: "2026-10-22T02:05:00Z",
      });
      expect(withoutName).toBe("On 2026-10-22 02:05 UTC, someone wrote:\n> Some text");

      const withoutDate = quotePlainText("Some text", {
        fromName: "Alice",
      });
      expect(withoutDate).toBe("Alice wrote:\n> Some text");
    });
  });
});
