import { describe, expect, it } from "vitest";
import { splitQuotedReply } from "./quoted-reply";
import { quotePlainText } from "./reply";

describe("splitQuotedReply", () => {
  describe("pattern (a): interim reply attribution and quotePlainText round-trip", () => {
    it("round-trips with quotePlainText containing sentAt and fromName", () => {
      const originalBody = "Hello Alice,\nCan we schedule a call tomorrow?\nThanks,\nBob";
      const attribution = {
        sentAt: "2026-10-23T02:00:00Z",
        fromName: "Bob Smith",
      };
      const quoted = quotePlainText(originalBody, attribution);
      const newReply = "Hi Bob,\nTomorrow at 10 AM UTC works perfectly for me.";
      const email = `${newReply}\n\n${quoted}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(newReply);
      expect(result.quoted).toBe(quoted);
    });

    it("round-trips with quotePlainText containing sentAt only", () => {
      const originalBody = "Project proposal draft attached.";
      const attribution = {
        sentAt: "2026-10-23T08:30:00Z",
      };
      const quoted = quotePlainText(originalBody, attribution);
      const newReply = "Received, reviewing now.";
      const email = `${newReply}\n\n${quoted}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(newReply);
      expect(result.quoted).toBe(quoted);
    });

    it("round-trips with quotePlainText containing fromName only", () => {
      const originalBody = "Status update on the launch.";
      const attribution = {
        fromName: "Alice Walker",
      };
      const quoted = quotePlainText(originalBody, attribution);
      const newReply = "Thank you for the update.";
      const email = `${newReply}\n\n${quoted}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(newReply);
      expect(result.quoted).toBe(quoted);
    });

    it("round-trips with quotePlainText with empty attribution options", () => {
      const originalBody = "Notes from yesterday.";
      const quoted = quotePlainText(originalBody, {});
      const newReply = "Thanks!";
      const email = `${newReply}\n\n${quoted}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(newReply);
      expect(result.quoted).toBe(quoted);
    });

    it("handles email containing only the quoted reply (no latest text)", () => {
      const originalBody = "Initial outreach message.";
      const quoted = quotePlainText(originalBody, {
        sentAt: "2026-10-20T12:00:00Z",
        fromName: "Sales Team",
      });

      const result = splitQuotedReply(quoted);
      expect(result.latest).toBe("");
      expect(result.quoted).toBe(quoted);
    });
  });

  describe("pattern (b): general English 'On … wrote:'", () => {
    it("splits single-line standard client attribution", () => {
      const latest = "Thanks for the swift response.";
      const attributionLine = "On Thu, Oct 22, 2026 at 10:00 AM Alice <alice@example.com> wrote:";
      const quoteContent = "> Here are the revised contract terms.";
      const email = `${latest}\n\n${attributionLine}\n${quoteContent}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(`${attributionLine}\n${quoteContent}`);
    });

    it("splits single-line alternative date/time formats", () => {
      const latest = "I agree with these points.";
      const quote = "On 2026-10-22 at 14:30, John Doe wrote:\n> Let's proceed with option B.";
      const email = `${latest}\n\n${quote}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(quote);
    });

    it("splits attribution wrapped across two lines (date then author/wrote)", () => {
      const latest = "Acknowledged.";
      const line1 = "On Thu, Oct 22, 2026 at 10:00 AM";
      const line2 = "Alice <alice@example.com> wrote:";
      const quoteBody = "> Can we confirm the venue?";
      const email = `${latest}\n\n${line1}\n${line2}\n${quoteBody}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(`${line1}\n${line2}\n${quoteBody}`);
    });

    it("splits attribution wrapped across two lines (author then wrote:)", () => {
      const latest = "Great work everyone.";
      const line1 = "On Thu, Oct 22, 2026 at 10:00 AM Alice <alice@example.com>";
      const line2 = "wrote:";
      const quoteBody = "> Milestone 1 has been completed.";
      const email = `${latest}\n\n${line1}\n${line2}\n${quoteBody}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(`${line1}\n${line2}\n${quoteBody}`);
    });
  });

  describe("pattern (c): Turkish attributions", () => {
    it("splits '… tarihinde … şunu yazdı:' format", () => {
      const latest = "Harika, teşekkürler.";
      const quote =
        "22 Eki 2026 Per, 14:30 tarihinde Alice <alice@example.com> şunu yazdı:\n> Merhaba, toplantı saatini onaylar mısınız?";
      const email = `${latest}\n\n${quote}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(quote);
    });

    it("splits '… tarihinde … yazdı:' format", () => {
      const latest = "Anlaştık.";
      const quote =
        "22 Ekim 2026 tarihinde Ahmet Yılmaz yazdı:\n> Teklifi güncelledim, inceleyebilirsiniz.";
      const email = `${latest}\n\n${quote}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(quote);
    });

    it("splits '… yazdı:' format without date", () => {
      const latest = "Tamamdır, iyi çalışmalar.";
      const quote = "Ahmet Yılmaz yazdı:\n> Yarın sabah görüşürüz.";
      const email = `${latest}\n\n${quote}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(quote);
    });

    it("splits Turkish attribution split across two lines", () => {
      const latest = "Bilgi için teşekkürler.";
      const line1 = "22 Eki 2026 tarihinde";
      const line2 = "Ahmet Yılmaz şunu yazdı:";
      const quoteBody = "> Rapor ektedir.";
      const email = `${latest}\n\n${line1}\n${line2}\n${quoteBody}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(`${line1}\n${line2}\n${quoteBody}`);
    });
  });

  describe("pattern (d): original message headers", () => {
    it("splits '-----Original Message-----'", () => {
      const latest = "Approved from my end.";
      const quote =
        "-----Original Message-----\nFrom: Alice Smith\nSent: Thursday, October 22, 2026 10:00 AM\nTo: Bob Jones\nSubject: Budget Q4\n\nPlease approve the Q4 budget.";
      const email = `${latest}\n\n${quote}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(quote);
    });

    it("splits '-------- Original Message --------'", () => {
      const latest = "Looks good.";
      const quote =
        "-------- Original Message --------\nFrom: Charlie Brown\nDate: 2026-10-22\n\nContract signed.";
      const email = `${latest}\n\n${quote}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(quote);
    });

    it("splits '----- Original Message -----' with spaces", () => {
      const latest = "Will check.";
      const quote = "----- Original Message -----\nFrom: Dave\nTo: Team\n\nMeeting postponed.";
      const email = `${latest}\n\n${quote}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(quote);
    });
  });

  describe("pattern (e): trailing block of consecutive lines starting with '>'", () => {
    it("splits trailing block of '>' lines when there is no attribution header", () => {
      const latest = "Sounds good, see you there!";
      const quote = "> Can we meet at the lobby at 9am?\n> Bring the presentation slides.";
      const email = `${latest}\n\n${quote}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(quote);
    });

    it("splits trailing block with empty line inside quoted paragraphs", () => {
      const latest = "Confirmed.";
      const quote = "> First quoted paragraph.\n>\n> Second quoted paragraph.";
      const email = `${latest}\n\n${quote}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(quote);
    });

    it("handles body containing only '>' lines", () => {
      const quote = "> Quoted line 1\n> Quoted line 2";

      const result = splitQuotedReply(quote);
      expect(result.latest).toBe("");
      expect(result.quoted).toBe(quote);
    });
  });

  describe("inline replies and forward preservation", () => {
    it("preserves inline quotes in latest when followed by reply text", () => {
      const email =
        "> Can we meet at 3pm?\nYes, 3pm works for me.\n\n> Should I bring the laptop?\nNo need, I have mine.";

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(email);
      expect(result.quoted).toBe("");
    });

    it("preserves inline replies while splitting the trailing quote block", () => {
      const latest = "> Question 1\nAnswer 1\n\n> Question 2\nAnswer 2";
      const trailingQuote = "> Previous conversation history\n> From last week";
      const email = `${latest}\n\n${trailingQuote}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(trailingQuote);
    });

    it("does not split forwarded messages ('---------- Forwarded message ---------')", () => {
      const email =
        "FYI, see the forwarded email below:\n\n---------- Forwarded message ---------\nFrom: supplier@example.com\nDate: Wed, Oct 21, 2026 at 3:00 PM\nSubject: Invoice #9981\nTo: accounting@example.com\n\nPlease find the invoice attached.\n> Note: payment due in 30 days.";

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(email);
      expect(result.quoted).toBe("");
    });

    it("does not split alternative forwarded message header ('----- Forwarded Message -----')", () => {
      const email =
        "Forwarding this for reference:\n\n----- Forwarded Message -----\nFrom: client@example.com\nSubject: Feedback\n\nAll deliverables accepted.";

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(email);
      expect(result.quoted).toBe("");
    });

    it("correctly splits reply above a forwarded message in quote", () => {
      const latest = "I agree with the forwarded notes.";
      const quote =
        "On 2026-10-23 UTC, Alice wrote:\n> Forwarding this:\n> ---------- Forwarded message ---------\n> From: Bob";
      const email = `${latest}\n\n${quote}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(quote);
    });
  });

  describe("text without quotes and edge cases", () => {
    it("leaves single-line text without quotes unchanged", () => {
      const text = "Hello world";
      const result = splitQuotedReply(text);
      expect(result.latest).toBe(text);
      expect(result.quoted).toBe("");
    });

    it("leaves multi-line text without quotes unchanged", () => {
      const text = "Line 1\nLine 2\nLine 3";
      const result = splitQuotedReply(text);
      expect(result.latest).toBe(text);
      expect(result.quoted).toBe("");
    });

    it("strips trailing blank lines from latest", () => {
      const email = "Hello there\n\n\n";
      const result = splitQuotedReply(email);
      expect(result.latest).toBe("Hello there");
      expect(result.quoted).toBe("");
    });

    it("handles empty input", () => {
      expect(splitQuotedReply("")).toEqual({ latest: "", quoted: "" });
      expect(splitQuotedReply("   ")).toEqual({ latest: "", quoted: "" });
      expect(splitQuotedReply("\n\n")).toEqual({ latest: "", quoted: "" });
      expect(splitQuotedReply("\r\n\r\n")).toEqual({ latest: "", quoted: "" });
      expect(splitQuotedReply(null as unknown as string)).toEqual({
        latest: "",
        quoted: "",
      });
      expect(splitQuotedReply(undefined as unknown as string)).toEqual({
        latest: "",
        quoted: "",
      });
    });
  });

  describe("CRLF line endings", () => {
    it("handles CRLF with standard reply quote", () => {
      const latest = "Reply line 1\r\nReply line 2";
      const quote = "On 2026-10-23 UTC, Alice wrote:\r\n> Quoted line 1\r\n> Quoted line 2";
      const email = `${latest}\r\n\r\n${quote}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(quote);
    });

    it("handles CRLF with original message header", () => {
      const latest = "Acknowledged.";
      const quote =
        "-----Original Message-----\r\nFrom: Bob\r\nSent: 2026-10-22\r\n\r\nOriginal text";
      const email = `${latest}\r\n\r\n${quote}`;

      const result = splitQuotedReply(email);
      expect(result.latest).toBe(latest);
      expect(result.quoted).toBe(quote);
    });

    it("handles CRLF without quotes", () => {
      const text = "Line 1\r\nLine 2\r\nLine 3";
      const result = splitQuotedReply(text);
      expect(result.latest).toBe(text);
      expect(result.quoted).toBe("");
    });
  });
});
