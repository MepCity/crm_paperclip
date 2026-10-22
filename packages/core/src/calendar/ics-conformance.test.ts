/**
 * RFC 5545 conformance tests for buildInvitation / foldLine / escapeText.
 *
 * Scope: format compliance only — no source-code changes.
 * Companion to ics.test.ts (functional tests).
 * Do NOT touch imip-request.* (parallel work).
 */

import { describe, expect, it } from "vitest";
import { buildInvitation, escapeText, foldLine, type InvitationInput } from "./ics";

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const base: InvitationInput = {
  uid: "rfc5545-test@example.com",
  sequence: 0,
  method: "REQUEST",
  dtstamp: new Date("2026-03-01T12:00:00Z"),
  organizer: { email: "organizer@example.com", name: "Test Organizer" },
  attendees: [{ email: "attendee@example.com", partstat: "NEEDS-ACTION" }],
  summary: "RFC 5545 Conformance Test",
  start: new Date("2026-03-15T10:00:00Z"),
  end: new Date("2026-03-15T11:00:00Z"),
  allDay: false,
};

const enc = new TextEncoder();

// ---------------------------------------------------------------------------
// Helper: split the output into raw physical lines
// ---------------------------------------------------------------------------

function physicalLines(ics: string): string[] {
  // The trailing \r\n produces a trailing empty entry — keep it for fold checks
  return ics.split("\r\n");
}

// ---------------------------------------------------------------------------
// Helper: unfold content lines per RFC 5545 §3.1
// ---------------------------------------------------------------------------

function unfold(ics: string): string {
  return ics.replace(/\r\n[ \t]/g, "");
}

// ---------------------------------------------------------------------------
// 1. Line endings — every line MUST end with CRLF
// ---------------------------------------------------------------------------

describe("RFC 5545 §3.1 — line endings", () => {
  it("every line delimiter is CRLF (no bare LF or bare CR)", () => {
    const ics = buildInvitation(base);

    // No bare LF (not preceded by CR)
    expect(ics).not.toMatch(/(?<!\r)\n/);
    // No bare CR (not followed by LF)
    expect(ics).not.toMatch(/\r(?!\n)/);
    // Must contain at least one CRLF
    expect(ics).toContain("\r\n");
  });

  it("output ends with a single CRLF", () => {
    const ics = buildInvitation(base);
    expect(ics.endsWith("\r\n")).toBe(true);
    // No double trailing CRLF
    expect(ics.endsWith("\r\n\r\n")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. Line length — no physical line may exceed 75 octets
// ---------------------------------------------------------------------------

describe("RFC 5545 §3.1 — line length ≤ 75 octets", () => {
  it("short content produces lines within 75 octets", () => {
    const ics = buildInvitation(base);
    for (const line of physicalLines(ics)) {
      expect(enc.encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it("long ASCII SUMMARY is folded within 75 octets", () => {
    const summary = "A".repeat(200);
    const ics = buildInvitation({ ...base, summary });
    for (const line of physicalLines(ics)) {
      expect(enc.encode(line).length).toBeLessThanOrEqual(75);
    }
    // After unfolding the summary must be recoverable
    const unfolded = unfold(ics);
    expect(unfolded).toContain(`SUMMARY:${"A".repeat(200)}`);
  });

  it("long Turkish SUMMARY with multi-byte chars folds within 75 octets and is not split mid-character", () => {
    // Each Turkish letter like ş, ğ, ü, ö, ı, İ, Ç, Ğ is 2 bytes in UTF-8
    const summary = "Türkçe uzun başlık: şğüöıİÇĞ ".repeat(10);
    const ics = buildInvitation({ ...base, summary });
    for (const line of physicalLines(ics)) {
      const bytes = enc.encode(line);
      // Must not exceed 75 octets
      expect(bytes.length).toBeLessThanOrEqual(75);
      // Must decode cleanly (no broken multi-byte sequences)
      expect(() => new TextDecoder("utf-8", { fatal: true }).decode(bytes)).not.toThrow();
    }
    // Unfolded content must equal the escaped summary
    const unfolded = unfold(ics);
    expect(unfolded).toContain(`SUMMARY:${escapeText(summary)}`);
  });

  it("long Turkish DESCRIPTION with multi-byte chars folds without splitting characters", () => {
    const description = "Toplantı açıklaması: ığüşöç, İĞÜŞÖÇ. ".repeat(12);
    const ics = buildInvitation({ ...base, description });
    for (const line of physicalLines(ics)) {
      const bytes = enc.encode(line);
      expect(bytes.length).toBeLessThanOrEqual(75);
      expect(() => new TextDecoder("utf-8", { fatal: true }).decode(bytes)).not.toThrow();
    }
    const unfolded = unfold(ics);
    expect(unfolded).toContain(`DESCRIPTION:${escapeText(description)}`);
  });

  it("continuation lines (fold continuations) start with a single space or tab", () => {
    const summary = "Z".repeat(200);
    const ics = buildInvitation({ ...base, summary });
    const lines = physicalLines(ics);
    const continuations = lines.filter((l) => l.startsWith(" ") || l.startsWith("\t"));
    // There must be at least one continuation for a 200-char ASCII summary
    expect(continuations.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 3. foldLine unit tests
// ---------------------------------------------------------------------------

describe("foldLine — unit", () => {
  it("leaves a short line unchanged", () => {
    const short = "SUMMARY:short";
    expect(foldLine(short)).toBe(short);
  });

  it("folds exactly at 75-octet boundary for ASCII", () => {
    const line = "X".repeat(75); // exactly 75 bytes
    expect(foldLine(line)).toBe(line); // no fold needed
  });

  it("folds a 76-octet ASCII line into two parts", () => {
    const line = "X".repeat(76);
    const folded = foldLine(line);
    expect(folded).toContain("\r\n ");
    const parts = folded.split("\r\n ");
    expect(parts[0]?.length).toBe(75);
    expect(parts[1]?.length).toBe(1);
  });

  it("does not split a 2-byte UTF-8 character across fold boundary", () => {
    // Build a string where a 2-byte char would straddle the 75-octet limit
    // 74 ASCII chars + 'ş' (2 bytes) = 76 bytes total → must fold before 'ş'
    const line = `${"A".repeat(74)}ş`;
    const folded = foldLine(line);
    const [first, ...rest] = folded.split("\r\n ");
    // First chunk must not contain a broken sequence
    expect(() => new TextDecoder("utf-8", { fatal: true }).decode(enc.encode(first))).not.toThrow();
    // 'ş' must appear intact in a continuation chunk
    expect(rest.join("")).toContain("ş");
  });

  it("does not split a 3-byte UTF-8 character (emoji or CJK) across fold boundary", () => {
    // '€' is 3 bytes (U+20AC); place it at the boundary
    const line = `${"A".repeat(73)}€`; // 73 + 3 = 76 bytes
    const folded = foldLine(line);
    const [first, ...rest] = folded.split("\r\n ");
    expect(() => new TextDecoder("utf-8", { fatal: true }).decode(enc.encode(first))).not.toThrow();
    expect(rest.join("")).toContain("€");
  });

  it("handles a very long unbreakable sequence gracefully", () => {
    // 300 ASCII chars — must produce multiple chunks all ≤ 75 bytes
    const line = "B".repeat(300);
    const folded = foldLine(line);
    for (const chunk of folded.split("\r\n ")) {
      expect(enc.encode(chunk).length).toBeLessThanOrEqual(75);
    }
    // Round-trip: unfolding recovers the original
    expect(folded.replace(/\r\n /g, "")).toBe(line);
  });
});

// ---------------------------------------------------------------------------
// 4. Required properties — presence, uniqueness, order
// ---------------------------------------------------------------------------

describe("RFC 5545 §3.4–3.6 — required properties", () => {
  it("output begins with BEGIN:VCALENDAR and ends with END:VCALENDAR", () => {
    const ics = buildInvitation(base);
    const unfolded = unfold(ics);
    const lines = unfolded.split("\r\n").filter(Boolean);
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines[lines.length - 1]).toBe("END:VCALENDAR");
  });

  it("BEGIN:VCALENDAR and END:VCALENDAR each appear exactly once", () => {
    const ics = buildInvitation(base);
    const unfolded = unfold(ics);
    expect([...unfolded.matchAll(/BEGIN:VCALENDAR/g)]).toHaveLength(1);
    expect([...unfolded.matchAll(/END:VCALENDAR/g)]).toHaveLength(1);
  });

  it("BEGIN:VEVENT and END:VEVENT each appear exactly once", () => {
    const ics = buildInvitation(base);
    const unfolded = unfold(ics);
    expect([...unfolded.matchAll(/BEGIN:VEVENT/g)]).toHaveLength(1);
    expect([...unfolded.matchAll(/END:VEVENT/g)]).toHaveLength(1);
  });

  it("VEVENT is properly nested inside VCALENDAR", () => {
    const ics = buildInvitation(base);
    const unfolded = unfold(ics);
    const lines = unfolded.split("\r\n").filter(Boolean);
    const vcalBegin = lines.indexOf("BEGIN:VCALENDAR");
    const vcalEnd = lines.indexOf("END:VCALENDAR");
    const veventBegin = lines.indexOf("BEGIN:VEVENT");
    const veventEnd = lines.indexOf("END:VEVENT");
    expect(vcalBegin).toBeLessThan(veventBegin);
    expect(veventBegin).toBeLessThan(veventEnd);
    expect(veventEnd).toBeLessThan(vcalEnd);
  });

  it("VERSION:2.0 is present exactly once", () => {
    const ics = buildInvitation(base);
    const unfolded = unfold(ics);
    expect([...unfolded.matchAll(/^VERSION:/gm)]).toHaveLength(1);
    expect(unfolded).toContain("VERSION:2.0");
  });

  it("PRODID is present exactly once", () => {
    const ics = buildInvitation(base);
    const unfolded = unfold(ics);
    expect([...unfolded.matchAll(/^PRODID:/gm)]).toHaveLength(1);
  });

  it("METHOD is present exactly once and matches the input", () => {
    const reqIcs = buildInvitation(base);
    const cancelIcs = buildInvitation({ ...base, method: "CANCEL" });
    const reqUnfolded = unfold(reqIcs);
    const cancelUnfolded = unfold(cancelIcs);

    expect([...reqUnfolded.matchAll(/^METHOD:/gm)]).toHaveLength(1);
    expect(reqUnfolded).toContain("METHOD:REQUEST");

    expect([...cancelUnfolded.matchAll(/^METHOD:/gm)]).toHaveLength(1);
    expect(cancelUnfolded).toContain("METHOD:CANCEL");
  });

  it("UID is present exactly once", () => {
    const ics = buildInvitation(base);
    const unfolded = unfold(ics);
    expect([...unfolded.matchAll(/^UID:/gm)]).toHaveLength(1);
    expect(unfolded).toContain(`UID:${base.uid}`);
  });

  it("DTSTAMP is present exactly once in UTC format", () => {
    const ics = buildInvitation(base);
    const unfolded = unfold(ics);
    expect([...unfolded.matchAll(/^DTSTAMP:/gm)]).toHaveLength(1);
    // Must be a UTC datetime value ending with Z
    expect(unfolded).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
  });

  it("DTSTART is present exactly once", () => {
    const ics = buildInvitation(base);
    const unfolded = unfold(ics);
    expect([...unfolded.matchAll(/^DTSTART/gm)]).toHaveLength(1);
  });

  it("ORGANIZER is present exactly once", () => {
    const ics = buildInvitation(base);
    const unfolded = unfold(ics);
    expect([...unfolded.matchAll(/^ORGANIZER/gm)]).toHaveLength(1);
    expect(unfolded).toContain("mailto:organizer@example.com");
  });

  it("VCALENDAR header properties appear before VEVENT", () => {
    const ics = buildInvitation(base);
    const unfolded = unfold(ics);
    const lines = unfolded.split("\r\n").filter(Boolean);
    const veventBegin = lines.indexOf("BEGIN:VEVENT");
    const versionIdx = lines.findIndex((l) => l.startsWith("VERSION:"));
    const prodidIdx = lines.findIndex((l) => l.startsWith("PRODID:"));
    const methodIdx = lines.findIndex((l) => l.startsWith("METHOD:"));
    expect(versionIdx).toBeGreaterThan(0);
    expect(versionIdx).toBeLessThan(veventBegin);
    expect(prodidIdx).toBeLessThan(veventBegin);
    expect(methodIdx).toBeLessThan(veventBegin);
  });
});

// ---------------------------------------------------------------------------
// 5. CANCEL — STATUS:CANCELLED and SEQUENCE contract
// ---------------------------------------------------------------------------

describe("RFC 5545 — CANCEL method", () => {
  it("CANCEL output contains STATUS:CANCELLED", () => {
    const ics = buildInvitation({ ...base, method: "CANCEL" });
    const unfolded = unfold(ics);
    expect(unfolded).toContain("STATUS:CANCELLED");
  });

  it("STATUS:CANCELLED appears exactly once", () => {
    const ics = buildInvitation({ ...base, method: "CANCEL" });
    const unfolded = unfold(ics);
    expect([...unfolded.matchAll(/^STATUS:/gm)]).toHaveLength(1);
  });

  it("REQUEST output does NOT contain STATUS:CANCELLED", () => {
    const ics = buildInvitation({ ...base, method: "REQUEST" });
    expect(ics).not.toContain("STATUS:CANCELLED");
  });

  it("CANCEL preserves the caller-supplied SEQUENCE value (monotonicity enforced by the caller)", () => {
    const seq1 = buildInvitation({ ...base, method: "CANCEL", sequence: 1 });
    const seq2 = buildInvitation({ ...base, method: "CANCEL", sequence: 5 });
    const u1 = unfold(seq1);
    const u2 = unfold(seq2);
    expect(u1).toContain("SEQUENCE:1");
    expect(u2).toContain("SEQUENCE:5");
  });

  it("CANCEL SEQUENCE is higher than REQUEST SEQUENCE when the caller follows the contract", () => {
    const request = buildInvitation({ ...base, method: "REQUEST", sequence: 0 });
    const cancel = buildInvitation({ ...base, method: "CANCEL", sequence: 1 });
    const reqSeq = Number(unfold(request).match(/SEQUENCE:(\d+)/)?.[1]);
    const cancelSeq = Number(unfold(cancel).match(/SEQUENCE:(\d+)/)?.[1]);
    expect(cancelSeq).toBeGreaterThan(reqSeq);
  });
});

// ---------------------------------------------------------------------------
// 6. RFC 5545 TEXT escaping
// ---------------------------------------------------------------------------

describe("RFC 5545 §3.3.11 — TEXT escaping", () => {
  it("escapes backslash", () => {
    expect(escapeText("a\\b")).toBe("a\\\\b");
  });

  it("escapes semicolon", () => {
    expect(escapeText("a;b")).toBe("a\\;b");
  });

  it("escapes comma", () => {
    expect(escapeText("a,b")).toBe("a\\,b");
  });

  it("escapes bare LF newline", () => {
    expect(escapeText("a\nb")).toBe("a\\nb");
  });

  it("escapes CRLF newline", () => {
    expect(escapeText("a\r\nb")).toBe("a\\nb");
  });

  it("escapes bare CR newline", () => {
    expect(escapeText("a\rb")).toBe("a\\nb");
  });

  it("escapes all special chars combined", () => {
    expect(escapeText("a\\;b,c\r\nd\ne")).toBe("a\\\\\\;b\\,c\\nd\\ne");
  });

  it("escapeText integration: escaped text appears in output", () => {
    const ics = buildInvitation({ ...base, summary: "a\\b;c,d\ne" });
    const unfolded = unfold(ics);
    expect(unfolded).toContain("SUMMARY:a\\\\b\\;c\\,d\\ne");
  });

  it("escapeText integration: Türkçe chars in SUMMARY are not altered (only RFC 5545 specials are escaped)", () => {
    // String with no RFC 5545 special chars (no backslash, semicolon, comma, or newline)
    const summary = "Öğrenci toplantısı ışık güneş merhaba!";
    const ics = buildInvitation({ ...base, summary });
    const unfolded = unfold(ics);
    // No special chars → escapeText leaves Turkish letters intact; content round-trips verbatim
    expect(unfolded).toContain(`SUMMARY:${summary}`);
  });
});
