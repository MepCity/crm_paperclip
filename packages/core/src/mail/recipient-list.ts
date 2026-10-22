import { normalizeAddress } from "../mail-threading/address";

export type ParsedRecipient = { address: string; name?: string };
export type ParsedRecipientList = { recipients: ParsedRecipient[]; invalid: string[] };

/** Splits on comma, semicolon and newline, ignoring separators inside quotes or angle brackets. */
function splitTokens(text: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quoted = false;
  let angle = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i] as string;
    if (quoted) {
      current += c;
      if (c === "\\" && i + 1 < text.length) current += text[++i];
      else if (c === '"') quoted = false;
      continue;
    }
    if (c === '"') {
      quoted = true;
      current += c;
    } else if (c === "<") {
      angle = true;
      current += c;
    } else if (c === ">") {
      angle = false;
      current += c;
    } else if (!angle && (c === "," || c === ";" || c === "\n" || c === "\r")) {
      tokens.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  tokens.push(current);
  return tokens;
}

function extractName(token: string): string | undefined {
  const lt = token.indexOf("<");
  if (lt <= 0) return undefined;
  let name = token.slice(0, lt).trim();
  if (name.length >= 2 && name.startsWith('"') && name.endsWith('"')) {
    name = name.slice(1, -1).replace(/\\(.)/g, "$1").trim();
  }
  return name || undefined;
}

/** Parses free-text To/CC/BCC input into unique, normalized recipients plus unparseable tokens. */
export function parseRecipientList(text: string): ParsedRecipientList {
  const recipients: ParsedRecipient[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const raw of splitTokens(text)) {
    const token = raw.trim();
    if (!token) continue;
    const address = normalizeAddress(token);
    if (!address) {
      invalid.push(token);
      continue;
    }
    if (seen.has(address)) continue;
    seen.add(address);
    const name = extractName(token);
    recipients.push(name ? { address, name } : { address });
  }
  return { recipients, invalid };
}
