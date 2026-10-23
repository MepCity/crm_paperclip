/**
 * RFC 2047 and RFC 2231 encoded-word decoder for mail headers (Subject, From, To, etc.).
 * Decodes `=?charset?encoding?encoded-text?=` tokens into plain Unicode strings.
 */

interface Token {
  type: "text" | "encoded";
  text: string;
}

function tryDecode(charset: string, encoding: string, encodedText: string): string | null {
  const cleanCharset = charset.trim().split("*")[0]?.trim().toLowerCase();
  if (!cleanCharset) {
    return null;
  }

  const enc = encoding.toUpperCase();

  if (enc === "B") {
    // Base64 encoding
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encodedText)) {
      return null;
    }
    try {
      const bin = atob(encodedText);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      const decoder = new TextDecoder(cleanCharset, { fatal: true });
      return decoder.decode(bytes);
    } catch {
      return null;
    }
  }

  if (enc === "Q") {
    // Quoted-Printable encoding for encoded-words (RFC 2047 §4.2)
    // '_' represents space (0x20), '=XX' represents hexadecimal byte
    const bytes: number[] = [];
    let i = 0;
    while (i < encodedText.length) {
      const ch = encodedText[i];
      if (ch === "_") {
        bytes.push(0x20);
        i++;
      } else if (ch === "=") {
        if (i + 2 >= encodedText.length) {
          return null;
        }
        const hex = encodedText.slice(i + 1, i + 3);
        if (!/^[0-9A-Fa-f]{2}$/.test(hex)) {
          return null;
        }
        bytes.push(parseInt(hex, 16));
        i += 3;
      } else {
        const code = ch?.charCodeAt(0) ?? 0;
        // Printable ASCII (32-126) except '?'
        if (code < 32 || code > 126 || ch === "?") {
          return null;
        }
        bytes.push(code);
        i++;
      }
    }

    try {
      const decoder = new TextDecoder(cleanCharset, { fatal: true });
      return decoder.decode(new Uint8Array(bytes));
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Decodes RFC 2047 encoded words in a header string.
 *
 * Rules:
 * - Supports B (Base64) and Q (Quoted-Printable) encodings (case-insensitive).
 * - Supported charsets include utf-8, iso-8859-1, iso-8859-9, windows-1252, us-ascii (via TextDecoder).
 * - RFC 2231 language suffixes (e.g. `utf-8*tr`, `iso-8859-9*tr`) are supported.
 * - Unknown charsets or malformed encodings are left as raw text without throwing errors.
 * - RFC 2047 §6.2: linear white space between two adjacent encoded-words is discarded;
 *   white space between an encoded-word and plain text is preserved.
 */
export function decodeEncodedWords(value: string): string {
  if (!value || typeof value !== "string" || !value.includes("=?")) {
    return value;
  }

  const encodedWordRegex = /=\?([^?\s]+)\?([bBqQ])\?([^?\s]*)\?=/g;
  const tokens: Token[] = [];
  let lastIndex = 0;
  let match = encodedWordRegex.exec(value);

  while (match !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        text: value.slice(lastIndex, match.index),
      });
    }

    const decoded = tryDecode(match[1] as string, match[2] as string, match[3] as string);
    if (decoded !== null) {
      tokens.push({
        type: "encoded",
        text: decoded,
      });
    } else {
      tokens.push({
        type: "text",
        text: match[0],
      });
    }

    lastIndex = match.index + match[0].length;
    match = encodedWordRegex.exec(value);
  }

  if (lastIndex < value.length) {
    tokens.push({
      type: "text",
      text: value.slice(lastIndex),
    });
  }

  let result = "";
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i] as Token;
    if (token.type === "text") {
      // RFC 2047 §6.2: whitespace between two adjacent encoded-words is omitted
      const isWhitespace = /^\s+$/.test(token.text);
      const isBetweenEncoded =
        i > 0 &&
        (tokens[i - 1] as Token).type === "encoded" &&
        i + 1 < tokens.length &&
        (tokens[i + 1] as Token).type === "encoded";

      if (isWhitespace && isBetweenEncoded) {
        continue;
      }
      result += token.text;
    } else {
      result += token.text;
    }
  }

  return result;
}
