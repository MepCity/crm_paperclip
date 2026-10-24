import { DROPPED_TAGS, decodeEntities } from "@crm/core/records/note-html";

export {
  ALLOWED_TAGS,
  DROPPED_TAGS,
  isSafeColor,
  type SafeStyle,
  safeHref,
  sanitizeNoteHtml,
  sanitizeStyle,
} from "@crm/core/records/note-html";

/** Note_Title maximum length (metadata). */
export const NOTE_TITLE_MAX = 120;
/** Note_Content maximum length, markup included (ADR 0005 P3). */
export const NOTE_CONTENT_MAX = 65_535;

const BLOCK_TAGS: ReadonlySet<string> = new Set(["p", "div", "br", "ul", "ol", "li", "blockquote"]);

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
