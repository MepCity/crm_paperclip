/**
 * Pure (DOM-free) allowlist policy for note HTML, shared by the web display,
 * the editor seed and the Notes save hook.
 */

export const ALLOWED_TAGS: ReadonlySet<string> = new Set([
  "p",
  "div",
  "br",
  "span",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "strike",
  "sub",
  "sup",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "font",
]);

/** Dropped together with everything inside them. */
export const DROPPED_TAGS: ReadonlySet<string> = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "template",
  "noscript",
  "link",
  "meta",
  "head",
  "title",
]);

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const LIST_STYLES = new Set(["disc", "circle", "square", "decimal", "lower-alpha", "lower-roman"]);

const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_COLOR =
  /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:\d{1,3}|\d*\.\d+)\s*)?\)$/i;
const PX_LENGTH = /^(\d{1,3})(?:\.\d+)?(?:px)?$/i;

export function isSafeColor(value: string): boolean {
  const v = value.trim();
  return HEX_COLOR.test(v) || RGB_COLOR.test(v);
}

/** Returns the href when its scheme is allowed, otherwise null. */
export function safeHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Browsers ignore control characters and whitespace inside the scheme.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional scrubbing
  const cleaned = raw.replace(/[\u0000-\u0020\u007f-\u009f]/g, "");
  if (cleaned === "") return null;
  const match = /^([a-z][a-z0-9+.-]*):/i.exec(cleaned);
  if (!match) return null; // relative or scheme-less links are not allowed
  const protocol = `${match[1]?.toLowerCase()}:`;
  if (!SAFE_PROTOCOLS.has(protocol)) return null;
  return raw.trim();
}

export type SafeStyle = {
  color?: string;
  backgroundColor?: string;
  listStyleType?: string;
  marginLeft?: string;
  paddingLeft?: string;
};

/** Keeps only the allowed declarations of an inline style attribute. */
export function sanitizeStyle(
  style: string | null | undefined,
  tag: string,
): SafeStyle | undefined {
  if (!style) return undefined;
  const out: SafeStyle = {};
  for (const decl of style.split(";")) {
    const idx = decl.indexOf(":");
    if (idx < 0) continue;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const value = decl.slice(idx + 1).trim();
    if (prop === "color" && isSafeColor(value)) out.color = value;
    else if (prop === "background-color" && isSafeColor(value)) out.backgroundColor = value;
    else if (prop === "list-style-type" && (tag === "ul" || tag === "ol")) {
      if (LIST_STYLES.has(value.toLowerCase())) out.listStyleType = value.toLowerCase();
    } else if (prop === "margin-left" || prop === "padding-left") {
      const m = PX_LENGTH.exec(value);
      if (m && Number(value.replace(/px$/i, "")) <= 400) {
        const px = `${Number(value.replace(/px$/i, ""))}px`;
        if (prop === "margin-left") out.marginLeft = px;
        else out.paddingLeft = px;
      }
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1]?.toLowerCase() === "x" ? Number.parseInt(body.slice(2), 16) : Number(body.slice(1));
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : whole;
    }
    return ENTITIES[body.toLowerCase()] ?? whole;
  });
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/y;
const ATTR_RE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function parseAttrs(raw: string): Map<string, string> {
  const attrs = new Map<string, string>();
  for (const m of raw.matchAll(ATTR_RE)) {
    const name = (m[1] ?? "").toLowerCase();
    if (!attrs.has(name)) attrs.set(name, decodeEntities(m[2] ?? m[3] ?? m[4] ?? ""));
  }
  return attrs;
}

function styleAttr(style: SafeStyle | undefined): string {
  if (!style) return "";
  const parts: string[] = [];
  if (style.color) parts.push(`color: ${style.color}`);
  if (style.backgroundColor) parts.push(`background-color: ${style.backgroundColor}`);
  if (style.listStyleType) parts.push(`list-style-type: ${style.listStyleType}`);
  if (style.marginLeft) parts.push(`margin-left: ${style.marginLeft}`);
  if (style.paddingLeft) parts.push(`padding-left: ${style.paddingLeft}`);
  return parts.length ? ` style="${escapeAttr(parts.join("; "))}"` : "";
}

/**
 * Rebuilds note HTML from the allowlist only: allowed tags with allowed
 * attributes, safe link schemes and safe inline styles. Dropped tags lose their
 * contents, other tags are unwrapped. Never touches a DOM.
 */
export function sanitizeNoteHtml(html: string): string {
  let out = "";
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt < 0) {
      out += html.slice(i);
      break;
    }
    out += html.slice(i, lt);
    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt + 4);
      i = end < 0 ? html.length : end + 3;
      continue;
    }
    if (html[lt + 1] === "!" || html[lt + 1] === "?") {
      const end = html.indexOf(">", lt);
      i = end < 0 ? html.length : end + 1;
      continue;
    }
    TAG_RE.lastIndex = lt;
    const m = TAG_RE.exec(html);
    if (!m) {
      out += "&lt;";
      i = lt + 1;
      continue;
    }
    i = lt + m[0].length;
    const closing = m[1] === "/";
    const tag = (m[2] ?? "").toLowerCase();
    if (DROPPED_TAGS.has(tag)) {
      if (!closing) {
        const close = new RegExp(`</${tag}\\s*>`, "i");
        const rest = html.slice(i);
        const found = close.exec(rest);
        i = found ? i + found.index + found[0].length : html.length;
      }
      continue;
    }
    if (!ALLOWED_TAGS.has(tag)) continue;
    const outTag = tag === "font" ? "span" : tag;
    if (closing) {
      if (tag !== "br") out += `</${outTag}>`;
      continue;
    }
    const attrs = parseAttrs(m[3] ?? "");
    if (tag === "br") {
      out += "<br>";
    } else if (tag === "a") {
      const href = safeHref(attrs.get("href"));
      out += href
        ? `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">`
        : "<a>";
    } else if (tag === "font") {
      out += `<span${styleAttr(sanitizeStyle(`color:${attrs.get("color") ?? ""}`, "span"))}>`;
    } else {
      out += `<${tag}${styleAttr(sanitizeStyle(attrs.get("style"), tag))}>`;
    }
  }
  return out;
}
