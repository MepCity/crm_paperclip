/**
 * Pure (DOM-free) sanitizer for inbound mail HTML. Inbound mail is untrusted
 * input (ADR 0009): everything outside a strict allowlist is removed, remote
 * images are blocked (no tracking pixels) and links open in a new context.
 */

export type InboundHtmlOptions = {
  /** Maps `cid:` content ids (without the scheme) to a displayable URL. */
  cidMap?: Record<string, string>;
};

export type InboundHtmlResult = { html: string; blockedRemoteImages: number };

const VOID_TAGS = new Set(["br", "hr", "img", "col"]);

const ALLOWED_TAGS = new Set([
  ...VOID_TAGS,
  "p",
  "div",
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
  "center",
  "pre",
  "code",
  "small",
  "big",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "dl",
  "dt",
  "dd",
  "abbr",
  "cite",
  "q",
  "address",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
  "caption",
  "colgroup",
  "section",
  "article",
  "header",
  "footer",
  "figure",
  "figcaption",
]);

/** Dropped together with everything inside them. */
const DROPPED_WITH_CONTENT = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "template",
  "noscript",
  "head",
  "title",
  "textarea",
  "select",
  "applet",
  "frameset",
  "frame",
  "xmp",
  "plaintext",
  "audio",
  "video",
  "canvas",
]);

const GLOBAL_ATTRS = new Set([
  "style",
  "title",
  "align",
  "valign",
  "width",
  "height",
  "bgcolor",
  "color",
  "colspan",
  "rowspan",
  "cellpadding",
  "cellspacing",
  "border",
  "dir",
  "lang",
  "size",
  "face",
]);

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  colon: ":",
  tab: "\t",
  newline: "\n",
  nbsp: " ",
  lpar: "(",
  rpar: ")",
  sol: "/",
  bsol: "\\",
  semi: ";",
  comma: ",",
  period: ".",
  excl: "!",
  num: "#",
  percnt: "%",
};

function decodeEntities(value: string): string {
  return value.replace(
    /&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([a-zA-Z]{2,8}));?/g,
    (m, dec, hex, name) => {
      if (dec || hex) {
        const code = dec ? Number.parseInt(dec, 10) : Number.parseInt(hex, 16);
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
      }
      const named = NAMED_ENTITIES[String(name).toLowerCase()];
      return named ?? m;
    },
  );
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(value: string): string {
  return value.replace(/</g, "&lt;");
}

function scheme(url: string): string | null {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional scrubbing
  const cleaned = url.replace(/[\u0000- \u007f-\u009f]/g, "");
  const m = /^([a-z][a-z0-9+.-]*):/i.exec(cleaned);
  return m ? `${m[1]?.toLowerCase()}:` : null;
}

function safeLink(raw: string): string | null {
  const url = decodeEntities(raw).trim();
  const s = scheme(url);
  if (s === null) return url.startsWith("#") ? url : null;
  return ["http:", "https:", "mailto:", "tel:"].includes(s) ? url : null;
}

function sanitizeStyle(raw: string): string {
  const out: string[] = [];
  for (const decl of decodeEntities(raw).split(";")) {
    const idx = decl.indexOf(":");
    if (idx < 1) continue;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const val = decl.slice(idx + 1).trim();
    if (!/^[a-z-]+$/.test(prop) || val === "" || prop === "position" || prop === "behavior")
      continue;
    if (/\\|url\s*\(|expression|javascript|vbscript|@import|binding|image-set|[<>]/i.test(val))
      continue;
    out.push(`${prop}: ${val}`);
  }
  return out.join("; ");
}

type Attr = { name: string; value: string };

function parseAttrs(src: string): Attr[] {
  const attrs: Attr[] = [];
  let i = 0;
  while (i < src.length) {
    while (i < src.length && /[\s/]/.test(src[i] as string)) i++;
    const start = i;
    while (i < src.length && !/[\s/=]/.test(src[i] as string)) i++;
    const name = src.slice(start, i).toLowerCase();
    while (i < src.length && /\s/.test(src[i] as string)) i++;
    let value = "";
    if (src[i] === "=") {
      i++;
      while (i < src.length && /\s/.test(src[i] as string)) i++;
      const q = src[i];
      if (q === '"' || q === "'") {
        const end = src.indexOf(q, i + 1);
        value = src.slice(i + 1, end === -1 ? src.length : end);
        i = end === -1 ? src.length : end + 1;
      } else {
        const s = i;
        while (i < src.length && !/\s/.test(src[i] as string)) i++;
        value = src.slice(s, i);
      }
    }
    if (name) attrs.push({ name, value });
  }
  return attrs;
}

/** Finds the `>` ending a tag, honouring quoted attribute values. */
function findTagEnd(html: string, from: number): number {
  let quote: string | null = null;
  for (let i = from; i < html.length; i++) {
    const c = html[i] as string;
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      // Quotes only open a value after `=`.
      let j = i - 1;
      while (j >= from && /\s/.test(html[j] as string)) j--;
      if (html[j] === "=") quote = c;
    } else if (c === ">") return i;
  }
  return -1;
}

export function sanitizeInboundHtml(
  html: string,
  options: InboundHtmlOptions = {},
): InboundHtmlResult {
  const cidMap = options.cidMap ?? {};
  let blocked = 0;
  let out = "";
  const stack: string[] = [];
  let i = 0;

  const imgTag = (attrs: Attr[]): string => {
    const get = (n: string) => attrs.find((a) => a.name === n)?.value;
    const rawSrc = get("src");
    if (rawSrc === undefined) return "";
    const src = decodeEntities(rawSrc).trim();
    const s = scheme(src);
    const parts: string[] = [];
    if (s === "cid:") {
      const id = src.replace(/^cid:/i, "").replace(/^<|>$/g, "");
      const mapped = Object.hasOwn(cidMap, id) ? cidMap[id] : undefined;
      const ms = mapped ? scheme(mapped) : null;
      if (!mapped || ms === "javascript:" || ms === "vbscript:") return "";
      parts.push(`src="${escapeAttr(mapped)}"`);
    } else if (s === "http:" || s === "https:") {
      blocked++;
      parts.push(`data-blocked-src="${escapeAttr(src)}"`);
    } else if (
      s === "data:" &&
      /^data:image\/(?:png|gif|jpe?g|webp);base64,[a-z0-9+/=\s]*$/i.test(src)
    ) {
      parts.push(`src="${escapeAttr(src)}"`);
    } else {
      return "";
    }
    for (const n of ["alt", "title", "width", "height", "align", "border"]) {
      const v = get(n);
      if (v !== undefined) parts.push(`${n}="${escapeAttr(decodeEntities(v))}"`);
    }
    const st = get("style");
    const cleaned = st === undefined ? "" : sanitizeStyle(st);
    if (cleaned) parts.push(`style="${escapeAttr(cleaned)}"`);
    return `<img ${parts.join(" ")}>`;
  };

  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      out += escapeText(html.slice(i));
      break;
    }
    out += escapeText(html.slice(i, lt));
    const rest = html.slice(lt);
    if (rest.startsWith("<!--")) {
      const end = html.indexOf("-->", lt + 4);
      i = end === -1 ? html.length : end + 3;
      continue;
    }
    if (/^<[!?]/.test(rest)) {
      const end = html.indexOf(">", lt);
      i = end === -1 ? html.length : end + 1;
      continue;
    }
    const m = /^<(\/?)([a-zA-Z][^\s/>]*)/.exec(rest);
    if (!m) {
      out += "&lt;";
      i = lt + 1;
      continue;
    }
    const closing = m[1] === "/";
    const name = (m[2] as string).toLowerCase();
    const end = findTagEnd(html, lt + m[0].length);
    if (end === -1) {
      i = html.length; // unterminated tag: drop it
      continue;
    }
    i = end + 1;
    const attrSrc = html.slice(lt + m[0].length, end);

    if (!closing && DROPPED_WITH_CONTENT.has(name)) {
      const re = new RegExp(`</${name}(?=[\\s/>])[^>]*>`, "i");
      const tail = html.slice(i);
      const found = re.exec(tail);
      i = found ? i + found.index + found[0].length : html.length;
      continue;
    }
    if (!ALLOWED_TAGS.has(name)) continue; // unwrap: keep children

    if (closing) {
      const at = stack.lastIndexOf(name);
      if (at === -1) continue;
      while (stack.length > at) out += `</${stack.pop()}>`;
      continue;
    }
    const attrs = parseAttrs(attrSrc);
    if (name === "img") {
      out += imgTag(attrs);
      continue;
    }
    const parts: string[] = [];
    const seen = new Set<string>();
    for (const a of attrs) {
      if (seen.has(a.name)) continue;
      seen.add(a.name);
      if (a.name === "style") {
        const st = sanitizeStyle(a.value);
        if (st) parts.push(`style="${escapeAttr(st)}"`);
      } else if (a.name === "href" && name === "a") {
        const href = safeLink(a.value);
        if (href) parts.push(`href="${escapeAttr(href)}"`);
      } else if (GLOBAL_ATTRS.has(a.name)) {
        parts.push(`${a.name}="${escapeAttr(decodeEntities(a.value))}"`);
      }
    }
    if (name === "a") parts.push('target="_blank"', 'rel="noopener noreferrer nofollow"');
    out += `<${name}${parts.length ? ` ${parts.join(" ")}` : ""}>`;
    if (!VOID_TAGS.has(name)) stack.push(name);
  }
  while (stack.length) out += `</${stack.pop()}>`;
  return { html: out, blockedRemoteImages: blocked };
}
