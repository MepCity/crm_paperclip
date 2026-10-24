/**
 * Result of splitting an email body into the latest (newly written) portion
 * and the quoted reply portion.
 */
export interface QuotedReplyResult {
  latest: string;
  quoted: string;
}

const FORWARD_MARKER_REGEX =
  /^\s*-{3,}\s*(?:Forwarded [Mm]essage|İletilen [İi]leti|İletilen [Mm]esaj)\s*-{3,}\s*$/i;

const ORIGINAL_MESSAGE_REGEX =
  /^\s*-{3,}\s*(?:Original Message|Özgün İleti|Orijinal Mesaj)\s*-{3,}\s*$/i;

const ON_WROTE_SINGLE_REGEX = /^\s*On\s+.+?\bwrote\s*:\s*$/i;
const ON_START_REGEX = /^\s*On\s+/i;
const WROTE_END_REGEX = /\bwrote\s*:\s*$/i;

const TR_TARIH_YAZDI_REGEX = /^\s*.*?\btarihinde\b.*?\b(?:şunu\s+)?yazdı\s*:\s*$/i;
const TR_YAZDI_REGEX = /^\s*.+?\b(?:şunu\s+)?yazdı\s*:\s*$/i;

function stripTrailingBlankLines(s: string): string {
  if (s.trim() === "") return "";
  return s.replace(/(?:[\r\n]+[ \t]*)+$/, "");
}

/**
 * Splits a plain-text email body into the latest newly written text and the quoted reply.
 *
 * Delimiters recognized:
 * (a) Interim reply attribution format ("On {date} UTC, {author} wrote:")
 * (b) General English "On … wrote:" (single or two lines)
 * (c) Turkish "… tarihinde … şunu yazdı:" / "… yazdı:"
 * (d) "-----Original Message-----" and "-------- Original Message --------"
 * (e) Trailing block of consecutive lines starting with ">"
 *
 * Inline quotes in the middle of the body (e.g. "> question" followed by "answer")
 * remain part of `latest`. Forwarded message headers ("---------- Forwarded message ---------")
 * are not treated as quotes; forwarded content remains in `latest`.
 */
export function splitQuotedReply(text: string): QuotedReplyResult {
  if (!text || text.trim() === "") {
    return { latest: "", quoted: "" };
  }

  const lines = text.split(/\r?\n/);
  const lineOffsets: number[] = [];
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    lineOffsets.push(offset);
    const lineText = lines[i] ?? "";
    offset += lineText.length;
    if (offset < text.length) {
      if (text[offset] === "\r" && text[offset + 1] === "\n") {
        offset += 2;
      } else if (text[offset] === "\n") {
        offset += 1;
      }
    }
  }

  let quoteStartIndex = -1;
  let hasForwardedMessage = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const lineOffset = lineOffsets[i] ?? 0;
    const nextLine = lines[i + 1] ?? "";

    // Forwarded message headers are NOT quotes. When encountered at the top level,
    // the forwarded content remains in latest and must not be split.
    if (FORWARD_MARKER_REGEX.test(line)) {
      hasForwardedMessage = true;
      break;
    }

    // (d) "-----Original Message-----" and "-------- Original Message --------"
    if (ORIGINAL_MESSAGE_REGEX.test(line)) {
      quoteStartIndex = lineOffset;
      break;
    }

    // (a) & (b) Single line English "On … wrote:"
    if (ON_WROTE_SINGLE_REGEX.test(line)) {
      quoteStartIndex = lineOffset;
      break;
    }

    // (b) Two lines English "On … \n … wrote:"
    if (
      i + 1 < lines.length &&
      ON_START_REGEX.test(line) &&
      !line.toLowerCase().includes("wrote:") &&
      WROTE_END_REGEX.test(nextLine) &&
      ON_WROTE_SINGLE_REGEX.test(`${line} ${nextLine}`)
    ) {
      quoteStartIndex = lineOffset;
      break;
    }

    // (c) Turkish "… tarihinde … şunu yazdı:" / "… tarihinde … yazdı:"
    if (TR_TARIH_YAZDI_REGEX.test(line)) {
      quoteStartIndex = lineOffset;
      break;
    }

    // (c) Turkish split across two lines (e.g. date line followed by "... şunu yazdı:")
    if (
      i + 1 < lines.length &&
      /\btarihinde\b/i.test(line) &&
      !line.toLowerCase().includes("yazdı:") &&
      TR_YAZDI_REGEX.test(nextLine) &&
      TR_TARIH_YAZDI_REGEX.test(`${line} ${nextLine}`)
    ) {
      quoteStartIndex = lineOffset;
      break;
    }

    // (c) Turkish "… yazdı:" / "… şunu yazdı:" or English "... wrote:" without "On"
    if (TR_YAZDI_REGEX.test(line) || WROTE_END_REGEX.test(line)) {
      quoteStartIndex = lineOffset;
      break;
    }
  }

  // (e) If no explicit attribution line found, look for trailing block of consecutive `>` lines.
  if (quoteStartIndex === -1 && !hasForwardedMessage) {
    let lastNonEmptyIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i] ?? "";
      if (line.trim() !== "") {
        lastNonEmptyIndex = i;
        break;
      }
    }

    const lastLine = lastNonEmptyIndex !== -1 ? (lines[lastNonEmptyIndex] ?? "") : "";
    if (lastNonEmptyIndex !== -1 && lastLine.trimStart().startsWith(">")) {
      let quoteStartLine = lastNonEmptyIndex;
      while (quoteStartLine > 0) {
        const prev = lines[quoteStartLine - 1] ?? "";
        if (prev.trimStart().startsWith(">")) {
          quoteStartLine--;
        } else if (prev.trim() === "") {
          let hasQuoteAbove = false;
          for (let j = quoteStartLine - 2; j >= 0; j--) {
            const above = lines[j] ?? "";
            if (above.trimStart().startsWith(">")) {
              hasQuoteAbove = true;
              break;
            }
            if (above.trim() !== "") {
              break;
            }
          }
          if (hasQuoteAbove) {
            quoteStartLine--;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      quoteStartIndex = lineOffsets[quoteStartLine] ?? 0;
    }
  }

  if (quoteStartIndex === -1) {
    return {
      latest: stripTrailingBlankLines(text),
      quoted: "",
    };
  }

  const rawLatest = text.slice(0, quoteStartIndex);
  const quoted = text.slice(quoteStartIndex);

  return {
    latest: stripTrailingBlankLines(rawLatest),
    quoted: stripTrailingBlankLines(quoted),
  };
}
