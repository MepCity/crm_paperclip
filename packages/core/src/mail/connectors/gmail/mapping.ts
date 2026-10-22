import {
  MAX_INBOUND_ATTACHMENT_BYTES,
  type MailAttachmentMeta,
  type MailFolder,
  type MailParticipant,
} from "../../types";
import type { MappedMessage } from "./port";

export interface GmailPart {
  filename?: string;
  mimeType?: string;
  headers?: { name: string; value: string }[];
  body?: { attachmentId?: string; size?: number };
  parts?: GmailPart[];
}
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: GmailPart;
}

const ADDRESS = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/;

/** Splits a header list on commas outside quotes and angle brackets. */
export function parseAddressList(value: string | undefined): MailParticipant[] {
  if (!value) return [];
  const items: string[] = [];
  let depth = 0;
  let quoted = false;
  let current = "";
  for (const ch of value) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && ch === "<") depth++;
    else if (!quoted && ch === ">") depth = Math.max(0, depth - 1);
    if (ch === "," && !quoted && depth === 0) {
      items.push(current);
      current = "";
    } else current += ch;
  }
  items.push(current);
  const out: MailParticipant[] = [];
  for (const raw of items) {
    const item = raw.trim();
    const m = /^(.*)<([^<>]+)>$/.exec(item);
    const address = (m ? m[2] : item)?.trim().toLowerCase() ?? "";
    if (!ADDRESS.test(address)) continue;
    const name = m?.[1]?.trim().replace(/^"|"$/g, "").trim();
    out.push(name ? { address, name } : { address });
  }
  return out;
}

function collectAttachments(part: GmailPart | undefined, into: GmailPart[]): void {
  if (!part) return;
  if (part.filename && part.body?.attachmentId) into.push(part);
  for (const child of part.parts ?? []) collectAttachments(child, into);
}

export function folderOf(labels: readonly string[] | undefined): MailFolder | null {
  if (labels?.includes("SENT")) return "sent";
  if (labels?.includes("INBOX")) return "inbox";
  return null;
}

/** Maps a hand-written or real Gmail `format=full` message; returns null if unusable. */
export function mapGmailMessage(
  organizationId: string,
  mailboxId: string,
  gm: GmailMessage,
): MappedMessage | null {
  const folder = folderOf(gm.labelIds);
  if (!folder) return null;
  const headers = new Map<string, string>();
  for (const h of gm.payload?.headers ?? []) {
    if (!headers.has(h.name.toLowerCase())) headers.set(h.name.toLowerCase(), h.value);
  }
  const from = parseAddressList(headers.get("from"));
  if (from.length === 0) return null;
  const ms = Number(gm.internalDate);
  const when = Number.isFinite(ms) ? new Date(ms).toISOString() : null;
  const messageId = `${mailboxId}:${gm.id}`;
  const attachments: MailAttachmentMeta[] = [];
  const parts: GmailPart[] = [];
  collectAttachments(gm.payload, parts);
  for (const p of parts) {
    const size = p.body?.size ?? 0;
    const stored = size <= MAX_INBOUND_ATTACHMENT_BYTES;
    attachments.push({
      organizationId,
      id: `${messageId}:${p.body?.attachmentId}`,
      messageId,
      name: p.filename as string,
      size,
      contentType: p.mimeType || "application/octet-stream",
      storage: stored ? "stored" : "not_stored",
      // Opaque provider locator; the attachment worker fetches bytes later.
      blobRef: stored ? `gmail-attachment:${messageId}:${p.body?.attachmentId}` : null,
    });
  }
  return {
    thread: {
      organizationId,
      id: `${mailboxId}:${gm.threadId}`,
      mailboxId,
      source: "provider",
      providerThreadKey: gm.threadId,
    },
    message: {
      organizationId,
      id: messageId,
      mailboxId,
      threadId: `${mailboxId}:${gm.threadId}`,
      providerMessageKey: gm.id,
      messageIdHeader: headers.get("message-id") ?? null,
      inReplyTo: headers.get("in-reply-to") ?? null,
      references: (headers.get("references") ?? "").split(/\s+/).filter(Boolean),
      subject: headers.get("subject") ?? "",
      from,
      to: parseAddressList(headers.get("to")),
      cc: parseAddressList(headers.get("cc")),
      bcc: parseAddressList(headers.get("bcc")),
      sentAt: folder === "sent" ? when : null,
      receivedAt: folder === "inbox" ? when : null,
      folder,
      summary: gm.snippet ?? "",
      bodyRef: null,
      sharedByOwner: false,
    },
    attachments,
  };
}
