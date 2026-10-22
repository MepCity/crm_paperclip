import { randomBytes } from "node:crypto";

export interface MimeAddress {
  name?: string;
  address: string;
}

export interface MimeAttachment {
  filename: string;
  contentType: string;
  content: Uint8Array;
}

export interface ComposeMimeInput {
  from: MimeAddress;
  to: MimeAddress[];
  cc?: MimeAddress[];
  bcc?: MimeAddress[];
  subject: string;
  text?: string;
  html?: string;
  inReplyTo?: string;
  references?: string[];
  messageId?: string;
  date?: Date;
  attachments?: MimeAttachment[];
  /** Injected for deterministic output in tests. */
  generateBoundary?: () => string;
}

const CRLF = "\r\n";
const ADDRESS_RE = /^[^\s<>()[\]",;:\\@]+@[^\s<>()[\]",;:\\@]+$/;
const TOKEN_RE = /^[!#$%&'*+\-.^_`{|}~0-9A-Za-z/]+\/[!#$%&'*+\-.^_`{|}~0-9A-Za-z]+$/;
const FOLD_LIMIT = 76;
const ENCODED_WORD_MAX_BYTES = 45; // 63 base64 chars => keeps the word within 75 chars

function assertNoLineBreak(value: string, label: string): void {
  if (/[\r\n\0]/.test(value)) {
    throw new Error(`${label} must not contain CR, LF or NUL`);
  }
}

function isAscii(value: string): boolean {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: ASCII range check
  return /^[\x00-\x7f]*$/.test(value);
}

/** RFC 2047 B encoded-words, UTF-8, never splitting a code point. */
function encodeWords(value: string): string {
  const words: string[] = [];
  let chunk: number[] = [];
  const flush = () => {
    if (chunk.length > 0) {
      words.push(`=?UTF-8?B?${Buffer.from(chunk).toString("base64")}?=`);
      chunk = [];
    }
  };
  for (const char of value) {
    const bytes = Buffer.from(char, "utf8");
    if (chunk.length + bytes.length > ENCODED_WORD_MAX_BYTES) flush();
    chunk.push(...bytes);
  }
  flush();
  return words.join(" ");
}

/** Unstructured text (subject). */
function encodeText(value: string, label: string): string {
  assertNoLineBreak(value, label);
  return isAscii(value) ? value : encodeWords(value);
}

function formatAddress(entry: MimeAddress, label: string): string {
  assertNoLineBreak(entry.address, label);
  if (!ADDRESS_RE.test(entry.address) || !isAscii(entry.address)) {
    throw new Error(`${label} has an invalid address`);
  }
  if (!entry.name) return entry.address;
  assertNoLineBreak(entry.name, `${label} name`);
  let phrase: string;
  if (!isAscii(entry.name)) phrase = encodeWords(entry.name);
  else if (/^[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~ ]+$/.test(entry.name)) phrase = entry.name;
  else phrase = `"${entry.name.replace(/(["\\])/g, "\\$1")}"`;
  return `${phrase} <${entry.address}>`;
}

function formatAddressList(list: MimeAddress[], label: string): string {
  return list.map((entry) => formatAddress(entry, label)).join(", ");
}

/** Fold at whitespace so lines stay within 76 chars where possible; hard-cut at 998. */
function foldHeader(name: string, value: string): string {
  const tokens = value.split(" ");
  const lines: string[] = [];
  let current = `${name}:`;
  for (const token of tokens) {
    if (
      (current.length + 1 + token.length > FOLD_LIMIT && current.length > name.length + 1) ||
      token.length > 60
    ) {
      lines.push(current);
      current = ` ${token}`;
    } else {
      current += `${current.endsWith(":") ? " " : " "}${token}`;
    }
  }
  lines.push(current);
  return lines
    .flatMap((line) => {
      const out: string[] = [];
      let rest = line;
      while (rest.length > 998) {
        out.push(rest.slice(0, 998));
        rest = ` ${rest.slice(998)}`;
      }
      out.push(rest);
      return out;
    })
    .join(CRLF);
}

function base64Lines(bytes: Uint8Array): string {
  const encoded = Buffer.from(bytes).toString("base64");
  const lines: string[] = [];
  for (let i = 0; i < encoded.length; i += 76) lines.push(encoded.slice(i, i + 76));
  return lines.join(CRLF);
}

function percentEncode(value: string): string {
  return [...Buffer.from(value, "utf8")]
    .map((b) =>
      /[A-Za-z0-9!#$&+\-.^_`|~]/.test(String.fromCharCode(b))
        ? String.fromCharCode(b)
        : `%${b.toString(16).toUpperCase().padStart(2, "0")}`,
    )
    .join("");
}

function filenameParams(filename: string): string {
  assertNoLineBreak(filename, "attachment filename");
  if (isAscii(filename)) {
    return `filename="${filename.replace(/(["\\])/g, "\\$1")}"`;
  }
  const fallback = [...filename].map((c) => (c.charCodeAt(0) < 128 ? c : "_")).join("");
  return `filename="${fallback.replace(/(["\\])/g, "\\$1")}"; filename*=UTF-8''${percentEncode(filename)}`;
}

function textPart(contentType: string, body: string): string {
  return [
    `Content-Type: ${contentType}; charset=utf-8`,
    "Content-Transfer-Encoding: base64",
    "",
    base64Lines(Buffer.from(body, "utf8")),
  ].join(CRLF);
}

function defaultBoundary(): string {
  return `=_mepcity_${randomBytes(12).toString("hex")}`;
}

function multipart(boundary: string, parts: string[]): string {
  return [...parts.flatMap((part) => [`--${boundary}`, part]), `--${boundary}--`, ""].join(CRLF);
}

/** Addresses the transport must deliver to (to + cc + bcc). BCC never appears in headers. */
export function envelopeRecipients(input: Pick<ComposeMimeInput, "to" | "cc" | "bcc">): string[] {
  return [...input.to, ...(input.cc ?? []), ...(input.bcc ?? [])].map((a) => a.address);
}

export function composeMime(input: ComposeMimeInput): string {
  if (input.to.length + (input.cc?.length ?? 0) + (input.bcc?.length ?? 0) === 0) {
    throw new Error("at least one recipient is required");
  }
  const boundaryFn = input.generateBoundary ?? defaultBoundary;
  const attachments = input.attachments ?? [];
  const messageId =
    input.messageId ?? `<${randomBytes(12).toString("hex")}@${input.from.address.split("@")[1]}>`;
  assertNoLineBreak(messageId, "messageId");
  if (!/^<[^<>\s]+>$/.test(messageId)) throw new Error("messageId must look like <id@host>");

  const headers: string[] = [
    foldHeader("From", formatAddress(input.from, "from")),
    foldHeader("To", formatAddressList(input.to, "to")),
  ];
  if (input.cc?.length) headers.push(foldHeader("Cc", formatAddressList(input.cc, "cc")));
  headers.push(foldHeader("Subject", encodeText(input.subject, "subject")));
  headers.push(
    foldHeader("Date", (input.date ?? new Date()).toUTCString().replace("GMT", "+0000")),
  );
  headers.push(foldHeader("Message-ID", messageId));
  if (input.inReplyTo) {
    assertNoLineBreak(input.inReplyTo, "inReplyTo");
    headers.push(foldHeader("In-Reply-To", input.inReplyTo));
  }
  if (input.references?.length) {
    for (const ref of input.references) assertNoLineBreak(ref, "references");
    headers.push(foldHeader("References", input.references.join(" ")));
  }
  headers.push("MIME-Version: 1.0");

  const text = input.text ?? (input.html === undefined ? "" : undefined);
  let body: { headers: string[]; content: string };
  const bodyPart = (): string => {
    if (text !== undefined && input.html === undefined) return textPart("text/plain", text);
    if (text === undefined && input.html !== undefined) return textPart("text/html", input.html);
    const b = boundaryFn();
    return [
      `Content-Type: multipart/alternative; boundary="${b}"`,
      "",
      multipart(b, [textPart("text/plain", text ?? ""), textPart("text/html", input.html ?? "")]),
    ].join(CRLF);
  };

  if (attachments.length === 0) {
    const part = bodyPart();
    const split = part.indexOf(CRLF + CRLF);
    body = { headers: part.slice(0, split).split(CRLF), content: part.slice(split + 4) };
  } else {
    const b = boundaryFn();
    const parts = [
      bodyPart(),
      ...attachments.map((att) => {
        if (!TOKEN_RE.test(att.contentType)) throw new Error("invalid attachment contentType");
        return [
          `Content-Type: ${att.contentType}`,
          `Content-Disposition: attachment; ${filenameParams(att.filename)}`,
          "Content-Transfer-Encoding: base64",
          "",
          base64Lines(att.content),
        ].join(CRLF);
      }),
    ];
    body = {
      headers: [`Content-Type: multipart/mixed; boundary="${b}"`],
      content: multipart(b, parts),
    };
  }
  return [...headers, ...body.headers, "", body.content].join(CRLF);
}
