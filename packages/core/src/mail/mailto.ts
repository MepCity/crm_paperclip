import { type ParsedRecipient, parseRecipientList } from "./recipient-list";

export type ParsedMailto = {
  to: ParsedRecipient[];
  cc: ParsedRecipient[];
  bcc: ParsedRecipient[];
  subject: string;
  body: string;
  invalid: string[];
};

/** Percent-decodes as UTF-8 (`+` stays a plus); a malformed piece is returned raw. */
function decode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/** Parses a `mailto:` link (RFC 6068) into compose prefill values; `null` when it is not a mailto link. */
export function parseMailto(href: string): ParsedMailto | null {
  const trimmed = href.trim();
  if (!/^mailto:/i.test(trimmed)) return null;
  const rest = trimmed.slice("mailto:".length);
  const queryAt = rest.indexOf("?");
  const path = queryAt === -1 ? rest : rest.slice(0, queryAt);
  const query = queryAt === -1 ? "" : rest.slice(queryAt + 1);

  const lists: Record<"to" | "cc" | "bcc", string[]> = { to: [], cc: [], bcc: [] };
  let subject: string | undefined;
  let body: string | undefined;
  if (path) lists.to.push(decode(path));
  for (const part of query.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const name = decode(eq === -1 ? part : part.slice(0, eq)).toLowerCase();
    const value = eq === -1 ? "" : decode(part.slice(eq + 1));
    if (name === "to" || name === "cc" || name === "bcc") lists[name].push(value);
    else if (name === "subject") subject ??= value;
    else if (name === "body") body ??= value;
  }

  const invalid: string[] = [];
  const parse = (values: string[]): ParsedRecipient[] => {
    const result = parseRecipientList(values.join(","));
    invalid.push(...result.invalid);
    return result.recipients;
  };
  return {
    to: parse(lists.to),
    cc: parse(lists.cc),
    bcc: parse(lists.bcc),
    subject: subject ?? "",
    body: body ?? "",
    invalid,
  };
}
