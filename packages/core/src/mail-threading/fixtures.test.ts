import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { matchRecordLinks, normalizeAddress, resolveThread } from "./index";
import type { KnownThread, ThreadingMessage } from "./types";

const dir = path.resolve(__dirname, "../../test-fixtures/mail");

/** Reads only the top-level header block, unfolding continuation lines. */
function readHeaders(file: string): Map<string, string> {
  const text = readFileSync(path.join(dir, file), "utf8");
  const block = text.split(/\r?\n\r?\n/)[0] ?? "";
  const unfolded = block.replace(/\r?\n[ \t]+/g, " ");
  const headers = new Map<string, string>();
  for (const line of unfolded.split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i <= 0) continue;
    const name = line.slice(0, i).trim().toLowerCase();
    if (!headers.has(name)) headers.set(name, line.slice(i + 1).trim());
  }
  return headers;
}

/** Splits an address list on commas that are outside quotes and angle brackets. */
function splitList(value: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  let angle = false;
  for (let i = 0; i < value.length; i++) {
    const c = value[i] as string;
    if (quoted && c === "\\") {
      cur += c + (value[++i] ?? "");
      continue;
    }
    if (c === '"') quoted = !quoted;
    else if (!quoted && c === "<") angle = true;
    else if (!quoted && c === ">") angle = false;
    if (c === "," && !quoted && !angle) {
      out.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function participants(h: Map<string, string>): string[] {
  return ["from", "to", "cc"].flatMap((n) => splitList(h.get(n) ?? ""));
}

function toMessage(file: string): ThreadingMessage {
  const h = readHeaders(file);
  return {
    messageId: h.get("message-id") ?? null,
    inReplyTo: h.get("in-reply-to") ?? null,
    references: h.get("references") ?? null,
    subject: h.get("subject") ?? "",
    participants: participants(h),
    sentAt: Date.parse(h.get("date") ?? ""),
  };
}

function toKnown(threadKey: string, messages: ThreadingMessage[]): KnownThread {
  const first = messages[0] as ThreadingMessage;
  return {
    threadKey,
    messageIds: messages.map((m) => m.messageId ?? ""),
    subject: first.subject,
    participants: messages.flatMap((m) => m.participants),
    lastMessageAt: Math.max(...messages.map((m) => m.sentAt)),
  };
}

const files = readdirSync(dir)
  .filter((f) => f.endsWith(".eml"))
  .sort();

describe("mail fixtures: threading", () => {
  const [m1, m2, m3, m4] = [
    "01-thread-root.eml",
    "02-thread-reply.eml",
    "03-thread-second-reply.eml",
    "04-reply-without-references.eml",
  ].map(toMessage) as [ThreadingMessage, ThreadingMessage, ThreadingMessage, ThreadingMessage];

  it("resolves 01 -> 02 -> 03 to one threadKey via headers", () => {
    const root = resolveThread(m1, []);
    expect(root.source).toBe("new");

    const known = [toKnown(root.threadKey, [m1])];
    const r2 = resolveThread(m2, known);
    expect(r2).toEqual({ threadKey: root.threadKey, source: "headers" });

    const known2 = [toKnown(root.threadKey, [m1, m2])];
    const r3 = resolveThread(m3, known2);
    expect(r3).toEqual({ threadKey: root.threadKey, source: "headers" });
  });

  it("04 has no threading headers and falls back to the subject (same subject, shared participants, within window)", () => {
    expect(m4.inReplyTo).toBeNull();
    expect(m4.references).toBeNull();
    const root = resolveThread(m1, []);
    const known = [toKnown(root.threadKey, [m1, m2, m3])];
    expect(resolveThread(m4, known)).toEqual({ threadKey: root.threadKey, source: "subject" });
  });

  it("04 starts a new thread when no known thread matches", () => {
    expect(resolveThread(m4, []).source).toBe("new");
  });
});

describe("mail fixtures: addresses", () => {
  for (const file of files) {
    it(`${file}: From/To/Cc normalize to non-null addresses`, () => {
      const list = participants(readHeaders(file));
      expect(list.length).toBeGreaterThan(0);
      for (const raw of list) expect(normalizeAddress(raw), raw).not.toBeNull();
    });
  }

  it("10: quoted display name with a comma and a quoted local part", () => {
    const h = readHeaders("10-display-name-comma-quoted-local.eml");
    expect(normalizeAddress(h.get("from") ?? "")).toBe('"alice.quoted local"@example.com');
    expect(splitList(h.get("to") ?? "").map((a) => normalizeAddress(a))).toEqual([
      "bob@example.org",
      "carol@example.net",
    ]);
  });
});

describe("mail fixtures: record links", () => {
  it("matches fixture participants against a synthetic record address table", () => {
    const table = [
      { kind: "contact" as const, recordId: "c1", email: "Bob@Example.org" },
      { kind: "lead" as const, recordId: "l1", email: "alice@example.com" },
      { kind: "account" as const, recordId: "a1", email: "other@example.net" },
    ];
    const result = matchRecordLinks(toMessage("01-thread-root.eml").participants, table);
    expect(result.ambiguous).toBe(false);
    expect(result.matches).toEqual([
      { address: "alice@example.com", kind: "lead", recordId: "l1" },
      { address: "bob@example.org", kind: "contact", recordId: "c1" },
    ]);
  });

  it("flags an address that matches two distinct records as ambiguous", () => {
    const table = [
      { kind: "contact" as const, recordId: "c1", email: "carol@example.net" },
      { kind: "lead" as const, recordId: "l9", email: "carol@example.net" },
    ];
    const result = matchRecordLinks(
      toMessage("10-display-name-comma-quoted-local.eml").participants,
      table,
    );
    expect(result.ambiguous).toBe(true);
    expect(result.matches).toHaveLength(2);
  });
});
