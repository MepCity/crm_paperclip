// Pure sanitizer for inbound attachment file names (ADR 0009). Not wired to
// any record or flow; export and binding are separate work.

const MAX_BYTES = 255;
const MAX_EXTENSION_BYTES = 32;
const FALLBACK_BASE = "attachment";

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "text/plain": ".txt",
  "text/calendar": ".ics",
};

const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
// Control characters and bidirectional formatting characters are dropped.
function isDropped(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (
    code <= 0x1f ||
    code === 0x7f ||
    (code >= 0x202a && code <= 0x202e) ||
    (code >= 0x2066 && code <= 0x2069)
  );
}
const REPLACED = /[<>:"|?*]/g;
const EDGE = /^[\s.]+|[\s.]+$/g;

const encoder = new TextEncoder();
const byteLength = (value: string): number => encoder.encode(value).length;

function truncateToBytes(value: string, maxBytes: number): string {
  let out = "";
  let used = 0;
  for (const char of value) {
    const size = byteLength(char);
    if (used + size > maxBytes) break;
    out += char;
    used += size;
  }
  return out;
}

function clean(raw: string): string {
  const parts = raw.normalize("NFC").split(/[\\/]/);
  let name = parts[parts.length - 1] ?? "";
  name = [...name]
    .filter((char) => !isDropped(char))
    .join("")
    .replace(REPLACED, "_")
    .replace(EDGE, "");
  if (name === "") return "";

  const dot = name.indexOf(".");
  const stem = dot === -1 ? name : name.slice(0, dot);
  if (WINDOWS_RESERVED.test(stem.replace(/\s+$/, ""))) name = `_${name}`;

  if (byteLength(name) > MAX_BYTES) {
    const lastDot = name.lastIndexOf(".");
    let extension = lastDot > 0 ? name.slice(lastDot) : "";
    if (byteLength(extension) > MAX_EXTENSION_BYTES) extension = "";
    const base = name.slice(0, name.length - extension.length);
    name = truncateToBytes(base, MAX_BYTES - byteLength(extension)).replace(EDGE, "") + extension;
  }
  return name;
}

export function sanitizeAttachmentFilename(
  name: string | undefined,
  opts: { contentType?: string; fallback?: string } = {},
): string {
  const cleaned = clean(name ?? "");
  if (cleaned !== "") return cleaned;
  const fallback = clean(opts.fallback ?? "");
  if (fallback !== "") return fallback;
  const mime = opts.contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  return `${FALLBACK_BASE}${CONTENT_TYPE_EXTENSIONS[mime] ?? ""}`;
}
