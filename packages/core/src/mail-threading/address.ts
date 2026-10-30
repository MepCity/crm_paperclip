const DOT_ATOM = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const DOMAIN = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)*$/;

/** Splits a header value into the bare address part, dropping comments and display name. */
function extractAddressPart(raw: string): string | null {
  let quoted = false;
  let comment = 0;
  let angle: string | null = null;
  let inAngle = false;
  let bare = "";
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i] as string;
    if (quoted) {
      const piece = c === "\\" && i + 1 < raw.length ? c + raw[++i] : c;
      if (c === '"') quoted = false;
      if (inAngle) angle += piece;
      else bare += piece;
      continue;
    }
    if (comment > 0) {
      if (c === "\\") i++;
      else if (c === "(") comment++;
      else if (c === ")") comment--;
      continue;
    }
    if (c === "(") {
      comment = 1;
    } else if (c === '"') {
      quoted = true;
      if (inAngle) angle += c;
      else bare += c;
    } else if (c === "<" && !inAngle) {
      if (angle !== null) return null;
      inAngle = true;
      angle = "";
    } else if (c === ">" && inAngle) {
      inAngle = false;
    } else if (inAngle) {
      angle += c;
    } else {
      bare += c;
    }
  }
  if (quoted || comment > 0 || inAngle) return null;
  if (angle !== null) return angle;
  if (/[,;]/.test(stripQuoted(bare))) return null;
  return bare;
}

function stripQuoted(s: string): string {
  return s.replace(/"(?:\\.|[^"\\])*"/g, "");
}

/**
 * Normalizes one mailbox header value to a lowercase `local@domain`.
 * Returns null when the input is not exactly one address.
 */
export function normalizeAddress(raw: string): string | null {
  const part = extractAddressPart(raw)?.trim();
  if (!part) return null;
  const at = part.lastIndexOf("@");
  if (at <= 0 || at === part.length - 1) return null;
  let local = part.slice(0, at).trim();
  const domain = part
    .slice(at + 1)
    .trim()
    .toLowerCase();
  if (!DOMAIN.test(domain)) return null;
  if (local.startsWith('"')) {
    if (local.length < 3 || !local.endsWith('"')) return null;
    const inner = local.slice(1, -1).replace(/\\(.)/g, "$1");
    if (/[\r\n]/.test(inner)) return null;
    local = inner.toLowerCase();
    // A quoted dot-atom is the same mailbox as the unquoted one.
    if (!DOT_ATOM.test(local)) local = `"${local.replace(/(["\\])/g, "\\$1")}"`;
  } else {
    local = local.toLowerCase();
    if (!DOT_ATOM.test(local)) return null;
  }
  return `${local}@${domain}`;
}
