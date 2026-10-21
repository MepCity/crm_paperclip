import { normalizeMailAddress } from "./service";
import type { MailMessage, MailParticipant } from "./types";

/**
 * Strips any number of leading reply or forward prefixes (e.g. Re:, RE:, Fwd:, FW:, Fw:, Re[2]:),
 * case-insensitively with optional whitespace, and trims the remaining subject.
 */
export function normalizeSubject(subject?: string | null): string {
  if (!subject) return "";
  let s = subject.trim();
  const prefixRegex = /^(?:re|fwd|fw)(?:\s*\[\d+\])?\s*:\s*/i;
  while (prefixRegex.test(s)) {
    s = s.replace(prefixRegex, "").trim();
  }
  return s;
}

/**
 * Produces a standardized reply subject: "Re: " + normalized subject.
 * Never stacks prefixes.
 */
export function replySubject(subject: string): string {
  const normalized = normalizeSubject(subject);
  return `Re: ${normalized}`;
}

/**
 * Produces a standardized forward subject: "Fwd: " + normalized subject.
 * Never stacks prefixes.
 */
export function forwardSubject(subject: string): string {
  const normalized = normalizeSubject(subject);
  return `Fwd: ${normalized}`;
}

export interface ReplyHeadersResult {
  inReplyTo: string | null;
  references: string[];
}

/**
 * Computes In-Reply-To and References headers per RFC 5322 §3.6.4:
 * - inReplyTo = original messageIdHeader (or null if missing)
 * - references = original references + original messageIdHeader, deduplicated, order kept,
 *   capped to the last 20 ids. If messageIdHeader is missing, references are unchanged.
 */
export function replyHeaders(
  message: Pick<MailMessage, "messageIdHeader" | "references">,
): ReplyHeadersResult {
  if (!message.messageIdHeader?.trim()) {
    return {
      inReplyTo: null,
      references: [...message.references],
    };
  }

  const combined = [...message.references, message.messageIdHeader];
  const deduplicated = Array.from(new Set(combined));
  const capped = deduplicated.slice(-20);

  return {
    inReplyTo: message.messageIdHeader,
    references: capped,
  };
}

export type ReplyMode = "reply" | "reply_all";

export interface MailRecipients {
  to: MailParticipant[];
  cc: MailParticipant[];
  bcc: MailParticipant[];
}

function deduplicateParticipants(participants: readonly MailParticipant[]): MailParticipant[] {
  const map = new Map<string, MailParticipant>();
  for (const p of participants) {
    const key = normalizeMailAddress(p.address);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...p });
    } else if (!existing.name && p.name) {
      existing.name = p.name;
    }
  }
  return Array.from(map.values());
}

/**
 * Computes recipient lists for replying or replying-all to a message:
 * - reply: to = original from (if the original was sent by ownAddress, i.e. folder "sent",
 *   then to = original to); cc = []; bcc = []
 * - reply_all: as reply, plus cc = original to + cc minus new to and minus ownAddress.
 * - original bcc is never included.
 * - address deduplication preserves the first observed display name.
 */
export function replyRecipients(
  message: Pick<MailMessage, "from" | "to" | "cc" | "bcc" | "folder">,
  ownAddress: string,
  mode: ReplyMode,
): MailRecipients {
  const normOwn = normalizeMailAddress(ownAddress);
  const isSentByOwn =
    message.folder === "sent" ||
    message.from.some((p) => normalizeMailAddress(p.address) === normOwn);

  let rawTo = isSentByOwn ? message.to : message.from;
  if (isSentByOwn) {
    const withoutOwn = rawTo.filter((p) => normalizeMailAddress(p.address) !== normOwn);
    if (withoutOwn.length > 0) {
      rawTo = withoutOwn;
    }
  }

  const to = deduplicateParticipants(rawTo);

  if (mode === "reply") {
    return {
      to,
      cc: [],
      bcc: [],
    };
  }

  // mode === "reply_all"
  const toAddresses = new Set(to.map((p) => normalizeMailAddress(p.address)));
  const candidateCc: MailParticipant[] = [];

  for (const p of [...message.to, ...message.cc]) {
    const addr = normalizeMailAddress(p.address);
    if (addr === normOwn || toAddresses.has(addr)) {
      continue;
    }
    candidateCc.push(p);
  }

  const cc = deduplicateParticipants(candidateCc);

  return {
    to,
    cc,
    bcc: [],
  };
}

/**
 * Empty recipient lists for forwarding a message.
 */
export function forwardRecipients(): MailRecipients {
  return {
    to: [],
    cc: [],
    bcc: [],
  };
}

/**
 * Interim plain-text reply attribution format.
 * Reference CRM format was not observed (W2 research open).
 */
export const INTERIM_REPLY_ATTRIBUTION = "On {date} UTC, {author} wrote:";

export interface QuoteAttribution {
  sentAt?: string | Date | null;
  fromName?: string | null;
}

function formatUtcDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function buildAttributionLine(options: QuoteAttribution): string {
  const dateStr = formatUtcDate(options.sentAt);
  const authorStr = options.fromName?.trim() || "";

  let line = INTERIM_REPLY_ATTRIBUTION;
  if (dateStr) {
    line = line.replace("{date}", dateStr);
  } else {
    line = line.replace("On {date} UTC, ", "").replace("{date}", "");
  }

  if (authorStr) {
    line = line.replace("{author}", authorStr).replace("{fromName}", authorStr);
  } else {
    line = line.replace("{author}", "someone").replace("{fromName}", "someone");
  }

  return line.trim();
}

/**
 * Quotes a plain-text message body with an attribution line and `> ` prepended to every line.
 */
export function quotePlainText(body: string, attribution: QuoteAttribution): string {
  const attributionLine = buildAttributionLine(attribution);
  const quotedBody = body
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
  return `${attributionLine}\n${quotedBody}`;
}
