import { decodeEncodedWords } from "./encoded-words";

export class MimeParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MimeParseError";
  }
}

export type ParsedAttachment = {
  filename?: string;
  contentType: string;
  contentId?: string;
  disposition: "attachment" | "inline";
  size: number;
  content: Uint8Array;
};

export type ParsedMimeMessage = {
  headers: Map<string, string[]>;
  text?: string;
  html?: string;
  attachments: ParsedAttachment[];
};

const MAX_DEPTH = 20;
const MAX_PARTS = 500;

/** Bytes → "binary string" (one char per byte) so string ops never corrupt data. */
function toBinary(raw: string | Uint8Array): string {
  const bytes = typeof raw === "string" ? new TextEncoder().encode(raw) : raw;
  let out = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    out += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return out;
}

function binaryToBytes(bin: string): Uint8Array {
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 0xff;
  return out;
}

function decodeBytes(bytes: Uint8Array, charset: string | undefined): string {
  const label = (charset ?? "utf-8").trim().toLowerCase();
  const mapped =
    label === "us-ascii" || label === "ascii"
      ? "utf-8"
      : label === "latin1" || label === "iso-8859-1" || label === "l1"
        ? "windows-1252"
        : label;
  try {
    return new TextDecoder(mapped).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

function splitHeaderBody(bin: string): { head: string; body: string } {
  const m = /\r?\n\r?\n/.exec(bin);
  if (bin.startsWith("\r\n") || bin.startsWith("\n")) {
    return { head: "", body: bin.replace(/^\r?\n/, "") };
  }
  if (!m) return { head: bin, body: "" };
  return { head: bin.slice(0, m.index), body: bin.slice(m.index + m[0].length) };
}

function parseHeaders(head: string): Map<string, string[]> {
  const headers = new Map<string, string[]>();
  const unfolded = head.replace(/\r?\n[ \t]+/g, " ");
  for (const line of unfolded.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const name = line.slice(0, idx).trim().toLowerCase();
    const value = decodeBytes(binaryToBytes(line.slice(idx + 1)), "utf-8").trim();
    const list = headers.get(name);
    if (list) list.push(value);
    else headers.set(name, [value]);
  }
  return headers;
}

type HeaderParams = { value: string; params: Map<string, string> };

function parseHeaderParams(raw: string | undefined): HeaderParams {
  const params = new Map<string, string>();
  if (!raw) return { value: "", params };
  const segments: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i] as string;
    if (quoted && c === "\\" && i + 1 < raw.length) {
      cur += raw[++i];
    } else if (c === '"') {
      quoted = !quoted;
    } else if (c === ";" && !quoted) {
      segments.push(cur);
      cur = "";
    } else cur += c;
  }
  segments.push(cur);
  const value = (segments.shift() ?? "").trim().toLowerCase();

  const continued = new Map<string, Map<number, { v: string; enc: boolean }>>();
  for (const seg of segments) {
    const eq = seg.indexOf("=");
    if (eq <= 0) continue;
    let key = seg.slice(0, eq).trim().toLowerCase();
    const v = seg.slice(eq + 1).trim();
    const star = /^(.+?)(?:\*(\d+))?(\*)?$/.exec(key);
    if (star && (star[2] !== undefined || star[3])) {
      key = star[1] as string;
      const idx = star[2] === undefined ? 0 : Number(star[2]);
      const map = continued.get(key) ?? new Map();
      map.set(idx, { v, enc: Boolean(star[3]) });
      continued.set(key, map);
    } else {
      params.set(key, v);
    }
  }
  for (const [key, map] of continued) {
    let charset = "utf-8";
    let out = "";
    const indexes = [...map.keys()].sort((a, b) => a - b);
    const bytes: number[] = [];
    const flush = () => {
      if (bytes.length) {
        out += decodeBytes(Uint8Array.from(bytes), charset);
        bytes.length = 0;
      }
    };
    indexes.forEach((i, n) => {
      const part = map.get(i) as { v: string; enc: boolean };
      let v = part.v;
      if (part.enc) {
        if (n === 0) {
          const m = /^([^']*)'[^']*'(.*)$/.exec(v);
          if (m) {
            charset = m[1] || "utf-8";
            v = m[2] as string;
          }
        }
        const re = /%([0-9a-fA-F]{2})|([^%])/g;
        for (let m = re.exec(v); m; m = re.exec(v)) {
          if (m[1]) bytes.push(Number.parseInt(m[1], 16));
          else bytes.push((m[2] as string).charCodeAt(0) & 0xff);
        }
      } else {
        flush();
        out += v;
      }
    });
    flush();
    params.set(key, out);
  }
  return { value, params };
}

function decodeQuotedPrintable(body: string): Uint8Array {
  const s = body.replace(/=\r?\n/g, "");
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i] as string;
    if (c === "=" && /^[0-9a-fA-F]{2}$/.test(s.slice(i + 1, i + 3))) {
      out.push(Number.parseInt(s.slice(i + 1, i + 3), 16));
      i += 2;
    } else out.push(s.charCodeAt(i) & 0xff);
  }
  return Uint8Array.from(out);
}

function decodeBase64(body: string): Uint8Array {
  const clean = body.replace(/[^A-Za-z0-9+/]/g, "");
  try {
    return Uint8Array.from(Buffer.from(clean, "base64"));
  } catch {
    return new Uint8Array();
  }
}

function decodeBody(body: string, encoding: string | undefined): Uint8Array {
  switch ((encoding ?? "").trim().toLowerCase()) {
    case "quoted-printable":
      return decodeQuotedPrintable(body);
    case "base64":
      return decodeBase64(body);
    default:
      return binaryToBytes(body);
  }
}

function splitMultipart(body: string, boundary: string): string[] {
  const parts: string[] = [];
  const lines = body.split(/\r?\n/);
  const open = `--${boundary}`;
  const close = `--${boundary}--`;
  let current: string[] | null = null;
  for (const line of lines) {
    const trimmed = line.replace(/[ \t]+$/, "");
    if (trimmed === close) {
      if (current) parts.push(current.join("\n"));
      current = null;
      break;
    }
    if (trimmed === open) {
      if (current) parts.push(current.join("\n"));
      current = [];
      continue;
    }
    if (current) current.push(line);
  }
  if (current) parts.push(current.join("\n"));
  return parts;
}

export function parseMimeMessage(raw: string | Uint8Array): ParsedMimeMessage {
  const bin = toBinary(raw);
  const { head, body } = splitHeaderBody(bin);
  const headers = parseHeaders(head);
  const result: ParsedMimeMessage = { headers, attachments: [] };
  const state = { parts: 0 };
  walk(headers, body, result, state, 0);
  return result;
}

function walk(
  headers: Map<string, string[]>,
  body: string,
  result: ParsedMimeMessage,
  state: { parts: number },
  depth: number,
): void {
  if (depth > MAX_DEPTH) throw new MimeParseError("MIME nesting too deep");
  if (++state.parts > MAX_PARTS) throw new MimeParseError("Too many MIME parts");

  const ct = parseHeaderParams(headers.get("content-type")?.[0]);
  const type = ct.value || "text/plain";

  if (type.startsWith("multipart/")) {
    const boundary = ct.params.get("boundary");
    if (!boundary) return;
    for (const part of splitMultipart(body, boundary)) {
      const split = splitHeaderBody(part);
      walk(parseHeaders(split.head), split.body, result, state, depth + 1);
    }
    return;
  }

  const cd = parseHeaderParams(headers.get("content-disposition")?.[0]);
  const bytes = decodeBody(body, headers.get("content-transfer-encoding")?.[0]);
  const isAttachment = cd.value === "attachment";
  const filenameRaw = cd.params.get("filename") ?? ct.params.get("name");
  const filename = filenameRaw ? decodeEncodedWords(filenameRaw) : undefined;

  if (!isAttachment && !filename) {
    if (type === "text/plain" && result.text === undefined) {
      result.text = decodeBytes(bytes, ct.params.get("charset"));
      return;
    }
    if (type === "text/html" && result.html === undefined) {
      result.html = decodeBytes(bytes, ct.params.get("charset"));
      return;
    }
  }

  const contentId = headers.get("content-id")?.[0]?.trim().replace(/^<|>$/g, "");
  result.attachments.push({
    ...(filename ? { filename } : {}),
    contentType: type,
    ...(contentId ? { contentId } : {}),
    disposition: cd.value === "inline" || (!isAttachment && contentId) ? "inline" : "attachment",
    size: bytes.length,
    content: bytes,
  });
}
