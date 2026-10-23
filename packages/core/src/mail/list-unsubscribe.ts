export interface ListUnsubscribeMailto {
  address: string;
  subject?: string;
  body?: string;
}

export interface ListUnsubscribeInfo {
  mailto: ListUnsubscribeMailto[];
  https: string[];
  oneClick: boolean;
}

type HeaderBag = Record<string, string | string[] | undefined>;

function headerValue(headers: HeaderBag, name: string): string {
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== name) continue;
    if (value === undefined) return "";
    return Array.isArray(value) ? value.join(",") : value;
  }
  return "";
}

function decode(value: string): string | undefined {
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

function parseMailto(uri: string): ListUnsubscribeMailto | undefined {
  const rest = uri.slice("mailto:".length);
  const queryAt = rest.indexOf("?");
  const rawAddress = queryAt === -1 ? rest : rest.slice(0, queryAt);
  const address = decode(rawAddress)?.trim();
  if (!address || !address.includes("@")) return undefined;
  const result: ListUnsubscribeMailto = { address };
  if (queryAt !== -1) {
    for (const pair of rest.slice(queryAt + 1).split("&")) {
      const eq = pair.indexOf("=");
      if (eq === -1) continue;
      const key = pair.slice(0, eq).toLowerCase();
      if (key !== "subject" && key !== "body") continue;
      const decoded = decode(pair.slice(eq + 1));
      if (decoded !== undefined) result[key] = decoded;
    }
  }
  return result;
}

export function parseListUnsubscribe(headers: HeaderBag): ListUnsubscribeInfo {
  const mailto: ListUnsubscribeMailto[] = [];
  const https: string[] = [];
  const raw = headerValue(headers, "list-unsubscribe").replace(/\r?\n[ \t]+/g, " ");
  for (const match of raw.matchAll(/<([^<>]*)>/g)) {
    const uri = (match[1] ?? "").replace(/\s+/g, "");
    const lower = uri.toLowerCase();
    if (lower.startsWith("mailto:")) {
      const parsed = parseMailto(uri);
      if (parsed) mailto.push(parsed);
    } else if (lower.startsWith("https:")) {
      try {
        const url = new URL(uri);
        if (url.protocol === "https:" && url.hostname) https.push(uri);
      } catch {
        // invalid URI: skipped
      }
    }
  }
  const post = headerValue(headers, "list-unsubscribe-post").trim();
  return { mailto, https, oneClick: post === "List-Unsubscribe=One-Click" && https.length > 0 };
}
