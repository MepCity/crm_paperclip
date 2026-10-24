/**
 * Pure function to rewrite `cid:` image references in HTML bodies
 * to resolved URLs (e.g. signed download/attachment URLs).
 *
 * This is NOT an HTML sanitizer; non-target attributes, text nodes,
 * and structural markup are preserved verbatim.
 */

export type CidPart = {
  contentId: string;
  url: string;
};

export type RewriteCidResult = {
  html: string;
  unresolved: string[];
};

/**
 * Escapes characters for safe inclusion inside an HTML attribute value:
 * `&` -> `&amp;`, `"` -> `&quot;`.
 */
function escapeAttributeValue(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * Cleans a Content-ID reference by URL-decoding percent-encoded characters
 * (RFC 2392) and stripping enclosing angle brackets (`<...>`).
 */
function cleanContentId(raw: string): string {
  let s = raw.trim();
  // Strip enclosing angle brackets before decoding if present
  if (s.startsWith("<") && s.endsWith(">")) {
    s = s.slice(1, -1).trim();
  }
  // URL decode (RFC 2392)
  try {
    s = decodeURIComponent(s);
  } catch {
    // If malformed percent-encoding, keep as-is
  }
  // Strip enclosing angle brackets again if decode revealed them (e.g. %3C...%3E)
  if (s.startsWith("<") && s.endsWith(">")) {
    s = s.slice(1, -1).trim();
  } else {
    s = s.replace(/^<+|>+$/g, "").trim();
  }
  return s;
}

/**
 * Normalizes a Content-ID for case-insensitive comparison.
 */
function normalizeContentId(raw: string): string {
  return cleanContentId(raw).toLowerCase();
}

/**
 * Finds the `>` ending an HTML tag, honouring quotes in attribute values.
 */
function findTagEnd(html: string, from: number): number {
  let quote: string | null = null;
  for (let i = from; i < html.length; i++) {
    const c = html[i];
    if (quote) {
      if (c === quote) {
        quote = null;
      }
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === ">") {
      return i;
    }
  }
  return -1;
}

/**
 * Processes the attributes inside an opening HTML tag, rewriting matching
 * `src="cid:..."` and `background="cid:..."` attributes to their resolved URLs.
 */
function processTagAttributes(
  tagStr: string,
  tagStartLength: number,
  partMap: Map<string, string>,
  unresolved: string[],
  seenUnresolved: Set<string>,
): string {
  const isSelfClosing = tagStr.endsWith("/>");
  const closeChars = isSelfClosing ? "/>" : ">";
  const closeLen = isSelfClosing ? 2 : 1;
  const attrSrc = tagStr.slice(tagStartLength, tagStr.length - closeLen);

  let out = tagStr.slice(0, tagStartLength);
  let i = 0;

  while (i < attrSrc.length) {
    // 1. Copy any whitespace or delimiters before attribute name
    const preAttrStart = i;
    while (i < attrSrc.length && /[\s/]/.test(attrSrc[i] as string)) {
      i++;
    }
    out += attrSrc.slice(preAttrStart, i);
    if (i >= attrSrc.length) break;

    // 2. Read attribute name
    const nameStart = i;
    while (i < attrSrc.length && !/[\s/=]/.test(attrSrc[i] as string)) {
      i++;
    }
    const rawAttrName = attrSrc.slice(nameStart, i);
    const attrNameLower = rawAttrName.toLowerCase();
    out += rawAttrName;

    // 3. Skip whitespace before `=`
    const preEqStart = i;
    while (i < attrSrc.length && /\s/.test(attrSrc[i] as string)) {
      i++;
    }
    const preEq = attrSrc.slice(preEqStart, i);

    // If no `=`, this is a boolean/valueless attribute (e.g. `disabled`)
    if (i >= attrSrc.length || attrSrc[i] !== "=") {
      out += preEq;
      continue;
    }

    // Include the `=` and any whitespace after `=`
    out += `${preEq}=`;
    i++; // skip '='

    const postEqStart = i;
    while (i < attrSrc.length && /\s/.test(attrSrc[i] as string)) {
      i++;
    }
    out += attrSrc.slice(postEqStart, i);
    if (i >= attrSrc.length) break;

    // 4. Read attribute value
    const q = attrSrc[i];
    const isTargetAttr = attrNameLower === "src" || attrNameLower === "background";

    if (q === '"' || q === "'") {
      // Quoted attribute value
      i++; // skip opening quote
      const valStart = i;
      const endQuote = attrSrc.indexOf(q, valStart);
      const valEnd = endQuote === -1 ? attrSrc.length : endQuote;
      const rawVal = attrSrc.slice(valStart, valEnd);
      i = endQuote === -1 ? attrSrc.length : endQuote + 1;

      if (isTargetAttr && /^cid:/i.test(rawVal.trimStart())) {
        const rawCid = rawVal.trimStart().slice(4);
        const cleanedId = cleanContentId(rawCid);
        const normId = cleanedId.toLowerCase();
        const url = partMap.get(normId);

        if (url !== undefined) {
          const escaped = escapeAttributeValue(url);
          out += `${q}${escaped}${q}`;
        } else {
          // Unresolved
          if (cleanedId.length > 0 && !seenUnresolved.has(normId)) {
            seenUnresolved.add(normId);
            unresolved.push(cleanedId);
          }
          out += `${q}${rawVal}${q}`;
        }
      } else {
        out += `${q}${rawVal}${q}`;
      }
    } else {
      // Unquoted attribute value
      const valStart = i;
      while (i < attrSrc.length && !/[\s/]/.test(attrSrc[i] as string)) {
        i++;
      }
      const rawVal = attrSrc.slice(valStart, i);

      if (isTargetAttr && /^cid:/i.test(rawVal)) {
        const rawCid = rawVal.slice(4);
        const cleanedId = cleanContentId(rawCid);
        const normId = cleanedId.toLowerCase();
        const url = partMap.get(normId);

        if (url !== undefined) {
          const escaped = escapeAttributeValue(url);
          out += escaped;
        } else {
          // Unresolved
          if (cleanedId.length > 0 && !seenUnresolved.has(normId)) {
            seenUnresolved.add(normId);
            unresolved.push(cleanedId);
          }
          out += rawVal;
        }
      } else {
        out += rawVal;
      }
    }
  }

  out += closeChars;
  return out;
}

/**
 * Rewrites inline image references (`src="cid:..."`, `src='cid:...'`, unquoted `src=cid:...`,
 * and `background="cid:..."`) in HTML to resolved URLs.
 *
 * Content-ID comparison:
 * - Angle brackets (`<...>`) are stripped.
 * - Case-insensitive matching.
 * - `cid:` values are URL-decoded per RFC 2392.
 * - URLs are HTML-attribute-escaped (`&` -> `&amp;`, `"` -> `&quot;`).
 *
 * Unmatched CIDs are left unmodified in the HTML and collected into `unresolved`
 * in order of first appearance without duplicates.
 *
 * This function does NOT alter non-matching HTML, text nodes, comments, or scripts.
 */
export function rewriteCidReferences(
  html: string,
  parts: ReadonlyArray<CidPart>,
): RewriteCidResult {
  const partMap = new Map<string, string>();
  for (const part of parts) {
    const norm = normalizeContentId(part.contentId);
    if (!partMap.has(norm)) {
      partMap.set(norm, part.url);
    }
  }

  const unresolved: string[] = [];
  const seenUnresolved = new Set<string>();
  let out = "";
  let i = 0;

  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      out += html.slice(i);
      break;
    }
    out += html.slice(i, lt);
    const rest = html.slice(lt);

    // 1. Comments: <!-- ... -->
    if (rest.startsWith("<!--")) {
      const end = html.indexOf("-->", lt + 4);
      if (end === -1) {
        out += rest;
        break;
      }
      out += html.slice(lt, end + 3);
      i = end + 3;
      continue;
    }

    // 2. Doctype, CDATA, XML declaration: <!... or <?...
    if (/^<[!?]/.test(rest)) {
      const end = html.indexOf(">", lt);
      if (end === -1) {
        out += rest;
        break;
      }
      out += html.slice(lt, end + 1);
      i = end + 1;
      continue;
    }

    // 3. Closing tag: </tag>
    if (rest.startsWith("</")) {
      const end = html.indexOf(">", lt);
      if (end === -1) {
        out += rest;
        break;
      }
      out += html.slice(lt, end + 1);
      i = end + 1;
      continue;
    }

    // 4. Raw text tags: <script... or <style...
    const rawTagMatch = /^<(script|style)(?=[\s/>]|$)/i.exec(rest);
    if (rawTagMatch) {
      const tagName = rawTagMatch[1] ?? "";
      const tagEnd = findTagEnd(html, lt + rawTagMatch[0].length);
      if (tagEnd === -1) {
        out += rest;
        break;
      }
      const closePattern = new RegExp(`</${tagName}(?=[\\s/>]|$)[^>]*>`, "i");
      const tail = html.slice(tagEnd + 1);
      const closeMatch = closePattern.exec(tail);
      if (closeMatch) {
        const fullEnd = tagEnd + 1 + closeMatch.index + closeMatch[0].length;
        out += html.slice(lt, fullEnd);
        i = fullEnd;
        continue;
      }
      out += html.slice(lt, tagEnd + 1);
      i = tagEnd + 1;
      continue;
    }

    // 5. Opening or void HTML tag: <tagname ...>
    const tagStartMatch = /^<([a-zA-Z][a-zA-Z0-9:-]*)/.exec(rest);
    if (!tagStartMatch) {
      out += "<";
      i = lt + 1;
      continue;
    }

    const end = findTagEnd(html, lt + tagStartMatch[0].length);
    if (end === -1) {
      out += rest;
      break;
    }

    const tagStr = html.slice(lt, end + 1);
    i = end + 1;

    if (/src|background/i.test(tagStr)) {
      out += processTagAttributes(
        tagStr,
        tagStartMatch[0].length,
        partMap,
        unresolved,
        seenUnresolved,
      );
    } else {
      out += tagStr;
    }
  }

  return { html: out, unresolved };
}
