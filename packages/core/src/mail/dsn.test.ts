import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseDeliveryStatus } from "./dsn";

const fixtureDir = path.resolve(import.meta.dirname, "../../test-fixtures/mail");

function readFixture(name: string): string {
  return readFileSync(path.join(fixtureDir, name), "utf8");
}

// ---------------------------------------------------------------------------
// Fixture 08 — real bounce DSN
// ---------------------------------------------------------------------------
describe("parseDeliveryStatus – fixture 08 (permanent bounce)", () => {
  const raw = readFixture("08-bounce-delivery-status.eml");
  const report = parseDeliveryStatus(raw);

  it("returns a non-null DeliveryReport", () => {
    expect(report).not.toBeNull();
  });

  it("extracts originalMessageId from message/rfc822 part", () => {
    expect(report?.originalMessageId).toBe("<orig-1@example.com>");
  });

  it("has exactly one recipient", () => {
    expect(report?.recipients).toHaveLength(1);
  });

  it("parses Final-Recipient address", () => {
    expect(report?.recipients[0]?.finalRecipient).toBe("nobody@example.org");
  });

  it("parses Action field", () => {
    expect(report?.recipients[0]?.action).toBe("failed");
  });

  it("parses Status field", () => {
    expect(report?.recipients[0]?.status).toBe("5.1.1");
  });

  it("parses Diagnostic-Code field", () => {
    expect(report?.recipients[0]?.diagnosticCode).toBe("smtp; 550 5.1.1 User unknown");
  });

  it("classifies kind as permanent", () => {
    expect(report?.recipients[0]?.kind).toBe("permanent");
  });
});

// ---------------------------------------------------------------------------
// Fixture 01 — plain email, must return null
// ---------------------------------------------------------------------------
describe("parseDeliveryStatus – fixture 01 (plain email → null)", () => {
  it("returns null for a non-DSN message", () => {
    const raw = readFixture("01-thread-root.eml");
    expect(parseDeliveryStatus(raw)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Synthetic transient DSN (action: delayed, status 4.4.1)
// ---------------------------------------------------------------------------
describe("parseDeliveryStatus – synthetic transient DSN", () => {
  const raw = [
    "From: Mail Delivery System <mailer-daemon@example.net>",
    "To: sender@example.com",
    "Subject: Delayed Mail",
    "Date: Thu, 01 Jan 2026 00:00:00 +0000",
    "Message-ID: <delay-bounce@example.net>",
    "MIME-Version: 1.0",
    'Content-Type: multipart/report; report-type=delivery-status; boundary="B1"',
    "",
    "--B1",
    "Content-Type: text/plain; charset=utf-8",
    "",
    "Temporary failure.",
    "--B1",
    "Content-Type: message/delivery-status",
    "",
    "Reporting-MTA: dns; mx.example.net",
    "",
    "Final-Recipient: rfc822; slow@example.org",
    "Action: delayed",
    "Status: 4.4.1",
    "Diagnostic-Code: smtp; 421 Try again later",
    "--B1",
    "Content-Type: text/rfc822-headers",
    "",
    "Message-ID: <orig-transient@example.com>",
    "From: sender@example.com",
    "To: slow@example.org",
    "--B1--",
    "",
  ].join("\r\n");

  const report = parseDeliveryStatus(raw);

  it("returns a non-null report", () => {
    expect(report).not.toBeNull();
  });

  it("extracts originalMessageId from text/rfc822-headers part", () => {
    expect(report?.originalMessageId).toBe("<orig-transient@example.com>");
  });

  it("classifies kind as transient", () => {
    expect(report?.recipients[0]?.kind).toBe("transient");
  });

  it("parses action and status", () => {
    expect(report?.recipients[0]?.action).toBe("delayed");
    expect(report?.recipients[0]?.status).toBe("4.4.1");
  });
});

// ---------------------------------------------------------------------------
// Folded header lines
// ---------------------------------------------------------------------------
describe("parseDeliveryStatus – folded Diagnostic-Code header", () => {
  const raw = [
    "From: Mail Delivery System <mailer-daemon@example.net>",
    "To: sender@example.com",
    "Subject: Bounce",
    "Date: Thu, 01 Jan 2026 00:00:00 +0000",
    "Message-ID: <fold-bounce@example.net>",
    "MIME-Version: 1.0",
    'Content-Type: multipart/report; report-type=delivery-status; boundary="B2"',
    "",
    "--B2",
    "Content-Type: text/plain; charset=utf-8",
    "",
    "Permanent failure.",
    "--B2",
    "Content-Type: message/delivery-status",
    "",
    "Reporting-MTA: dns; mx.example.net",
    "",
    "Final-Recipient: rfc822; nobody@example.org",
    "Action: failed",
    "Status: 5.1.1",
    // Folded diagnostic code: continuation line starts with a space
    "Diagnostic-Code: smtp; 550 5.1.1",
    " Mailbox does not exist",
    "--B2--",
    "",
  ].join("\r\n");

  const report = parseDeliveryStatus(raw);

  it("returns a non-null report", () => {
    expect(report).not.toBeNull();
  });

  it("unfolds the Diagnostic-Code value correctly", () => {
    expect(report?.recipients[0]?.diagnosticCode).toBe("smtp; 550 5.1.1 Mailbox does not exist");
  });
});

// ---------------------------------------------------------------------------
// Two recipients in one DSN
// ---------------------------------------------------------------------------
describe("parseDeliveryStatus – two recipients", () => {
  const raw = [
    "From: Mail Delivery System <mailer-daemon@example.net>",
    "To: sender@example.com",
    "Subject: Bounce",
    "Date: Thu, 01 Jan 2026 00:00:00 +0000",
    "Message-ID: <two-bounce@example.net>",
    "MIME-Version: 1.0",
    'Content-Type: multipart/report; report-type=delivery-status; boundary="B3"',
    "",
    "--B3",
    "Content-Type: text/plain; charset=utf-8",
    "",
    "Two recipients failed.",
    "--B3",
    "Content-Type: message/delivery-status",
    "",
    "Reporting-MTA: dns; mx.example.net",
    "",
    "Final-Recipient: rfc822; user1@example.org",
    "Action: failed",
    "Status: 5.1.1",
    "Diagnostic-Code: smtp; 550 User unknown",
    "",
    "Final-Recipient: rfc822; user2@example.org",
    "Action: delayed",
    "Status: 4.2.1",
    "Diagnostic-Code: smtp; 421 Mailbox full",
    "--B3",
    "Content-Type: message/rfc822",
    "",
    "From: sender@example.com",
    "To: user1@example.org, user2@example.org",
    "Message-ID: <orig-two@example.com>",
    "",
    "Original body.",
    "--B3--",
    "",
  ].join("\r\n");

  const report = parseDeliveryStatus(raw);

  it("returns a non-null report", () => {
    expect(report).not.toBeNull();
  });

  it("has two recipients", () => {
    expect(report?.recipients).toHaveLength(2);
  });

  it("first recipient is permanent", () => {
    expect(report?.recipients[0]?.finalRecipient).toBe("user1@example.org");
    expect(report?.recipients[0]?.kind).toBe("permanent");
  });

  it("second recipient is transient", () => {
    expect(report?.recipients[1]?.finalRecipient).toBe("user2@example.org");
    expect(report?.recipients[1]?.kind).toBe("transient");
  });

  it("extracts originalMessageId", () => {
    expect(report?.originalMessageId).toBe("<orig-two@example.com>");
  });
});
