/** Note_Title maximum length (metadata). */
export const NOTE_TITLE_MAX = 120;
/** Note_Content maximum length, markup included (ADR 0005 P3). */
export const NOTE_CONTENT_MAX = 65_535;

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

const BLOCK_TAGS: ReadonlySet<string> = new Set(["p", "div", "br", "ul", "ol", "li", "blockquote"]);

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

function decodeEntities(text: string): string {
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

/** Tag-stripping fallback used where DOMParser is unavailable (server render). */
export function stripMarkup(html: string): string {
  let out = html.replace(/<!--[\s\S]*?-->/g, "");
  for (const tag of DROPPED_TAGS) {
    out = out.replace(new RegExp(`<${tag}\\b[\\s\\S]*?(?:</${tag}\\s*>|$)`, "gi"), " ");
    out = out.replace(new RegExp(`<${tag}\\b[^>]*>`, "gi"), " ");
  }
  out = out.replace(/<\/?(?:p|div|br|ul|ol|li|blockquote)\b[^>]*>/gi, " ");
  out = out.replace(/<[^>]*>?/g, "");
  return decodeEntities(out);
}

function collectText(node: Node, parts: string[]): void {
  if (node.nodeType === 3) {
    parts.push(node.nodeValue ?? "");
    return;
  }
  if (node.nodeType !== 1) return;
  const tag = (node as Element).tagName.toLowerCase();
  if (DROPPED_TAGS.has(tag)) return;
  const block = BLOCK_TAGS.has(tag);
  if (block) parts.push(" ");
  for (const child of Array.from(node.childNodes)) collectText(child, parts);
  if (block) parts.push(" ");
}

export function hasDomParser(): boolean {
  return typeof DOMParser !== "undefined";
}

/** Plain text of the note HTML with whitespace collapsed. */
export function noteContentText(html: string): string {
  if (!html) return "";
  let text: string;
  if (hasDomParser()) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const parts: string[] = [];
    collectText(doc.body, parts);
    text = parts.join("");
  } else {
    text = stripMarkup(html);
  }
  return text.replace(/[\s\u00a0]+/g, " ").trim();
}

/** True when the note has no visible text (e.g. "<p><br></p>"). */
export function isNoteContentEmpty(html: string): boolean {
  return noteContentText(html) === "";
}
