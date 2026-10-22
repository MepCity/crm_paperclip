import { describe, expect, it } from "vitest";
import {
  type KnownThread,
  matchRecordLinks,
  normalizeAddress,
  normalizeSubject,
  parseReferences,
  resolveThread,
} from "./index";

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 0, 10);

describe("normalizeAddress", () => {
  it.each([
    ["  Alice@Example.COM ", "alice@example.com"],
    ["Alice <alice@example.com>", "alice@example.com"],
    ['"Doe, Jane X" <Jane@Example.org>', "jane@example.org"],
    ["jane@example.org (Jane, work)", "jane@example.org"],
    ['"john"@example.com', "john@example.com"],
    ['"john smith"@example.com', '"john smith"@example.com'],
  ])("%s", (raw, out) => expect(normalizeAddress(raw)).toBe(out));
  it.each([
    "",
    "nope",
    "a@",
    "@example.com",
    "a@example.com, b@example.org",
    "a b@example.com",
    "<a@example.com",
  ])("rejects %j", (raw) => expect(normalizeAddress(raw)).toBeNull());
});

describe("parseReferences", () => {
  it("handles folded whitespace and duplicates", () => {
    expect(parseReferences("<a@example.com>\r\n <b@example.com>\t<a@example.com>")).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });
  it("skips broken tokens", () => {
    expect(parseReferences("<a@example.com> garbage <broken <c@example.org>")).toEqual([
      "a@example.com",
      "c@example.org",
    ]);
    expect(parseReferences(undefined)).toEqual([]);
  });
});

describe("normalizeSubject", () => {
  it("strips stacked prefixes and list tags", () => {
    expect(normalizeSubject("RE:  Fwd: AW: [list]  Quarterly   plan")).toBe("Quarterly plan");
    expect(normalizeSubject("[news] Re: WG: Fw: Hello")).toBe("Hello");
  });
  it("keeps inner brackets", () => {
    expect(normalizeSubject("Plan [draft] v2")).toBe("Plan [draft] v2");
  });
});

const known: KnownThread[] = [
  {
    threadKey: "T-A",
    messageIds: ["m1@example.com", "<m2@example.com>"],
    subject: "Quarterly plan",
    participants: ["Alice <alice@example.com>", "bob@example.org"],
    lastMessageAt: T0,
  },
  {
    threadKey: "T-B",
    messageIds: ["x1@example.com"],
    subject: "Other",
    participants: ["carol@example.com"],
    lastMessageAt: T0,
  },
];

describe("resolveThread", () => {
  const base = { subject: "Hi", participants: ["zed@example.com"], sentAt: T0 + DAY };
  it("provider id wins over headers", () => {
    expect(
      resolveThread({ ...base, providerThreadId: "P1", inReplyTo: "<m1@example.com>" }, known),
    ).toEqual({ threadKey: "P1", source: "provider" });
  });
  it("In-Reply-To then References last to first", () => {
    expect(resolveThread({ ...base, inReplyTo: "<m2@example.com>" }, known)).toEqual({
      threadKey: "T-A",
      source: "headers",
    });
    expect(
      resolveThread(
        { ...base, references: "<m1@example.com> <unknown@example.com> <x1@example.com>" },
        known,
      ),
    ).toEqual({ threadKey: "T-B", source: "headers" });
  });
  it("subject fallback with overlap inside 30 days", () => {
    const m = {
      subject: "RE: [list] quarterly plan",
      participants: ["BOB@example.org"],
      sentAt: T0 + 29 * DAY,
    };
    expect(resolveThread(m, known)).toEqual({ threadKey: "T-A", source: "subject" });
    expect(resolveThread({ ...m, sentAt: T0 + 31 * DAY }, known).source).toBe("new");
  });
  it("same subject without participant overlap does not merge", () => {
    const r = resolveThread(
      { subject: "Quarterly plan", participants: ["zed@example.com"], sentAt: T0 },
      known,
    );
    expect(r.source).toBe("new");
  });
  it("broken References fall through to new thread keyed by Message-ID", () => {
    expect(
      resolveThread({ ...base, messageId: "<own@example.com>", references: "<<<" }, known),
    ).toEqual({
      threadKey: "mid:own@example.com",
      source: "new",
    });
  });
  it("missing Message-ID gives a stable hash", () => {
    const a = resolveThread(base, []);
    expect(a.source).toBe("new");
    expect(a.threadKey).toMatch(/^hash:[0-9a-f]{8}$/);
    expect(resolveThread({ ...base }, [])).toEqual(a);
  });
});

describe("matchRecordLinks", () => {
  const records = [
    { kind: "contact" as const, recordId: "c1", email: "Jane@Example.org" },
    { kind: "lead" as const, recordId: "l1", email: "bob@example.com" },
    { kind: "account" as const, recordId: "a1", email: "bob@example.com" },
  ];
  it("matches case-insensitively with display names", () => {
    const r = matchRecordLinks(['"Doe, Jane" <JANE@example.org>', "none@example.com"], records);
    expect(r.matches).toEqual([{ address: "jane@example.org", kind: "contact", recordId: "c1" }]);
    expect(r.ambiguous).toBe(false);
  });
  it("links all and flags ambiguous", () => {
    const r = matchRecordLinks(["bob@example.com"], records);
    expect(r.matches).toHaveLength(2);
    expect(r.ambiguous).toBe(true);
  });
});
